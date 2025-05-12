import React, { useEffect, useRef } from 'react';
import './YandexMap.css';

const YandexMap = ({ coordinates, amenities }) => {
  const mapRef = useRef(null);

  const getAmenityIcon = (category) => {
    const icons = {
      station: '🚌',
      school: '🏫',
      kindergarten: '🏠',
      pickup_point: '📦',
      polyclinic: '🏥',
      center: '🏙️',
      gym: '💪',
      mall: '🛍️',
      college_and_university: '🎓',
      beauty_salon: '💇',
      pharmacy: '💊',
      grocery_store: '🛒',
      restaurant: '🍽️',
      park: '🌳',
      bank: '🏦',
      religious: '⛪',
    };
    return icons[category] || '📍';
  };

  const getAmenityLabel = (key) => {
    const labels = {
      station: 'Остановка',
      school: 'Школа',
      kindergarten: 'Детский сад',
      pickup_point: 'Пункт выдачи',
      polyclinic: 'Поликлиника',
      center: 'Центр города',
      gym: 'Спортзал',
      mall: 'Торговый центр',
      college_and_university: 'Колледжи и Вузы',
      beauty_salon: 'Салон красоты',
      pharmacy: 'Аптека',
      grocery_store: 'Продуктовый магазин',
      religious: 'Религиозное место',
      restaurant: 'Ресторан',
      bank: 'Банк',
      park: 'Парк',
    };
    return labels[key] || key;
  };

  useEffect(() => {
    if (!coordinates || !window.ymaps) return;

    const [lat, lon] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lon)) return;

    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(mapRef.current, {
        center: [lat, lon],
        zoom: 15,
        controls: ['zoomControl', 'geolocationControl'],
      }, {
        suppressMapOpenBlock: true,
        yandexMapDisablePoiInteractivity: true,
      });

      // Главная метка (объект)
      const mainPlacemark = new window.ymaps.Placemark([lat, lon], {
        balloonContent: 'Здание находится здесь',
        hintContent: 'Здание',
      }, {
        preset: 'islands#redIcon',
        zIndex: 1000,
      });

      map.geoObjects.add(mainPlacemark);

      // Метки удобств
      if (amenities?.length) {
        amenities.forEach(amenity => {
          const [amenityLat, amenityLon] = amenity.coordinates.split(',').map(parseFloat);
          if (isNaN(amenityLat) || isNaN(amenityLon)) return;

          const icon = getAmenityIcon(amenity.category);

          const layout = window.ymaps.templateLayoutFactory.createClass(`
            <div style="
              font-size: 18px;
              width: 36px;
              height: 36px;
              background: #fff;
              border: 2px solid #1e88e5;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s;
              cursor: pointer;
            ">${icon}</div>
          `);

          const placemark = new window.ymaps.Placemark([amenityLat, amenityLon], {
            balloonContent: `
              <strong>${amenity.title}</strong><br/>
              Категория: ${getAmenityLabel(amenity.category)}<br/>
              Расстояние: ${amenity.distance.toFixed(2)} м
            `,
            hintContent: `${amenity.title} (${amenity.distance.toFixed(2)} м)`
          }, {
            iconLayout: 'default#imageWithContent',
            iconContentLayout: layout,
            iconOffset: [-18, -18],
            hintOffset: [0, 20],
            hasBalloon: true,
            hasHint: true,
            hideIconOnBalloonOpen: false,
            iconShape: {
              type: 'Circle',
              coordinates: [18, 18], // Центр иконки (в пикселях от левого верхнего угла layout)
              radius: 18 // Радиус — такой же как твоя иконка по стилю
            }
          });

          map.geoObjects.add(placemark);
        });
      }
    });
  }, [coordinates, amenities]);

  return <div ref={mapRef} className="ymap" />;
};

export default YandexMap;
