// Η σύνδεση της εφαρμογής με τον δικό μας server (Express + Postgres).
// Περιέχει: appApi.entities (δεδομένα + realtime), auth, functions.

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'auth_token';

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
};
const storeToken = (t) => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

// PIN της παίκτριας σε αυτό το κινητό (αποθηκεύεται όταν μπαίνει με το όνομά της).
const pinFor = (code) => { try { return localStorage.getItem(`dot_pin_${String(code || '').trim().toUpperCase()}`) || ''; } catch { return ''; } };
export const setPlayerPin = (code, pin) => { try { if (pin) localStorage.setItem(`dot_pin_${String(code).toUpperCase()}`, pin); else localStorage.removeItem(`dot_pin_${String(code).toUpperCase()}`); } catch { /* χωρίς storage */ } };
function withPin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  if (body.playerId && body.sessionCode && body.pin === undefined) return { ...body, pin: pinFor(body.sessionCode) };
  if (body.query?.playerId && body.query?.sessionCode && body.query.pin === undefined) return { ...body, query: { ...body.query, pin: pinFor(body.query.sessionCode) } };
  return body;
}

export async function request(method, path, rawBody) {
  const token = getToken();
  const body = withPin(rawBody);
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

// ---------- realtime: ΜΙΑ κοινή σύνδεση SSE για όλες τις οντότητες της σελίδας ----------
const subscriptions = new Map();
const live = { es: null, pending: null, timer: null, retry: 0, opened: false, signature: '', scheduled: null };

const emitTo = (sub, event) => sub.listeners.forEach((fn) => { try { fn(event); } catch (e) { console.error(e); } });

function matches(sub, event) {
  if (sub.entity !== event.entity) return false;
  if (sub.sessionCode && event.data?.sessionCode && event.data.sessionCode !== sub.sessionCode) return false;
  return true;
}

function closeLive() {
  if (live.timer) { clearTimeout(live.timer); live.timer = null; }
  live.pending?.close();
  live.pending = null;
  live.es?.close();
  live.es = null;
  live.signature = '';
}

async function openLive(reason) {
  if (live.timer) { clearTimeout(live.timer); live.timer = null; }
  const subs = [...subscriptions.values()].map(({ entity, sessionCode, playerId }) => ({ entity, ...(sessionCode ? { sessionCode } : {}), ...(playerId ? { playerId, pin: pinFor(sessionCode) } : {}) }));
  if (!subs.length) { closeLive(); return; }
  const signature = JSON.stringify(subs);
  const params = new URLSearchParams({ subs: signature });
  if (getToken()) {
    try {
      const ticket = (await request('POST', '/api/entities/stream-ticket'))?.ticket;
      if (ticket) params.set('ticket', ticket);
    } catch (error) {
      // Συσκευή admin: ΠΟΤΕ ανώνυμη σύνδεση (θα έπαιρνε φιλτραρισμένα δεδομένα και θα τα έγραφε πίσω).
      // Μόνο αν δεν είναι admin (401/403, δηλαδή δεν μπορεί και να γράψει) συνεχίζει ανώνυμα· αλλιώς ξαναδοκιμάζει.
      if (![401, 403].includes(error?.status)) {
        live.retry = Math.min(live.retry + 1, 5);
        live.timerSince = Date.now();
        live.timer = setTimeout(() => openLive(reason === 'change' ? 'error' : reason), 1000 * live.retry);
        return;
      }
    }
  }
  if (JSON.stringify([...subscriptions.values()].map(({ entity, sessionCode, playerId }) => ({ entity, ...(sessionCode ? { sessionCode } : {}), ...(playerId ? { playerId, pin: pinFor(sessionCode) } : {}) }))) !== signature) return;
  live.pending?.close();
  const es = new EventSource(`${API_URL}/api/entities/multi/stream?${params.toString()}`);
  live.pending = es;
  live.pendingSince = Date.now();
  live.signature = signature;
  es.addEventListener('ping', () => { if (live.es === es) live.lastSeen = Date.now(); });
  // Ο server κλείνει (redeploy): ξανασύνδεση σε λίγο, στον νέο server.
  es.addEventListener('bye', () => {
    es.close();
    if (live.es === es) live.es = null;
    if (live.pending === es) live.pending = null;
    if (live.timer) clearTimeout(live.timer);
    live.timerSince = Date.now();
    live.timer = setTimeout(() => openLive('error'), 1500);
  });
  es.addEventListener('ready', () => {
    if (live.pending !== es) return;
    live.lastSeen = Date.now();
    const previous = live.es;
    live.es = es;
    live.pending = null;
    previous?.close();
    const resync = reason === 'error' || reason === 'wake';
    live.retry = 0;
    live.opened = true;
    if (resync) subscriptions.forEach((sub) => emitTo(sub, { type: 'resync', entity: sub.entity }));
  });
  es.onmessage = (msg) => {
    if (live.es !== es) return;
    live.lastSeen = Date.now();
    let event;
    try { event = JSON.parse(msg.data); } catch { return; }
    subscriptions.forEach((sub) => { if (matches(sub, event)) emitTo(sub, event); });
  };
  es.onerror = () => {
    es.close();
    if (live.pending === es) live.pending = null;
    if (live.es === es) live.es = null;
    if (live.timer || !subscriptions.size) return;
    live.retry = Math.min(live.retry + 1, 5);
    live.timerSince = Date.now();
    live.timer = setTimeout(() => openLive('error'), 1000 * live.retry);
  };
}

function scheduleReopen() {
  if (live.scheduled) return;
  live.scheduled = setTimeout(() => { live.scheduled = null; openLive('change'); }, 30);
}

function subscribeEntity(name, callback, options = {}) {
  const sessionCode = name === 'GameSession' ? (options.sessionCode || '') : '';
  const playerId = name === 'GameSession' ? (options.playerId || '') : '';
  const key = `${name}|${sessionCode}|${playerId}`;
  let sub = subscriptions.get(key);
  if (!sub) {
    sub = { entity: name, sessionCode, playerId, listeners: new Set() };
    subscriptions.set(key, sub);
    scheduleReopen();
  }
  sub.listeners.add(callback);
  return () => {
    sub.listeners.delete(callback);
    if (sub.listeners.size === 0 && subscriptions.get(key) === sub) {
      subscriptions.delete(key);
      scheduleReopen();
    }
  };
}

// Κατάσταση ζωντανής σύνδεσης (για ένδειξη υγείας και διάγνωση).
export function realtimeHealth() {
  return { state: live.es ? ['connecting', 'open', 'closed'][live.es.readyState] : 'none', pending: !!live.pending, lastSeen: live.lastSeen || 0, retrying: !!live.timer, retry: live.retry, subscriptions: subscriptions.size };
}

if (typeof window !== 'undefined') {
  window.__dtRealtime = realtimeHealth;
  const wake = () => {
    if (!subscriptions.size) return;
    if (!live.es || live.es.readyState === 2) openLive('wake');
  };
  window.addEventListener('online', wake);
  // Φύλακας: αν δεν ακουστεί σφυγμός για 40″ (κομμένο WiFi, redeploy, «κοιμισμένη» σύνδεση), ξανασυνδέεται.
  setInterval(() => {
    if (!subscriptions.size) return;
    // Σύνδεση που «κρέμεται» (ούτε ανοίγει ούτε αποτυγχάνει) πάνω από 20″: ξεκινά από την αρχή.
    if (live.pending && Date.now() - (live.pendingSince || 0) > 20000) { live.pending.close(); live.pending = null; }
    if (live.pending) return;
    // Χρονοδιακόπτης επανασύνδεσης που «κόλλησε» (π.χ. κρυμμένη καρτέλα): τον παρακάμπτουμε μετά από 30″.
    if (live.timer && Date.now() - (live.timerSince || 0) < 30000) return;
    if (!live.es || live.es.readyState === 2 || (live.lastSeen && Date.now() - live.lastSeen > 40000)) {
      if (live.timer) { clearTimeout(live.timer); live.timer = null; }
      live.es?.close();
      live.es = null;
      openLive('wake');
    }
  }, 10000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') wake(); });
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

export const appApi = { entities, auth, functions, app };
export default appApi;
