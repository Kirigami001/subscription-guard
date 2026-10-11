import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import { categoriesList } from '../data.js';

export default function AddSubscription({ onAddSubscription }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Развлечения',
    amount: '',
    billingPeriod: 'monthly',
    nextPayment: '',
    description: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Укажите название подписки');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('Укажите корректную сумму');
      return;
    }
    if (!formData.nextPayment) {
      setError('Выберите дату следующего списания');
      return;
    }

    onAddSubscription({
      ...formData,
      amount: Number(formData.amount),
      currency: '₸',
      status: 'active',
      unusedWarning: false
    });

    navigate('/subscriptions');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Добавить подписку</h1>
        <p style={{ color: 'var(--text-muted)' }}>Заполните данные для начала отслеживания нового сервиса</p>
      </div>

      <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        {error && (
          <div style={{ background: '#FEE2E2', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Название сервиса"
            name="title"
            placeholder="Например, Netflix, Spotify, Claude"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Стоимость (₸)"
              name="amount"
              type="number"
              placeholder="3490"
              value={formData.amount}
              onChange={handleChange}
              required
            />

            <div className="input-group">
              <label className="input-label">Периодичность *</label>
              <select
                name="billingPeriod"
                value={formData.billingPeriod}
                onChange={handleChange}
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
                value={formData.category}
                onChange={handleChange}
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
              value={formData.nextPayment}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Примечание / Описание</label>
            <textarea
              name="description"
              rows="3"
              className="input-field"
              placeholder="Семейный тариф, привязана карта..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button type="submit" variant="primary" style={{ flex: 1 }}>Сохранить подписку</Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Отмена</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
