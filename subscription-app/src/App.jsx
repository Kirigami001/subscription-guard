import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Subscriptions from './pages/Subscriptions.jsx';
import AddSubscription from './pages/AddSubscription.jsx';
import SubscriptionDetails from './pages/SubscriptionDetails.jsx';
import Stats from './pages/Stats.jsx';
import Profile from './pages/Profile.jsx';
import Auth, { getCurrentUser, logoutUser } from './pages/Auth.jsx';
import { initialSubscriptions } from './data.js';

export default function App() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [user, setUser] = useState(getCurrentUser);
  const [theme, setTheme] = useState(() => localStorage.getItem('subtrack-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('subtrack-theme', theme);
  }, [theme]);

  const handleAddSubscription = (newSub) => {
    const item = {
      ...newSub,
      id: Date.now().toString(),
      brandColor: '#1E3A8A'
    };
    setSubscriptions([item, ...subscriptions]);
  };

  const handleCancelSubscription = (id) => {
    setSubscriptions(subscriptions.map(s => 
      s.id === id ? { ...s, status: 'cancelled' } : s
    ));
  };

  const handleTogglePause = (id) => {
    setSubscriptions(subscriptions.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: s.status === 'paused' ? 'active' : 'paused'
        };
      }
      return s;
    }));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Auth mode="register" onAuthenticated={setUser} />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth mode="login" onAuthenticated={setUser} />} />
        <Route path="/" element={user ? <Layout user={user} onLogout={() => { logoutUser(); setUser(null); }} theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} /> : <Navigate to="/register" replace />}>
          <Route index element={<Home subscriptions={subscriptions} onCancelSubscription={handleCancelSubscription} />} />
          <Route path="subscriptions" element={<Subscriptions subscriptions={subscriptions} onCancelSubscription={handleCancelSubscription} />} />
          <Route path="add" element={<AddSubscription onAddSubscription={handleAddSubscription} />} />
          <Route path="subscription/:id" element={<SubscriptionDetails subscriptions={subscriptions} onCancelSubscription={handleCancelSubscription} onTogglePause={handleTogglePause} />} />
          <Route path="stats" element={<Stats subscriptions={subscriptions} />} />
          <Route path="profile" element={<Profile user={user} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
