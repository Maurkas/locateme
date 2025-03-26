import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faHeart} from "@fortawesome/free-solid-svg-icons"
import NavMenu from './nav_menu';
import { Button } from '@mui/material';
import { useAuth } from '../Authorization/AuthContext';
import AuthModal from '../Authorization/AuthModal';


export default function Header() {
    const [isSticky, setSticky] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const { user, logout } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
        setIsOverlayOpen(!isOverlayOpen);
    };

    const handleOutsideMenuClick = (e) => {
        const menuContainer = e.target.closest('.menu-container');
        if (!menuContainer) {
        setIsMenuOpen(false);
        setIsOverlayOpen(false);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
        if (window.scrollY > 0) {
            setSticky(true);
        } else {
            setSticky(false);
        }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.addEventListener('click', handleOutsideMenuClick);
        } else {
            document.removeEventListener('click', handleOutsideMenuClick);
        }

        return () => {
            document.removeEventListener('click', handleOutsideMenuClick);
        };
    }, [isMenuOpen]);
    
    return (
        
    <header className={isSticky ? 'sticky' : ''}>
        <div className='mid-menu container-fluid'>
            <div className='header__body'>
                <div className="hamburger">
                    <div className='menu-container'>
                        <input id="menu__toggle" type="checkbox" checked={isMenuOpen} onChange={handleMenuToggle}/>
                        <label className="menu__btn" htmlFor="menu__toggle">
                            <span></span>
                        </label>
                        <NavMenu isOpen={isMenuOpen} />
                    </div>
                </div>
                <div className="header-logo">
                    <Link to="/" className='myLogo'>LocateMe</Link>
                </div>
                <div className='header-icons'>
                    <a>
                        <FontAwesomeIcon className='icon-fav' icon={faHeart} size="1x" style={{color: "#616161",}} />
                    </a>
                    {user ? (
                        <div className="user-menu">
                            <span>{user.username}</span>
                            <Button onClick={logout}>Выйти</Button>
                        </div>
                        ) : (
                        <Button 
                            onClick={() => setIsAuthModalOpen(true)}
                            className='auth-btn'
                        >
                            Вход и регистрация
                        </Button>
                    )}
                    <AuthModal 
                        open={isAuthModalOpen} 
                        onClose={() => setIsAuthModalOpen(false)} 
                    />
                    <div className={`overlay ${isOverlayOpen ? 'open' : ''}`}></div>
                </div>
            </div>
        </div>
    </header>
    
    )
}