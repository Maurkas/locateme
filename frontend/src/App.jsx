import React from 'react';
import Home from './pages/Home/Home';
import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import AnnouncementDetail from './pages/Announcement/AnnouncementDetail';
import Register from './components/Authorization/Register';
import Login from './components/Authorization/Login';
import { AuthProvider } from './components/Authorization/AuthContext';


function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Helmet>
          <title>LocateMe</title>
          <meta name="description" content="Подбор недвижимости по персональным потребностям." />
        </Helmet>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/announcement/:id" element={<AnnouncementDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
