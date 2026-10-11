import React, { useState } from 'react';

export default function App() {
  const [subscriptions, setSubscriptions] = useState([
    { id: '1', title: 'Spotify Premium', amount: 1500, currency: 'KZT', category: 'Музыка', nextPayment: '2026-11-01', status: 'ACTIVE' },
    { id: '2', title: 'YouTube Premium', amount: 2700, currency: 'KZT', category: 'Видео', nextPayment: '2026-10-25', status: 'ACTIVE' },
    { id: '3', title: 'GitHub Copilot', amount: 4800, currency: 'KZT', category: 'Разработка', nextPayment: '2026-10-30', status: 'ACTIVE' }
  ]);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Сервисы',
    nextPayment: ''
  });

  const totalMonthly = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + Number(s.amount), 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.nextPayment) return;

    const newSub = {
      id: Date.now().toString(),
      title: form.title,
      amount: Number(form.amount),
      currency: 'KZT',
      category: form.category,
      nextPayment: form.nextPayment,
      status: 'ACTIVE'
    };

    setSubscriptions([...subscriptions, newSub]);
    setForm({ title: '', amount: '', category: 'Сервисы', nextPayment: '' });
  };

  const handleDelete = (id) => {
    setSubscriptions(subscriptions.filter(s => s.id !== id));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: '#111827' }}>🛡️ SubscriptionGuard</h1>
        <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Панель контроля регулярных расходов и подписок</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
          <div style={{ color: '#4b5563', fontSize: '14px' }}>Ежемесячный расход</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{totalMonthly.toLocaleString()} KZT</div>
        </div>
        <div style={{ background: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
          <div style={{ color: '#4b5563', fontSize: '14px' }}>Активные подписки</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{subscriptions.length}</div>
        </div>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
        <input
          type="text"
          placeholder="Название (например, Netflix)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ flex: '1 1 180px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <input
          type="number"
          placeholder="Сумма (KZT)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          style={{ flex: '1 1 120px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <input
          type="date"
          value={form.nextPayment}
          onChange={(e) => setForm({ ...form, nextPayment: e.target.value })}
          style={{ flex: '1 1 140px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
          Добавить
        </button>
      </form>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', color: '#374151' }}>Сервис</th>
              <th style={{ padding: '12px 16px', color: '#374151' }}>Категория</th>
              <th style={{ padding: '12px 16px', color: '#374151' }}>Стоимость</th>
              <th style={{ padding: '12px 16px', color: '#374151' }}>След. платеж</th>
              <th style={{ padding: '12px 16px', color: '#374151', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map(sub => (
              <tr key={sub.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{sub.title}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{sub.category}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{sub.amount.toLocaleString()} {sub.currency}</td>
                <td style={{ padding: '12px 16px', color: '#4b5563' }}>{sub.nextPayment}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <button onClick={() => handleDelete(sub.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
