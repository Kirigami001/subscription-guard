export async function api(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    ...restOptions,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Ошибка ${response.status}`);
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
