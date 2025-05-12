import React, { useState, useEffect, useContext  } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AnnouncementsService } from '../../services/api/announcements';
import './AnnouncementDetail.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import YandexMap from '../../components/YandexMap/YandexMap';
import FiltersPopup from '../../components/FiltersPopup/FiltersPopup'
import usePersonalScore from '../../hooks/usePersonalScore';
import { AuthContext } from '../../components/Authorization/AuthContext';
import { handleFavoriteClick, isFavorite } from '../../utils/favoritesUtils';


const AnnouncementDetail = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const location = useLocation();
  const [showFiltersPopup, setShowFiltersPopup] = useState(false);
  const filters = location.state?.filters || {};
  const [personalScore, setPersonalScore] = useState(location.state?.personal_score || null);
  const authContext = useContext(AuthContext);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const data = await AnnouncementsService.getById(id);
        setAnnouncement(data);
        setIsFav(isFavorite(data.announcement_id, authContext));
      } catch (error) {
        setError('Failed to load announcement');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id, authContext]);

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
  
  const { additionalScore } = usePersonalScore(announcement, filters);

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;
  if (!announcement) return <div>Объявление не найдено</div>;

  return (
    <>
      <Header />
      <main className="announcement">
        <div className="announcement__container">
          <div className="announcement__image-wrapper">
            <img 
              src={announcement.photo} 
              alt={announcement.name} 
              className="announcement__image"
            />
          </div>
          
          <div className="announcement__content">
            <div className="announcement__header">
              <h1 className="announcement__title">{announcement.name}</h1>
              <span className="announcement__walk-score">Общая оценка: {announcement.walk_score || 0}</span>
              {personalScore && (
                <span className="announcement__walk-score">Персональная оценка: {personalScore}</span>
              )}
              <button 
                className={`favorite-button ${isFav ? 'active' : ''}`}
                onClick={(e) => {
                  const newFavoriteState = handleFavoriteClick(e, announcement, authContext);
                  setIsFav(newFavoriteState);
                }}
              >
                {isFav ? '❤️ В избранном' : '🤍 В избранное'}
              </button>
              {personalScore && (
                <button 
                className="report-button"
                onClick={() => setShowFiltersPopup(true)}
                >
                  Отчет по фильтрам
                </button>
              )}
              
              {showFiltersPopup && (
                <FiltersPopup 
                  filters={filters}
                  onClose={() => setShowFiltersPopup(false)}
                  walkScore={announcement.walk_score}
                  personalScore={personalScore}
                  additionalScore={additionalScore}
                />
              )}
              <div className="announcement__price">
                {new Intl.NumberFormat('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(announcement.price)}
              </div>
              <a 
                href={announcement.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="announcement__link"
              >
                Посмотреть на Avito
              </a>
            </div>

            <div className="info-block">
              <h2 className="info-block__title">Характеристики объявления</h2>
              <div className="info-block__grid">
                <div className="info-block__item">
                  <span className="info-block__label">Количество комнат</span>
                  <span className="info-block__value">{announcement.number_of_rooms}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Общая площадь</span>
                  <span className="info-block__value">{announcement.total_area} м²</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Площадь кухни</span>
                  <span className="info-block__value">{announcement.kitchen_area} м²</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Этаж</span>
                  <span className="info-block__value">{announcement.floor}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Балкон/лоджия</span>
                  <span className="info-block__value">{announcement.balcony_or_loggia}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Санузел</span>
                  <span className="info-block__value">{announcement.bathroom}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Ремонт</span>
                  <span className="info-block__value">{announcement.repair}</span>
                </div>
              </div>
            </div>

            <div className="info-block">
              <h2 className="info-block__title">Информация о здании</h2>
              <div className="info-block__grid">
                <div className="info-block__item">
                  <span className="info-block__label">Адрес</span>
                  <span className="info-block__value">{announcement.building?.address_text}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Район</span>
                  <span className="info-block__value">{announcement.building?.district}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Тип дома</span>
                  <span className="info-block__value">{announcement.building?.house_type}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Год постройки</span>
                  <span className="info-block__value">{announcement.building?.year_of_construction}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Этажей в доме</span>
                  <span className="info-block__value">{announcement.building?.number_of_floors}</span>
                </div>
                <div className="info-block__item">
                  <span className="info-block__label">Высота потолков</span>
                  <span className="info-block__value">{announcement.building?.ceiling_height}</span>
                </div>
              </div>
            </div>

            <div className="info-block">
              <h2 className="info-block__title">Инфраструктура</h2>
              {announcement.nearby_amenities && announcement.nearby_amenities.length > 0 ? (
                <div className="amenities-container">
                  {announcement.nearby_amenities.map((amenity) => (
                    <div key={amenity.id} className="amenity-card">
                      <div className="amenity-icon">{getAmenityIcon(amenity.category)}</div>
                      <div className="amenity-content">
                        <h3 className="amenity-title">{amenity?.title || 'Неизвестно'}</h3>
                        <div className="amenity-meta">
                          <span className="amenity-category">{getAmenityLabel(amenity.category)}</span>
                          <span className="amenity-distance">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
                              <circle cx="12" cy="9" r="2.5"></circle>
                            </svg>
                            {amenity.distance.toFixed(1)} м
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-amenities">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <p>Информация о ближайшей инфраструктуре отсутствует</p>
                </div>
              )}
            </div>
            <div className="info-block">
              <h2 className="info-block__title">Расположение на карте</h2>
              <YandexMap coordinates={announcement.coordinates} amenities={announcement.nearby_amenities} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AnnouncementDetail;