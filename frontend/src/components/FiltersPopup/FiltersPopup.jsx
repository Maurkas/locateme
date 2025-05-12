import React from 'react';
import './FiltersPopup.css';

const FiltersPopup = ({ filters, onClose, walkScore, personalScore, additionalScore }) => {
  const translateFilterValue = (value) => {
    switch(value) {
      case 'close': return 'Рядом';
      case 'far': return 'Подальше';
      case 'any': return 'Неважно';
      default: return value;
    }
  };

  const getFilterLabel = (key) => {
    const labels = {
      stops: 'Остановки',
      school: 'Школы',
      kindergarten: 'Детские сады',
      pickup_point: 'Пункты выдачи',
      polyclinic: 'Поликлиники',
      center: 'Центр города',
      gym: 'Спортзалы',
      mall: 'Торговые центры',
      college_and_university: 'Колледжи и Вузы',
      beauty_salon: 'Салоны красоты',
      pharmacy: 'Аптеки',
      grocery_store: 'Продуктовые магазины',
      religious: 'Религиозные места',
      restaurant: 'Рестораны',
      bank: 'Банки'
    };
    return labels[key] || key;
  };

  return (
    <div className="filters-popup">
      <div className="filters-popup__content">
        <h2>Примененные фильтры</h2>
        <button 
          className="filters-popup__close"
          onClick={onClose}
        >
          &times;
        </button>
        
        <div className="filters-popup-list">
          {Object.entries(filters).map(([key, value]) => (
            <div key={key} className="filter-popup-item">
              <span className="filter-popup-label">{getFilterLabel(key)}:</span>
              <span className={`filter-popup-value filter-${value}`}>
                {translateFilterValue(value)}
              </span>
            </div>
          ))}
        </div>
        <div className='filter-popup-scores'>
          <span>Общая оценка: {walkScore}</span>
          <span>Персональная оценка (реальный путь пешком): {personalScore}</span>
          <span>Персональная оценка (по прямой): {additionalScore?.haversine_score}</span>
          <span>Персональная оценка (с учетом городской застройки): {additionalScore?.estimated_score}</span>
        </div>
      </div>
    </div>
  );
};

export default FiltersPopup;