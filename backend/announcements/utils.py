import math
from collections import defaultdict

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Радиус Земли в километрах
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def estimate_urban_distance(straight_dist: float) -> float:
    """
    Оценивает реальное пешеходное расстояние с учетом городской застройки
    
    Параметры:
    - straight_dist: расстояние по прямой в км
    - density_factor: фиксированное значение 1.5 (плотная застройка)
    - block_size: средний размер квартала в стандартном городе (0.15 км)
    """
    density_factor = 1.5
    block_size = 0.15  # средний размер квартала
    
    # Базовое увеличение из-за городской планировки
    base_multiplier = 1.0 + 0.2 * math.log1p(density_factor * 2)
    
    # Коррекция на размер кварталов (чем меньше кварталы, тем больше поворотов)
    grid_factor = math.log(straight_dist / block_size + 1) * 0.5
    
    # Итоговый расчет (без учета рек и магистралей)
    estimated_dist = straight_dist * base_multiplier + grid_factor
    
    return max(estimated_dist, straight_dist)

CATEGORY_WEIGHTS = {
    "mall": 2, "park": 3, "gym": 2, "station": 4,
    "kindergarten": 2, "school": 3, "beauty_salon": 1,
    "pickup_point": 1, "polyclinic": 3, "bank": 2, "center": 2,
    "college_and_university": 3, "grocery_store": 5,
}

MAX_CATEGORY_SCORE = 8
DISTANCE_THRESHOLDS = {
    'walkable': 0.5,  # км - пешая доступность
    'nearby': 1.0,    # км - ближайшая зона
    'far': 2.0        # км - дальняя зона
}

def calculate_walk_score(announcement_coordinates, infrastructure_data):
    MAX_THEORETICAL_SCORE = 80
    ann_lat, ann_lon = announcement_coordinates
    category_scores = {}

    for obj in infrastructure_data:
        obj_type = obj.get("type")
        if obj_type not in CATEGORY_WEIGHTS:
            continue

        try:
            obj_lat, obj_lon = map(float, obj.get("coordinates", "0,0").split(","))
        except (ValueError, AttributeError):
            continue

        # Получаем расстояние по прямой
        straight_dist = haversine(ann_lat, ann_lon, obj_lat, obj_lon)
        
        # Оцениваем реальное городское расстояние
        urban_dist = estimate_urban_distance(straight_dist)
        
        # Используем urban_dist вместо straight_dist для классификации
        if urban_dist <= DISTANCE_THRESHOLDS['walkable']:
            base_score = 4
        elif urban_dist <= DISTANCE_THRESHOLDS['nearby']:
            base_score = 2
        else:
            continue  # Пропускаем слишком далекие объекты

        weighted_score = base_score * CATEGORY_WEIGHTS[obj_type]
        
        if obj_type not in category_scores or weighted_score > category_scores[obj_type][0]:
            category_scores[obj_type] = (weighted_score, urban_dist)

    total_score = 0
    for obj_type, (score, _) in category_scores.items():
        capped_score = min(score, MAX_CATEGORY_SCORE)
        total_score += capped_score

    normalized_score = min(total_score, MAX_THEORETICAL_SCORE) / MAX_THEORETICAL_SCORE
    logistic_score = 100 / (1 + math.exp(-10 * (normalized_score - 0.5)))
    
    return round(logistic_score)