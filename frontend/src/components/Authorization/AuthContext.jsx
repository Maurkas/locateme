import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8000/api';

export const AuthContext = createContext({
  user: null,
  token: null,
  favorites: [],
  savedSearches: [],
  login: async () => {},
  logout: () => {},
  toggleFavorite: async () => {},
  isFavorite: () => false,
  saveSearch: async () => {},
  deleteSearch: async () => {},
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [favorites, setFavorites] = useState([]);
    const [savedSearches, setSavedSearches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Проверка валидности токена и загрузка данных пользователя
    const verifyAndLoadUser = useCallback(async () => {
        if (!token) {
            loadFavoritesFromLocalStorage();
            loadSearchesFromLocalStorage();
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/auth/user/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(response.data);
            await Promise.all([loadFavoritesFromDB(), loadSavedSearches()]);
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

    const loadSavedSearches = useCallback(async () => {
        if (!token) return;
        
        try {
          const response = await axios.get(`${API_URL}/auth/searches/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSavedSearches(response.data);
        } catch (error) {
            console.error('Ошибка загрузки сохраненных поисков:', error);
            if (error.response?.status === 401) {
                logout();
            }
        }
      }, [token]);

          // Сохранение поиска в localStorage
    const saveSearchToLocalStorage = useCallback((name, params) => {
        const newSearch = {
            id: Date.now(), // Используем timestamp как временный ID
            name,
            params,
            created_at: new Date().toISOString()
        };
        
        setSavedSearches(prev => {
            const newSearches = [newSearch, ...prev];
            localStorage.setItem('guest_searches', JSON.stringify(newSearches));
            return newSearches;
        });
        
        return newSearch;
    }, []);

    // Удаление поиска из localStorage
    const deleteSearchFromLocalStorage = useCallback((searchId) => {
        setSavedSearches(prev => {
        const newSearches = prev.filter(s => s.id !== searchId);
        localStorage.setItem('guest_searches', JSON.stringify(newSearches));
        return newSearches;
        });
    }, []);
      
      // Сохранение нового поиска
      const saveSearch = useCallback(async (name, params) => {
        if (token) {
          try {
            const response = await axios.post(
              `${API_URL}/auth/searches/`,
              { name, params },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSavedSearches(prev => [response.data, ...prev]);
            return response.data;
          } catch (error) {
            console.error('Ошибка сохранения поиска:', error);
            throw error;
          }
        } else {
          return saveSearchToLocalStorage(name, params);
        }
      }, [token, saveSearchToLocalStorage]);
      
      // Универсальный метод удаления поиска
      const deleteSearch = useCallback(async (searchId) => {
        if (token) {
          try {
            await axios.delete(`${API_URL}/auth/searches/${searchId}/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setSavedSearches(prev => prev.filter(s => s.id !== searchId));
          } catch (error) {
            console.error('Ошибка удаления поиска:', error);
            throw error;
          }
        } else {
          deleteSearchFromLocalStorage(searchId);
        }
      }, [token, deleteSearchFromLocalStorage]);

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

    // Загрузка сохраненных поисков из localStorage
    const loadSearchesFromLocalStorage = useCallback(() => {
        const saved = localStorage.getItem('guest_searches');
        if (saved) {
        try {
            setSavedSearches(JSON.parse(saved));
        } catch (e) {
            console.error('Ошибка парсинга сохраненных поисков:', e);
            setSavedSearches([]);
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
            
            return true;
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);
    

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

            // Перенос сохраненных поисков
            const guestSearches = JSON.parse(localStorage.getItem('guest_searches') || '[]');
            if (guestSearches.length > 0) {
                await Promise.all(guestSearches.map(search => saveSearch(search.name, search.params).catch(e => console.error(e))));
                localStorage.removeItem('guest_searches');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            logout(false);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toggleFavoriteInDB, saveSearch]);

    // При логауте очищаем данные
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setFavorites([]);
        setSavedSearches([]);
        navigate('/favourites');
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
            savedSearches,
            toggleFavorite,
            isFavorite,
            saveSearch,
            deleteSearch
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