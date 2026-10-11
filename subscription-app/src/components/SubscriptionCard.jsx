import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';

export default function SubscriptionCard({ subscription, onCancel }) {
  const { id, title, category, amount, currency, billingPeriod, nextPayment, status, brandColor, unusedWarning } = subscription;

  const statusMap = {
    active: 'Активна',
    paused: 'На паузе',
    trialing: 'Пробная',
    cancelled: 'Отменена'
  };

  return (
    <div className="card">
      <div>
        <div className="card-header">
          <div className="card-icon" style={{ backgroundColor: brandColor || '#1E3A8A' }}>
            {title ? title[0].toUpperCase() : 'S'}
          </div>
          <div className="card-title-group">
            <h3>{title}</h3>
            <span className="card-category">{category}</span>
          </div>
          <span className={`badge badge-${status}`} style={{ marginLeft: 'auto' }}>
            {statusMap[status] || status}
          </span>
        </div>

        {unusedWarning && (
          <div className="alert-warning" style={{ padding: '6px 10px', fontSize: '12px', marginBottom: '10px' }}>
            ⚠️ Редко используется
          </div>
        )}

        <div className="card-price">
          {amount.toLocaleString()} {currency} <span>/ {billingPeriod === 'monthly' ? 'мес' : 'год'}</span>
        </div>

        <div className="card-next-date">
          Списание: <strong>{nextPayment}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <Link to={`/subscription/${id}`} style={{ flex: 1, textDecoration: 'none' }}>
          <Button variant="outline" style={{ width: '100%' }}>Детали</Button>
        </Link>
        {status === 'active' && onCancel && (
          <Button variant="danger" onClick={() => onCancel(id)}>Отменить</Button>
        )}
      </div>
    </div>
  );
}
