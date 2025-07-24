import React from 'react';
import Home from './pages/Home/Home';
import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import AnnouncementDetail from './pages/Announcement/AnnouncementDetail';
import FavoritesPage from './pages/Favourites/FavoritesPage';
import { AuthProvider } from './components/Authorization/AuthContext';
import NotFound from './pages/NotFound/NotFound';
import './index.css'


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
          <Route path='/favourites' element={<FavoritesPage/>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
