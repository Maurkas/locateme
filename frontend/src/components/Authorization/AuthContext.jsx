import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

export const AuthContext = createContext({
  user: null,
  token: null,
  favorites: [],
  login: async () => {},
  logout: () => {},
  toggleFavorite: async () => {},
  isFavorite: () => false,
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Проверка валидности токена и загрузка данных пользователя
    const verifyAndLoadUser = useCallback(async () => {
        if (!token) {
            loadFavoritesFromLocalStorage();
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/auth/user/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            await loadFavoritesFromDB();
        } catch (error) {
            if (error.response?.status === 401) {
                logout();
            }
            console.error('Ошибка проверки токена:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Загрузка данных при монтировании и изменении токена
    useEffect(() => {
        verifyAndLoadUser();
    }, [verifyAndLoadUser]);

    // Метод для загрузки избранного из БД
    const loadFavoritesFromDB = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/favorites/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFavorites(response.data.map(item => item.announcement.id));
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
            if (error.response?.status === 401) {
                logout();
            }
        }
    }, [token]);

    // Метод для загрузки из localStorage
    const loadFavoritesFromLocalStorage = useCallback(() => {
        const saved = localStorage.getItem('guest_favorites');
        if (saved) {
            try {
                setFavorites(JSON.parse(saved));
            } catch (e) {
                console.error('Ошибка парсинга избранного:', e);
                setFavorites([]);
            }
        }
    }, []);

    // Логика для БД
    const toggleFavoriteInDB = useCallback(async (announcementId) => {
        try {
            const response = await axios.post(
                `${API_URL}/auth/favorites/${announcementId}/`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setFavorites(prev => 
                response.data.status === 'added' 
                    ? [...prev, announcementId] 
                    : prev.filter(id => id !== announcementId)
            );
        } catch (error) {
            console.error('Ошибка при изменении избранного:', {
                error: error.message,
                response: error.response?.data,
                announcementId
            });
            
            if (error.response?.status === 401) {
                logout();
            }
            throw error;
        }
    }, [token]);

    // Логика для localStorage
    const toggleFavoriteInLocalStorage = useCallback((announcementId) => {
        setFavorites(prev => {
            const newFavorites = prev.includes(announcementId)
                ? prev.filter(id => id !== announcementId)
                : [...prev, announcementId];
            
            localStorage.setItem('guest_favorites', JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Универсальный метод переключения избранного
    const toggleFavorite = useCallback(async (announcementId) => {
        try {
            if (token) {
                await toggleFavoriteInDB(announcementId);
            } else {
                toggleFavoriteInLocalStorage(announcementId);
            }
        } catch (error) {
            console.error('Ошибка при изменении избранного:', error);
            throw error;
        }
    }, [token, toggleFavoriteInDB, toggleFavoriteInLocalStorage]);

    const register = useCallback(async (username, password, email) => {
        try {
            setIsLoading(true);
            const res = await axios.post(`${API_URL}/auth/register/`, { 
                username, 
                email,
                password 
            });
            
            const newToken = res.data.access;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            
            // Получаем данные пользователя
            const userRes = await axios.get(`${API_URL}/auth/user/`, {
                headers: { Authorization: `Bearer ${newToken}` }
            });
            setUser(userRes.data);
            
            navigate('/');
            return true;
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);
    

    // При логине переносим избранное из localStorage в БД
    const login = useCallback(async (username, password) => {
        try {
            setIsLoading(true);
            const res = await axios.post(`${API_URL}/auth/login/`, { username, password });
            const newToken = res.data.access;
            
            localStorage.setItem('token', newToken);
            setToken(newToken);
            
            // Получаем данные пользователя
            const userRes = await axios.get(`${API_URL}/auth/user/`, {
                headers: { Authorization: `Bearer ${newToken}` }
            });
            setUser(userRes.data);

            // Перенос избранного
            const guestFavorites = JSON.parse(localStorage.getItem('guest_favorites') || '[]');
            if (guestFavorites.length > 0) {
                await Promise.all(guestFavorites.map(id => toggleFavoriteInDB(id)));
                localStorage.removeItem('guest_favorites');
            }

            navigate('/');
        } catch (error) {
            console.error('Ошибка входа:', error);
            logout();
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [navigate, toggleFavoriteInDB]);

    // При логауте очищаем данные
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setFavorites([]);
        navigate('/');
    }, [navigate]);

    const isFavorite = useCallback((announcementId) => {
        return favorites.includes(announcementId);
    }, [favorites]);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            isLoading,
            login, 
            register,
            logout,
            favorites,
            toggleFavorite,
            isFavorite
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};