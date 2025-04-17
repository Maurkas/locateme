import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../components/Authorization/AuthContext';
import { NumericFormat } from 'react-number-format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import './FavoritesPage.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { AnnouncementsService } from '../../services/api/announcements';
import { Link, useNavigate } from 'react-router-dom';

const DEFAULT_IMAGE_URL = 'https://sun9-21.userapi.com/impg/dLJL9rctl21QsCZjldHnHQxCnH5RjQtieZ0D0g/fkogJXv_IEQ.jpg?size=1200x800&quality=95&sign=588aa60862d21ec0be777a1db320ce6d&type=album';

const FavoritesPage = () => {
  const { 
    favorites, 
    toggleFavorite, 
    token, 
    savedSearches,
    deleteSearch
  } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('announcements');
  const [sortOption, setSortOption] = useState('date');
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localFavorites, setLocalFavorites] = useState(() => {
    const saved = localStorage.getItem('guest_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [localSearches, setLocalSearches] = useState(() => {
    const saved = localStorage.getItem('guest_searches');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  // Загружаем данные объявлений
  useEffect(() => {
    const loadFavorites = async () => {
      if (activeTab === 'announcements') {
        setLoading(true);
        setError(null);
        
        try {
          if (token) {
            const response = await AnnouncementsService.getAll();
            if (!response?.results) throw new Error('Некорректные данные');
            
            const favoriteAnnouncements = response.results.filter(ann => 
              favorites.includes(ann.announcement_id)
            );
            
            setAnnouncements(favoriteAnnouncements.map(ann => ({
              id: ann.announcement_id,
              title: ann.name,
              price: ann.price,
              url: ann.url || '#',
              image: ann.photo || DEFAULT_IMAGE_URL,
              date: ann.created_at ? new Date(ann.created_at) : new Date(),
              walk_score: ann.walk_score,
            })));
          } else {
            setAnnouncements(localFavorites);
          }
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
  }, [favorites, activeTab, token, localFavorites]);

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
  }, [announcements, sortOption]);

  // Сортировка сохраненных поисков (новые сверху)
  const sortedSearches = React.useMemo(() => {
    const searches = token ? savedSearches : localSearches;
    return [...searches].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }, [savedSearches, localSearches, token]);

  const handleRemoveFavorite = (id) => {
    if (token) {
      toggleFavorite(id);
      setAnnouncements(prev => prev.filter(item => item.id !== id));
    } else {
      const newFavorites = localFavorites.filter(fav => fav.id !== id);
      setLocalFavorites(newFavorites);
      localStorage.setItem('guest_favorites', JSON.stringify(newFavorites));
      setAnnouncements(newFavorites);
    }
  };

  const handleDeleteSearch = async (id) => {
    try {
      if (token) {
        await deleteSearch(id);
      } else {
        const newSearches = localSearches.filter(search => search.id !== id);
        setLocalSearches(newSearches);
        localStorage.setItem('guest_searches', JSON.stringify(newSearches));
      }
    } catch (error) {
      console.error('Ошибка удаления поиска:', error);
    }
  };

  const handleApplySearch = (searchParams) => {
    // Здесь должна быть логика применения параметров поиска
    // Например, переход на главную страницу с примененными фильтрами
    navigate('/', { state: { appliedFilters: searchParams } });
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
                          e.target.src = DEFAULT_IMAGE_URL;
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
                      <div className="walk-score">
                        <span>Оценка: </span>
                        <strong>{item.walk_score || 0}</strong><br />
                      </div>
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
                {token 
                  ? (favorites.length === 0 ? 'В избранном пока нет объявлений' : 'Не удалось загрузить объявления')
                  : (localFavorites.length === 0 ? 'В избранном пока нет объявлений' : 'Не удалось загрузить объявления')}
              </div>
            )}
          </>
        )}

        {activeTab === 'searches' && (
          <div className="searches-container">
            {sortedSearches.length > 0 ? (
              <div className="searches-list">
                {sortedSearches.map((search) => (
                  <div key={search.id} className="search-card">
                    <div className="search-info">
                      <h4>{search.name}</h4>
                      <div className="search-date">
                        {new Date(search.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <div className="search-actions">
                      <button
                        className="apply-search-btn"
                        onClick={() => handleApplySearch(search.params)}
                      >
                        <FontAwesomeIcon icon={faFilter} /> Применить
                      </button>
                      <button
                        className="delete-search-btn"
                        onClick={() => handleDeleteSearch(search.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                {token
                  ? 'У вас нет сохраненных поисков'
                  : 'У вас нет сохраненных поисков. Войдите, чтобы сохранять поиски.'}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer/>
    </>
  );
};

export default FavoritesPage;