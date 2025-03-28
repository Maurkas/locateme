import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AnnouncementsService } from '../../services/api/announcements';
import './AnnouncementDetail.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import YandexMap from '../../components/YandexMap/YandexMap';

const AnnouncementDetail = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const data = await AnnouncementsService.getById(id);
        setAnnouncement(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load announcement');
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, [id]);

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
              <span className="announcement__walk-score">Оценка: {announcement.walk_score || 0}</span>
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
                <div className="info-block__item">
                  <span className="info-block__label">Мебель</span>
                  <span className="info-block__value">{announcement.furniture}</span>
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