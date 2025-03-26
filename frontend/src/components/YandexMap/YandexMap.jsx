import React, { useEffect, useRef } from 'react';
import './YandexMap.css';

const YandexMap = ({ coordinates, amenities }) => {
  const mapRef = useRef(null);

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

      // Добавляем метку для здания
      map.geoObjects.add(new window.ymaps.Placemark([lat, lon], {
        balloonContent: 'Здание находится здесь',
      }, {
        preset: 'islands#redDotIconWithCaption',
      }));

      // Добавляем метки для ближайших удобств
      if (amenities && amenities.length > 0) {
        amenities.forEach((amenity, index) => {
          const [amenityLat, amenityLon] = amenity.coordinates.split(',').map(parseFloat);

          map.geoObjects.add(new window.ymaps.Placemark([amenityLat, amenityLon], {
            balloonContent: `${amenity.title} (${amenity.type})`,
            hintContent: `${amenity.title} (${amenity.distance} км)`,
          }, {
            preset: 'islands#blueCircleIcon',
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