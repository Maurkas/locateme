import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { NumericFormat } from 'react-number-format';
import './AnnouncementCard.css'

const AnnouncementCard = ({ announcement, onFavoriteClick, isFavorite }) => {
  return (
    <div className="col-md-4">
      <div className="card mb-4 box-shadow">
        <div className="card-img-container">
          <Link
            to={`/announcement/${announcement.announcement_id}`}
            state={{ 
              personal_score: announcement.personal_score,
              filters: announcement.filters
            }}
          >
            <img
              className="card-img-top"
              src={announcement.photo}
              alt={announcement.name}
              style={{ height: '225px', width: '100%', objectFit: 'cover' }}
            />
          </Link>
          <button 
            className="favorite-btn"
            onClick={(e) => onFavoriteClick(e, announcement)}
          >
            <FontAwesomeIcon 
              icon={faHeart} 
              color={isFavorite ? 'red' : 'white'}
            />
          </button>
        </div>
        <div className="card-body">
          <Link
            to={`/announcement/${announcement.announcement_id}`}
            state={{ 
              personal_score: announcement.personal_score,
              filters: announcement.filters
            }}
            className="card-title-link"
          >
            <h5 className="card-title">{announcement.name}</h5>
          </Link>
          <p className="card-text">
            <strong className="text-primary">
              <NumericFormat
                value={announcement.price}
                displayType={'text'}
                thousandSeparator={' '}
                suffix={' ₽'}
                renderText={(value) => <>{value}</>}
              />
            </strong>
            <br/>
            {announcement.building?.address_text}<br/>
            р-н {announcement.building?.district}
          </p>
          <div className="walk-score">
            <span>Общая оценка: </span>
            <strong>{announcement.walk_score || 0}</strong><br />
            {announcement.personal_score && (
              <>
              <span>Персональная оценка: </span> 
              <strong>{announcement.personal_score}</strong>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementCard;