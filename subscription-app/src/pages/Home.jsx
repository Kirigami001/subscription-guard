import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SubscriptionCard from '../components/SubscriptionCard.jsx';
import Button from '../components/Button.jsx';

const monthlyAmount = (s) => Number(s.amount) / (s.billingPeriod === 'yearly' ? 12 : 1);

export default function Home({
  subscriptions,
  insights,
  onCancelSubscription,
  onDeleteSubscription,
  onSeedSubscriptions
}) {
  const [seeding, setSeeding] = useState(false);

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const computedMonthly = activeSubs.reduce((sum, s) => sum + monthlyAmount(s), 0);
  const totalMonthly = insights?.monthlyEquivalent ?? computedMonthly;
  const totalYearly = insights?.yearlyEquivalent ?? computedMonthly * 12;

  const today = new Date().toISOString().slice(0, 10);
  const upcomingActive = activeSubs.filter(s => s.nextPayment >= today);
  const sortedByDate = [...(upcomingActive.length ? upcomingActive : activeSubs)].sort(
    (a, b) => a.nextPayment.localeCompare(b.nextPayment)
  );
  const nextSub = sortedByDate[0];
  const upcomingPayments = insights?.upcoming || [];
  const recommendations = insights?.recommendations || [];
  const potentialYearlySavings = insights?.potentialYearlySavings || 0;

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
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>Панель управления</h1>
          <p style={{ color: 'var(--text-muted)' }}>Обзор всех ваших регулярных платежей и активных подписок</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {subscriptions.length === 0 && onSeedSubscriptions && (
            <Button variant="secondary" disabled={seeding} onClick={handleSeed}>
              {seeding ? 'Загрузка…' : 'Загрузить примеры'}
            </Button>
          )}
          <Link to="/add">
            <Button variant="primary">+ Добавить подписку</Button>
          </Link>
        </div>
      </div>

      {/* Метрики */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="label">Сумма в месяц</div>
          <div className="value">{Math.round(totalMonthly).toLocaleString()} ₸</div>
          <div className="trend">Ежемесячный эквивалент</div>
        </div>
        <div className="metric-card">
          <div className="label">Прогноз на год</div>
          <div className="value">{Math.round(totalYearly).toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {potentialYearlySavings > 0
              ? `Потенциал экономии: ${Math.round(potentialYearlySavings).toLocaleString()} ₸`
              : 'Экономия при контроле'}
          </div>
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
            {nextSub ? `${Number(nextSub.amount).toLocaleString()} ₸ (${nextSub.nextPayment})` : 'Нет платежей'}
          </div>
        </div>
      </div>

      {upcomingPayments.length > 0 && (
        <div className="alert-warning" style={{ marginBottom: '20px' }}>
          <strong>Ближайшие списания (в ближайшие {insights?.reminderDays || 7} дн.):</strong>{' '}
          {upcomingPayments.map(item => `${item.title} (${item.nextPayment})`).join(', ')}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Рекомендации по оптимизации подписок</h2>
            {potentialYearlySavings > 0 && (
              <span className="badge badge-paused">
                Экономия до {Math.round(potentialYearlySavings).toLocaleString()} ₸/год
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {recommendations.map((rec, idx) => (
              <div key={idx} style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>{rec.title}:</strong> {rec.detail}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Сетка подписок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Ваши подписки</h2>
        <Link to="/subscriptions" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '14px' }}>
          Смотреть все ({subscriptions.length}) →
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <div className="page-panel" style={{ textAlign: 'center', padding: '48px 20px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            У вас пока нет добавленных подписок
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {onSeedSubscriptions && (
              <Button variant="secondary" disabled={seeding} onClick={handleSeed}>
                {seeding ? 'Загрузка…' : 'Загрузить примеры подписок'}
              </Button>
            )}
            <Link to="/add">
              <Button variant="primary">+ Добавить первую подписку</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {subscriptions.map(sub => (
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
