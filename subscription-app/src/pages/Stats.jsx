import React from 'react';

const monthlyAmount = (s) => Number(s.amount) / (s.billingPeriod === 'yearly' ? 12 : 1);

export default function Stats({ subscriptions, insights }) {
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const computedMonthly = activeSubs.reduce((sum, s) => sum + monthlyAmount(s), 0);
  const totalMonthly = insights?.monthlyEquivalent ?? computedMonthly;
  const totalYearly = insights?.yearlyEquivalent ?? computedMonthly * 12;
  const avgSpend = activeSubs.length ? Math.round(totalMonthly / activeSubs.length) : 0;
  const maxSpend = activeSubs.length ? Math.round(Math.max(...activeSubs.map(s => monthlyAmount(s)))) : 0;

  // Группировка по категориям (в месячном эквиваленте)
  const categoryTotals = {};
  activeSubs.forEach(sub => {
    categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + monthlyAmount(sub);
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Аналитика и статистика</h1>
        <p style={{ color: 'var(--text-muted)' }}>Структура расходов и распределение затрат по направлениям</p>
      </div>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="label">Расходы в месяц (эквивалент)</div>
          <div className="value">{Math.round(totalMonthly).toLocaleString()} ₸</div>
          <div className="trend">Регулярные платежи</div>
        </div>
        <div className="metric-card">
          <div className="label">Активных подписок</div>
          <div className="value">{activeSubs.length}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Сервисов на обслуживании</div>
        </div>
        <div className="metric-card">
          <div className="label">Средний месячный расход</div>
          <div className="value">{avgSpend.toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>На одну подписку</div>
        </div>
        <div className="metric-card">
          <div className="label">Максимальный расход в месяц</div>
          <div className="value">{maxSpend.toLocaleString()} ₸</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Максимальный платеж</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Распределение по категориям */}
        <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Расходы по категориям</h3>
          {Object.keys(categoryTotals).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Нет активных подписок для расчёта распределения по категориям.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(categoryTotals).map(([cat, amount]) => {
                const pct = totalMonthly > 0 ? Math.round((amount / totalMonthly) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 500 }}>{cat}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{Math.round(amount).toLocaleString()} ₸ ({pct}%)</span>
                    </div>
                    <div className="chart-track" style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Вместо выдуманной истории — прогноз, рассчитанный по текущим подпискам. */}
        <div className="page-panel" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Прогноз регулярных расходов</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <p>В месяц: <strong>{Math.round(totalMonthly).toLocaleString()} ₸</strong></p>
            <p>В год: <strong>{Math.round(totalYearly).toLocaleString()} ₸</strong></p>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Оценка на основе активных подписок. История фактических списаний не ведётся.
          </p>
        </div>
      </div>
    </div>
  );
}
