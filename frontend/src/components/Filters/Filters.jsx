import React from 'react';
import './Filters.css'
import { RadioButton } from './RadioButton';
import { useState } from 'react';
import { NumericFormat } from 'react-number-format';


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
  gas_station: "any",
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
    onReset(true);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="filters-header">
          <h1>Фильтры</h1>
          <span className="close-btn" onClick={onClose}>
            &times;
          </span>
        </div>
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
            <label className="filter__label">Близость заправки:</label>
            <div className="filter-item">
              <div className="input-container">
              {options.map((option) => (
                <RadioButton
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  selectedOption={selectedOptions.gas_station}
                  setSelectedOption={handleOptionChange("gas_station")}
                  groupName="gas_station"
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
          </div>
        </div>
        <div className="filters-footer">
          <button onClick={() => onApply(selectedOptions)}>Показать</button>
          <button onClick={handleResetFilters}>Сбросить фильтры</button>
        </div>
      </div>
    </div>
  );
};

export default Filters;