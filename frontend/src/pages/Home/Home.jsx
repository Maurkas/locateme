import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Filters from '../../components/Filters/Filters';
import { AnnouncementsService } from '../../services/api/announcements';
import { AuthContext } from '../../components/Authorization/AuthContext'
import './Home.css';
import { Link } from 'react-router-dom';
import { NumericFormat } from 'react-number-format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faHeart} from "@fortawesome/free-solid-svg-icons";


class Home extends React.Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.state = {
      isModalOpen: false,
      announcements: [],
      filteredAnnouncements: [],
      loading: false,
      error: null,
      sortOption: 'default',
      currentPage: 1,
      itemsPerPage: 21,
      totalItems: 0,
      totalPages: 1,
      filters: {
        districts: [],
        rooms: [],
        priceMin: null,
        priceMax: null,
        pricePerMeterMin: null,
        pricePerMeterMax: null,
        totalAreaMin: null,
        totalAreaMax: null,
        floorMin: null,
        floorMax: null,
        notFirstFloor: false,
        notLastFloor: false,
        bathroomType: [],
        kitchenAreaMin: null,
        kitchenAreaMax: null,
        ceilingHeightMin: null,
        ceilingHeightMax: null,
        windows: [],
        repairType: [],
        balcony: [],
        yearOfConstructionMin: null,
        yearOfConstructionMax: null,
        numberOfFloorMin: null,
        numberOfFloorMax: null,
        houseType: [],
        elevator: [],
        parking: [],
        stops: "any",
        school: "any",
        kindergarten: "any",
        pickup_point: "any",
        polyclinic: "any",
        center: "any",
        gym: "any",
        mall: "any",
        college_and_university: "any",
        beauty_salon: "any",
        gas_station: "any",
        pharmacy: "any",
        grocery_store: "any",
        religious: "any",
        restaurant: "any",
        bank: "any"
      },
      activeDropdown: null, // Текущее открытое выпадающее меню
      districts: ['Кировский', 'Ленинский', 'Советский', 'Трусовский']
    };
    this.handleFavoriteClick = this.handleFavoriteClick.bind(this);
  }

  handleFavoriteClick(e, announcement) {
    e.preventDefault();
    const { isFavorite, token } = this.context;
    
    if (token) {
      // Для авторизованных пользователей - обычное поведение
      this.context.toggleFavorite(announcement.announcement_id);
    } else {
      // Для гостей - сохраняем полную информацию в localStorage
      const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites')) || [];
      const isAlreadyFavorite = guestFavorites.some(fav => fav.id === announcement.announcement_id);
      
      if (isAlreadyFavorite) {
        // Удаляем из избранного
        const updatedFavorites = guestFavorites.filter(fav => fav.id !== announcement.announcement_id);
        localStorage.setItem('guest_favorites', JSON.stringify(updatedFavorites));
      } else {
        // Добавляем в избранное
        const newFavorite = {
          id: announcement.announcement_id,
          title: announcement.name,
          price: announcement.price,
          url: announcement.url || '#',
          image: announcement.photo || DEFAULT_IMAGE_URL,
          date: announcement.published_at ? new Date(announcement.published_at) : new Date(),
          walk_score: announcement.walk_score,
        };
        
        localStorage.setItem('guest_favorites', JSON.stringify([...guestFavorites, newFavorite]));
      }
      this.forceUpdate();
    }
  }

  // Переключение выпадающего меню
  toggleDropdown = (dropdownName) => {
    this.setState(prev => ({
      activeDropdown: prev.activeDropdown === dropdownName ? null : dropdownName
    }));
  };

  componentDidMount() {
    this.loadFiltersFromStorage();
    //this.fetchAnnouncements();
  }

  loadFiltersFromStorage = () => {
    const savedFilters = localStorage.getItem('announcementFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        this.setState({ filters: parsedFilters }, this.fetchAnnouncements);
      } catch {
        this.resetFilters();
      }
    } else {
      this.fetchAnnouncements(); // Только если нет фильтров в localStorage
    }
  };
  
  handleResetFilters = () => {
    this.resetFilters();
  };

  handleSearchClick = () => {
    this.setState({ currentPage: 1 }, () => {
      this.fetchAnnouncements();
      this.scrollToTop();
    });
  };

  // Обработчик выбора районов
  handleDistrictChange = (district) => {
    this.setState(prev => {
      const newDistricts = prev.filters.districts.includes(district)
        ? prev.filters.districts.filter(d => d !== district)
        : [...prev.filters.districts, district];
      
      return { 
        filters: {
          ...prev.filters,
          districts: newDistricts
        }
      };
    });
  };

  // Обработчик выбора комнат
  handleRoomChange = (room) => {
    this.setState(prev => {
      const newRooms = prev.filters.rooms.includes(room)
        ? prev.filters.rooms.filter(r => r !== room)
        : [...prev.filters.rooms, room];
      
      return { 
        filters: {
          ...prev.filters,
          rooms: newRooms
        }
      };
    });
  };

  // Обработчик изменения цены
  handlePriceChange = (min, max) => {
    this.setState(prev => ({
      filters: {
        ...prev.filters,
        priceMin: min,
        priceMax: max
      }
    }));
  };

  getDistrictButtonText = () => {
    const { filters } = this.state;
    if (filters.districts.length === 0) return 'Район';
    if (filters.districts.length === 1) return `${filters.districts[0]}`;
    return `Район (${filters.districts.length})`;
  };
  
  getRoomsButtonText = () => {
    const { filters } = this.state;
    if (filters.rooms.length === 0) return 'Комнаты';
    if (filters.rooms.length === 1) return `${filters.rooms[0]} комн.`;
    if (filters.rooms.length === 2) {
      const sorted = [...filters.rooms].sort((a, b) => a - b);
      return `${sorted[0]}-${sorted[1]} комн.`;
    }
    return `${filters.rooms.length} выб.`;
  };
  
  getPriceButtonText = () => {
    const { filters } = this.state;
    
    // Проверяем и null, и undefined
    if ((filters.priceMin === null || filters.priceMin === undefined) && 
        (filters.priceMax === null || filters.priceMax === undefined)) {
      return 'Цена';
    }
  
    const formatMin = (num) => 
      num !== null && num !== undefined ? 
      new Intl.NumberFormat('ru-RU').format(num) + ' ₽' : 
      '0 ₽';
  
    const formatMax = (num) => 
      num !== null && num !== undefined ? 
      new Intl.NumberFormat('ru-RU').format(num) + ' ₽' : 
      '∞ ₽';
  
    return `${formatMin(filters.priceMin)} - ${formatMax(filters.priceMax)}`;
  };


  updateFilter = (filterName, value) => {
    this.setState((prevState) => ({
      filters: {
        ...prevState.filters,
        [filterName]: value,
      },
    }));
  };

  resetFilters = (isFullReset = false) => {
    this.setState(
      {
        filters: {
          districts: [],
          rooms: [],
          priceMin: null,
          priceMax: null,
          pricePerMeterMin: null,
          pricePerMeterMax: null,
          totalAreaMin: null,
          totalAreaMax: null,
          floorMin: null,
          floorMax: null,
          notFirstFloor: false,
          notLastFloor: false,
          bathroomType: [],
          kitchenAreaMin: null,
          kitchenAreaMax: null,
          ceilingHeightMin: null,
          ceilingHeightMax: null,
          windows: [],
          repairType: [],
          balcony: [],
          yearOfConstructionMin: null,
          yearOfConstructionMax: null,
          numberOfFloorMin: null,
          numberOfFloorMax: null,
          houseType: [],
          elevator: [],
          parking: [],
          stops: "any",
          school: "any",
          kindergarten: "any",
          pickup_point: "any",
          polyclinic: "any",
          center: "any",
          gym: "any",
          mall: "any",
          college_and_university: "any",
          beauty_salon: "any",
          gas_station: "any",
          pharmacy: "any",
          grocery_store: "any",
          religious: "any",
          restaurant: "any",
          bank: "any"
        },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
      },
      () => {
        // Для полного сброса очищаем localStorage
        if (isFullReset) {
          localStorage.removeItem('announcementFilters');
        }
        //this.fetchAnnouncements();
      }
    );
  };


  // Обработчик изменения сортировки
  handleSortChange = (sortOption) => {
    this.setState({ sortOption, currentPage: 1 }, () => {
      this.fetchAnnouncements(); 
      this.scrollToTop();
    });
  };

  hasActiveAmenityFilters = () => {
    const { filters } = this.state;
    const amenityKeys = [
      "stops", "school", "kindergarten", "pickup_point", 
      "polyclinic", "center", "gym", "mall", "college_and_university",
      "beauty_salon", "gas_station", "pharmacy", "grocery_store",
      "religious", "restaurant", "bank"
    ];
  
    return amenityKeys.some(key => filters[key] !== "any");
  };

  // Новый метод для применения фильтров
  handleApplyFilters = (amenitiesFilters = {}) => {
    this.setState(prevState => {
      const newFilters = {
        ...prevState.filters,
        ...amenitiesFilters
      };
      
      // Сохраняем в localStorage только если это не сброс
      localStorage.setItem('announcementFilters', JSON.stringify(newFilters));
      
      return { filters: newFilters, currentPage: 1 };
    }, () => {
      this.fetchAnnouncements();
      this.scrollToTop();
      this.closeModal();
    });
  };

  fetchAnnouncements = async () => {
    try {
      this.setState({ loading: true });

      const { currentPage, itemsPerPage, filters, sortOption } = this.state;
        
      const params = {
          page: currentPage,
          limit: itemsPerPage,
          sort: sortOption,
          ...filters
      };
      
      console.log("Отправляемые параметры фильтров:", params);
      const response = await AnnouncementsService.getWithFilters(params);
      console.log("Ответ сервера:", response);
      
      this.setState({
        announcements: response.results || response,
        filteredAnnouncements: response.results || response,
        totalItems: response.total_items || response.length || 0,
        totalPages: response.total_pages || Math.ceil((response.total_items || response.length || 0) / itemsPerPage),
        loading: false
      });
    } catch (error) {
      this.setState({ 
        error: 'Не удалось загрузить объявления',
        loading: false 
      });
    }
  };

  scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth" 
    });
  };

  // Обработчик изменения страницы
  handlePageChange = (pageNumber) => {
    this.setState({ currentPage: pageNumber }, () => {
      this.fetchAnnouncements();
      this.scrollToTop();
    });
  };

  openModal = () => {
    this.setState({ 
      isModalOpen: true,
     });
  };

  closeModal = () => {
    this.setState({ isModalOpen: false });
  };

  renderPagination = () => {
    const { currentPage, totalPages } = this.state;
    const pages = [];

    // Всегда показываем первую страницу
    if (currentPage > 1) {
      pages.push(
        <button key="first" onClick={() => this.handlePageChange(1)}>
          &laquo;
        </button>
      );
    }

    // Показываем предыдущую страницу
    if (currentPage > 1) {
      pages.push(
        <button key="prev" onClick={() => this.handlePageChange(currentPage - 1)}>
          &lsaquo;
        </button>
      );
    }

    // Показываем страницы вокруг текущей
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => this.handlePageChange(i)}
          className={currentPage === i ? 'active' : ''}
        >
          {i}
        </button>
      );
    }

    // Показываем следующую страницу
    if (currentPage < totalPages) {
      pages.push(
        <button key="next" onClick={() => this.handlePageChange(currentPage + 1)}>
          &rsaquo;
        </button>
      );
    }

    // Всегда показываем последнюю страницу
    if (currentPage < totalPages) {
      pages.push(
        <button key="last" onClick={() => this.handlePageChange(totalPages)}>
          &raquo;
        </button>
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  render() {
    const { isModalOpen, filteredAnnouncements, loading, error, activeDropdown, districts, sortOption, currentPage, totalPages } = this.state;
    const { isFavorite } = this.context;
    
    return (
      <>
        <Header />
        <main className='container-fluid'>
          <div className='search-form'>
            <h1>Недвижимость</h1>
            <div className='search-form__buttons'>
              {/* Кнопка и выпадающее меню для районов */}
              <div className="dropdown-container">
                <button 
                  className='dropdown-btn' 
                  onClick={() => this.toggleDropdown('district')}
                >
                  {this.getDistrictButtonText()}
                </button>
                {activeDropdown === 'district' && (
                  <div className="dropdown-menu">
                    {districts.map(district => (
                      <label className="input__item" key={district}>
                        <input
                          type="checkbox"
                          checked={this.state.filters.districts.includes(district)}
                          onChange={() => this.handleDistrictChange(district)}
                        />
                        <span>{district}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопка и выпадающее меню для комнат */}
              <div className="dropdown-container">
                <button 
                  className='dropdown-btn' 
                  onClick={() => this.toggleDropdown('rooms')}
                >
                  {this.getRoomsButtonText()}
                </button>
                {activeDropdown === 'rooms' && (
                  <div className="dropdown-menu">
                    {[1, 2, 3, 4, "5+"].map(room => (
                      <label className="input__item" key={room}>
                        <input
                          type="checkbox"
                          checked={this.state.filters.rooms.includes(room)}
                          onChange={() => this.handleRoomChange(room)}
                        />
                        <span>{room}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопка и выпадающее меню для цены */}
              <div className="dropdown-container">
                <button 
                  className='dropdown-btn' 
                  onClick={() => this.toggleDropdown('price')}
                >
                  {this.getPriceButtonText()}
                </button>
                {activeDropdown === 'price' && (
                  <div className="dropdown-menu price-dropdown">
                    <div className="filter-item">
                      <div className="input-container">
                        <NumericFormat
                          thousandSeparator=" "
                          suffix=" ₽"
                          placeholder="От"
                          value={this.state.filters.priceMin || ""}
                          onValueChange={(values) => this.handlePriceChange(values.floatValue, this.state.filters.priceMax)}
                        />
                        <NumericFormat
                          thousandSeparator=" "
                          suffix=" ₽"
                          placeholder="До"
                          value={this.state.filters.priceMax || ""}
                          onValueChange={(values) => this.handlePriceChange(this.state.filters.priceMin, values.floatValue)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className='dropdown-btn' onClick={this.openModal}>Ещё фильтры</button>
            </div>
            <a className='search-form__search-btn' onClick={this.handleSearchClick}>Найти</a>
          </div>
          {/* Добавляем блок сортировки */}
          <div className="sort-options">
            <span>Сортировка:</span>
            <select 
              value={sortOption}
              onChange={(e) => this.handleSortChange(e.target.value)}
            >
              <option value="default">По умолчанию</option>
              <option value="date">По дате (новые)</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
              {/* <option value="score">По оценке</option> */}
            </select>
          </div>
          <Filters 
            isOpen={isModalOpen} 
            onClose={this.closeModal} 
            updateFilter={this.updateFilter} 
            onApply={this.handleApplyFilters}
            onReset={this.handleResetFilters}
            currentFilters={this.state.filters}
          />
          <section className='myContainer'>
            <div className="recommendations">
              <h1>Могут подойти</h1>
              {loading && <div>Загрузка...</div>}
              {error && <div className="error-message">{error}</div>}
              <div className="album py-5 bg-light">
                <div className="row">
                  {filteredAnnouncements.map(announcement => (
                    <div className="col-md-4" key={announcement.announcement_id}>
                      <div className="card mb-4 box-shadow">
                        <div className="card-img-container">
                          <Link to={`/announcement/${announcement.announcement_id}`}>
                            <img
                              className="card-img-top"
                              src={announcement.photo}
                              alt={announcement.name}
                              style={{ height: '225px', width: '100%', objectFit: 'cover' }}
                            />
                          </Link>
                          <button 
                            className="favorite-btn"
                            onClick={(e) => this.handleFavoriteClick(e, announcement)}
                          >
                            <FontAwesomeIcon 
                              icon={faHeart} 
                              color={
                                this.context.token 
                                  ? this.context.isFavorite(announcement.announcement_id) 
                                    ? 'red' 
                                    : 'white'
                                  : (JSON.parse(localStorage.getItem('guest_favorites')) || [])
                                    .some(fav => fav.id === announcement.announcement_id)
                                    ? 'red'
                                    : 'white'
                              }
                            />
                          </button>
                        </div>
                        <div className="card-body">
                          <Link 
                            to={`/announcement/${announcement.announcement_id}`}
                            className="card-title-link"
                          >
                            <h5 className="card-title">{announcement.name}</h5>
                          </Link>
                          <p className="card-text">
                            <strong className="text-primary">
                              {new Intl.NumberFormat('ru-RU', {
                                style: 'currency',
                                currency: 'RUB',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(announcement.price)}
                            </strong>
                            <br/>
                            {announcement.building?.address_text}<br/>
                            р-н {announcement.building?.district}
                          </p>
                          <div className="walk-score">
                            <span>Оценка: </span>
                            <strong>{announcement.walk_score || 0}</strong><br />
                            {this.hasActiveAmenityFilters() && (
                              <strong>{announcement.personal_score || ''}</strong>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {this.renderPagination()}
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}

export default Home;