import React, { useState } from 'react';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import Button from '../components/Button.jsx';
import { categoriesList } from '../data.js';

export default function Subscriptions({ subscriptions, onCancelSubscription }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = sub.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Все' || sub.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Мои подписки</h1>
        <p style={{ color: 'var(--text-muted)' }}>Полный список ваших подписок с удобной фильтрацией и поиском</p>
      </div>

      <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Поиск подписки..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ flex: '1 1 220px' }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'active', 'paused', 'trialing'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className="btn"
              style={{
                background: selectedStatus === status ? 'var(--primary)' : '#F1F5F9',
                color: selectedStatus === status ? '#FFF' : 'var(--text)',
                padding: '6px 14px',
                fontSize: '13px'
              }}
            >
              {status === 'all' ? 'Все статусы' : status === 'active' ? 'Активные' : status === 'paused' ? 'На паузе' : 'Пробные'}
            </button>
          ))}
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field"
          style={{ width: 'auto' }}
        >
          {categoriesList.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '12px' }}>Ничего не найдено</p>
          <Button variant="secondary" onClick={() => { setSearch(''); setSelectedCategory('Все'); setSelectedStatus('all'); }}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(sub => (
            <SubscriptionCard key={sub.id} subscription={sub} onCancel={onCancelSubscription} />
          ))}
        </div>
      )}
    </div>
  );
}
