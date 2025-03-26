from playwright.async_api import async_playwright  # Используем асинхронный Playwright
from asgiref.sync import sync_to_async  # Для работы с синхронным Django ORM
import time, random, asyncio
import sys, os, django

# Настройка Django
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.locateme.settings')
django.setup()

from amenities.models import Amenities  # Импорт модели

@sync_to_async
def save_to_database(name, address, lat, lon):
    """Сохраняет данные в базу данных."""
    try:
        # Создаём или обновляем запись в базе данных
        Amenities.objects.update_or_create(
            title=name,
            address=address,
            defaults={
                'type': 'gas_station',  # Указываем тип удобства
                'coordinates': f"{lat},{lon}", 
            }
        )
    except Exception as e:
        print(f"Ошибка при сохранении в базу данных: {e}")

async def run_gas_station_parser(log, stop_flag):

    async def handle_response(response):
        """Обработка API-ответов."""
        if response.url.startswith('https://catalog.api.2gis.ru/3.0/items'):
            try:
                data = await response.json()
                if 'result' in data and 'items' in data['result']:
                    for item in data['result']['items']:
                        name = item.get('name', 'Название не указано')
                        address = item.get('address_name', 'Адрес не указан')
                        point = item.get('point', {})
                        lat = point.get('lat', None)
                        lon = point.get('lon', None)
                        if lat and lon:
                            log(f"Название заправки: {name}")
                            log(f"Адрес: {address}")
                            log(f"Координаты: {lat}, {lon}")
                            log("---")
                            
                            # Сохраняем данные в базу данных
                            await save_to_database(name, address, lat, lon)
            except Exception as e:
                log(f"Ошибка при обработке данных: {e}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)  # headless=True для режима без GUI
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            ignore_https_errors=True
        )
        page = await context.new_page()

        # Открыть страницу
        url = "https://2gis.ru/astrakhan/search/%D0%B7%D0%B0%D0%BF%D1%80%D0%B0%D0%B2%D0%BA%D0%B8?m=48.132681%2C46.341209%2F12.02"
        await page.goto(url)

        # Перехват API-запросов
        page.on("response", handle_response)

        # Ждём загрузки страницы
        await asyncio.sleep(5)

        # Переход по страницам
        while not stop_flag():
            try:
                next_button = await page.query_selector('div._n5hmn94:nth-child(2)')
                if not next_button or '_7q94tr' in await next_button.get_attribute('class'):
                    log("Кнопка следующей страницы недоступна. Завершение.")
                    break

                await next_button.click()
                await page.wait_for_load_state("networkidle")
                await asyncio.sleep(random.uniform(2, 5))
                log("Переход на следующую страницу...")
            except Exception as e:
                log(f"Ошибка при переходе: {e}")
                break

        await browser.close()