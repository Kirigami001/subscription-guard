import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';

export default function Layout({ theme, onToggleTheme, user, onLogout }) {
  return (
    <div className="app-container">
      <Navbar theme={theme} onToggleTheme={onToggleTheme} user={user} onLogout={onLogout} />
      <main className="main-content">
        <div className="page-actions">
          <button className="btn btn-outline" onClick={() => window.print()} aria-label="Сохранить страницу в PDF">
            ⤓ Экспорт в PDF
          </button>
        </div>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
