export async function api(path, options = {}) {
  let response;
  try {
    const { headers: customHeaders, ...restOptions } = options;
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      ...restOptions,
    });
  } catch {
    const err = new Error(
      'Не удалось подключиться к серверу. Убедитесь, что приложение запущено через npm run dev.'
    );
    err.status = 0;
    throw err;
  }

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    let message = data.error;
    if (!message) {
      if (response.status >= 500) {
        message =
          'Backend-сервер (порт 3001) не запущен или не отвечает. Запустите в папке subscription-app: npm run dev (или npm run server).';
      } else if (response.status === 404 || response.status === 405) {
        message =
          'API-сервер не найден. Для регистрации и базы данных SQLite запускайте проект локально, а не на статическом хостинге.';
      } else {
        message = `Ошибка ${response.status}`;
      }
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

export const authApi = {
  me: () => api('/auth/me'),
  login: (email, password) =>
    api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  logout: () => api('/auth/logout', { method: 'POST' }),
};

export const subscriptionsApi = {
  list: () => api('/subscriptions'),
  get: (id) => api(`/subscriptions/${id}`),
  add: (subscription) =>
    api('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscription),
    }),
  status: (id, status) =>
    api(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  remove: (id) => api(`/subscriptions/${id}`, { method: 'DELETE' }),
  insights: () => api('/insights'),
};
