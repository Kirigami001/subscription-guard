import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <strong>SubTrack</strong> — сервис контроля и оптимизации цифровых подписок.
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Команда: Айяна, Даулет, Дидар, Темирлан (МУИТ, 2026)
          </div>
        </div>

        <div className="footer-links">
          <Link to="/">Дашборд</Link>
          <Link to="/subscriptions">Подписки</Link>
          <Link to="/stats">Аналитика</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
