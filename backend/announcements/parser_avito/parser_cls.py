import asyncio
import threading
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from announcements.models import Announcements
from buildings.models import Buildings
from custom_exception import StopEventException
from playwright.async_api import async_playwright
from loguru import logger
from locator import LocatorAvito

class AvitoParse:
    DEFAULT_PHOTO = "https://via.placeholder.com/150"
    
    def __init__(self, 
                 url_list, 
                 count=5, 
                 geo=None,  
                 debug_mode=0,
                 need_more_info: int = 1, 
                 stop_event=None):
        self.url_list = url_list
        self.url = None
        self.count = count
        self.data = []
        self.geo = geo
        self.debug_mode = debug_mode
        self.stop_event = stop_event or threading.Event()
        self.need_more_info = need_more_info
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def setup_driver(self):
        """Инициализация Playwright"""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=False)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()

    async def close_driver(self):
        """Закрытие ресурсов Playwright"""
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def parse(self):
        """Основной метод парсинга"""
        try:
            await self.setup_driver()
            
            for url in self.url_list:
                if self.stop_event.is_set():
                    logger.info("Процесс остановлен по сигналу")
                    return
                    
                self.url = url
                logger.info(f"Переход по адресу: {url}")
                
                try:
                    await self.page.goto(url, timeout=60000)
                    await self.__handle_pagination()
                except Exception as e:
                    logger.error(f"Ошибка при обработке {url}: {e}")
                    continue
                    
        finally:
            await self.close_driver()
            logger.info("Парсинг завершен")

    async def __handle_pagination(self):
        """Обработка пагинации"""
        for _ in range(self.count):
            if self.stop_event.is_set():
                break
                
            logger.info("Парсинг страницы...")
            await self.__parse_page()

            next_url = self.get_next_page_url(self.url)
            if not next_url:
                break
                
            logger.info(f"Переход на следующую страницу: {next_url}")
            await self.page.goto(next_url, timeout=60000)

    async def __parse_page(self):
        """Парсинг списка объявлений"""
        try:
            await self.page.wait_for_selector("div[data-marker='item']", timeout=10000)
            items = await self.page.query_selector_all("div[data-marker='item']")
            logger.info(f"Найдено {len(items)} объявлений")
            
            # Прокрутка для загрузки всех элементов
            await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)
            
            for item in items:
                if self.stop_event.is_set():
                    return
                    
                try:
                    item_data = await self.__parse_item(item)
                    if item_data and self.need_more_info:
                        item_data = await self.__parse_full_page(item_data)
                        
                    if item_data:
                        await self.__save_data(item_data)
                        
                except Exception as e:
                    logger.debug(f"Ошибка при обработке объявления: {e}")
                    
        except Exception as e:
            logger.error(f"Ошибка при парсинге страницы: {e}")

    async def __parse_item(self, item):
        """Парсинг отдельного объявления"""
        try:
            name_element = await item.query_selector(LocatorAvito.NAME[1])
            name = await name_element.inner_text() if name_element else ""
            
            link_element = await item.query_selector("a")
            url = await link_element.get_attribute("href") if link_element else ""
            if url:
                if not url.startswith(('http://', 'https://')):
                    url = f"https://www.avito.ru{url}" if url.startswith('/') else f"https://www.avito.ru/{url}"
            
            ads_id = await item.get_attribute("data-item-id") or self.__extract_id_from_url(url)
            
            if not ads_id or await self.is_viewed(ads_id):
                return None
                
            price_meta = await item.query_selector("meta[itemprop='price']")
            description_meta = await item.query_selector(LocatorAvito.DESCRIPTIONS[1])
            
            return {
                "announcement_id": ads_id,
                "name": name,
                "url": url,
                "price": await price_meta.get_attribute("content") if price_meta else None,
                "description": await description_meta.get_attribute("content") if description_meta else ""
            }
            
        except Exception as e:
            logger.debug(f"Ошибка при парсинге элемента: {e}")
            return None

    async def __parse_full_page(self, data):
        try:
            # Создаем новую страницу в новом контексте
            url = data['url']
            new_page = await self.context.new_page()
            
            try:
                await new_page.goto(url, timeout=60000)
                
                if "Доступ ограничен" in await new_page.title():
                    logger.warning("Обнаружена блокировка IP")
                    await new_page.close()
                    await self.ip_block()
                    return await self.__parse_full_page(data)
                    
                # Парсинг фото
                try:
                    img = await new_page.query_selector("img.desktop-1ky5g7j")
                    data["photo"] = await img.get_attribute("src") if img else self.DEFAULT_PHOTO
                except Exception as e:
                    data["photo"] = self.DEFAULT_PHOTO
                    logger.error(f"Ошибка при получении фото: {e}")
                    
                # Парсинг адреса и координат
                if self.geo:
                    await self.__parse_geo_data(new_page, data)
                    
                # Парсинг параметров
                await self.__parse_parameters(new_page, data)
                
                return data
                
            finally:
                await new_page.close()
                
        except Exception as e:
            logger.error(f"Ошибка при парсинге полной страницы: {e}")
            return data

    async def __parse_geo_data(self, page, data):
        """Парсинг географических данных"""
        try:
            address_container = await page.query_selector("div.style-item-address-KooqC")
            if address_container:
                address_element = await address_container.query_selector("span.style-item-address__string-wt61A")
                data["address"] = await address_element.inner_text() if address_element else ""
                
                district_element = await address_container.query_selector("span.style-item-address-georeferences-item-TZsrp")
                data["district"] = await district_element.inner_text() if district_element else ""
                
            map_container = await page.query_selector("div.style-item-map-wrapper-ElFsX")
            if map_container:
                lat = await map_container.get_attribute("data-map-lat")
                lon = await map_container.get_attribute("data-map-lon")
                if lat and lon:
                    data["coordinates"] = f"{round(float(lat), 5)},{round(float(lon), 5)}"
                data["data_location_id"] = await map_container.get_attribute("data-location-id")
                
        except Exception as e:
            logger.warning(f"Ошибка при парсинге геоданных: {e}")

    async def __parse_parameters(self, page, data):
        """Парсинг параметров объявления"""
        try:
            params = {}
            # Парсим основной список параметров
            params_list = await page.query_selector("ul.params-paramsList-_awNW")
            if params_list:
                items = await params_list.query_selector_all("li.params-paramsList__item-_2Y2O")
                for item in items:
                    full_text = await item.text_content()
                    if ":" in full_text:
                        param_name, param_value = full_text.split(":", 1)
                        params[param_name.strip()] = param_value.strip()

            # Парсим детали дома (если есть второй список)
            details_div = await page.query_selector("div.styles-params-A5_I4")
            if details_div:
                details_list = await details_div.query_selector("ul.params-paramsList-_awNW")
                if details_list:
                    details_items = await details_list.query_selector_all("li.params-paramsList__item-_2Y2O")
                    for item in details_items:
                        full_text = await item.text_content()
                        if ":" in full_text:
                            param_name, param_value = full_text.split(":", 1)
                            params[param_name.strip()] = param_value.strip()

            # Маппинг параметров
            param_mapping = {
                "number_of_rooms": "Количество комнат",
                "total_area": "Общая площадь",
                "kitchen_area": "Площадь кухни",
                "floor": "Этаж",
                "balcony_or_loggia": "Балкон или лоджия",
                "ceiling_height": "Высота потолков",
                "bathroom": "Санузел",
                "windows": "Окна",
                "repair": "Ремонт",
                "house_type": "Тип дома",
                "year_of_construction": "Год постройки",
                "number_of_floors": "Этажей в доме",
                "passenger_elevator": "Пассажирский лифт",
                "service_elevator": "Грузовой лифт",
                "courtyard": "Двор",
                "parking": "Парковка",
            }

            # Заполнение данных
            for field, param_name in param_mapping.items():
                if param_name in params:
                    if field in ["number_of_rooms", "total_area", "kitchen_area", "floor", "ceiling_height", "number_of_floors"]:
                        value = params[param_name].split()[0]  # Берём первое слово (число)
                        data[field] = float(value) if value.replace(".", "").isdigit() else None
                    else:
                        data[field] = params[param_name].strip()

        except Exception as e:
            logger.warning(f"Ошибка при парсинге параметров: {e}")

    @staticmethod
    def __extract_id_from_url(url):
        """Извлечение ID из URL"""
        try:
            ids = re.findall(r"_\d+$", url)
            return ids[0][1:] if ids else None
        except Exception:
            return None

    def get_next_page_url(self, url):
        """Генерация URL следующей страницы"""
        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            params['p'] = int(params.get('p', [1])[0]) + 1
            new_query = urlencode(params, doseq=True)
            return urlunparse(parsed._replace(query=new_query))
        except Exception as e:
            logger.error(f"Ошибка генерации URL следующей страницы: {e}")
            return None

    async def is_viewed(self, ads_id):
        """Проверка, было ли объявление уже просмотрено"""
        from asgiref.sync import sync_to_async
        return await sync_to_async(Announcements.objects.filter(announcement_id=ads_id).exists)()

    async def ip_block(self):
        """Обработка блокировки IP"""
        logger.warning("Обнаружена блокировка IP - ожидание 60 секунд")
        await asyncio.sleep(60)

    async def __save_data(self, data):
        """Сохранение данных"""
        try:
            from asgiref.sync import sync_to_async
            
            address = data.get("address")
            if not address:
                logger.warning(f"Адрес отсутствует для объявления {data.get('name')}")
                return

            # Асинхронное сохранение здания
            building, created = await sync_to_async(Buildings.objects.get_or_create)(
                address_text=address,
                defaults={
                    "address_text": data.get("address"),
                    "district": data.get("district"),
                    "coordinates": data.get("coordinates"),
                    "house_type": data.get("house_type"),
                    "year_of_construction": data.get("year_of_construction"),
                    "number_of_floors": data.get("number_of_floors"),
                    "ceiling_height": data.get("ceiling_height"),
                    "passenger_elevator": data.get("passenger_elevator"),
                    "service_elevator": data.get("service_elevator"),
                    "courtyard": data.get("courtyard"),
                    "parking": data.get("parking"),
                }
            )

            logger.info(f"Здание {'создано' if created else 'найдено'}: {building.address_text}")

            # Асинхронное сохранение объявления
            await sync_to_async(Announcements.objects.update_or_create)(
                announcement_id=data.get("announcement_id"),
                defaults={
                    "name": data.get("name"),
                    "url": data.get("url"),
                    "price": data.get("price"),
                    "pricePerMeter": data.get("pricePerMeter"),
                    "photo": data.get("photo"),
                    "coordinates": data.get("coordinates"),
                    "number_of_rooms": data.get("number_of_rooms"),
                    "total_area": data.get("total_area"),
                    "kitchen_area": data.get("kitchen_area"),
                    "floor": data.get("floor"),
                    "balcony_or_loggia": data.get("balcony_or_loggia"),
                    "bathroom": data.get("bathroom"),
                    "windows": data.get("windows"),
                    "repair": data.get("repair"),
                    "building": building,
                }
            )
            logger.info(f"Объявление сохранено: {data.get('name')}")

        except Exception as e:
            logger.error(f"Ошибка при сохранении данных: {e}")
            logger.error(f"Данные объявления: {data}")

    def check_stop_event(self):
        if self.stop_event.is_set():
            logger.info("Процесс будет остановлен")
            raise StopEventException()

    @staticmethod
    def __pretty_log(data):
        """Красивый вывод"""
        logger.success(
            f'\n{data.get("name", "-")}\n'
            f'Цена: {data.get("price", "-")}\n'
            f'Адрес: {data.get("address", "-")}\n'
            f'Район: {data.get("district", "-")}\n'
            f'Фото: {data.get("photo", "-")}\n'
            f'Координаты: {data.get("coordinates", "-")}\n'
            f'Цена за кв.м.: {data.get("pricePerMeter","-")}\n'
            f'Кол-во комнат: {data.get("number_of_rooms", "-")}\n'
            f'Общая площадь: {data.get("total_area", "-")}\n'
            f'Площадь кухни: {data.get("kitchen_area", "-")}\n'
            f'Этаж: {data.get("floor", "-")}\n'
            f'Балкон или лоджия: {data.get("balcony_or_loggia", "-")}\n'
            f'Высота потолков: {data.get("ceiling_height", "-")}\n'
            f'Санузел: {data.get("bathroom", "-")}\n'
            f'Окна: {data.get("windows", "-")}\n'
            f'Ремонт: {data.get("repair", "-")}\n'
            f'Ссылка: {data.get("url", "-")}\n'
            f'Тип дома: {data.get("house_type", "-")}\n'
            f'Год постройки: {data.get("year_of_construction", "-")}\n'
            f'Этажей в доме: {data.get("number_of_floors", "-")}\n'
            f'Пассажирский лифт: {data.get("passenger_elevator", "-")}\n'
            f'Грузовой лифт: {data.get("service_elevator", "-")}\n'
            f'Двор: {data.get("courtyard", "-")}\n'
            f'Парковка: {data.get("parking", "-")}\n'
        )

async def main():
    config = configparser.ConfigParser()
    config.read("settings.ini", encoding="utf-8")

    try:
        url = config["Avito"]["URL"].split(",")
    except Exception:
        with open('settings.ini', encoding="utf-8") as file:
            line_url = file.readlines()[1]
            regex = r"http.+"
            url = re.findall(regex, line_url)

    num_ads = config["Avito"]["NUM_ADS"]
    freq = config["Avito"]["FREQ"]
    geo = config["Avito"].get("GEO", "") or ""
    need_more_info = config["Avito"]["NEED_MORE_INFO"]

    while True:
        try:
            parser = AvitoParse(
                url_list=url,
                count=int(num_ads),
                geo=geo,
                need_more_info=1 if need_more_info else 0,
            )
            await parser.parse()
            logger.info("Пауза")
            await asyncio.sleep(int(freq))
        except Exception as error:
            logger.error(error)
            logger.error('Произошла ошибка, но работа будет продолжена через 30 сек.')
            await asyncio.sleep(30)

if __name__ == '__main__':
    import configparser
    asyncio.run(main())