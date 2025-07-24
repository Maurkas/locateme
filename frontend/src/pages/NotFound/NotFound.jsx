import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <h2 className="not-found-subtitle">Упс! Страница не найдена</h2>
      <div className="not-found-illustration"></div>
      <p className="not-found-text">
        Кажется, мы не можем найти страницу, которую вы ищете.
        Возможно, она была перемещена или больше не существует.
      </p>
      <Link to="/" className="not-found-button">Вернуться на главную</Link>
    </div>
  );
};

export default NotFound;