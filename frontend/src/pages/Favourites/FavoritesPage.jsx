import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/Authorization/AuthContext';
import { NumericFormat } from 'react-number-format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import './FavoritesPage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { AnnouncementsService } from '../../services/api/announcements';
import { Link } from 'react-router-dom';


const DEFAULT_IMAGE_URL = 'https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album';

const FavoritesPage = () => {
  const { favorites, toggleFavorite, token } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('announcements');
  const [sortOption, setSortOption] = useState('date');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localFavorites, setLocalFavorites] = useState([]);


  // Загружаем данные объявлений
  useEffect(() => {
    const loadFavorites = async () => {
        if (activeTab === 'announcements') {
            setLoading(true);
            setError(null);
            
            try {
                // Получаем все объявления
                const allAnnouncements = await AnnouncementsService.getAll();
                
                // Получаем ID избранных объявлений
                const favoriteIds = token ? favorites : JSON.parse(localStorage.getItem('guest_favorites')) || [];
                
                // Фильтруем объявления
                const favoriteAnnouncements = allAnnouncements.filter(ann => 
                    favoriteIds.includes(ann.announcement_id)
                );
                
                setAnnouncements(favoriteAnnouncements.map(item => ({
                    id: item.announcement_id,
                    title: item.name,
                    price: item.price,
                    url: item.url || '#',
                    image: item.photo || DEFAULT_IMAGE_URL,
                    date: item.created_at ? new Date(item.created_at) : new Date()
                })));
                
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                setError('Не удалось загрузить избранное');
                setAnnouncements([]);
            } finally {
                setLoading(false);
            }
        }
    };

    loadFavorites();
}, [favorites, activeTab, token]);


  // Сортировка объявлений
  const sortedAnnouncements = React.useMemo(() => {
    return [...announcements].sort((a, b) => {
      switch (sortOption) {
        case 'date': return b.date - a.date;
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        default: return b.date - a.date;
      }
    });
  }, [announcements, sortOption, token]);

  const handleRemoveFavorite = (id) => {
    if (token) {
        toggleFavorite(id);
    } else {
        const newFavorites = localFavorites.filter(favId => favId !== id);
        setLocalFavorites(newFavorites);
        localStorage.setItem('guest_favorites', JSON.stringify(newFavorites));
        setAnnouncements(prev => prev.filter(item => item.id !== id));
    }
};

  return (
    <>
      <Header/>
      <main className='container-fluid'>
        <h1>Избранное</h1>
        
        {/* Вкладки */}
        <div className="favorites-tabs">
          <button
            className={`tab-button ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            <FontAwesomeIcon icon={faHeart} /> Объявления
          </button>
          <button
            className={`tab-button ${activeTab === 'searches' ? 'active' : ''}`}
            onClick={() => setActiveTab('searches')}
          >
            <FontAwesomeIcon icon={faSearch} /> Поиски
          </button>
        </div>

        {/* Сортировка и контент */}
        {activeTab === 'announcements' && (
          <>
            <div className="sort-options">
              <span>Сортировка:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="date">По дате</option>
                <option value="price_asc">Сначала дешевые</option>
                <option value="price_desc">Сначала дорогие</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}
            
            {loading ? (
              <div>Загрузка...</div>
            ) : sortedAnnouncements.length > 0 ? (
              <div className="announcements-grid">
                {sortedAnnouncements.map((item) => (
                  <div key={item.id} className="announcement-card">
                    <Link to={`/announcement/${item.id}`}>
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="announcement-image" 
                        onError={(e) => {
                          e.target.src = 'https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album';
                        }}
                      />
                    </Link>
                    <div className="announcement-details">
                      <Link 
                        to={`/announcement/${item.id}`}
                        className="card-title-link"
                      >
                        <h5 className='card-title'>{item.title}</h5>
                      </Link>
                      <p className="announcement-price">
                        <NumericFormat
                          value={item.price}
                          displayType={'text'}
                          thousandSeparator={' '}
                          suffix={' ₽'}
                        />
                      </p>
                      <div className="announcement-actions">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="avito-link"
                        >
                          Посмотреть на Avito
                        </a>
                        <button
                            className="remove-button"
                            onClick={() => handleRemoveFavorite(item.id)}
                        >
                            <FontAwesomeIcon icon={faTrash} /> Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {favorites.length === 0 
                  ? 'В избранном пока нет объявлений' 
                  : 'Не удалось загрузить объявления'}
              </div>
            )}
          </>
        )}

        {activeTab === 'searches' && (
          <div className="empty-state">
            Сохранённые поиски появятся здесь
          </div>
        )}
      </main>
      <Footer/>
    </>
  );
};

export default FavoritesPage;