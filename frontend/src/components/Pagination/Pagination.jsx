import React from 'react';
import PropTypes from 'prop-types';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const pages = [];

    // Всегда показываем первую страницу
    if (currentPage > 1) {
        pages.push(
            <button 
                key="first" 
                onClick={() => onPageChange(1)}
                className="pagination-btn"
            >
                &laquo;
            </button>
        );
    }

    // Показываем предыдущую страницу
    if (currentPage > 1) {
        pages.push(
            <button 
                key="prev" 
                onClick={() => onPageChange(currentPage - 1)}
                className="pagination-btn"
            >
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
                onClick={() => onPageChange(i)}
                className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
            >
                {i}
            </button>
        );
    }

    // Показываем следующую страницу
    if (currentPage < totalPages) {
        pages.push(
            <button 
                key="next" 
                onClick={() => onPageChange(currentPage + 1)}
                className="pagination-btn"
            >
                &rsaquo;
            </button>
        );
    }

    // Всегда показываем последнюю страницу
    if (currentPage < totalPages) {
        pages.push(
            <button 
                key="last" 
                onClick={() => onPageChange(totalPages)}
                className="pagination-btn"
            >
                &raquo;
            </button>
        );
    }

    return <div className="pagination">{pages}</div>;
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired
};

export default Pagination;