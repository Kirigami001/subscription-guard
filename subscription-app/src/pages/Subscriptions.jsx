import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import Button from '../components/Button.jsx';
import { categoriesList } from '../data.js';

export default function Subscriptions({
  subscriptions,
  onCancelSubscription,
  onDeleteSubscription,
  onSeedSubscriptions
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [seeding, setSeeding] = useState(false);

  const statusLabels = {
    all: 'Все статусы',
    active: 'Активные',
    paused: 'На паузе',
    trialing: 'Пробные',
    cancelled: 'Отменённые'
  };

  const filtered = subscriptions.filter(sub => {
    const matchesSearch = sub.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Все' || sub.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleSeed = async () => {
    if (!onSeedSubscriptions) return;
    setSeeding(true);
    try {
      await onSeedSubscriptions();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Мои подписки</h1>
          <p style={{ color: 'var(--text-muted)' }}>Полный список ваших подписок с удобной фильтрацией и поиском</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/api/subscriptions/export" download="subtrack-subscriptions.csv" className="btn btn-outline">
            ⤓ Экспорт CSV
          </a>
          <Link to="/add">
            <Button variant="primary">+ Добавить подписку</Button>
          </Link>
        </div>
      </div>

      {/* Панель фильтров */}
      <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="🔍 Поиск подписки..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ flex: '1 1 220px' }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'active', 'paused', 'trialing', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className="btn status-filter"
              style={{
                background: selectedStatus === status ? 'var(--primary)' : '#F1F5F9',
                color: selectedStatus === status ? '#FFF' : 'var(--text)',
                padding: '6px 14px',
                fontSize: '13px'
              }}
            >
              {statusLabels[status]}
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

      {/* Список */}
      {subscriptions.length === 0 ? (
        <div className="page-panel" style={{ textAlign: 'center', padding: '48px 20px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '16px' }}>У вас пока нет подписок</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {onSeedSubscriptions && (
              <Button variant="secondary" disabled={seeding} onClick={handleSeed}>
                {seeding ? 'Загрузка…' : 'Загрузить примеры подписок'}
              </Button>
            )}
            <Link to="/add">
              <Button variant="primary">+ Добавить подписку</Button>
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="page-panel" style={{ textAlign: 'center', padding: '48px 20px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '12px' }}>Ничего не найдено</p>
          <Button variant="secondary" onClick={() => { setSearch(''); setSelectedCategory('Все'); setSelectedStatus('all'); }}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(sub => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onCancel={onCancelSubscription}
              onDelete={onDeleteSubscription}
            />
          ))}
        </div>
      )}
    </div>
  );
}
