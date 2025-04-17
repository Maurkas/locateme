import tkinter as tk
from tkinter import ttk, scrolledtext
import queue
import ast
import requests
import sys
import os
import django
import asyncio
from asgiref.sync import sync_to_async
from threading import Thread

# Настройка Django
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.locateme.settings')
django.setup()
from buildings.models import Buildings, BuildingAmenities
from amenities.models import Amenities

# Асинхронные обертки для Django ORM
async_get_buildings = sync_to_async(lambda: list(Buildings.objects.all()))
async_get_amenity_types = sync_to_async(lambda: list(Amenities.objects.values_list('type', flat=True).distinct()))
async_get_amenities_by_type = sync_to_async(lambda amenity_type: list(Amenities.objects.filter(type=amenity_type)))
async_update_or_create = sync_to_async(BuildingAmenities.objects.update_or_create)

class DistanceCalculatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Расчет расстояний до инфраструктуры")
        self.root.geometry("800x600")
        
        self.running = False
        self.queue = queue.Queue()
        self.loop = asyncio.new_event_loop()
        
        self.create_widgets()
        self.check_queue()
        self.start_event_loop()
    
    def start_event_loop(self):
        def run_loop():
            asyncio.set_event_loop(self.loop)
            self.loop.run_forever()
        
        self.thread = Thread(target=run_loop, daemon=True)
        self.thread.start()
    
    def create_widgets(self):
        # Основной фрейм
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Фрейм для кнопок
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        # Кнопки управления
        self.start_button = ttk.Button(
            button_frame, 
            text="Старт расчета", 
            command=self.start_calculation
        )
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.cancel_button = ttk.Button(
            button_frame, 
            text="Остановить", 
            command=self.cancel_calculation,
            state=tk.DISABLED
        )
        self.cancel_button.pack(side=tk.LEFT, padx=5)
        
        # Progress bar
        self.progress = ttk.Progressbar(
            main_frame, 
            orient=tk.HORIZONTAL, 
            length=400, 
            mode='determinate'
        )
        self.progress.pack(fill=tk.X, pady=10)
        
        # Лог
        self.log_area = scrolledtext.ScrolledText(
            main_frame, 
            wrap=tk.WORD,
            state='disabled'
        )
        self.log_area.pack(fill=tk.BOTH, expand=True, pady=5)
    
    def log_message(self, message):
        self.log_area.configure(state='normal')
        self.log_area.insert(tk.END, message + "\n")
        self.log_area.see(tk.END)
        self.log_area.configure(state='disabled')
    
    def update_progress(self, value):
        self.progress['value'] = value
    
    def check_queue(self):
        try:
            while True:
                msg = self.queue.get_nowait()
                if msg['type'] == 'log':
                    self.log_message(msg['message'])
                elif msg['type'] == 'progress':
                    self.update_progress(msg['value'])
        except queue.Empty:
            pass
        
        self.root.after(100, self.check_queue)
    
    def start_calculation(self):
        if not self.running:
            self.running = True
            self.start_button.config(state=tk.DISABLED)
            self.cancel_button.config(state=tk.NORMAL)
            self.log_area.configure(state='normal')
            self.log_area.delete(1.0, tk.END)
            self.log_area.configure(state='disabled')
            self.progress['value'] = 0
            
            asyncio.run_coroutine_threadsafe(self.calculate_distances(), self.loop)
    
    def cancel_calculation(self):
        if self.running:
            self.running = False
            self.log_message("Процесс остановлен пользователем")
            self.start_button.config(state=tk.NORMAL)
            self.cancel_button.config(state=tk.DISABLED)
    
    async def calculate_distances(self):
        try:
            buildings = await async_get_buildings()
            amenity_types = await async_get_amenity_types()
            
            total_buildings = len(buildings)
            total_amenity_types = len(amenity_types)
            total_tasks = total_buildings * total_amenity_types
            completed = 0
            
            self.queue.put({'type': 'log', 'message': f"Начинаем расчет для {total_buildings} зданий и {total_amenity_types} типов удобств"})
            
            for i, building in enumerate(buildings):
                if not self.running:
                    break
                
                building_coords = ast.literal_eval(building.coordinates)
                if not building_coords or len(building_coords) != 2:
                    self.queue.put({'type': 'log', 'message': f"Здание {building.pk} имеет некорректные координаты"})
                    continue
                
                self.queue.put({'type': 'log', 'message': f"Обработка здания {i+1}/{total_buildings}: {building.address_text}"})
                
                for amenity_type in amenity_types:
                    if not self.running:
                        break
                    
                    closest_amenity = None
                    min_distance = float('inf')
                    
                    amenities = await async_get_amenities_by_type(amenity_type)
                    for amenity in amenities:
                        amenity_coords = ast.literal_eval(amenity.coordinates)
                        if not amenity_coords or len(amenity_coords) != 2:
                            continue
                            
                        distance = await self.get_walking_distance_osrm(building_coords, amenity_coords)
                        if distance is not None and distance < min_distance:
                            min_distance = distance
                            closest_amenity = amenity
                    
                    if closest_amenity:
                        await async_update_or_create(
                            building=building,
                            amenity=closest_amenity,
                            defaults={'distance': min_distance}
                        )
                        self.queue.put({
                            'type': 'log', 
                            'message': f"  - {amenity_type}: {min_distance:.0f} м до {closest_amenity.title}"
                        })
                    
                    completed += 1
                    progress = (completed / total_tasks) * 100
                    self.queue.put({'type': 'progress', 'value': progress})
            
            if self.running:
                self.queue.put({'type': 'log', 'message': "Расчет завершен успешно!"})
            else:
                self.queue.put({'type': 'log', 'message': "Расчет прерван"})
            
        except Exception as e:
            self.queue.put({'type': 'log', 'message': f"Критическая ошибка: {str(e)}"})
        finally:
            self.running = False
            self.queue.put({'type': 'progress', 'value': 100})
            self.root.after(100, lambda: [
                self.start_button.config(state=tk.NORMAL),
                self.cancel_button.config(state=tk.DISABLED)
            ])
    
    async def get_walking_distance_osrm(self, point1, point2, timeout=3.0):
        try:
            lat1, lon1 = point1
            lat2, lon2 = point2
            url = f"http://localhost:5000/route/v1/foot/{lon1},{lat1};{lon2},{lat2}?overview=false"
            
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "Ok" and data.get("routes"):
                return data["routes"][0]["distance"]
            return None
        except Exception as e:
            self.queue.put({'type': 'log', 'message': f"Ошибка расчета расстояния: {str(e)}"})
            return None

def run_calculator():
    root = tk.Tk()
    app = DistanceCalculatorApp(root)
    root.mainloop()

if __name__ == "__main__":
    run_calculator()