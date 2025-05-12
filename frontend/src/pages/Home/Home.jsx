import React from 'react';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Filters from '../../components/Filters/Filters';
import { AnnouncementsService } from '../../services/api/announcements';
import { AuthContext } from '../../components/Authorization/AuthContext'
import './Home.css';
import AnnouncementCard from '../../components/AnnouncementCard/AnnouncementCard';
import Pagination from '../../components/Pagination/Pagination';
import { handleFavoriteClick, isFavorite } from '../../utils/favoritesUtils';


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
      showSaveNotification: false,  
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
  }

  getAmenityFilters = () => {
    const amenityKeys = [
      "stops", "school", "kindergarten", "pickup_point", 
      "polyclinic", "center", "gym", "mall", "college_and_university",
      "beauty_salon", "pharmacy", "grocery_store",
      "religious", "restaurant", "bank"
    ];
    
    const amenityFilters = {};
    
    amenityKeys.forEach(key => {
      if (this.state.filters[key] !== undefined) {
        amenityFilters[key] = this.state.filters[key];
      }
    });
    
    return amenityFilters;
  };

  handleSaveSearch = async () => {
    const { filters } = this.state;
    const { saveSearch, token, savedSearches } = this.context;
  
    // Проверяем активные фильтры (исключая amenity-фильтры)
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
      // Исключаем amenity-фильтры из проверки
      const amenityKeys = [
        "stops", "school", "kindergarten", "pickup_point", 
        "polyclinic", "center", "gym", "mall", "college_and_university",
        "beauty_salon", "pharmacy", "grocery_store",
        "religious", "restaurant", "bank"
      ];
      
      if (amenityKeys.includes(key)) return false;
      if (value === null || value === undefined || value === "any") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && Object.keys(value).length === 0) return false;
      return true;
    });
  
    if (!hasActiveFilters) {
      alert('Пожалуйста, укажите параметры поиска для сохранения');
      return;
    }
  
    try {
      // Формируем название поиска
      let searchName = '';
      
      // Добавляем районы, если есть
      if (filters.districts.length > 0) {
        searchName += filters.districts.join(', ');
      }
      
      // Добавляем комнаты, если есть
      if (filters.rooms.length > 0) {
        if (searchName.length > 0) searchName += ', ';
        searchName += filters.rooms.map(r => `${r}комн.`).join(',');
      }
      
      // Добавляем цену, если есть
      if (filters.priceMin || filters.priceMax) {
        if (searchName.length > 0) searchName += ', ';
        searchName += `${filters.priceMin || '0'}-${filters.priceMax || '∞'}₽`;
      }
  
      // Если ничего не выбрано (маловероятно, так как hasActiveFilters=true)
      if (searchName.length === 0) {
        searchName = 'Мой поиск';
      }
  
      // Проверяем, есть ли уже такой поиск
      const isSearchExists = (searches) => {
        return searches.some(search => {
          // Сравниваем основные параметры
          const sameDistricts = JSON.stringify(search.params.districts) === JSON.stringify(filters.districts);
          const sameRooms = JSON.stringify(search.params.rooms) === JSON.stringify(filters.rooms);
          const samePrice = search.params.priceMin === filters.priceMin && 
                           search.params.priceMax === filters.priceMax;
          
          return sameDistricts && sameRooms && samePrice;
        });
      };
  
      // Проверяем существование поиска
      if (isSearchExists(token ? savedSearches : JSON.parse(localStorage.getItem('guest_searches') || '[]'))) {
        alert('Такой поиск уже сохранен');
        return;
      }
  
      // Сохраняем поиск
      await saveSearch(searchName, filters);
      
      this.setState({ showSaveNotification: true });
      setTimeout(() => {
        this.setState({ showSaveNotification: false });
      }, 2000);
    } catch (error) {
      console.error('Ошибка сохранения поиска:', error);
      alert('Не удалось сохранить поиск');
    }
  };

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
          bank: "any",
          custom_address: null
        },                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
      },
      () => {
        // Для полного сброса очищаем localStorage
        if (isFullReset) {
          localStorage.removeItem('announcementFilters');
        }
        this.fetchAnnouncements();
      }
    );
  };


  // Обработчик изменения сортировки
  handleSortChange = (sortOption) => {
    this.setState({ sortOption, currentPage: 1 }, () => {
      if (sortOption === 'personal_score') {
        // Сортировка на фронтенде
        this.sortByPersonalScore();
      } else {
        // Остальные сортировки делаются на бэкенде
        this.fetchAnnouncements();
      }
      this.scrollToTop();
    });
  };

  sortByPersonalScore = () => {
    this.setState(prevState => {
      // Создаем копию массива объявлений
      const sortedAnnouncements = [...prevState.announcements]
        // Фильтруем объявления без оценки (если нужно)
        .filter(announcement => announcement.personal_score !== undefined)
        // Сортируем по personal_score (по убыванию)
        .sort((a, b) => (b.personal_score || 0) - (a.personal_score || 0));
      
      return {
        filteredAnnouncements: sortedAnnouncements,
        totalPages: Math.ceil(sortedAnnouncements.length / prevState.itemsPerPage)
      };
    });
  };

  hasPersonalScores = () => {
    return this.state.announcements.some(announcement => announcement.personal_score !== null);
  };

  hasActiveAmenityFilters = () => {
    const { filters } = this.state;
    const amenityKeys = [
      "stops", "school", "kindergarten", "pickup_point", 
      "polyclinic", "center", "gym", "mall", "college_and_university",
      "beauty_salon", "pharmacy", "grocery_store",
      "religious", "restaurant", "bank"
    ];
  
    return amenityKeys.some(key => filters[key] !== "any");
  };

  // Новый метод для применения фильтров
  handleApplyFilters = (amenitiesFilters = {}) => {
    console.log('Получены фильтры из модального окна:', amenitiesFilters);
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

      const amenityFilters = {
        stops: filters.stops,
        school: filters.school,
        kindergarten: filters.kindergarten,
        pickup_point: filters.pickup_point,
        polyclinic: filters.polyclinic,
        center: filters.center,
        gym: filters.gym,
        mall: filters.mall,
        college_and_university: filters.college_and_university,
        beauty_salon: filters.beauty_salon,
        pharmacy: filters.pharmacy,
        grocery_store: filters.grocery_store,
        religious: filters.religious,
        restaurant: filters.restaurant,
        bank: filters.bank,
      };
        
      const params = {
          page: currentPage,
          limit: itemsPerPage,
          sort: sortOption,
          ...this.state.filters,
          ...amenityFilters
      };

      if (filters.custom_address) {
        params.custom_address = filters.custom_address;
      }
      
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
      if (this.state.sortOption === 'personal_score') {
        // Для персональной сортировки просто обновляем страницу
        this.scrollToTop();
      } else {
        // Для остальных - делаем запрос к серверу
        this.fetchAnnouncements();
        this.scrollToTop();
      }
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


  render() {
    const { isModalOpen, filteredAnnouncements, loading, error, activeDropdown, districts, sortOption, currentPage, totalPages } = this.state;
    const { showSaveNotification } = this.state;
    const { savedSearches } = this.context;
    
    return (
      <>
        <Header />
        <div className={`save-notification ${showSaveNotification ? 'show' : ''}`}>
          Поиск сохранен
        </div>
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
              <button className='dropdown-btn save-search-btn' onClick={this.handleSaveSearch}>Сохранить поиск</button>
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
              <option value="score">По оценке</option>
              {this.hasPersonalScores() && (
                <option value="personal_score">По персональной оценке</option>
              )}
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
                  {filteredAnnouncements.map(announcement => {
                    const isFav = isFavorite(announcement.announcement_id, this.context);
                    
                    return (
                      <AnnouncementCard 
                        key={announcement.announcement_id}
                        announcement={{
                          ...announcement,
                          filters: this.getAmenityFilters()
                        }}
                        onFavoriteClick={(e) => {
                          const newFavoriteState = handleFavoriteClick(e, announcement, this.context);
                          // Принудительно обновляем компонент, если нужно
                          this.forceUpdate();
                        }}
                        isFavorite={isFav}
                      />
                    );
                  })}
                </div>
              </div>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={this.handlePageChange}
              />
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}

export default Home;