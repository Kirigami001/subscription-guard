import React, { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';

export default function Profile({ user, onUpdateProfile }) {
  const [name, setName] = useState(user?.name || '');
  const [reminderDays, setReminderDays] = useState(String(user?.reminderDays ?? 7));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled ?? true
  );
  const [unusedDetectionEnabled, setUnusedDetectionEnabled] = useState(
    user?.unusedDetectionEnabled ?? true
  );
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setReminderDays(String(user?.reminderDays ?? 7));
    setNotificationsEnabled(user?.notificationsEnabled ?? true);
    setUnusedDetectionEnabled(user?.unusedDetectionEnabled ?? true);
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!onUpdateProfile) return;
    setError('');
    setStatusMsg('');

    if (name.trim().length < 2) {
      setError('Имя должно содержать не менее 2 символов');
      return;
    }
    const days = Number(reminderDays);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      setError('Срок напоминания должен быть от 1 до 30 дней');
      return;
    }

    setBusy(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        reminderDays: days,
        notificationsEnabled,
        unusedDetectionEnabled
      });
      setStatusMsg('Настройки сохранены в SQLite');
    } catch (err) {
      setError(err.message || 'Не удалось сохранить настройки');
    } finally {
      setBusy(false);
    }
  };

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

      <form onSubmit={handleSave} className="page-panel" style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Параметры приложения</h3>

        {error && (
          <div className="error-panel" role="alert" style={{ background: '#FEE2E2', color: 'var(--danger)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {statusMsg && (
          <div role="status" style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {statusMsg}
          </div>
        )}

        <Input
          label="Отображаемое имя"
          name="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          required
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Основная валюта</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Валюта для расчета ежемесячных расходов</div>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>KZT (₸)</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Уведомления о списаниях</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Предупреждать за N дней до списания (1–30)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="number"
              min="1"
              max="30"
              aria-label="Дней до уведомления"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
              className="input-field"
              style={{ width: '76px', padding: '6px 10px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
              />
              {notificationsEnabled ? 'Включено' : 'Выключено'}
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', marginBottom: '16px' }}>
          <div>
            <div style={{ fontWeight: 500 }}>Unused Subscription Detection</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Анализ и выявление неиспользуемых сервисов</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={unusedDetectionEnabled}
              onChange={(e) => setUnusedDetectionEnabled(e.target.checked)}
            />
            {unusedDetectionEnabled ? 'Активно' : 'Отключено'}
          </label>
        </div>

        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Сохранение…' : 'Сохранить настройки'}
        </Button>
      </form>
    </div>
  );
}
