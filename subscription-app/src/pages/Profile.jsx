import React from 'react';

export default function Profile({ user }) {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Профиль и настройки</h1>
        <p style={{ color: 'var(--text-muted)' }}>Параметры учетной записи и сведения о разработчиках</p>
      </div>

      <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 }}>
            {(user?.name || 'U').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{user?.name || 'Пользователь'}</h2>
            <div style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Команда авторов проекта:</h3>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            <li>Айяна</li>
            <li>Даулет</li>
            <li>Дидар (Zhenis Didar)</li>
            <li>Темирлан</li>
          </ul>
          <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <strong>Преподаватель:</strong> Zhanibek Sydykbek
          </div>
        </div>
      </div>

      <div className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Параметры приложения</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Основная валюта</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Валюта для расчета ежемесячных расходов</div>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>KZT (₸)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Уведомления о списаниях</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Предупреждать за 4 дня до списания</div>
          </div>
          <span className="badge badge-active">Включено</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Unused Subscription Detection</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Анализ и выявление неиспользуемых сервисов</div>
          </div>
          <span className="badge badge-active">Активно</span>
        </div>
      </div>
    </div>
  );
}
