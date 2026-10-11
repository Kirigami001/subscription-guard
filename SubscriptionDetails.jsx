import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';

export default function SubscriptionDetails({ subscriptions, onCancelSubscription, onTogglePause }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const sub = subscriptions.find(s => s.id === id);

  if (!sub) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Подписка не найдена</h2>
        <Button variant="primary" onClick={() => navigate('/subscriptions')} style={{ marginTop: '16px' }}>
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const yearlyTotal = sub.billingPeriod === 'monthly' ? sub.amount * 12 : sub.amount;

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '16px', fontWeight: 500 }}
      >
        ← Назад к списку
      </button>

      <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div className="card-icon" style={{ backgroundColor: sub.brandColor || '#1E3A8A', width: '56px', height: '56px', fontSize: '24px' }}>
            {sub.title[0]}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{sub.title}</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{sub.category}</span>
          </div>
          <span className={`badge badge-${sub.status}`} style={{ marginLeft: 'auto', fontSize: '14px', padding: '6px 14px' }}>
            {sub.status === 'active' ? 'Активна' : sub.status === 'paused' ? 'На паузе' : sub.status}
          </span>
        </div>

        {sub.unusedWarning && (
          <div className="alert-warning" style={{ marginBottom: '24px' }}>
            <strong>Внимание (Unused Detection):</strong> По данным аналитики, вы редко пользовались этой подпиской за последний месяц. Отмена подписки сэкономит вам <strong>{yearlyTotal.toLocaleString()} ₸</strong> в год.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '24px 0', background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Стоимость за период</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
              {sub.amount.toLocaleString()} {sub.currency}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Период: {sub.billingPeriod === 'monthly' ? 'Каждый месяц' : 'Раз в год'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Годовые затраты</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
              {yearlyTotal.toLocaleString()} {sub.currency}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              След. списание: {sub.nextPayment}
            </div>
          </div>
        </div>

        {sub.description && (
          <div style={{ marginBottom: '28px' }}>
            <h4 style={{ fontSize: '15px', marginBottom: '8px', color: 'var(--text)' }}>Описание</h4>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{sub.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <Button variant="secondary" onClick={() => onTogglePause(sub.id)}>
            {sub.status === 'paused' ? 'Возобновить' : 'Приостановить'}
          </Button>
          <Button variant="danger" onClick={() => { onCancelSubscription(sub.id); navigate('/subscriptions'); }}>
            Отменить подписку
          </Button>
        </div>
      </div>
    </div>
  );
}
