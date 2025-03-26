import React, { useState } from "react";

export const RadioButton = ({ value, label, selectedOption, setSelectedOption, groupName }) => {
    const handleClick = () => {
      setSelectedOption(value); // Обновляем выбранное значение
    };
  
    return (
        <label className="input__item">
            <input
            type="radio"
            id={value}
            name={groupName} // Уникальное имя для каждой группы
            value={value}
            checked={selectedOption === value} // Проверяем, является ли текущий option выбранным
            onChange={() => setSelectedOption(value)} // Обработка через input
            />
            <span onClick={handleClick}>{label}</span>
        </label>
    );
  };

