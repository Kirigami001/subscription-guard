import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const USERS_KEY = 'subtrack-users';
const SESSION_KEY = 'subtrack-session';

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export default function Auth({ mode, onAuthenticated }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    if (isRegister) {
      if (name.trim().length < 2) return setError('Введите имя (не менее 2 символов).');
      if (password.length < 6) return setError('Пароль должен содержать не менее 6 символов.');
      if (password !== confirmPassword) return setError('Пароли не совпадают.');
      const users = readUsers();
      if (users.some(user => user.email === normalizedEmail)) return setError('Аккаунт с этой почтой уже существует.');

      const user = { name: name.trim(), email: normalizedEmail, password };
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
      const session = { name: user.name, email: user.email };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onAuthenticated(session);
      navigate('/', { replace: true });
      return;
    }

    const user = readUsers().find(item => item.email === normalizedEmail && item.password === password);
    if (!user) return setError('Неверная почта или пароль.');
    const session = { name: user.name, email: user.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    onAuthenticated(session);
    navigate('/', { replace: true });
  };

  return (
    <section className="auth-page">
      <form className="auth-card page-panel" onSubmit={handleSubmit}>
        <div className="auth-brand">🛡️ SubTrack</div>
        <h1>{isRegister ? 'Создать аккаунт' : 'Войти в аккаунт'}</h1>
        <p className="auth-description">
          {isRegister ? 'Зарегистрируйтесь, чтобы управлять подписками.' : 'Введите почту и пароль, указанные при регистрации.'}
        </p>

        {isRegister && (
          <div className="input-group">
            <label className="input-label" htmlFor="auth-name">Имя</label>
            <input id="auth-name" className="input-field" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required minLength={2} />
          </div>
        )}
        <div className="input-group">
          <label className="input-label" htmlFor="auth-email">Электронная почта</label>
          <input id="auth-email" className="input-field" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </div>
        <div className="input-group">
          <label className="input-label" htmlFor="auth-password">Пароль</label>
          <input id="auth-password" className="input-field" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={6} />
        </div>
        {isRegister && (
          <div className="input-group">
            <label className="input-label" htmlFor="auth-confirm-password">Повторите пароль</label>
            <input id="auth-confirm-password" className="input-field" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={6} />
          </div>
        )}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="btn btn-primary auth-submit" type="submit">{isRegister ? 'Зарегистрироваться' : 'Войти'}</button>
        <p className="auth-switch">
          {isRegister ? 'Уже есть аккаунт? ' : 'Еще нет аккаунта? '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Войти' : 'Зарегистрироваться'}</Link>
        </p>
      </form>
    </section>
  );
}
