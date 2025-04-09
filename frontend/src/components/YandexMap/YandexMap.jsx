import React, { useEffect, useRef } from 'react';
import './YandexMap.css';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const YandexMap = ({ coordinates, amenities }) => {
  const mapRef = useRef(null);

  // Пресеты иконок для разных типов удобств
  const iconPresets = {
    stops: 'islands#blueStretchyIcon',        // Остановки
    school: 'islands#blueSchoolIcon',         // Школы
    kindergarten: 'islands#blueKindergartenIcon', // Детские сады
    pickup_point: 'islands#blueDeliveryIcon', // Пункты выдачи
    polyclinic: 'islands#blueMedicalIcon',    // Поликлиники
    center: 'islands#blueGovernmentIcon',     // Центры
    gym: 'islands#blueSportIcon',             // Спортзалы
    mall: 'islands#blueShoppingIcon',         // Торговые центры
    college_and_university: 'islands#blueCollegeIcon', // Вузы
    beauty_salon: 'islands#blueBeautyIcon',   // Салоны красоты
    gas_station: 'islands#blueFuelIcon',      // АЗС
    pharmacy: 'islands#bluePharmacyIcon',     // Аптеки
    grocery_store: 'islands#blueShopIcon',    // Магазины
    religious: 'islands#bluePlaceOfWorshipIcon', // Религиозные места
    restaurant: 'islands#blueFoodIcon',       // Рестораны
    bank: 'islands#blueMoneyIcon',            // Банки
  };

  useEffect(() => {
    if (!coordinates) return;

    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    if (!lat || !lon) return;

    const init = () => {
      const map = new window.ymaps.Map(mapRef.current, {
        center: [lat, lon],
        zoom: 16,
        controls: ['zoomControl', 'geolocationControl'],
      }, {
        searchControlProvider: 'yandex#search',
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
      });

      // Метка для основного здания
      map.geoObjects.add(new window.ymaps.Placemark([lat, lon], {
        balloonContent: 'Здание находится здесь',
      }, {
        preset: 'islands#redDotIconWithCaption',
      }));

      // Фильтруем удобства - оставляем только ближайшие
      if (amenities && amenities.length > 0) {
        const closestAmenities = {};
        
        // Находим ближайшие удобства каждого типа
        amenities.forEach(amenity => {
          const [amenityLat, amenityLon] = amenity.coordinates.split(',').map(parseFloat);
          const distance = haversine(lat, lon, amenityLat, amenityLon);
          
          if (!closestAmenities[amenity.type] || 
              distance < closestAmenities[amenity.type].distance) {
            closestAmenities[amenity.type] = {
              ...amenity,
              distance: distance
            };
          }
        });

        // Добавляем на карту только ближайшие удобства
        Object.values(closestAmenities).forEach(amenity => {
          const [amenityLat, amenityLon] = amenity.coordinates.split(',').map(parseFloat);
          
          map.geoObjects.add(new window.ymaps.Placemark([amenityLat, amenityLon], {
            balloonContent: `${amenity.title} (${amenity.type})`,
            hintContent: `${amenity.title} (${amenity.distance.toFixed(2)} км)`,
          }, {
            preset: iconPresets[amenity.type] || 'islands#blueCircleIcon',
            iconColor: '#1e98ff' // Единый синий цвет для всех иконок
          }));
        });
      }
    };

    if (window.ymaps && window.ymaps.Map) {
      init();
    } else {
      const checkYmaps = setInterval(() => {
        if (window.ymaps && window.ymaps.Map) {
          clearInterval(checkYmaps);
          init();
        }
      }, 100);
    }
  }, [coordinates, amenities]);

  return <div ref={mapRef} className="ymap" />;
};

export default YandexMap;