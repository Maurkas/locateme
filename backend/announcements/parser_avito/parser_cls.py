import threading
import time
import re, os, sys, django
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from announcements.models import Announcements
from buildings.models import Buildings
from custom_exception import StopEventException
from seleniumbase import Driver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium_stealth import stealth
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from locator import LocatorAvito

class AvitoParse:
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

    def setup_driver(self):
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        if not self.debug_mode:
            options.add_argument("--headless")
        self.driver = Driver(uc=True)
        stealth(self.driver,
            languages=["en-US", "en"],
            vendor="Google Inc.",
            platform="Win32",
            webgl_vendor="Intel Inc.",
            renderer="Intel Iris OpenGL Engine",
            fix_hairline=True,
        )

    # def __get_url(self):
    #     logger.info(f"Открываю страницу: {self.url}")
    #     self.driver.open(self.url)

    def parse(self):
        self.setup_driver()
        main_page_opened = False  # Флаг для проверки первого запуска
        
        for url in self.url_list:
            self.url = url
            if self.stop_event and self.stop_event.is_set():
                logger.info("Процесс будет остановлен")
                return
            try:
                # Открываем главную страницу только один раз
                if not main_page_opened:
                    self.driver.get("https://www.avito.ru/")
                    logger.info("Ожидание 1 секунду на главной странице...")
                    time.sleep(1)
                    main_page_opened = True  # Устанавливаем флаг, чтобы не открывать снова

                logger.info(f"Переход по адресу: {url}")
                self.driver.get(self.url)

                # Если открывается новая вкладка, закрываем её
                if len(self.driver.window_handles) > 1:
                    self.driver.close()
                    self.driver.switch_to.window(self.driver.window_handles[0])

                # Обрабатываем пагинацию на текущей странице
                #self.__get_url()
                self.__paginator()
            except StopEventException:
                logger.info("Парсинг завершен")
                return
            except Exception as e:
                logger.error(f"Ошибка при обработке {url}: {e}")
        self.stop_event.clear()
        logger.info("Парсинг завершен")
        self.driver.quit()

    def __paginator(self):
        for _ in range(self.count):
            if self.stop_event.is_set():
                break
            logger.info("Начинаю парсинг страницы...")
            self.__parse_page()

            next_url = self.get_next_page_url(self.url)
            if not next_url:
                break
            self.url = next_url
            self.driver.get(self.url)

    def __parse_page(self):
        """Парсит открытую страницу"""
        self.check_stop_event()

        # Получение всех объявлений на странице
        titles = WebDriverWait(self.driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "div[data-marker='item']"))
        )
        logger.info(f"Найдено {len(titles)} объявлений на странице")
        data_from_general_page = []
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)  # Подождите, пока элемент загрузится

        # Обход каждого объявления
        for title in titles:
            try:
                name = title.find_element(*LocatorAvito.NAME).text
            except Exception:  # иногда это не объявление
                continue

            if title.find_elements(*LocatorAvito.DESCRIPTIONS):
                try:
                    description = title.find_element(*LocatorAvito.DESCRIPTIONS).get_attribute("content")
                except Exception as err:
                    logger.debug(f"Ошибка при получении описания: {err}")
                    description = ''
            else:
                description = ''
            logger.info(f"Название: {title.find_element(*LocatorAvito.NAME).text}")
            name = title.find_element(*LocatorAvito.NAME).text
            url = title.find_element(By.TAG_NAME, "a").get_attribute("href")
            logger.info(f"Парсит страницу: {url}")
            price_meta = title.find_element(By.CSS_SELECTOR, "meta[itemprop='price']")
            price = price_meta.get_attribute("content")
            ads_id = title.get_attribute("data-item-id")
            
            if url and not ads_id:
                try:
                    regex = r"_\d+$"
                    ids = re.findall(pattern=regex, string=url)
                    if ids:
                        ads_id = url[-1][:-1]
                    continue
                except Exception:
                    continue

            if not ads_id: continue
            

            if self.is_viewed(ads_id):
                logger.info(f"Объявление уже просмотрено: {ads_id}")
                continue

            # Сбор базовой информации
            data = {"announcement_id": ads_id, "name": name, "url": url, "price": price, "description": description}

            data_from_general_page.append(data)
        if data_from_general_page:
            self.__parse_other_data(item_info_list=data_from_general_page)

    def __parse_other_data(self, item_info_list: list):
        """Собирает доп. информацию для каждого объявления"""
        for item_info in item_info_list:
            try:
                if self.stop_event.is_set():
                    logger.info("Процесс будет остановлен")
                    break
                if self.need_more_info:
                    item_info = self.__parse_full_page(item_info)
                self.__pretty_log(data=item_info)
                self.__save_data(data=item_info)
            except Exception as err:
                logger.debug(err)

    def __parse_full_page(self, data: dict) -> dict:
        logger.info("Начало парсинга объявления")
        """Парсит для доп. информации открытое объявление"""
        self.driver.uc_open(data.get("url"))
        if "Доступ ограничен" in self.driver.get_title():
            logger.info("Доступ ограничен: проблема с IP")
            self.ip_block()
            return self.__parse_full_page(data=data)
        logger.info(data["name"])
        
        """Фото"""
        try:
            img_elements = self.driver.find_elements(By.CSS_SELECTOR, "img.desktop-1ky5g7j")
            if img_elements:
                photo = img_elements[0].get_attribute("src")
                if not photo:  # Если src пустой
                    photo = "https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album"
                    logger.warning("Не удалось получить URL фото, установлено значение по умолчанию")
            else:
                photo = "https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album"
                logger.warning("Элемент фото не найден, установлено значение по умолчанию")
            
            data["photo"] = photo
            logger.info(f"Фото: {photo}")
        except Exception as e:
            photo = "https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album"
            data["photo"] = photo
            logger.error(f"Ошибка при получении фото: {e}")

        """Гео"""
        if self.geo:
            # Извлекаем адрес и район
            try:
                address_container = self.driver.find_element(By.CSS_SELECTOR, "div.style-item-address-KooqC")
                main_address = address_container.find_element(By.CSS_SELECTOR, "span.style-item-address__string-wt61A").text

                # Извлекаем район
                district_element = address_container.find_element(By.CSS_SELECTOR, "span.style-item-address-georeferences-item-TZsrp")
                district = district_element.text if district_element else ""

                # Записываем адрес и район через запятую
                data["address"] = main_address
                data["district"] = district

            except Exception as e:
                print(f"Ошибка при извлечении адреса и района: {e}")
        
        """Координаты"""
        try:
            # Извлекаем координаты
            map_container = self.driver.find_element(By.CSS_SELECTOR, "div.style-item-map-wrapper-ElFsX")
            latitude = map_container.get_attribute("data-map-lat")
            longitude = map_container.get_attribute("data-map-lon")
            data_location_id = map_container.get_attribute("data-location-id")
            data["data_location_id"] = data_location_id
            
            # Сохраняем координаты в формате "lat,lon"
            if latitude and longitude:
                rounded_latitude = round(float(latitude), 5)
                rounded_longitude = round(float(longitude), 5)
                data["coordinates"] = f"{rounded_latitude},{rounded_longitude}"
                logger.info(f"Координаты: {data['coordinates']}")
            else:
                logger.warning("Координаты не найдены")

        except Exception as e:
            logger.warning(f"Ошибка при извлечении координат: {e}")
            
        try:
            price_element = self.driver.find_element(By.CLASS_NAME, "styles-item-price-sub-price-A1IZy")
            price_paragraph = price_element.find_element(By.TAG_NAME, "p")
            price_span = price_paragraph.find_element(By.TAG_NAME, "span")
            price_text = price_span.text 
            cleaned_price = int(re.sub(r'[^\d]', '', price_text))
            pricePerMeter = int(cleaned_price)
            data["pricePerMeter"] = pricePerMeter
        except Exception as e:
            logger.warning(f"Ошибка при извлечении цены за квадратный метр: {e}")

        try:
            # Ищем список параметров
            params_ul = self.driver.find_element(By.CSS_SELECTOR, "ul.params-paramsList-_awNW")
            
            # Извлекаем все параметры из <li>
            params_li = params_ul.find_elements(By.CSS_SELECTOR, "li.params-paramsList__item-_2Y2O")
            params_dict = {li.text.split(":")[0].strip(): li.text.split(":")[1].strip() for li in params_li if ":" in li.text}

            data["number_of_rooms"] = params_dict.get("Количество комнат", None)
            data["total_area"] = params_dict.get("Общая площадь", "").split(" ")[0]
            data["kitchen_area"] = params_dict.get("Площадь кухни", "").split(" ")[0]
            data["floor"] = params_dict.get("Этаж", "").split(" ")[0]
            data["balcony_or_loggia"] = params_dict.get("Балкон или лоджия", None)
            data["ceiling_height"] = params_dict.get("Высота потолков", "-").split(" ")[0]
            data["bathroom"] = params_dict.get("Санузел", None)
            data["windows"] = params_dict.get("Окна", None)
            data["repair"] = params_dict.get("Ремонт", None)

            details_div = self.driver.find_element(By.CSS_SELECTOR, "div.styles-params-A5_I4")
            details_ul = details_div.find_element(By.CSS_SELECTOR, "ul.params-paramsList-_awNW")
            details_li = details_ul.find_elements(By.CSS_SELECTOR, "li.params-paramsList__item-_2Y2O")
            details_dict = {li.text.split(":")[0].strip(): li.text.split(":")[1].strip() for li in details_li if ":" in li.text}
            data["house_type"] = details_dict.get("Тип дома", None)
            data["year_of_construction"] = details_dict.get("Год постройки", None)
            data["number_of_floors"] = details_dict.get("Этажей в доме", None)
            data["passenger_elevator"] = details_dict.get("Пассажирский лифт", None)
            data["service_elevator"] = details_dict.get("Грузовой лифт", None)
            data["courtyard"] = details_dict.get("Двор", None)
            data["parking"] = details_dict.get("Парковка", None)

        except Exception as e:
            logger.warning(f"Ошибка при извлечении параметров: {e}")

        return data
    
    def open_next_btn(self):
        self.url = self.get_next_page_url(url=self.url)
        logger.info("Следующая страница")
        self.driver.uc_open(self.url)

    @staticmethod
    def get_next_page_url(url: str):
        """Получает следующую страницу"""
        try:
            url_parts = urlparse(url)
            query_params = parse_qs(url_parts.query)
            current_page = int(query_params.get('p', [1])[0])
            query_params['p'] = current_page + 1
            new_query = urlencode(query_params, doseq=True)
            next_url = urlunparse((url_parts.scheme, url_parts.netloc, url_parts.path, url_parts.params, new_query,
                                   url_parts.fragment))
            return next_url
        except Exception as err:
            logger.error(f"Не смог сформировать ссылку на следующую страницу для {url}. Ошибка: {err}")
    
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

    def is_viewed(self, ads_id: str) -> bool:
        """Проверяет, существует ли объявление с таким announcement_id в базе данных"""
        return Announcements.objects.filter(announcement_id=ads_id).exists()
    
    def __save_data(self, data):
        try:
            address = data.get("address")
            logger.info(f"Попытка сохранения здания с адресом: {address}")
            
            # Проверяем наличие адреса
            if not address:
                logger.warning(f"Адрес отсутствует для объявления {data.get('name')}")
                return

            # Создаем или обновляем здание по адресу
            building, created = Buildings.objects.get_or_create(
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

            if created:
                logger.info(f"Создано новое здание: {building.address_text}")
            else:
                logger.info(f"Найдено существующее здание: {building.address_text}")

            # Создаем или обновляем объявление
            announcement, _ = Announcements.objects.update_or_create(
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
            
    
if __name__ == '__main__':
    import configparser

    config = configparser.ConfigParser()  # создаём объекта парсера
    config.read("settings.ini", encoding="utf-8")  # читаем конфиг

    try:
        """Багфикс проблем с экранированием"""
        url = config["Avito"]["URL"].split(",")
    except Exception:
        with open('settings.ini', encoding="utf-8") as file:
            line_url = file.readlines()[1]
            regex = r"http.+"
            url = re.findall(regex, line_url)

    num_ads = config["Avito"]["NUM_ADS"]
    freq = config["Avito"]["FREQ"]
    keys = config["Avito"]["KEYS"].split(",")
    geo = config["Avito"].get("GEO", "") or ""
    need_more_info = config["Avito"]["NEED_MORE_INFO"]


    while True:
        try:
            AvitoParse(
                url=url,
                count=int(num_ads),
                geo=geo,
                need_more_info=1 if need_more_info else 0,
            ).parse()
            logger.info("Пауза")
            time.sleep(int(freq))
        except Exception as error:
            logger.error(error)
            logger.error('Произошла ошибка, но работа будет продолжена через 30 сек. '
                         'Если ошибка повторится несколько раз - перезапустите скрипт.'
                         'Если и это не поможет - обратитесь к разработчику по ссылке ниже')
            time.sleep(30)