import React from 'react';
import './Filters.css'
import { RadioButton } from './RadioButton';
import { useState, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { infrastructurePresets } from "./presets";
import Slider from "react-slick";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { saveFilterStats } from '../../services/api/statsApi';


const initialSelectedOptions = {
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
  pharmacy: "any",
  grocery_store: "any",
  religious: "any",
  restaurant: "any",
  bank: "any"
};

const Filters = ({ isOpen, onClose, updateFilter, onApply, onReset }) => {
  const [selectedOptions, setSelectedOptions] = useState(initialSelectedOptions);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [priceMin, setPriceMin] = useState(null);
  const [priceMax, setPriceMax] = useState(null);
  const [pricePerMeterMin, setPricePerMeterMin] = useState(null);
  const [pricePerMeterMax, setPricePerMeterMax] = useState(null);
  const [totalAreaMin, setTotalAreaMin] = useState(null);
  const [totalAreaMax, setTotalAreaMax] = useState(null);
  const [floorMin, setFloorMin] = useState(null);
  const [floorMax, setFloorMax] = useState(null);
  const [notFirstFloor, setNotFirstFloor] = useState(false);
  const [notLastFloor, setNotLastFloor] = useState(false);
  const [bathroomType, setBathroomType] = useState([]);
  const [kitchenAreaMin, setKitchenAreaMin] = useState(null);
  const [kitchenAreaMax, setKitchenAreaMax] = useState(null);
  const [ceilingHeightMin, setCeilingHeightMin] = useState(null);
  const [ceilingHeightMax, setCeilingHeightMax] = useState(null);
  const [windows, setWindows] = useState([]);
  const [repairType, setRepairType] = useState([]);
  const [balcony, setBalcony] = useState([]);
  const [yearOfConstructionMin, setYearOfConstructionMin] = useState(null);
  const [yearOfConstructionMax, setYearOfConstructionMax] = useState(null);
  const [numberOfFloorMin, setNumberOfFloorMin] = useState(null);
  const [numberOfFloorMax, setNumberOfFloorMax] = useState(null);
  const [houseType, setHouseType] = useState([]);
  const [elevator, setElevator] = useState([]);
  const [parking, setParking] = useState([]);
  const isDragging = useRef(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);


  const handleAddressInput = async (e) => {
    const value = e.target.value;
    setAddressInput(value);

    if (value.trim().length === 0) {
      setSuggestions([]);
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/amenities/yandex-suggest/?q=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error("Ошибка при получении подсказок");
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        setSuggestions([{ title: { text: "Ничего не найдено" } }]);
      } else {
        setSuggestions(data.results);
      }
    } catch (error) {
      setSuggestions([{ title: { text: "Ничего не найдено" } }]);
    }    
  };
  

  const handleSuggestionClick = async (addressText) => {
    setAddressInput(addressText);
    setSuggestions([]);
  
    try {
      const response = await fetch(`http://localhost:8000/api/amenities/yandex-geocode/?address=${encodeURIComponent(addressText)}`);
      const data = await response.json();
      if (data.lat && data.lon) {
        const coords = { address: addressText, lat: data.lat, lon: data.lon };
        setSelectedSuggestion(coords);
      } else {
        toast.error("Не удалось получить координаты.");
      }
    } catch (error) {
      toast.error("Ошибка получения координат:", error);
    }
  };
  

  const handleApply = () => {
    if (!selectedSuggestion) {
      toast.warning("Пожалуйста, выберите адрес из списка.");
      return;
    }

    updateFilter("custom_address", {
      coords: {
        lat: selectedSuggestion.lat,
        lon: selectedSuggestion.lon
      },
      distance: "nearby"
    });

    toast.success(`Адрес применён: ${selectedSuggestion.address}`, {
      autoClose: 2000,
      hideProgressBar: true
    });
  };
  
  
  const handleOptionChange = (key) => (value) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: value, // Обновляем только одно поле в объекте состояния
    }));
  };

  const options = [
    { value: "any", label: "Неважно" },
    { value: "close", label: "Рядом" },
    { value: "far", label: "Подальше" },
  ];

  const handleDistrictChange = (district) => {
    const updatedDistrict = selectedDistricts.includes(district)
    ? selectedDistricts.filter((d) => d !== district)
    : [...selectedDistricts, district];
    setSelectedDistricts(updatedDistrict);
    updateFilter("districts", updatedDistrict);
  };

  const handleRoomChange = (room) => {
    const updatedRooms = selectedRooms.includes(room)
    ? selectedRooms.filter((r) => r !== room)
    : [...selectedRooms, room];
    setSelectedRooms(updatedRooms);
    updateFilter("rooms", updatedRooms);
  };

  const handlePriceChange = (min, max) => {
    setPriceMin(min);
    setPriceMax(max);
    updateFilter("priceMin", min);
    updateFilter("priceMax", max);
  };

  const handlePricePerMeterChange = (min, max) => {
    setPricePerMeterMin(min);
    setPricePerMeterMax(max);
    updateFilter("pricePerMeterMin", min);
    updateFilter("pricePerMeterMax", max);
  };

  const handleTotalAreaChange = (min, max) => {
    setTotalAreaMin(min);
    setTotalAreaMax(max);
    updateFilter("totalAreaMin", min);
    updateFilter("totalAreaMax", max);
  };

  const handleFloorChange = (min, max) => {
    setFloorMin(min);
    setFloorMax(max);
    updateFilter("floorMin", min);
    updateFilter("floorMax", max);
  };

  const handleNotFirstFloorChange = (e) => {
    setNotFirstFloor(e.target.checked);
    updateFilter("notFirstFloor", e.target.checked);
  };
  
  const handleNotLastFloorChange = (e) => {
    setNotLastFloor(e.target.checked);
    updateFilter("notLastFloor", e.target.checked);
  };

  const handleBathroomChange = (type) => {
    const updatedTypes = bathroomType.includes(type)
    ? bathroomType.filter((t) => t !== type)
    : [...bathroomType, type];
    setBathroomType(updatedTypes);
    updateFilter("bathroomType", updatedTypes);
  };

  const handleWindowChange = (window) => {
    const updatedWindows = windows.includes(window)
      ? windows.filter((w) => w !== window)
      : [...windows, window];
    setWindows(updatedWindows);
    updateFilter("windows", updatedWindows);
  };

  const handleRepairChange = (repair) => {
    const updatedRepairs = repairType.includes(repair)
      ? repairType.filter((r) => r !== repair)
      : [...repairType, repair];
    setRepairType(updatedRepairs);
    updateFilter("repairType", updatedRepairs);
  };

  const handleKitchenAreaChange = (min, max) => {
    setKitchenAreaMin(min);
    setKitchenAreaMax(max);
    updateFilter("kitchenAreaMin", min);
    updateFilter("kitchenAreaMax", max);
  };

  const handleBalconyChange = (balconyType) => {
    const updatedBalcony = balcony.includes(balconyType)
      ? balcony.filter((b) => b !== balconyType)
      : [...balcony, balconyType];
    setBalcony(updatedBalcony);
    updateFilter("balcony", updatedBalcony);
  };

  const handleCeilingHeightChange = (min, max) => {
    setCeilingHeightMin(min);
    setCeilingHeightMax(max);
    updateFilter("ceilingHeightMin", min);
    updateFilter("ceilingHeightMax", max);
  };

  const handleYearOfConstructionChange = (min, max) => {
    setYearOfConstructionMin(min);
    setYearOfConstructionMax(max);
    updateFilter("yearOfConstructionMin", min);
    updateFilter("yearOfConstructionMax", max);
  };

  const handleNumberOfFloorChange = (min, max) => {
    setNumberOfFloorMin(min);
    setNumberOfFloorMax(max);
    updateFilter("numberOfFloorMin", min);
    updateFilter("numberOfFloorMax", max);
  };

  const handleHouseTypeChange = (type) => {
    const updatedTypes = houseType.includes(type)
      ? houseType.filter((t) => t !== type)
      : [...houseType, type];
    setHouseType(updatedTypes);
    updateFilter("houseType", updatedTypes);
  };

  const handleElevatorChange = (elevatorType) => {
    const updatedElevator = elevator.includes(elevatorType)
      ? elevator.filter((e) => e !== elevatorType)
      : [...elevator, elevatorType];
    setElevator(updatedElevator);
    updateFilter("elevator", updatedElevator);
  };

  const handleParkingChange = (parkingType) => {
    const updatedParking = parking.includes(parkingType)
      ? parking.filter((p) => p !== parkingType)
      : [...parking, parkingType];
    setParking(updatedParking);
    updateFilter("parking", updatedParking);
  };

  const handleResetFilters = () => {
    setSelectedOptions(initialSelectedOptions);
    setSelectedDistricts([]);
    setSelectedRooms([]);
    setPriceMin(null);
    setPriceMax(null);
    setPricePerMeterMin(null);
    setPricePerMeterMax(null);
    setTotalAreaMin(null);
    setTotalAreaMax(null);
    setFloorMin(null);
    setFloorMax(null);
    setNotFirstFloor(false);
    setNotLastFloor(false);
    setBathroomType([]);
    setKitchenAreaMin(null);
    setKitchenAreaMax(null);
    setCeilingHeightMin(null);
    setCeilingHeightMax(null);
    setWindows([]);
    setRepairType([]);
    setBalcony([]);
    setYearOfConstructionMin(null);
    setYearOfConstructionMax(null);
    setNumberOfFloorMin(null);
    setNumberOfFloorMax(null);
    setHouseType([]);
    setElevator([]);
    setParking([]);
    setSelectedPreset(null);
    onReset(true);
  };

  const applyPreset = (presetFilters, presetKey) => {
    if (selectedPreset === presetKey) {
      // Если пресет уже выбран, отменяем его
      setSelectedOptions(initialSelectedOptions);
      setSelectedPreset(null);
    } else {
      // Иначе применяем пресет
      setSelectedOptions((prev) => ({
        ...prev,
        ...presetFilters
      }));
      setSelectedPreset(presetKey);
    }
  };

  const handleApplyAllFilters = async () => {
    // Проверяем и применяем адрес, если он был выбран
    if (addressInput && !selectedSuggestion) {
      toast.warning("Пожалуйста, выберите адрес из списка или очистите поле адреса");
      return;
    }

    // Собираем все фильтры в один объект
    const allFilters = {
      ...selectedOptions,
      districts: selectedDistricts,
      rooms: selectedRooms,
      priceMin,
      priceMax,
      pricePerMeterMin,
      pricePerMeterMax,
      totalAreaMin,
      totalAreaMax,
      floorMin,
      floorMax,
      notFirstFloor,
      notLastFloor,
      bathroomType,
      kitchenAreaMin,
      kitchenAreaMax,
      ceilingHeightMin,
      ceilingHeightMax,
      windows,
      repairType,
      balcony,
      yearOfConstructionMin,
      yearOfConstructionMax,
      numberOfFloorMin,
      numberOfFloorMax,
      houseType,
      elevator,
      parking,
    };

    try {
      // Отправляем статистику на сервер
      if (saveFilterStats) {
        await saveFilterStats('announcements/filters', allFilters);
      }

      // Обновляем фильтры в родительском компоненте
      if (onApply) {
        onApply(allFilters);
      }
    } catch (error) {
      toast.error("Ошибка при применении фильтров", {
        autoClose: 2000,
        hideProgressBar: true
      });
      console.error("Ошибка:", error);
    }
  };
  

  if (!isOpen) return null;

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="filters-header">
            <h1>Фильтры</h1>
            <span className="close-btn" onClick={onClose}>
              &times;
            </span>
          </div>
          <Slider
            dots={false}
            infinite={false}
            speed={500}
            slidesToShow={3}
            slidesToScroll={1}
            className="preset-slider"
          >
            {Object.entries(infrastructurePresets).map(([key, preset]) => (
              <div key={key} onClick={(e) => {
                if (!isDragging.current) {
                  applyPreset(preset.filters, key);
                }
                isDragging.current = false;
              }}
                onMouseDown={() => (isDragging.current = false)}
                onMouseMove={() => (isDragging.current = true)} 
                className={`preset-card ${selectedPreset === key ? 'selected' : ''}`}
                >
                <div className="preset-icon" style={{ fontSize: "24px" }}>{preset.icon}</div>
                <div className="preset-name">{preset.name}</div>
                <div className="preset-desc">{preset.description}</div>
              </div>
            ))}
          </Slider>
          {/* Две колонки: характеристики помещения (слева) и внешние факторы (справа) */}
          <div className="filters-container">
            <div className="filters-left">
              <h3>Характеристики</h3>
              <div className="filter-item">
                <label className="filter__label">Район:</label>
                <div className="input-container">
                {['Кировский', 'Ленинский', 'Советский', 'Трусовский'].map((district) => (
                  <label className="input__item" key={district}>
                    <input
                      type="checkbox"
                      checked={selectedDistricts.includes(district)}
                      onChange={() => handleDistrictChange(district)}
                    />
                    <span>{district}</span>
                  </label>
                ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Количество комнат:</label>
                <div className="input-container">
                {[1, 2, 3, 4, "5+"].map((room) => (
                  <label className="input__item" key={room}>
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room)}
                      onChange={() => handleRoomChange(room)}
                    />
                    <span>{room}</span>
                  </label>
                ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Цена, ₽:</label>
                <div className="input-container">
                <NumericFormat
                  thousandSeparator=" "
                  suffix=" ₽"
                  placeholder="От"
                  value={priceMin || ""}
                  onValueChange={(values) => {
                    handlePriceChange(values.floatValue, priceMax);
                  }}
                />
                <NumericFormat
                  thousandSeparator=" "
                  suffix=" ₽"
                  placeholder="До"
                  value={priceMax || ""}
                  onValueChange={(values) => {
                    handlePriceChange(priceMin, values.floatValue);
                  }}
                />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Цена за м²:</label>
                <div className="input-container">
                  <NumericFormat
                    thousandSeparator=" "
                    suffix=" ₽"
                    placeholder="От"
                    value={pricePerMeterMin || ""}
                    onValueChange={(values) => handlePricePerMeterChange(values.floatValue, pricePerMeterMax)}
                  />
                  <NumericFormat
                    thousandSeparator=" "
                    suffix=" ₽"
                    placeholder="До"
                    value={pricePerMeterMax || ""}
                    onValueChange={(values) => handlePricePerMeterChange(pricePerMeterMin, values.floatValue)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Общая площадь, м²:</label>
                <div className="input-container">
                    <NumericFormat
                      thousandSeparator=" "
                      suffix=" м²"
                      placeholder="От"
                      value={totalAreaMin || ""}
                      onValueChange={(values) => handleTotalAreaChange(values.floatValue, totalAreaMax)}
                    />
                    <NumericFormat
                      thousandSeparator=" "
                      suffix=" м²"
                      placeholder="До"
                      value={totalAreaMax || ""}
                      onValueChange={(values) => handleTotalAreaChange(totalAreaMin, values.floatValue)}
                    />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Этаж:</label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="От"
                    value={floorMin || ""}
                    onChange={(e) => handleFloorChange(e.target.value, floorMax)}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={floorMax || ""}
                    onChange={(e) => handleFloorChange(floorMin, e.target.value)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <div className="input-container">
                  <label className="input__item">
                    <input
                      type="checkbox"
                      checked={notFirstFloor}
                      onChange={handleNotFirstFloorChange}
                    />
                    <span>Не первый</span>
                  </label>
                  <label className="input__item">
                    <input
                      type="checkbox"
                      checked={notLastFloor}
                      onChange={handleNotLastFloorChange}
                    />
                    <span>Не последний</span>
                  </label>
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Санузел:</label>
                <div className="input-container">
                  {["Разделенный", "Совмещенный"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={bathroomType.includes(type)}
                      onChange={() => handleBathroomChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Ремонт:</label>
                <div className="input-container">
                  {["Евро", "Косметический", "Без ремонта"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={repairType.includes(type)}
                      onChange={() => handleRepairChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Площадь кухни:</label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="От"
                    value={kitchenAreaMin || ""}
                    onChange={(e) => handleKitchenAreaChange(e.target.value, kitchenAreaMax)}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={kitchenAreaMax || ""}
                    onChange={(e) => handleKitchenAreaChange(kitchenAreaMin, e.target.value)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Балкон или лоджия:</label>
                <div className="input-container">
                  {["Балкон", "Лоджия"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={balcony.includes(type)}
                      onChange={() => handleBalconyChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Высота потолков:</label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="От"
                    value={ceilingHeightMin || ""}
                    onChange={(e) => handleCeilingHeightChange(e.target.value, ceilingHeightMax)}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={ceilingHeightMax || ""}
                    onChange={(e) => handleCeilingHeightChange(ceilingHeightMin, e.target.value)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Окна:</label>
                <div className="input-container">
                  {["На улицу", "Во двор"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={windows.includes(type)}
                      onChange={() => handleWindowChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Год постройки дома:</label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="От"
                    value={yearOfConstructionMin || ""}
                    onChange={(e) => handleYearOfConstructionChange(e.target.value, yearOfConstructionMax)}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={yearOfConstructionMax || ""}
                    onChange={(e) => handleYearOfConstructionChange(yearOfConstructionMin, e.target.value)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Этажей в доме:</label>
                <div className="input-container">
                  <input
                    type="number"
                    placeholder="От"
                    value={numberOfFloorMin || ""}
                    onChange={(e) => handleNumberOfFloorChange(e.target.value, numberOfFloorMax)}
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={numberOfFloorMax || ""}
                    onChange={(e) => handleNumberOfFloorChange(numberOfFloorMin, e.target.value)}
                  />
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Тип дома:</label>
                <div className="input-container">
                  {["Панельный", "Кирпичный", "Монолитный"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={houseType.includes(type)}
                      onChange={() => handleHouseTypeChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Лифт:</label>
                <div className="input-container">
                  {["Пассажирский", "Грузовой"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={elevator.includes(type)}
                      onChange={() => handleElevatorChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
              <div className="filter-item">
                <label className="filter__label">Парковка:</label>
                <div className="input-container">
                  {["Подземная", "Наземная"].map((type) => (
                  <label className="input__item" key={type}>
                    <input
                      type="checkbox"
                      checked={parking.includes(type)}
                      onChange={() => handleParkingChange(type)}
                    />
                    <span>{type}</span>
                  </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Правая часть: Внешние факторы */}
            <div className="filters-right">
              <h3>Внешние факторы</h3>
              <label className="filter__label">Близость остановок:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.stops}
                    setSelectedOption={handleOptionChange("stops")}
                    groupName="stops"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость магазина продуктов:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.grocery_store}
                    setSelectedOption={handleOptionChange("grocery_store")}
                    groupName="grocery_store"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость ресторанов:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.restaurant}
                    setSelectedOption={handleOptionChange("restaurant")}
                    groupName="restaurant"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость школы:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.school}
                    setSelectedOption={handleOptionChange("school")}
                    groupName="school"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость детского сада:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.kindergarten}
                    setSelectedOption={handleOptionChange("kindergarten")}
                    groupName="kindergarten"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость пункта выдачи:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.pickup_point}
                    setSelectedOption={handleOptionChange("pickup_point")}
                    groupName="pickup_point"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость поликлиники:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.polyclinic}
                    setSelectedOption={handleOptionChange("polyclinic")}
                    groupName="polyclinic"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость аптеки:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.pharmacy}
                    setSelectedOption={handleOptionChange("pharmacy")}
                    groupName="pharmacy"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость банкомата:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.bank}
                    setSelectedOption={handleOptionChange("bank")}
                    groupName="bank"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость к центру города:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.center}
                    setSelectedOption={handleOptionChange("center")}
                    groupName="center"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость тренажерного зала:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.gym}
                    setSelectedOption={handleOptionChange("gym")}
                    groupName="gym"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость торгового центра:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.mall}
                    setSelectedOption={handleOptionChange("mall")}
                    groupName="mall"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость ВУЗа или колледжа:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.college_and_university}
                    setSelectedOption={handleOptionChange("college_and_university")}
                    groupName="college_and_university"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость салона красоты:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.beauty_salon}
                    setSelectedOption={handleOptionChange("beauty_salon")}
                    groupName="beauty_salon"
                  />
                ))}
                </div>
              </div>
              <label className="filter__label">Близость религиозных объектов:</label>
              <div className="filter-item">
                <div className="input-container">
                {options.map((option) => (
                  <RadioButton
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    selectedOption={selectedOptions.religious}
                    setSelectedOption={handleOptionChange("religious")}
                    groupName="religious"
                  />
                ))}
                </div>
              </div>
              {/* Пользовательские объекты */}
              <label className="filter__label">Близость любого объекта:</label>
              <div className="user-object-section" style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="address-suggest"
                  placeholder="Введите адрес"
                  onChange={handleAddressInput}
                  value={addressInput}
                />
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(`${suggestion.subtitle?.text ?? ""}, ${suggestion.title.text}`)}

                        className="suggestion-item"
                        style={suggestion.title.text === "Ничего не найдено" ? { cursor: "default", color: "#999" } : {}}
                      >
                        <div className="suggestion-title">{suggestion.title.text}</div>
                        {suggestion.subtitle?.text && suggestion.title.text !== "Ничего не найдено" && (
                          <div className="suggestion-subtitle">{suggestion.subtitle.text}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={handleApply} className="apply-button">
                  Применить
                </button>

              </div>
            </div>
          </div>
          <div className="filters-footer">
            <button onClick={() => handleApplyAllFilters(selectedOptions)}>Показать</button>
            <button onClick={handleResetFilters}>Сбросить фильтры</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Filters;