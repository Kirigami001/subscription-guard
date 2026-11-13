import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';

export default function Auth({ mode, onAuthenticated }) {
  const navigate = useNavigate();
  const register = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError('');
    setConfirm('');
  }, [mode]);

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (register) {
      if (name.trim().length < 2) {
        return setError('Введите имя (не менее 2 символов)');
      }
      if (password !== confirm) {
        return setError('Пароли не совпадают');
      }
    }

    setBusy(true);
    try {
      const { user } = register
        ? await authApi.register(name.trim(), email.trim(), password)
        : await authApi.login(email.trim(), password);
      onAuthenticated(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card page-panel" onSubmit={submit}>
        <div className="auth-brand">🛡️ SubTrack</div>
        <h1>{register ? 'Создать аккаунт' : 'Войти в аккаунт'}</h1>
        <p className="auth-description">
          {register
            ? 'Зарегистрируйтесь, чтобы управлять подписками.'
            : 'Введите почту и пароль.'}
        </p>

        {register && (
          <div className="input-group">
            <label className="input-label" htmlFor="auth-name">
              Имя
            </label>
            <input
              id="auth-name"
              className="input-field"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>
        )}

        <div className="input-group">
          <label className="input-label" htmlFor="auth-email">
            Электронная почта
          </label>
          <input
            id="auth-email"
            className="input-field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="auth-password">
            Пароль
          </label>
          <input
            id="auth-password"
            className="input-field"
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {register && (
          <div className="input-group">
            <label className="input-label" htmlFor="auth-confirm">
              Повторите пароль
            </label>
            <input
              id="auth-confirm"
              className="input-field"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
          {busy ? 'Обработка…' : register ? 'Зарегистрироваться' : 'Войти'}
        </button>

        <p className="auth-switch">
          {register ? 'Уже есть аккаунт? ' : 'Еще нет аккаунта? '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Войти' : 'Зарегистрироваться'}
          </Link>
        </p>
      </form>
    </section>
  );
}
