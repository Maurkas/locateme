import math, requests
from typing import Optional
from buildings.models import BuildingAmenities, Buildings


OSRM_SERVER_URL = "http://localhost:5000"

def get_walking_distance_osrm(
    point1: tuple[float, float], 
    point2: tuple[float, float],
    timeout: float = 3.0
) -> Optional[float]:
    """
    Возвращает дистанцию в метрах между точками пешком через OSRM.
    Если ошибка - возвращает None.
    """
    try:
        lon1, lat1 = point1
        lon2, lat2 = point2
        url = f"{OSRM_SERVER_URL}/route/v1/foot/{lon1},{lat1};{lon2},{lat2}?overview=false"
        
        response = requests.get(url, timeout=timeout)
        data = response.json()
        
        if response.status_code == 200 and data.get("code") == "Ok":
            return data["routes"][0]["distance"]  # Дистанция в метрах
        return None
    except (requests.RequestException, KeyError, IndexError):
        return None

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

def calculate_walk_score(announcement):
    """
    Рассчитывает Walk Score для объявления на основе BuildingAmenities
    """
    if not hasattr(announcement, 'building') or not announcement.building:
        return 0

    try:
        MAX_THEORETICAL_SCORE = 80
        category_scores = {}

        # Получаем все связанные amenities для этого здания
        amenities = BuildingAmenities.objects.filter(building=announcement.building)
        
        for amenity in amenities:
            obj_type = amenity.amenity.type
            if obj_type not in CATEGORY_WEIGHTS:
                continue

            urban_dist = amenity.distance / 1000
            
            if urban_dist <= DISTANCE_THRESHOLDS['walkable']:
                base_score = 4
            elif urban_dist <= DISTANCE_THRESHOLDS['nearby']:
                base_score = 2
            else:
                continue

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

    except Exception as e:
        print(f"Error calculating walk score: {e}")
        return 0

def calculate_personalized_score_db(
    building: Buildings,
    user_filters: dict[str, str],
    verbose: bool = False
) -> int:
    """
    Быстрый расчёт персональной оценки на основе building_amenities.
    """
    BASE_WEIGHTS = {
        "stops": 3, "school": 4, "kindergarten": 3, "pickup_point": 2,
        "polyclinic": 3, "center": 2, "gym": 2, "mall": 3,
        "college_and_university": 2, "beauty_salon": 1,
        "pharmacy": 2, "grocery_store": 4, "religious": 1, "restaurant": 2,
        "bank": 2, "custom_address": 5  # Добавляем вес для пользовательского адреса
    }

    active_filters = {k: v for k, v in user_filters.items() if v != "any"}
    if not active_filters:
        return None

    # Проверяем наличие пользовательского адреса
    custom_address_coords = None
    custom_address_pref = None
    if "custom_address[coords][lat]" in user_filters and "custom_address[coords][lon]" in user_filters:
        try:
            lat = float(user_filters["custom_address[coords][lat]"])
            lon = float(user_filters["custom_address[coords][lon]"])
            custom_address_coords = (lat, lon)
            custom_address_pref = user_filters.get("custom_address[distance]", "close")
        except (ValueError, TypeError):
            pass

    # Загружаем удобства рядом с этим зданием
    building_amenities = BuildingAmenities.objects.select_related("amenity").filter(building=building)
    category_scores = {}
    max_possible = sum(BASE_WEIGHTS.get(k, 1) * 2 for k in active_filters)
    
    # Добавляем максимальный возможный балл за пользовательский адрес, если он есть
    if custom_address_coords:
        max_possible += BASE_WEIGHTS["custom_address"] * 2

    for ba in building_amenities:
        obj_type = ba.amenity.type
        if obj_type not in active_filters:
            continue

        distance = ba.distance / 1000  # переводим в км
        preference = active_filters[obj_type]
        weight = BASE_WEIGHTS.get(obj_type, 1)

        if distance <= DISTANCE_THRESHOLDS['walkable']:
            zone = 'walkable'
        elif distance <= DISTANCE_THRESHOLDS['nearby']:
            zone = 'nearby'
        else:
            zone = 'far'

        if preference == "nearby":
            if zone == 'walkable':
                score = weight * 2
            elif zone == 'nearby':
                score = weight * 1
            else:
                score = -weight * 0.5
        elif preference == "far":
            if zone == 'far':
                score = weight * 1
            elif zone == 'nearby':
                score = weight * 0.5
            else:
                score = 0

        if obj_type not in category_scores or score > category_scores[obj_type]:
            category_scores[obj_type] = score

    # Добавляем оценку для пользовательского адреса
    custom_address_score = 0
    if custom_address_coords and building.coordinates:
        try:
            # Преобразуем координаты здания в нужный формат
            if isinstance(building.coordinates, str):
                building_coords = tuple(map(float, building.coordinates.strip("()").split(",")))
            else:
                building_coords = building.coordinates
            
            # Рассчитываем расстояние
            straight_dist = haversine(custom_address_coords[0], custom_address_coords[1], 
                                    building_coords[0], building_coords[1])
            distance = estimate_urban_distance(straight_dist)
            print('Дистанция: ', distance)
            
            # Определяем зону
            if distance <= DISTANCE_THRESHOLDS['walkable']:
                zone = 'walkable'
            elif distance <= DISTANCE_THRESHOLDS['nearby']:
                zone = 'nearby'
            else:
                zone = 'far'
            print('Зона:', zone)
            # Рассчитываем баллы в зависимости от предпочтений пользователя
            weight = BASE_WEIGHTS["custom_address"]
            if custom_address_pref == "nearby":
                if zone == 'walkable':
                    custom_address_score = weight * 2
                elif zone == 'nearby':
                    custom_address_score = weight * 1
                else:
                    custom_address_score = -weight * 0.5
        except Exception as e:
            if verbose:
                print(f"Ошибка расчета оценки для кастомного адреса: {e}")

    total_score = sum(category_scores.values()) + custom_address_score
    normalized_score = (total_score / max_possible) * 100 if max_possible > 0 else 0
    personalized_score = max(0, min(100, round(normalized_score)))

    if verbose:
        print("\n=== DB: Расчёт персональной оценки ===")
        print(f"Фильтры: {active_filters}")
        print(f"Оценка за amenities: {sum(category_scores.values())}")
        print(f"Оценка за custom address: {custom_address_score}")
        print(f"Сумма: {total_score}/{max_possible} = {personalized_score}")

    return personalized_score

def calculate_personal_walk_score(
    announcement_coordinates: tuple[float, float],
    infrastructure_data: list[dict],
    user_filters: dict[str, str],
    use_estimated: bool = False,
    verbose: bool = False
) -> int:

    BASE_WEIGHTS = {
        "stops": 3, "school": 4, "kindergarten": 3, "pickup_point": 2,
        "polyclinic": 3, "center": 2, "gym": 2, "mall": 3,
        "college_and_university": 2, "beauty_salon": 1,
        "pharmacy": 2, "grocery_store": 4, "religious": 1, "restaurant": 2,
        "bank": 2
    }

    ann_lat, ann_lon = announcement_coordinates
    active_filters = {k: v for k, v in user_filters.items() if v != "any"}
    if not active_filters:
        return 0

    category_scores = {}
    max_possible = sum(BASE_WEIGHTS.get(k, 1) * 2 for k in active_filters)

    for amenity in infrastructure_data:
        obj_type = amenity["type"]
        if obj_type not in active_filters:
            continue

        lat2 = float(amenity.get("lat"))
        lon2 = float(amenity.get("lon"))
        straight_dist = haversine(ann_lat, ann_lon, lat2, lon2)
        distance = estimate_urban_distance(straight_dist) if use_estimated else straight_dist

        preference = active_filters[obj_type]
        weight = BASE_WEIGHTS.get(obj_type, 1)

        if distance <= DISTANCE_THRESHOLDS['walkable']:
            zone = 'walkable'
        elif distance <= DISTANCE_THRESHOLDS['nearby']:
            zone = 'nearby'
        else:
            zone = 'far'

        if preference == "close":
            if zone == 'walkable':
                score = weight * 2
            elif zone == 'nearby':
                score = weight * 1
            else:
                score = -weight * 0.5
        elif preference == "far":
            if zone == 'far':
                score = weight * 1
            elif zone == 'nearby':
                score = weight * 0.5
            else:
                score = 0
        else: 
            score = 0

        if obj_type not in category_scores or score > category_scores[obj_type]:
            category_scores[obj_type] = score

    total_score = sum(category_scores.get(category, 0) for category in active_filters)
    normalized_score = (total_score / max_possible) * 100
    final_score = max(0, min(100, round(normalized_score)))

    if verbose:
        print("\n=== Расчёт оценки Walk Score ===")
        print(f"Фильтры: {active_filters}")
        print(f"Сумма: {total_score}/{max_possible} => {final_score}")

    return final_score
