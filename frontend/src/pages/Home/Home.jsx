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
      sortOption: 'date',
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

  // Переключение выпадающего меню
  toggleDropdown = (dropdownName) => {
    this.setState(prev => ({
      activeDropdown: prev.activeDropdown === dropdownName ? null : dropdownName
    }));
  };

  componentDidMount() {
    this.loadFiltersFromStorage();
    this.fetchAnnouncements().then(() => {
    });
  }

  loadFiltersFromStorage = () => {
    const savedFilters = localStorage.getItem('announcementFilters');
    if (savedFilters) {
      try {
        const parsedFilters = JSON.parse(savedFilters);
        this.setState({ 
          filters: parsedFilters 
        }, () => {
          // После загрузки фильтров применяем их
          this.applyFilters();
        });
      } catch (error) {
        console.error('Ошибка при загрузке фильтров:', error);
        // Если ошибка парсинга, используем фильтры по умолчанию
        this.resetFilters();
      }
    }
  };
  
  handleResetFilters = () => {
    this.resetFilters();
  };

  handleSearchClick = () => {
    this.applyFilters();
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

  filterAnnouncements = (announcements) => {
    const { filters } = this.state;

    return announcements.filter((announcement) => {

      if (filters.districts.length > 0 && !filters.districts.includes(announcement.building?.district)) {
        return false;
      }

      // Фильтрация по количеству комнат
      if (filters.rooms.length > 0 && !filters.rooms.includes(announcement.number_of_rooms)) {
        return false;
      }

      // Фильтрация по цене
      if (filters.priceMin !== null && announcement.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== null && announcement.price > filters.priceMax) {
        return false;
      }

      // Фильтрация по цене за м²
      if (filters.pricePerMeterMin !== null && (announcement.pricePerMeter) < filters.pricePerMeterMin) {
        return false;
      }
      if (filters.pricePerMeterMax !== null && (announcement.pricePerMeter) > filters.pricePerMeterMax) {
        return false;
      }

      // Фильтрация по площади
      if (filters.totalAreaMin !== null && announcement.total_area < filters.totalAreaMin) {
        return false;
      }
      if (filters.totalAreaMax !== null && announcement.total_area > filters.totalAreaMax) {
        return false;
      }

      // Фильтрация по этажу
      if (filters.floorMin !== null && announcement.floor < filters.floorMin) {
        return false;
      }
      if (filters.floorMax !== null && announcement.floor > filters.floorMax) {
        return false;
      }
      if (filters.notFirstFloor && announcement.floor === 1) {
        return false;
      }
      if (filters.notLastFloor && announcement.floor === announcement.building?.number_of_floors) {
        return false;
      }

      // Фильтрация по типу санузла
      if (
        filters.bathroomType.length > 0 &&
        !filters.bathroomType.includes(announcement.bathroom_type)
      ) {
        return false;
      }

      // Фильтрация по площади кухни
      if (filters.kitchenAreaMin !== null && announcement.kitchen_area < filters.kitchenAreaMin) {
        return false;
      }
      if (filters.kitchenAreaMax !== null && announcement.kitchen_area > filters.kitchenAreaMax) {
        return false;
      }

      // Фильтрация по высоте потолков
      if (filters.ceilingHeightMin !== null && announcement.ceiling_height < filters.ceilingHeightMin) {
        return false;
      }
      if (filters.ceilingHeightMax !== null && announcement.ceiling_height > filters.ceilingHeightMax) {
        return false;
      }

      // Фильтрация по окнам
      if (
        filters.windows.length > 0 &&
        !filters.windows.includes(announcement.windows)
      ) {
        return false;
      }

      // Фильтрация по типу ремонта
      if (
        filters.repairType.length > 0 &&
        !filters.repairType.includes(announcement.repair)
      ) {
        return false;
      }

      // Фильтрация по балкону/лоджии
      if (
        filters.balcony.length > 0 &&
        !filters.balcony.some(type => announcement.balcony_or_loggia?.includes(type))
      ) {
        return false;
      }

      // Фильтрация по году постройки
      if (filters.yearOfConstructionMin !== null && announcement.building?.year_of_construction < filters.yearOfConstructionMin) {
        return false;
      }
      if (filters.yearOfConstructionMax !== null && announcement.building?.year_of_construction > filters.yearOfConstructionMax) {
        return false;
      }

      // Фильтрация по количеству этажей в доме
      if (filters.numberOfFloorMin !== null && announcement.building?.number_of_floors < filters.numberOfFloorMin) {
        return false;
      }
      if (filters.numberOfFloorMax !== null && announcement.building?.number_of_floors > filters.numberOfFloorMax) {
        return false;
      }

      // Фильтрация по типу дома
      if (
        filters.houseType.length > 0 &&
        !filters.houseType.includes(announcement.building?.house_type)
      ) {
        return false;
      }

      // Фильтрация по лифту
      if (
        filters.elevator.length > 0 &&
        !filters.elevator.some(type => announcement.elevator_type?.includes(type))
      ) {
        return false;
      }

      // Фильтрация по парковке
      if (
        filters.parking.length > 0 &&
        !filters.parking.some(type => announcement.parking?.includes(type))
      ) {
        return false;
      }

      // Фильтрация по внешним факторам (если есть соответствующие данные в announcement)
      // Например:
      if (filters.stops === "close" && announcement.stops_distance > 500) {
        return false;
      }
      if (filters.stops === "far" && announcement.stops_distance <= 500) {
        return false;
      }

      return true;
    });
  };

  updateFilter = (filterName, value) => {
    // Убираем вызов applyFilters здесь
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
        this.applyFilters();
      }
    );
  };

  sortAnnouncements = (announcements, sortOption) => {
    const sorted = [...announcements];
    
    switch(sortOption) {
      case 'date':
        // Сортировка по дате (новые сначала)
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'price_asc':
        // Сортировка по цене (дешевые сначала)
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        // Сортировка по цене (дорогие сначала)
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'score':
        // Сортировка по оценке (высокие сначала)
        sorted.sort((a, b) => (b.walk_score || 0) - (a.walk_score || 0));
        break;
      default:
        // По умолчанию сортируем по дате
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    return sorted;
  };

  applyFilters = () => {
    const { announcements, sortOption } = this.state;
    let filteredAnnouncements = this.filterAnnouncements(announcements);
    
    // Применяем сортировку
    filteredAnnouncements = this.sortAnnouncements(filteredAnnouncements, sortOption);
    
    this.setState({ filteredAnnouncements });
  };

  // Обработчик изменения сортировки
  handleSortChange = (sortOption) => {
    this.setState({ sortOption }, () => {
      this.applyFilters(); // Применяем фильтры и сортировку после изменения
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
      
      return { filters: newFilters };
    }, () => {
      this.fetchAnnouncements();
      // this.applyFilters();
      this.closeModal();
    });
  };

  fetchAnnouncements = async () => {
    try {
      this.setState({ loading: true });
      
      // Формируем параметры только для внешних факторов
      const amenitiesParams = {};
      const amenityKeys = ["stops",
        "school",
        "kindergarten",
        "pickup_point",
        "polyclinic",
        "center",
        "gym",
        "mall",
        "college_and_university",
        "beauty_salon",
        "gas_station",
        "pharmacy",
        "grocery_store",
        "religious",
        "restaurant",
        "bank"];
      
      amenityKeys.forEach(key => {
        amenitiesParams[`amenities_${key}`] = this.state.filters[key];
      });
      console.log("Отправляемые параметры фильтров:", amenitiesParams);
      const data = await AnnouncementsService.getWithFilters(amenitiesParams);
      
      this.setState({
        announcements: data,
        loading: false
      }, () => {
        this.applyFilters(); // Применяем все фильтры после загрузки новых данных
      });
    } catch (error) {
      this.setState({ 
        error: 'Не удалось загрузить объявления',
        loading: false 
      });
    }
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
    const { isModalOpen, filteredAnnouncements, loading, error, activeDropdown, districts, filters, sortOption } = this.state;
    const { toggleFavorite, isFavorite } = this.context;
    
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
              <option value="date">По дате (новые)</option>
              <option value="price_asc">Дешевле</option>
              <option value="price_desc">Дороже</option>
              <option value="score">По оценке</option>
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
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(announcement.announcement_id);
                            }}
                          >
                            <FontAwesomeIcon 
                              icon={faHeart} 
                              color={isFavorite(announcement.announcement_id) ? 'red' : 'white'}
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
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }
}

export default Home;