import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { TextField, Button, Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const wsToken = import.meta.env.VITE_WS_TOKEN;
    console.log('WS Token:', wsToken);

    const handleSubmit = (e) => {
        e.preventDefault();
        register(username, password, email);
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>Регистрация</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Логин"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained" fullWidth>
                    Зарегистрироваться
                </Button>
            </form>
            <Typography sx={{ mt: 2 }}>
                Уже есть аккаунт?{' '}
                <Link component={RouterLink} to="/login">
                    Войти
                </Link>
            </Typography>
        </Box>
    );
};

export default Register;