import React from 'react';
import Home from './pages/Home/Home';
import { Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import AnnouncementDetail from './pages/Announcement/AnnouncementDetail';

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>LocateMe</title>
        <meta name="description" content="Подбор недвижимости по персональным потребностям." />
      </Helmet>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/announcement/:id" element={<AnnouncementDetail />} />
      </Routes>
    </HelmetProvider>
  );
}

export default App;
