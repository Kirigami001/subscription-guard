import http from 'node:http';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
mkdirSync(dirname(dbFile), { recursive: true });

const db = new DatabaseSync(dbFile);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
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

const q = (sql) => db.prepare(sql);

const COOKIE_NAME = 'subtrack_session';
const SESSION_TTL_MS = 7 * 86400 * 1000;
const ALLOWED_STATUSES = ['active', 'paused', 'cancelled', 'trialing'];
const ALLOWED_PERIODS = ['monthly', 'yearly'];

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

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
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

function getUser(req) {
  const token = extractSessionToken(req);
  if (!token) return null;
  const now = Date.now();
  return (
    q(
      'SELECT users.id, users.name, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?'
    ).get(hashToken(token), now) || null
  );
}

function buildCookie(token, maxAgeSeconds) {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
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

const server = http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  try {
    if (path === '/api/health' && req.method === 'GET') {
      return send(res, 200, { ok: true, database: 'sqlite' });
    }

    if (path === '/api/auth/register' && req.method === 'POST') {
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
      const token = createSession(id);
      return send(
        res,
        201,
        { user: { id, name, email } },
        { 'Set-Cookie': buildCookie(token, 604800) }
      );
    }

    if (path === '/api/auth/login' && req.method === 'POST') {
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
        { user: { id: user.id, name: user.name, email: user.email } },
        { 'Set-Cookie': buildCookie(token, 604800) }
      );
    }

    if (path === '/api/auth/logout' && req.method === 'POST') {
      const token = extractSessionToken(req);
      if (token) {
        q('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
      }
      return send(res, 200, { ok: true }, { 'Set-Cookie': buildCookie('', 0) });
    }

    if (path === '/api/auth/me' && req.method === 'GET') {
      const user = getUser(req);
      return user
        ? send(res, 200, { user })
        : send(res, 401, { error: 'Не авторизован' });
    }

    const user = getUser(req);
    if (!user) {
      return send(res, 401, { error: 'Требуется вход' });
    }

    if (path === '/api/subscriptions' && req.method === 'GET') {
      const rows = q(
        'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY next_payment ASC'
      ).all(user.id);
      return send(res, 200, { subscriptions: rows.map(subRow) });
    }

    if (path === '/api/subscriptions' && req.method === 'POST') {
      const d = await readBody(req);
      const error = validateSub(d);
      if (error) {
        return send(res, 400, { error });
      }

      const id = randomUUID();
      const status = ['active', 'paused', 'trialing'].includes(d.status)
        ? d.status
        : 'active';
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

    const match = path.match(/^\/api\/subscriptions\/([a-f0-9-]+)$/);
    if (match) {
      const subId = match[1];

      if (req.method === 'GET') {
        const existing = q(
          'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
        ).get(subId, user.id);
        return existing
          ? send(res, 200, { subscription: subRow(existing) })
          : send(res, 404, { error: 'Подписка не найдена' });
      }

      if (req.method === 'PATCH') {
        const existing = q(
          'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
        ).get(subId, user.id);
        if (!existing) {
          return send(res, 404, { error: 'Подписка не найдена' });
        }

        const d = await readBody(req);
        if (!ALLOWED_STATUSES.includes(d.status)) {
          return send(res, 400, { error: 'Недопустимый статус' });
        }

        q('UPDATE subscriptions SET status = ? WHERE id = ? AND user_id = ?').run(
          d.status,
          subId,
          user.id
        );
        const updated = q(
          'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?'
        ).get(subId, user.id);
        return send(res, 200, { subscription: subRow(updated) });
      }

      if (req.method === 'DELETE') {
        const result = q(
          'DELETE FROM subscriptions WHERE id = ? AND user_id = ?'
        ).run(subId, user.id);
        return result.changes
          ? send(res, 200, { ok: true })
          : send(res, 404, { error: 'Подписка не найдена' });
      }
    }

    if (path === '/api/insights' && req.method === 'GET') {
      const subs = q(
        "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY next_payment ASC"
      ).all(user.id);

      const monthly = subs.reduce(
        (sum, s) => sum + s.amount / (s.billing_period === 'yearly' ? 12 : 1),
        0
      );

      const todayUtcStr = new Date().toISOString().slice(0, 10);
      const todayMs = Date.parse(`${todayUtcStr}T00:00:00Z`);

      const upcoming = subs
        .filter((s) => {
          const paymentMs = Date.parse(`${s.next_payment}T00:00:00Z`);
          if (!Number.isFinite(paymentMs)) return false;
          const days = Math.round((paymentMs - todayMs) / 86400000);
          return days >= 0 && days <= 7;
        })
        .map((s) => ({
          id: s.id,
          title: s.title,
          nextPayment: s.next_payment,
          amount: s.amount,
          currency: s.currency,
          billingPeriod: s.billing_period,
        }));

      return send(res, 200, {
        monthlyEquivalent: Math.round(monthly * 100) / 100,
        yearlyEquivalent: Math.round(monthly * 1200) / 100,
        upcoming,
      });
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
