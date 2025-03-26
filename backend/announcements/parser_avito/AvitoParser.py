import configparser
import re
import threading
import time
import os, django, sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.locateme.settings')
django.setup()
import flet as ft
from loguru import logger
from lang import *
from parser_cls import AvitoParse


def main(page: ft.Page):
    page.title = f'Parser Avito'
    page.theme_mode = ft.ThemeMode.DARK
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.window.width = 1000
    page.window.height = 920
    page.window.min_width = 650
    page.window.min_height = 920
    page.padding = 20
    config = configparser.ConfigParser()
    current_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(current_dir, "settings.ini")
    config.read(config_path, encoding='utf-8')
    is_run = False
    stop_event = threading.Event()

    def set_up():
        """Работа с настройками"""
        nonlocal config
        try:
            """Багфикс возможных проблем с экранированием"""
            url_input.value = "\n".join(config["Avito"]["URL"].split(","))
        except Exception as err:
            logger.debug(f"Ошибка url при открытии конфига: {err}")
            with open(config_path) as file:
                line_url = file.readlines()[1]
                regex = r"http.+"
                all_links = re.findall(regex, line_url)
                if all_links:
                    url_input.value = "\n".join(all_links)
                url_input.value = re.findall(regex, line_url)[0]
        count_page.value = config["Avito"]["NUM_ADS"]
        pause_sec.value = config["Avito"]["FREQ"]
        geo.value = config["Avito"].get("GEO", "")
        need_more_info.value = True if config["Avito"].get("NEED_MORE_INFO", "0") == "1" else False
        debug_mode.value = True if config["Avito"].get("DEBUG_MODE", "0") == "1" else False
        page.update()

    def save_config():
        """Сохраняет конфиг"""
        config["Avito"]["URL"] = ",".join(str(url_input.value).replace('%', '%%').split())  # bugfix
        config["Avito"]["NUM_ADS"] = count_page.value
        config["Avito"]["FREQ"] = pause_sec.value
        config["Avito"]["GEO"] = geo.value
        config["Avito"]["NEED_MORE_INFO"] = "1" if need_more_info.value else "0"
        config["Avito"]["DEBUG_MODE"] = "1" if debug_mode.value else "0"
        with open(config_path, 'w', encoding='utf-8') as configfile:
            config.write(configfile)
        logger.debug("Настройки сохранены")


    def logger_console_init():
        logger.add(logger_console_widget, format="{time:HH:mm:ss} - {message}")

    def logger_console_widget(message):
        console_widget.value += message
        page.update()


    def start_parser(e):
        nonlocal is_run
        logger.info("Старт")
        stop_event.clear()
        save_config()
        console_widget.height = 700
        input_fields.visible = False
        start_btn.visible = False
        stop_btn.visible = True
        is_run = True
        page.update()
        while is_run and not stop_event.is_set():
            run_process()
            if not is_run:
                return
            logger.info("Пауза между повторами")
            for _ in range(int(pause_sec.value if pause_sec.value else 300)):
                time.sleep(1)
                if not is_run:
                    logger.info("Завершено")
                    start_btn.text = "Старт"
                    start_btn.disabled = False
                    page.update()
                    return

    def stop_parser(e):
        nonlocal is_run
        stop_event.set()
        logger.debug("Стоп")
        is_run = False
        console_widget.height = 100
        input_fields.visible = True
        stop_btn.visible = False
        start_btn.visible = True
        start_btn.text = "Останавливаюсь..."
        start_btn.disabled = True
        page.update()

    def geo_change(e):
        if geo.value:
            need_more_info.value = True
        page.update()

    def run_process():
        parser = AvitoParse(
            url_list=url_input.value.split(),
            stop_event=stop_event,
            count=int(count_page.value),
            geo=geo.value,
            debug_mode=debug_mode.value,
            need_more_info=need_more_info.value,
        )
        #parser.url = url_input.value.split()

        parsing_thread = threading.Thread(target=parser.parse)
        parsing_thread.start()
        parsing_thread.join()
        start_btn.disabled = False
        start_btn.text = "Старт"
        page.update()

    label_required = ft.Text("Обязательные параметры", size=20)
    url_input = ft.TextField(
        label="Актуальная ссылка",
        multiline=True,
        min_lines=1,
        max_lines=5,
        expand=True,
        tooltip=URL_INPUT_HELP
    )
    label_not_required = ft.Text("Дополнительные параметры")
    
    count_page = ft.TextField(label="Количество страниц", width=400, expand=True, tooltip=COUNT_PAGE_HELP)
    pause_sec = ft.TextField(label="Пауза в секундах между повторами", width=400, expand=True, tooltip=PAUSE_SEC_HELP)
    geo = ft.TextField(label="Ограничение по городу", width=400, on_change=geo_change, expand=True, tooltip=GEO_HELP)
    start_btn = ft.FilledButton("Старт", width=800, on_click=start_parser, expand=True)
    stop_btn = ft.OutlinedButton("Стоп", width=980, on_click=stop_parser, visible=False,
                                 style=ft.ButtonStyle(bgcolor=ft.colors.RED_400), expand=True)
    console_widget = ft.Text(width=800, height=100, color=ft.colors.GREEN, value="", selectable=True,
                             expand=True)  # , bgcolor=ft.colors.GREY_50)
    need_more_info = ft.Checkbox("Дополнительная информация", on_change=geo_change, tooltip=NEED_MORE_INFO_HELP)
    debug_mode = ft.Checkbox("Режим отладки", tooltip=DEBUG_MODE_HELP)

    input_fields = ft.Column(
        [
            label_required,
            url_input,
            
            ft.Text(""),
            label_not_required,

            ft.Row(
                [count_page, pause_sec],
                alignment=ft.MainAxisAlignment.CENTER,
                spacing=0
            ),
            
        ],
        expand=True,
        alignment=ft.MainAxisAlignment.CENTER,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER
    )

    controls = ft.Column(
        [console_widget,
         start_btn,
         stop_btn],
        expand=True,
        alignment=ft.MainAxisAlignment.CENTER,
        horizontal_alignment=ft.CrossAxisAlignment.CENTER
    )
    all_field = ft.Column([input_fields, controls], alignment=ft.MainAxisAlignment.CENTER,
                          horizontal_alignment=ft.CrossAxisAlignment.CENTER)

    def start_page():
        page.add(all_field, )

    set_up()
    start_page()
    logger_console_init()


ft.app(
    target=main,
)
