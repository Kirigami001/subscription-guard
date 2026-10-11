import React from 'react';

export default function Stats({ subscriptions }) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = activeSubs.reduce((sum, s) => sum + s.amount, 0);
  const avgSpend = activeSubs.length ? Math.round(totalMonthly / activeSubs.length) : 0;
  const maxSpend = activeSubs.length ? Math.max(...activeSubs.map(s => s.amount)) : 0;

  // Группировка по категориям
  const categoryTotals = {};
  activeSubs.forEach(sub => {
    categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + sub.amount;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Аналитика и статистика</h1>
        <p style={{ color: 'var(--text-muted)' }}>Структура расходов и распределение затрат по направлениям</p>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="label">Всего потрачено в месяц</div>
          <div className="value">{totalMonthly.toLocaleString()} ₸</div>
          <div className="trend">Регулярные платежи</div>
        </div>
        <div className="metric-card">
          <div className="label">Активных подписок</div>
          <div className="value">{activeSubs.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Сервисов на обслуживании</div>
        </div>
        <div className="metric-card">
          <div className="label">Средний чек сервиса</div>
          <div className="value">{avgSpend.toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>На одну подписку</div>
        </div>
        <div className="metric-card">
          <div className="label">Самая дорогая подписка</div>
          <div className="value">{maxSpend.toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Максимальный платеж</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Распределение по категориям */}
        <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Расходы по категориям</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const pct = totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 500 }}>{cat}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{amount.toLocaleString()} ₸ ({pct}%)</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Динамика за полгода */}
        <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Динамика расходов (мес.)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', gap: '12px' }}>
            {[
              { m: 'Май', v: 38000 },
              { m: 'Июн', v: 42000 },
              { m: 'Июл', v: 41500 },
              { m: 'Авг', v: 45000 },
              { m: 'Сен', v: 44000 },
              { m: 'Окт', v: totalMonthly }
            ].map(item => {
              const maxV = 60000;
              const h = Math.round((item.v / maxV) * 140);
              return (
                <div key={item.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.round(item.v / 1000)}k</div>
                  <div style={{ width: '100%', maxWidth: '36px', height: `${h}px`, background: item.m === 'Окт' ? 'var(--primary)' : '#93C5FD', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{item.m}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
