// nav_menu.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export default function NavMenu() {
    const [keyboardOpen, setKeyboardOpen] = useState(false); // Состояние для подменю "Клавиатуры"
    const [accessoryOpen, setAccessoryOpen] = useState(false); // Состояние для подменю "Аксессуары"
    const [toolsOpen, setToolsOpen] = useState(false); // Состояние для подменю "Инструменты"

    // Обработчик клика для изменения состояния подменю "Клавиатуры"
    const handleKeyboardClick = () => {
        setKeyboardOpen(!keyboardOpen);
    };

    // Обработчик клика для изменения состояния подменю "Аксессуары"
    const handleAccessoryClick = () => {
        setAccessoryOpen(!accessoryOpen);
    };

    // Обработчик клика для изменения состояния подменю "Инструменты"
    const handleToolsClick = () => {
        setToolsOpen(!toolsOpen);
    };

    return (
        <ul className='nav__box'>
            <li className='category_name'>
                <div className='category-container'>
                    <Link to="/keyboards" className='category_name_link'>
                        Клавиатуры
                    </Link>
                    <FontAwesomeIcon className={keyboardOpen ? 'chevron_link open' : 'chevron_link'} icon={faChevronDown} onClick={handleKeyboardClick}/>
                </div>
                {keyboardOpen && ( // Если keyboardOpen равен true, отображаем подменю "Клавиатуры"
                    <ul className="submenu">
                        <li><a href='#'>Беспроводные</a></li>
                        <li><a href='#'>Полноразмерные</a></li>
                        <li><a href='#'>TKL</a></li>
                        <li><a href='#'>60%</a></li>
                    </ul>
                )}
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <Link to="/accessories" className='category_name_link'>
                        Аксессуары
                    </Link>
                    <FontAwesomeIcon className={accessoryOpen ? 'chevron_link open' : 'chevron_link'} icon={faChevronDown} onClick={handleAccessoryClick}/>
                </div>
                {accessoryOpen && ( // Если accessoryOpen равен true, отображаем подменю "Аксессуары"
                    <ul className="submenu">
                        <li><a href='#'>Пуллеры</a></li>
                        <li><a href='#'>Кабели</a></li>
                        <li><a href='#'>Коврики</a></li>
                        <li><a href='#'>Подставки</a></li>
                    </ul>
                )}
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <Link to="/details" className='category_name_link'>
                        Детали
                    </Link>
                    <FontAwesomeIcon className={toolsOpen ? 'chevron_link open' : 'chevron_link'} icon={faChevronDown} onClick={handleToolsClick}/>
                </div>
                {toolsOpen && ( // Если accessoryOpen равен true, отображаем подменю "Детали"
                    <ul className="submenu">
                        <li><Link to='/details/switches'>Переключатели</Link></li>
                        <li><Link to='/details/stabilizers'>Стабилизаторы</Link></li>
                        <li><Link to='/details/base'>Основы</Link></li>
                        <li><Link to='/details/keycaps'>Клавиши</Link></li>
                    </ul>
                )}
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <a className='category_name_link'>
                        Конфигуратор
                    </a>
                </div>
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <a className='category_name_link'>
                        WIKI
                    </a>
                </div>
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <a className='category_name_link'>
                        Контакты
                    </a>
                </div>
            </li>
            <li className='category_name'>
                <div className='category-container'>
                    <a className='category_name_link'>
                        О нас
                    </a>
                </div>
            </li>
        </ul>
    );
}

