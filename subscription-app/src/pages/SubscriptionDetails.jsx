import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import { categoriesList } from '../data.js';

export default function SubscriptionDetails({
  subscriptions,
  onUpdateSubscription,
  onRenewSubscription,
  onCancelSubscription,
  onTogglePause,
  onDeleteSubscription
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [form, setForm] = useState(null);

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

  const statusMap = {
    active: 'Активна',
    paused: 'На паузе',
    trialing: 'Пробная',
    cancelled: 'Отменена'
  };

  const yearlyTotal = sub.billingPeriod === 'monthly' ? sub.amount * 12 : sub.amount;

  const startEdit = () => {
    setEditError('');
    setForm({
      title: sub.title,
      category: sub.category,
      amount: String(sub.amount),
      billingPeriod: sub.billingPeriod,
      nextPayment: sub.nextPayment,
      description: sub.description || '',
      unusedWarning: Boolean(sub.unusedWarning)
    });
    setEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!form.title.trim()) {
      setEditError('Укажите название подписки');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setEditError('Укажите корректную сумму');
      return;
    }
    if (!form.nextPayment) {
      setEditError('Выберите дату списания');
      return;
    }

    setBusy(true);
    try {
      await onUpdateSubscription(sub.id, {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        billingPeriod: form.billingPeriod,
        nextPayment: form.nextPayment,
        description: form.description,
        unusedWarning: form.unusedWarning
      });
      setEditing(false);
    } catch (err) {
      setEditError(err.message || 'Не удалось сохранить изменения');
    } finally {
      setBusy(false);
    }
  };

  const handleRenew = async () => {
    if (!onRenewSubscription) return;
    setBusy(true);
    try {
      await onRenewSubscription(sub.id);
    } finally {
      setBusy(false);
    }
  };

  const handleTogglePause = async () => {
    setBusy(true);
    try {
      await onTogglePause(sub.id);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      await onCancelSubscription(sub.id);
      navigate('/subscriptions');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDeleteSubscription(sub.id);
      navigate('/subscriptions');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/subscriptions')}
        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '16px', fontWeight: 500 }}
      >
        ← Назад к списку
      </button>

      <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div className="card-icon" style={{ backgroundColor: sub.brandColor || '#1E3A8A', width: '56px', height: '56px', fontSize: '24px' }}>
            {sub.title ? sub.title[0].toUpperCase() : 'S'}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{sub.title}</h1>
            <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{sub.category}</span>
          </div>
          <span className={`badge badge-${sub.status}`} style={{ marginLeft: 'auto', fontSize: '14px', padding: '6px 14px' }}>
            {statusMap[sub.status] || sub.status}
          </span>
        </div>

        {sub.unusedWarning && !editing && (
          <div className="alert-warning" style={{ marginBottom: '24px' }}>
            <strong>Внимание (Unused Detection):</strong> По данным аналитики, вы редко пользовались этой подпиской за последний месяц. Отмена подписки сэкономит вам <strong>{yearlyTotal.toLocaleString()} ₸</strong> в год.
          </div>
        )}

        {editing && form ? (
          <form onSubmit={handleSaveEdit} style={{ marginTop: '16px' }}>
            {editError && (
              <div className="error-panel" role="alert" style={{ background: '#FEE2E2', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {editError}
              </div>
            )}
            <Input
              label="Название сервиса"
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Стоимость (₸)"
                name="amount"
                type="number"
                min="1"
                step="any"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <div className="input-group">
                <label className="input-label">Периодичность *</label>
                <select
                  name="billingPeriod"
                  value={form.billingPeriod}
                  onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
                  className="input-field"
                >
                  <option value="monthly">Ежемесячно</option>
                  <option value="yearly">Ежегодно</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Категория *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  {categoriesList.filter(c => c !== 'Все').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Дата след. списания"
                name="nextPayment"
                type="date"
                value={form.nextPayment}
                onChange={(e) => setForm({ ...form, nextPayment: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label className="input-label">Описание</label>
              <textarea
                rows="3"
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.unusedWarning}
                onChange={(e) => setForm({ ...form, unusedWarning: e.target.checked })}
              />
              Отметить как редко используемую подписку
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button type="submit" variant="primary" disabled={busy}>
                {busy ? 'Сохранение…' : 'Сохранить изменения'}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(false)}>
                Отмена
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="soft-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', margin: '24px 0', background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Стоимость за период</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
                  {Number(sub.amount).toLocaleString()} {sub.currency}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Период: {sub.billingPeriod === 'monthly' ? 'Каждый месяц' : 'Раз в год'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Годовые затраты</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>
                  {Number(yearlyTotal).toLocaleString()} {sub.currency}
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
              {onUpdateSubscription && (
                <Button variant="outline" disabled={busy} onClick={startEdit}>
                  Редактировать
                </Button>
              )}
              {onRenewSubscription && (
                <Button variant="primary" disabled={busy} onClick={handleRenew}>
                  Оплачено (+1 {sub.billingPeriod === 'yearly' ? 'год' : 'мес'})
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={handleTogglePause}>
                {sub.status === 'paused' || sub.status === 'cancelled' ? 'Возобновить' : 'Приостановить'}
              </Button>
              {sub.status !== 'cancelled' && (
                <Button variant="danger" disabled={busy} onClick={handleCancel}>
                  Отменить подписку
                </Button>
              )}
              {onDeleteSubscription && (
                <Button
                  variant="outline"
                  disabled={busy}
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  onClick={handleDelete}
                >
                  Удалить подписку
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
