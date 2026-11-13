// Drop-in replacement for the old Base44 SDK client.
// Keeps the same `base44.entities / auth / functions / app` surface so the
// ~45 files that import `@/api/base44Client` keep working unchanged,
// but talks to our own Express + Postgres backend (see /server).

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'auth_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
const storeToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

export async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- realtime (Server-Sent Events, one shared connection per entity) ----------
const streams = new Map(); // entity -> { es, listeners:Set }

function subscribeEntity(name, callback, options = {}) {
  let s = streams.get(name);
  if (!s) {
    const token = getToken();
    const params = new URLSearchParams();
    if (token) params.set('token', token);
    if (options.sessionCode) params.set('sessionCode', options.sessionCode);
    if (options.playerId) params.set('playerId', options.playerId);
    const query = params.toString();
    const url = `${API_URL}/api/entities/${name}/stream${query ? `?${query}` : ''}`;
    const es = new EventSource(url);
    s = { es, listeners: new Set() };
    es.onmessage = (msg) => {
      let event;
      try { event = JSON.parse(msg.data); } catch { return; }
      s.listeners.forEach((fn) => { try { fn(event); } catch (e) { console.error(e); } });
    };
    streams.set(name, s);
  }
  s.listeners.add(callback);
  return () => {
    s.listeners.delete(callback);
    if (s.listeners.size === 0) { s.es.close(); streams.delete(name); }
  };
}

function makeEntity(name) {
  const base = `/api/entities/${name}`;
  const filter = (query = {}, opts = {}) =>
    request('POST', `${base}/filter`, { query, sort: opts.sort, limit: opts.limit, skip: opts.skip });
  return {
    filter,
    list: (sort, limit) => filter({}, { sort, limit }),
    get: (id) => request('GET', `${base}/${id}`),
    create: (data) => request('POST', base, data),
    bulkCreate: (records) => request('POST', `${base}/bulk`, records),
    update: (id, data) => request('PATCH', `${base}/${id}`, data),
    delete: (id) => request('DELETE', `${base}/${id}`),
    deleteMany: (query = {}) => request('POST', `${base}/delete-many`, { query }),
    count: async (query = {}) => (await request('POST', `${base}/count`, { query })).count,
    subscribe: (cb, options) => subscribeEntity(name, cb, options),
  };
}

const entityCache = {};
const entities = new Proxy({}, {
  get(_, name) {
    if (typeof name !== 'string') return undefined;
    return (entityCache[name] ||= makeEntity(name));
  },
});

// ---------- auth ----------
const auth = {
  me: () => request('GET', '/api/auth/me'),
  setToken: (t) => storeToken(t),
  async loginViaEmailPassword(email, password) {
    const r = await request('POST', '/api/auth/login', { email, password });
    storeToken(r.access_token);
    return r;
  },
  async register({ email, password }) {
    const r = await request('POST', '/api/auth/register', { email, password });
    storeToken(r.access_token);
    return r;
  },
  resetPasswordRequest: (email) => request('POST', '/api/auth/reset-request', { email }),
  resetPassword: ({ resetToken, newPassword }) =>
    request('POST', '/api/auth/reset', { token: resetToken, password: newPassword }),
  loginWithProvider(provider, returnTo = '/') {
    window.location.href = `${API_URL}/api/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  },
  logout(redirectTo) {
    storeToken('');
    if (redirectTo) window.location.href = '/login';
  },
  redirectToLogin(returnTo) {
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo || window.location.pathname)}`;
  },
};

const functions = {
  invoke: async (name, body) => ({ data: await request('POST', `/api/functions/${name}`, body || {}) }),
};

const app = {
  getPublicSettings: async () => ({ id: 'deal-of-temptation', public_settings: {} }),
};

export const base44 = { entities, auth, functions, app };
export default base44;
