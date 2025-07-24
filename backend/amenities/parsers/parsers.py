import tkinter as tk
from tkinter import scrolledtext
from phrm_parser import run_pharmacy_parser
from station_parser import run_station_parser
from grocery_store_parser import run_grocery_store_parser
from bank_parser import run_bank_parser
from gym_parser import run_gym_parser
from mosque_religion_parser import run_mosque_religion_parser
from church_religion_parser import run_church_religion_parser
from restaurant_parser import run_restaurant_parser
from school_parser import run_school_parser
import threading
import asyncio


stop_parsing = False

def log(message):
    """Функция для логирования."""
    text_area.configure(state='normal')  # Разблокируем текстовое поле
    text_area.insert(tk.END, message + "\n")  # Добавляем сообщение
    text_area.configure(state='disabled')  # Блокируем текстовое поле
    text_area.see(tk.END)  # Прокручиваем до конца

def stop_parsers():
    """Функция для остановки парсинга."""
    global stop_parsing
    stop_parsing = True
    log("Запрошена остановка парсинга...")

def start_parsers():
    """Функция для запуска выбранных парсеров."""
    global stop_parsing
    stop_parsing = False

    selected_parsers = []
    if pharmacy_var.get():
        selected_parsers.append("Аптеки")
    if station_var.get():
        selected_parsers.append("Остановки")
    if grocery_store_var.get():
        selected_parsers.append("Продукты")
    if bank_var.get():
        selected_parsers.append("Банки")
    if gym_var.get():
        selected_parsers.append("Тренажерные залы")
    if religious_var.get():
        selected_parsers.append("Религиозные объекты")
    if restaurant_var.get():
        selected_parsers.append("Рестораны")
    if school_var.get():
        selected_parsers.append("Школы")
    if not selected_parsers:
        log("Не выбрано ни одного парсера.")
        return

    log(f"Запуск парсеров: {', '.join(selected_parsers)}")
    for parser in selected_parsers:
        if parser == "Аптеки":
            thread = threading.Thread(target=run_async_parser, args=(run_pharmacy_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Остановки":
            thread = threading.Thread(target=run_async_parser, args=(run_station_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Продукты":
            thread = threading.Thread(target=run_async_parser, args=(run_grocery_store_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Банки":
            thread = threading.Thread(target=run_async_parser, args=(run_bank_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Тренажерные залы":
            thread = threading.Thread(target=run_async_parser, args=(run_gym_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Религиозные объекты":
            thread1 = threading.Thread(target=run_async_parser, args=(run_mosque_religion_parser, log, lambda: stop_parsing))
            thread2 = threading.Thread(target=run_async_parser, args=(run_church_religion_parser, log, lambda: stop_parsing))
            thread1.start()
            thread2.start()
        elif parser == "Рестораны":
            thread = threading.Thread(target=run_async_parser, args=(run_restaurant_parser, log, lambda: stop_parsing))
            thread.start()
        elif parser == "Школы":
            thread = threading.Thread(target=run_async_parser, args=(run_school_parser, log, lambda: stop_parsing))
            thread.start()

def run_async_parser(parser_func, log, stop_flag):
    """Запускает асинхронный парсер в отдельном потоке."""
    asyncio.run(parser_func(log, stop_flag))

# Создание главного окна
root = tk.Tk()
root.title("Приложение для запуска парсеров")
root.geometry("600x600")

# Надпись "Парсеры"
label = tk.Label(root, text="Парсеры", font=("Arial", 14, "bold"))
label.pack(pady=10)

# Чекбоксы
pharmacy_var = tk.BooleanVar()
bank_var = tk.BooleanVar()
gym_var = tk.BooleanVar()
station_var = tk.BooleanVar()
grocery_store_var = tk.BooleanVar()
religious_var = tk.BooleanVar()
restaurant_var = tk.BooleanVar()
school_var = tk.BooleanVar()

checkbox_frame = tk.Frame(root)
checkbox_frame.pack(pady=10)

checkboxes = [
    ("Аптеки", pharmacy_var), ("Остановки", station_var),
    ("Продукты", grocery_store_var), ("Банкоматы", bank_var),
    ("Тренажерные залы", gym_var), ("Религиозные объекты", religious_var),
    ("Рестораны", restaurant_var), ("Салоны красоты", None),
    ("Школы", school_var), ("Детские сады", None),
    ("Пункты выдачи", None), ("Поликлиники", None),
    ("Торговые центры", None), ("ВУЗы и колледжи", None)
]

for i, (text, var) in enumerate(checkboxes):
    row = i % 7
    column = i // 7
    tk.Checkbutton(checkbox_frame, text=text, variable=var).grid(row=row, column=column, sticky="w")

# Кнопка "Запустить"
start_button = tk.Button(root, text="Запустить", command=start_parsers)
start_button.pack(pady=10)

# Кнопка "Остановить парсинг"
stop_button = tk.Button(root, text="Остановить парсинг", command=stop_parsers)
stop_button.pack(pady=10)

# Текстовое поле для логов
text_area = scrolledtext.ScrolledText(root, wrap=tk.WORD, state='disabled', height=15)
text_area.pack(pady=10, padx=10, fill=tk.BOTH, expand=True)

# Запуск главного цикла
root.mainloop()
