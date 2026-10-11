import React from 'react';
import { Link } from 'react-router-dom';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import Button from '../components/Button.jsx';

export default function Home({ subscriptions, onCancelSubscription }) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = totalMonthly * 12;

  // Найти ближайшее списание
  const sortedByDate = [...activeSubs].sort((a, b) => new Date(a.nextPayment) - new Date(b.nextPayment));
  const nextSub = sortedByDate[0];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>Панель управления</h1>
          <p style={{ color: 'var(--text-muted)' }}>Обзор всех ваших регулярных платежей и активных подписок</p>
        </div>
        <Link to="/add">
          <Button variant="primary">+ Добавить подписку</Button>
        </Link>
      </div>

      {/* Метрики */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="label">Сумма в месяц</div>
          <div className="value">{totalMonthly.toLocaleString()} ₸</div>
          <div className="trend">↑ 8% по сравнению с прошлым месяцем</div>
        </div>
        <div className="metric-card">
          <div className="label">Прогноз на год</div>
          <div className="value">{totalYearly.toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Экономия при контроле</div>
        </div>
        <div className="metric-card">
          <div className="label">Активные сервисы</div>
          <div className="value">{activeSubs.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Всего в реестре: {subscriptions.length}</div>
        </div>
        <div className="metric-card">
          <div className="label">Ближайший платеж</div>
          <div className="value" style={{ fontSize: '20px' }}>{nextSub ? nextSub.title : '—'}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {nextSub ? `${nextSub.amount.toLocaleString()} ₸ (${nextSub.nextPayment})` : 'Нет платежей'}
          </div>
        </div>
      </div>

      {/* Сетка подписок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Ваши подписки</h2>
        <Link to="/subscriptions" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
          Смотреть все ({subscriptions.length}) →
        </Link>
      </div>

      <div className="cards-grid">
        {subscriptions.map(sub => (
          <SubscriptionCard key={sub.id} subscription={sub} onCancel={onCancelSubscription} />
        ))}
      </div>
    </div>
  );
}
