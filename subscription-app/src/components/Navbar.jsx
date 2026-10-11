import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          <span>🛡️ SubTrack</span>
        </Link>

        <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Меню">
          ☰
        </button>

        <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
          <li><NavLink to="/" end onClick={() => setIsOpen(false)}>Главная</NavLink></li>
          <li><NavLink to="/subscriptions" onClick={() => setIsOpen(false)}>Мои подписки</NavLink></li>
          <li><NavLink to="/add" onClick={() => setIsOpen(false)}>Добавить</NavLink></li>
          <li><NavLink to="/stats" onClick={() => setIsOpen(false)}>Статистика</NavLink></li>
          <li><NavLink to="/profile" onClick={() => setIsOpen(false)}>Профиль</NavLink></li>
        </ul>

        <Link to="/profile" className="user-badge">
          👤 Дидар (IT1-2306)
        </Link>
      </div>
    </nav>
  );
}
