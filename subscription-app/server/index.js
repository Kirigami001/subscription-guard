import http from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

let DatabaseSync;
try {
  ({ DatabaseSync } = await import('node:sqlite'));
} catch {
  console.error(
    `[SubTrack] Требуется Node.js 22.13+ (или 24+) со встроенным модулем node:sqlite. Текущая версия: ${process.version}.`
  );
  console.error(
    '[SubTrack] На Node 22.5–22.12 можно запустить с флагом: node --experimental-sqlite server/index.js'
  );
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = resolve(process.env.DB_PATH || resolve(__dirname, 'data/subtrack.sqlite'));
const distDir = resolve(__dirname, '../dist');
mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    reminder_days INTEGER NOT NULL DEFAULT 7,
    notifications_enabled INTEGER NOT NULL DEFAULT 1,
    unused_detection_enabled INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT '₸',
    billing_period TEXT NOT NULL,
    next_payment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    description TEXT NOT NULL DEFAULT '',
    brand_color TEXT NOT NULL DEFAULT '#1E3A8A',
    unused_warning INTEGER NOT NULL DEFAULT 0
  );
`);

// Безопасная миграция для существующих БД без новых колонок профиля
const userColumns = new Set(
  db
    .prepare('PRAGMA table_info(users)')
    .all()
    .map((col) => col.name)
);
if (!userColumns.has('reminder_days')) {
  db.exec('ALTER TABLE users ADD COLUMN reminder_days INTEGER NOT NULL DEFAULT 7');
}
if (!userColumns.has('notifications_enabled')) {
  db.exec('ALTER TABLE users ADD COLUMN notifications_enabled INTEGER NOT NULL DEFAULT 1');
}
if (!userColumns.has('unused_detection_enabled')) {
  db.exec('ALTER TABLE users ADD COLUMN unused_detection_enabled INTEGER NOT NULL DEFAULT 1');
}

const q = (sql) => db.prepare(sql);

const COOKIE_NAME = 'subtrack_session';
const SESSION_TTL_MS = 7 * 86400 * 1000;
const ALLOWED_STATUSES = ['active', 'paused', 'cancelled', 'trialing'];
const ALLOWED_PERIODS = ['monthly', 'yearly'];
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT || 30);
const authAttempts = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

const DEMO_TEMPLATES = [
  {
    title: 'Netflix',
    category: 'Развлечения',
    amount: 3490,
    billingPeriod: 'monthly',
    daysAhead: 2,
    status: 'active',
    description: 'Тариф Standard HD, просмотр на 2 экранах одновременно.',
    brandColor: '#E50914',
    unusedWarning: false,
  },
  {
    title: 'Spotify Premium',
    category: 'Музыка',
    amount: 1890,
    billingPeriod: 'monthly',
    daysAhead: 4,
    status: 'active',
    description: 'Индивидуальный тариф без рекламы и с офлайн-режимом.',
    brandColor: '#1DB954',
    unusedWarning: false,
  },
  {
    title: 'YouTube Premium',
    category: 'Развлечения',
    amount: 1250,
    billingPeriod: 'monthly',
    daysAhead: 6,
    status: 'active',
    description: 'Фоновое воспроизведение видео, отключение рекламы и YouTube Music.',
    brandColor: '#FF0000',
    unusedWarning: false,
  },
  {
    title: 'Cloud Storage',
    category: 'Продуктивность',
    amount: 5820,
    billingPeriod: 'monthly',
    daysAhead: 10,
    status: 'active',
    description: '2 ТБ облачного хранилища для бэкапов и учебных файлов.',
    brandColor: '#2563EB',
    unusedWarning: false,
  },
  {
    title: 'GitHub Copilot',
    category: 'Разработка',
    amount: 4800,
    billingPeriod: 'monthly',
    daysAhead: 14,
    status: 'active',
    description: 'ИИ-ассистент для программирования и автодополнения кода.',
    brandColor: '#24292F',
    unusedWarning: false,
  },
  {
    title: 'Adobe Creative Cloud',
    category: 'Дизайн',
    amount: 24500,
    billingPeriod: 'monthly',
    daysAhead: 18,
    status: 'active',
    description: 'Пакет графических программ (Photoshop, Illustrator, Premiere Pro).',
    brandColor: '#FF0000',
    unusedWarning: true,
  },
  {
    title: 'Slack Pro',
    category: 'Связь',
    amount: 3200,
    billingPeriod: 'monthly',
    daysAhead: 22,
    status: 'paused',
    description: 'Корпоративный мессенджер для проектной команды.',
    brandColor: '#4A154B',
    unusedWarning: false,
  },
  {
    title: 'Notion Plus',
    category: 'Продуктивность',
    amount: 3600,
    billingPeriod: 'monthly',
    daysAhead: 26,
    status: 'trialing',
    description: 'Пробный период единого рабочего пространства для заметок и задач.',
    brandColor: '#000000',
    unusedWarning: false,
  },
];

function dateDaysFromToday(days) {
  const d = new Date(Date.now() + days * 86400000);
  return d.toISOString().slice(0, 10);
}

function seedDemoSubscriptionsForUser(userId, onlyIfEmpty = true) {
  const existing = q('SELECT title FROM subscriptions WHERE user_id = ?').all(userId);
  if (onlyIfEmpty && existing.length > 0) {
    return [];
  }
  const existingTitles = new Set(existing.map((r) => r.title.toLowerCase()));
  const insert = q(
    `INSERT INTO subscriptions
      (id, user_id, title, category, amount, currency, billing_period, next_payment, status, description, brand_color, unused_warning)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const createdIds = [];
  for (const tpl of DEMO_TEMPLATES) {
    if (existingTitles.has(tpl.title.toLowerCase())) continue;
    const id = randomUUID();
    insert.run(
      id,
      userId,
      tpl.title,
      tpl.category,
      tpl.amount,
      '₸',
      tpl.billingPeriod,
      dateDaysFromToday(tpl.daysAhead),
      tpl.status,
      tpl.description,
      tpl.brandColor,
      tpl.unusedWarning ? 1 : 0
    );
    createdIds.push(id);
  }

  return q('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_payment ASC')
    .all(userId)
    .map(subRow);
}

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

function verifyPassword(password, stored) {
  try {
    const [salt, expectedHex] = stored.split(':');
    if (!salt || !expectedHex) return false;
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function checkRateLimit(req, scope) {
  const now = Date.now();
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || req.socket.remoteAddress || 'local';
  const key = `${ip}:${scope}`;

  if (authAttempts.size > 500) {
    for (const [k, entry] of authAttempts) {
      if (now > entry.resetAt) authAttempts.delete(k);
    }
  }

  const current = authAttempts.get(key);
  if (!current || now > current.resetAt) {
    authAttempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= RATE_LIMIT_MAX;
}

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...headers,
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > 30000) {
      throw new Error('Слишком большой запрос');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  const parsed = raw ? JSON.parse(raw) : {};
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SyntaxError('Ожидался JSON-объект');
  }
  return parsed;
}

function extractSessionToken(req) {
  const match = /(?:^|;\s*)subtrack_session=([^;]+)/.exec(req.headers.cookie || '');
  return match ? match[1] : null;
}

function userPayload(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    reminderDays: Number(row.reminder_days ?? 7),
    notificationsEnabled: Boolean(row.notifications_enabled ?? 1),
    unusedDetectionEnabled: Boolean(row.unused_detection_enabled ?? 1),
  };
}

function getUser(req) {
  const token = extractSessionToken(req);
  if (!token) return null;
  const now = Date.now();
  const row = q(
    `SELECT users.id, users.name, users.email, users.reminder_days, users.notifications_enabled, users.unused_detection_enabled
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE token_hash = ? AND expires_at > ?`
  ).get(hashToken(token), now);
  return row ? userPayload(row) : null;
}

function buildCookie(req, token, maxAgeSeconds) {
  const isHttps =
    req.socket?.encrypted ||
    String(req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https';
  const secureFlag = process.env.NODE_ENV === 'production' || isHttps ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}${secureFlag}`;
}

function subRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: row.amount,
    currency: row.currency,
    billingPeriod: row.billing_period,
    nextPayment: row.next_payment,
    status: row.status,
    description: row.description,
    brandColor: row.brand_color,
    unusedWarning: Boolean(row.unused_warning),
  };
}

function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const parsed = new Date(`${dateStr}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateStr;
}

function validateSub(d) {
  const title = String(d.title || '').trim();
  const amount = Number(d.amount);
  if (
    !title ||
    title.length > 120 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1e9 ||
    !isValidCalendarDate(d.nextPayment) ||
    !ALLOWED_PERIODS.includes(d.billingPeriod)
  ) {
    return 'Проверьте название, стоимость, дату и период подписки';
  }
  return null;
}

function advanceDate(dateStr, billingPeriod) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetYear = billingPeriod === 'yearly' ? y + 1 : y + Math.floor(m / 12);
  const targetMonth = billingPeriod === 'yearly' ? m : (m % 12) + 1;
  const maxDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(d, maxDay);
  return `${String(targetYear).padStart(4, '0')}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

function escapeCsvCell(value) {
  let str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function createSession(userId) {
  const now = Date.now();
  q('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  const token = randomBytes(32).toString('hex');
  q('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    userId,
    now + SESSION_TTL_MS
  );
  return token;
}

function computeInsights(user) {
  const allSubs = q('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_payment ASC').all(
    user.id
  );
  const activeSubs = allSubs.filter((s) => s.status === 'active');
  const monthlyEquivalent = activeSubs.reduce(
    (sum, s) => sum + s.amount / (s.billing_period === 'yearly' ? 12 : 1),
    0
  );

  const reminderWindow = user.notificationsEnabled ? Math.max(1, Math.min(30, user.reminderDays)) : 0;
  const todayUtcStr = new Date().toISOString().slice(0, 10);
  const todayMs = Date.parse(`${todayUtcStr}T00:00:00Z`);

  const upcoming = [];
  if (reminderWindow > 0) {
    for (const s of activeSubs) {
      const paymentMs = Date.parse(`${s.next_payment}T00:00:00Z`);
      if (!Number.isFinite(paymentMs)) continue;
      const days = Math.round((paymentMs - todayMs) / 86400000);
      if (days >= 0 && days <= reminderWindow) {
        upcoming.push({
          id: s.id,
          title: s.title,
          nextPayment: s.next_payment,
          daysLeft: days,
          amount: s.amount,
          currency: s.currency,
          billingPeriod: s.billing_period,
        });
      }
    }
  }

  const upcomingTotal = upcoming.reduce((sum, item) => sum + Number(item.amount), 0);

  // Потенциальная экономия по неиспользуемым подпискам
  const unusedActive = user.unusedDetectionEnabled
    ? activeSubs.filter((s) => Boolean(s.unused_warning))
    : [];
  const potentialMonthlySavings = unusedActive.reduce(
    (sum, s) => sum + s.amount / (s.billing_period === 'yearly' ? 12 : 1),
    0
  );

  // Категории с сортировкой по убыванию расходов
  const categoryMap = new Map();
  for (const s of activeSubs) {
    const monthly = s.amount / (s.billing_period === 'yearly' ? 12 : 1);
    const prev = categoryMap.get(s.category) || { category: s.category, monthlyTotal: 0, count: 0 };
    prev.monthlyTotal += monthly;
    prev.count += 1;
    categoryMap.set(s.category, prev);
  }
  const byCategory = [...categoryMap.values()]
    .map((item) => ({
      category: item.category,
      count: item.count,
      monthlyTotal: Math.round(item.monthlyTotal * 100) / 100,
      yearlyTotal: Math.round(item.monthlyTotal * 1200) / 100,
      sharePercent:
        monthlyEquivalent > 0 ? Math.round((item.monthlyTotal / monthlyEquivalent) * 100) : 0,
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  // Практичные рекомендации на основе SQLite-данных
  const recommendations = [];
  if (unusedActive.length > 0) {
    const names = unusedActive.map((s) => s.title).join(', ');
    recommendations.push({
      type: 'warning',
      title: `Неиспользуемые подписки (${unusedActive.length})`,
      detail: `Сервисы ${names} отмечены как редко используемые. Отмена сэкономит до ${Math.round(potentialMonthlySavings * 12).toLocaleString()} ₸/год.`,
    });
  }

  for (const cat of byCategory) {
    if (cat.count >= 2) {
      recommendations.push({
        type: 'info',
        title: `Несколько сервисов в категории «${cat.category}»`,
        detail: `У вас ${cat.count} активных подписок на сумму ${Math.round(cat.monthlyTotal).toLocaleString()} ₸/мес — проверьте, нет ли дублирующих функций.`,
      });
    }
  }

  if (upcoming.length > 0) {
    const urgent = upcoming.filter((u) => u.daysLeft <= 3);
    if (urgent.length > 0) {
      recommendations.push({
        type: 'alert',
        title: 'Срочное списание в ближайшие 3 дня',
        detail: `${urgent.map((u) => `${u.title} (${u.nextPayment})`).join(', ')} — на сумму ${Math.round(urgent.reduce((t, u) => t + u.amount, 0)).toLocaleString()} ₸.`,
      });
    }
  }

  const trialingCount = allSubs.filter((s) => s.status === 'trialing').length;
  if (trialingCount > 0) {
    recommendations.push({
      type: 'info',
      title: `Пробные периоды (${trialingCount})`,
      detail: 'Проверьте даты окончания пробных подписок, чтобы избежать неожиданного автосписания.',
    });
  }

  return {
    monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
    yearlyEquivalent: Math.round(monthlyEquivalent * 1200) / 100,
    reminderDays: reminderWindow,
    upcoming,
    upcomingTotal: Math.round(upcomingTotal * 100) / 100,
    unusedCount: unusedActive.length,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    potentialYearlySavings: Math.round(potentialMonthlySavings * 1200) / 100,
    byCategory,
    recommendations,
  };
}

function tryServeStatic(req, res, pathname) {
  if (!existsSync(resolve(distDir, 'index.html'))) {
    if (pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        '<!doctype html><html lang="ru"><meta charset="utf-8"><title>SubTrack API</title>' +
          '<body style="font-family:sans-serif;padding:32px">' +
          '<h1>SubTrack Backend работает</h1>' +
          '<p>API доступен по <code>/api/health</code>. Для разработки откройте Vite на <code>http://localhost:5173</code> или выполните <code>npm run build</code> для раздачи фронтенда на этом порту.</p>' +
          '</body></html>'
      );
      return true;
    }
    return false;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false;
  }

  const safePath = pathname === '/' ? '/index.html' : pathname;
  let candidate = resolve(distDir, `.${safePath}`);
  if (!candidate.startsWith(distDir + sep) && candidate !== distDir) {
    return false;
  }

  let fileToServe = candidate;
  if (!existsSync(fileToServe) || statSync(fileToServe).isDirectory()) {
    // SPA fallback для клиентских маршрутов (/login, /subscriptions, /stats и т.д.)
    if (extname(safePath)) {
      return false;
    }
    fileToServe = resolve(distDir, 'index.html');
  }

  const ext = extname(fileToServe).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheControl =
    fileToServe.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'same-origin',
  });
  if (req.method === 'HEAD') {
    res.end();
  } else {
    res.end(readFileSync(fileToServe));
  }
  return true;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost');
  const path = parsedUrl.pathname;

  try {
    if (!path.startsWith('/api/')) {
      if (tryServeStatic(req, res, path)) return;
      return send(res, 404, { error: 'Страница не найдена' });
    }

    if (path === '/api/health' && req.method === 'GET') {
      return send(res, 200, {
        ok: true,
        database: 'sqlite',
        uptimeSec: Math.round(process.uptime()),
      });
    }

    if (path === '/api/auth/register' && req.method === 'POST') {
      if (!checkRateLimit(req, 'auth')) {
        return send(res, 429, {
          error: 'Слишком много попыток. Повторите через несколько минут.',
        });
      }
      const d = await readBody(req);
      const email = String(d.email || '').trim().toLowerCase();
      const name = String(d.name || '').trim();
      const password = String(d.password || '');

      if (
        name.length < 2 ||
        name.length > 100 ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        email.length > 254 ||
        password.length < 8 ||
        password.length > 128
      ) {
        return send(res, 400, { error: 'Введите имя, email и пароль от 8 символов' });
      }

      if (q('SELECT id FROM users WHERE email = ?').get(email)) {
        return send(res, 409, { error: 'Такой аккаунт уже существует' });
      }

      const id = randomUUID();
      q('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)').run(
        id,
        name,
        email,
        hashPassword(password)
      );

      // Стартовые примеры подписок сразу сохраняются в SQLite нового пользователя
      seedDemoSubscriptionsForUser(id, true);

      const createdUser = q(
        'SELECT id, name, email, reminder_days, notifications_enabled, unused_detection_enabled FROM users WHERE id = ?'
      ).get(id);
      const token = createSession(id);
      return send(
        res,
        201,
        { user: userPayload(createdUser) },
        { 'Set-Cookie': buildCookie(req, token, 604800) }
      );
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
      if (!checkRateLimit(req, 'auth')) {
        return send(res, 429, {
          error: 'Слишком много попыток входа. Повторите через несколько минут.',
        });
      }
      const d = await readBody(req);
      const email = String(d.email || '').trim().toLowerCase();
      const password = String(d.password || '');
      const user = q('SELECT * FROM users WHERE email = ?').get(email);

      if (!user || !verifyPassword(password, user.password_hash)) {
        return send(res, 401, { error: 'Неверная почта или пароль' });
      }

      const token = createSession(user.id);
      return send(
        res,
        200,
        { user: userPayload(user) },
        { 'Set-Cookie': buildCookie(req, token, 604800) }
      );
    }

    if (path === '/api/auth/logout' && req.method === 'POST') {
      const token = extractSessionToken(req);
      if (token) {
        q('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      }
      return send(res, 200, { ok: true }, { 'Set-Cookie': buildCookie(req, '', 0) });
    }

    if (path === '/api/auth/me' && req.method === 'GET') {
      const user = getUser(req);
      return user ? send(res, 200, { user }) : send(res, 401, { error: 'Не авторизован' });
    }

    const user = getUser(req);
    if (!user) {
      return send(res, 401, { error: 'Требуется вход' });
    }

    if (path === '/api/profile' && req.method === 'PATCH') {
      const d = await readBody(req);
      const nextName =
        d.name !== undefined ? String(d.name).trim() : user.name;
      if (nextName.length < 2 || nextName.length > 100) {
        return send(res, 400, { error: 'Имя должно содержать от 2 до 100 символов' });
      }
      const nextReminderDays =
        d.reminderDays !== undefined ? Number(d.reminderDays) : user.reminderDays;
      if (!Number.isInteger(nextReminderDays) || nextReminderDays < 1 || nextReminderDays > 30) {
        return send(res, 400, { error: 'Срок уведомления должен быть от 1 до 30 дней' });
      }
      const nextNotifications =
        d.notificationsEnabled !== undefined
          ? Boolean(d.notificationsEnabled)
          : user.notificationsEnabled;
      const nextUnusedDetection =
        d.unusedDetectionEnabled !== undefined
          ? Boolean(d.unusedDetectionEnabled)
          : user.unusedDetectionEnabled;

      q(
        'UPDATE users SET name = ?, reminder_days = ?, notifications_enabled = ?, unused_detection_enabled = ? WHERE id = ?'
      ).run(
        nextName,
        nextReminderDays,
        nextNotifications ? 1 : 0,
        nextUnusedDetection ? 1 : 0,
        user.id
      );

      const updated = q(
        'SELECT id, name, email, reminder_days, notifications_enabled, unused_detection_enabled FROM users WHERE id = ?'
      ).get(user.id);
      return send(res, 200, { user: userPayload(updated) });
    }

    if (path === '/api/subscriptions' && req.method === 'GET') {
      const statusFilter = parsedUrl.searchParams.get('status');
      const categoryFilter = parsedUrl.searchParams.get('category');
      const searchFilter = parsedUrl.searchParams.get('search')?.trim().toLowerCase();

      let rows = q('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_payment ASC').all(
        user.id
      );
      if (statusFilter && statusFilter !== 'all') {
        rows = rows.filter((r) => r.status === statusFilter);
      }
      if (categoryFilter && categoryFilter !== 'Все') {
        rows = rows.filter((r) => r.category === categoryFilter);
      }
      if (searchFilter) {
        rows = rows.filter((r) => r.title.toLowerCase().includes(searchFilter));
      }

      return send(res, 200, { subscriptions: rows.map(subRow) });
    }

    if (path === '/api/subscriptions' && req.method === 'POST') {
      const d = await readBody(req);
      const error = validateSub(d);
      if (error) {
        return send(res, 400, { error });
      }

      const id = randomUUID();
      const status = ['active', 'paused', 'trialing'].includes(d.status) ? d.status : 'active';
      const brandColor =
        typeof d.brandColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(d.brandColor)
          ? d.brandColor
          : '#1E3A8A';
      const unusedWarning = d.unusedWarning ? 1 : 0;

      q(
        `INSERT INTO subscriptions
          (id, user_id, title, category, amount, currency, billing_period, next_payment, status, description, brand_color, unused_warning)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        user.id,
        d.title.trim(),
        String(d.category || 'Другое').trim().slice(0, 80) || 'Другое',
        Number(d.amount),
        '₸',
        d.billingPeriod,
        d.nextPayment,
        status,
        String(d.description || '').slice(0, 2000),
        brandColor,
        unusedWarning
      );

      const created = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
        id,
        user.id
      );
      return send(res, 201, { subscription: subRow(created) });
    }

    if (path === '/api/subscriptions/seed' && req.method === 'POST') {
      const subscriptions = seedDemoSubscriptionsForUser(user.id, false);
      return send(res, 201, { subscriptions });
    }

    if (path === '/api/subscriptions/export' && req.method === 'GET') {
      const rows = q('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_payment ASC').all(
        user.id
      );
      const header = ['Название', 'Категория', 'Сумма', 'Валюта', 'Период', 'След. списание', 'Статус', 'Редко используется', 'Описание'];
      const lines = [
        header.map(escapeCsvCell).join(';'),
        ...rows.map((r) =>
          [
            r.title,
            r.category,
            r.amount,
            r.currency,
            r.billing_period === 'yearly' ? 'Ежегодно' : 'Ежемесячно',
            r.next_payment,
            r.status,
            r.unused_warning ? 'Да' : 'Нет',
            r.description,
          ]
            .map(escapeCsvCell)
            .join(';')
        ),
      ];
      const csvBody = '\uFEFF' + lines.join('\r\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="subtrack-subscriptions.csv"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(csvBody);
      return;
    }

    const renewMatch = path.match(/^\/api\/subscriptions\/([a-f0-9-]+)\/renew$/);
    if (renewMatch && req.method === 'POST') {
      const subId = renewMatch[1];
      const existing = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
        subId,
        user.id
      );
      if (!existing) {
        return send(res, 404, { error: 'Подписка не найдена' });
      }
      const nextDate = advanceDate(existing.next_payment, existing.billing_period);
      q('UPDATE subscriptions SET next_payment = ?, status = ? WHERE id = ? AND user_id = ?').run(
        nextDate,
        existing.status === 'cancelled' ? 'active' : existing.status,
        subId,
        user.id
      );
      const updated = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
        subId,
        user.id
      );
      return send(res, 200, { subscription: subRow(updated) });
    }

    const match = path.match(/^\/api\/subscriptions\/([a-f0-9-]+)$/);
    if (match) {
      const subId = match[1];

      if (req.method === 'GET') {
        const existing = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
          subId,
          user.id
        );
        return existing
          ? send(res, 200, { subscription: subRow(existing) })
          : send(res, 404, { error: 'Подписка не найдена' });
      }

      if (req.method === 'PATCH') {
        const existing = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
          subId,
          user.id
        );
        if (!existing) {
          return send(res, 404, { error: 'Подписка не найдена' });
        }

        const d = await readBody(req);
        const merged = {
          title: d.title !== undefined ? String(d.title).trim() : existing.title,
          category:
            d.category !== undefined
              ? String(d.category || 'Другое').trim().slice(0, 80) || 'Другое'
              : existing.category,
          amount: d.amount !== undefined ? Number(d.amount) : existing.amount,
          billingPeriod:
            d.billingPeriod !== undefined ? d.billingPeriod : existing.billing_period,
          nextPayment: d.nextPayment !== undefined ? d.nextPayment : existing.next_payment,
          status: d.status !== undefined ? d.status : existing.status,
          description:
            d.description !== undefined
              ? String(d.description || '').slice(0, 2000)
              : existing.description,
          unusedWarning:
            d.unusedWarning !== undefined
              ? Boolean(d.unusedWarning)
              : Boolean(existing.unused_warning),
          brandColor:
            typeof d.brandColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(d.brandColor)
              ? d.brandColor
              : existing.brand_color,
        };

        if (!ALLOWED_STATUSES.includes(merged.status)) {
          return send(res, 400, { error: 'Недопустимый статус' });
        }

        const validationError = validateSub(merged);
        if (validationError) {
          return send(res, 400, { error: validationError });
        }

        q(
          `UPDATE subscriptions
           SET title = ?, category = ?, amount = ?, billing_period = ?, next_payment = ?, status = ?, description = ?, brand_color = ?, unused_warning = ?
           WHERE id = ? AND user_id = ?`
        ).run(
          merged.title,
          merged.category,
          merged.amount,
          merged.billingPeriod,
          merged.nextPayment,
          merged.status,
          merged.description,
          merged.brandColor,
          merged.unusedWarning ? 1 : 0,
          subId,
          user.id
        );

        const updated = q('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?').get(
          subId,
          user.id
        );
        return send(res, 200, { subscription: subRow(updated) });
      }

      if (req.method === 'DELETE') {
        const result = q('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').run(
          subId,
          user.id
        );
        return result.changes
          ? send(res, 200, { ok: true })
          : send(res, 404, { error: 'Подписка не найдена' });
      }
    }

    if (path === '/api/insights' && req.method === 'GET') {
      return send(res, 200, computeInsights(user));
    }

    return send(res, 404, { error: 'Маршрут не найден' });
  } catch (err) {
    if (err instanceof SyntaxError || err.message === 'Слишком большой запрос') {
      return send(res, 400, { error: 'Некорректный запрос' });
    }
    console.error(err);
    return send(res, 500, { error: 'Ошибка сервера' });
  }
});

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3001);
server.listen(port, host, () => {
  console.log(`SubTrack API: http://${host}:${port}`);
});
