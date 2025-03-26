import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = 'http://localhost:8000/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);

    const login = async (username, password) => {
        try {
            const res = await axios.post(`${API_URL}/auth/login/`, { username, password });
            localStorage.setItem('token', res.data.access);
            setToken(res.data.access);
            setUser({ username });
            navigate('/');
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const register = async (username, password, email) => {
        try {
            const res = await axios.post(`${API_URL}/auth/register/`, { username, password, email });
            localStorage.setItem('token', res.data.access);
            setToken(res.data.access);
            setUser({ username });
            navigate('/');
        } catch (error) {
            console.error('Registration failed:', error);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);