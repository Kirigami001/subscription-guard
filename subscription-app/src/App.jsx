import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import AddSubscription from './pages/AddSubscription.jsx';
import SubscriptionDetails from './pages/SubscriptionDetails.jsx';
import Stats from './pages/Stats.jsx';
import Profile from './pages/Profile.jsx';
import Auth from './pages/Auth.jsx';
import { authApi, subscriptionsApi } from './api.js';

export default function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('subtrack-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('subtrack-theme', theme);
  }, [theme]);

  useEffect(() => {
    authApi
      .me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((err) => {
        if (err?.status !== 401) {
          setError(err.message);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const refreshInsights = useCallback(async () => {
    try {
      const data = await subscriptionsApi.insights();
      setInsights(data);
    } catch {
      // Insights will fall back to local calculations if unavailable
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setInsights(null);
      return;
    }

    let cancelled = false;
    Promise.all([subscriptionsApi.list(), subscriptionsApi.insights()])
      .then(([subsRes, insightsRes]) => {
        if (cancelled) return;
        setSubscriptions(subsRes.subscriptions);
        setInsights(insightsRes);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAddSubscription = async (newSub) => {
    const { subscription } = await subscriptionsApi.add(newSub);
    setSubscriptions((prev) => [subscription, ...prev]);
    setError('');
    await refreshInsights();
  };

  const handleChangeStatus = async (id, status) => {
    try {
      const { subscription } = await subscriptionsApi.status(id, status);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? subscription : s)));
      setError('');
      await refreshInsights();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleTogglePause = (id) => {
    const current = subscriptions.find((s) => s.id === id);
    if (!current) return Promise.resolve();
    const nextStatus = current.status === 'paused' || current.status === 'cancelled' ? 'active' : 'paused';
    return handleChangeStatus(id, nextStatus);
  };

  const handleDeleteSubscription = async (id) => {
    try {
      await subscriptionsApi.remove(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      setError('');
      await refreshInsights();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setSubscriptions([]);
      setInsights(null);
      setError('');
    }
  };

  const handleAuthenticated = (loggedInUser) => {
    setError('');
    setUser(loggedInUser);
  };

  if (!ready) {
    return <div style={{ padding: 30 }}>Загрузка SubTrack…</div>;
  }

  return (
    <BrowserRouter>
      {error && (
        <div role="alert" className="error-panel" style={{ padding: 12, background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
      <Routes>
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Auth mode="register" onAuthenticated={handleAuthenticated} />}
        />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Auth mode="login" onAuthenticated={handleAuthenticated} />}
        />
        <Route
          path="/"
          element={
            user ? (
              <Layout
                user={user}
                onLogout={handleLogout}
                theme={theme}
                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route
            index
            element={
              <Home
                subscriptions={subscriptions}
                insights={insights}
                onCancelSubscription={(id) => handleChangeStatus(id, 'cancelled')}
                onDeleteSubscription={handleDeleteSubscription}
              />
            }
          />
          <Route
            path="subscriptions"
            element={
              <Subscriptions
                subscriptions={subscriptions}
                onCancelSubscription={(id) => handleChangeStatus(id, 'cancelled')}
                onDeleteSubscription={handleDeleteSubscription}
              />
            }
          />
          <Route path="add" element={<AddSubscription onAddSubscription={handleAddSubscription} />} />
          <Route
            path="subscription/:id"
            element={
              <SubscriptionDetails
                subscriptions={subscriptions}
                onCancelSubscription={(id) => handleChangeStatus(id, 'cancelled')}
                onTogglePause={handleTogglePause}
                onDeleteSubscription={handleDeleteSubscription}
              />
            }
          />
          <Route path="stats" element={<Stats subscriptions={subscriptions} insights={insights} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
