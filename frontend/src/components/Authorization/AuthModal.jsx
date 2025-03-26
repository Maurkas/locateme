import React, { useState } from 'react';
import { 
  TextField, Button, Box, Tabs, Tab, Dialog, 
  CircularProgress, Alert, Snackbar 
} from '@mui/material';
import { useAuth } from './AuthContext';

const AuthModal = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    username: '', 
    email: '', 
    password: '' 
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      setError('Заполните все поля');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(loginData.username, loginData.password);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Неверные учетные данные");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('Заполните все поля');
      return;
    }
    
    setIsLoading(true);
    try {
      await register(registerData.username, registerData.password, registerData.email);
      setActiveTab(0);
      setLoginData({
        username: registerData.username,
        password: registerData.password
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 
              err.response?.data?.username?.[0] || 
              "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            setError(null);
          }}
          variant="fullWidth"
        >
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {activeTab === 0 ? (
          <form onSubmit={handleLoginSubmit}>
            <TextField
              fullWidth
              required
              label="Логин"
              value={loginData.username}
              onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              required
              label="Пароль"
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              sx={{ mt: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <TextField
              fullWidth
              required
              label="Логин"
              value={registerData.username}
              onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              required
              label="Email"
              type="email"
              value={registerData.email}
              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              required
              label="Пароль"
              type="password"
              value={registerData.password}
              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
              sx={{ mt: 2 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              fullWidth 
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Зарегистрироваться'}
            </Button>
          </form>
        )}
      </Box>
    </Dialog>
  );
};

export default AuthModal;