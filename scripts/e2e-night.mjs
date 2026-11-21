#!/usr/bin/env node
// Τεστ ολόκληρης βραδιάς πάνω σε πραγματικό server:
// φόρμα → ειδοποίηση → έγκριση → παιχνίδι → κινητά (consent, ζάρι, μυστική ψήφος) → ιδιωτικότητα → αρχείο → καθάρισμα.
//
// Χρήση (με τον server να τρέχει):
//   E2E_BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
// Δημιουργεί μόνο δοκιμαστικά δεδομένα με πρόθεμα «E2E» και τα σβήνει στο τέλος.

const BASE = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('Λείπουν E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.');
  process.exit(2);
}

let token = '';
const results = [];
const cleanup = [];

async function api(method, path, body, { auth = true, expect } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* κενό */ }
  if (expect !== undefined && res.status !== expect) throw new Error(`${method} ${path} → ${res.status} (αναμενόταν ${expect}) ${JSON.stringify(data)?.slice(0, 200)}`);
  if (expect === undefined && !res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)?.slice(0, 200)}`);
  return data;
}

async function step(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log(`✔ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    console.log(`✖ ${name}\n    ${error.message}`);
    throw error;
  }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const code = `E2E${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
const players = [{ id: 'p0', name: 'E2E Άννα' }, { id: 'p1', name: 'E2E Βίκυ' }, { id: 'p2', name: 'E2E Γιώτα' }];
let session = null;
let intake = null;

async function main() {
  await step('Ο server απαντά (health & version)', async () => {
    assert((await api('GET', '/api/health', undefined, { auth: false })).ok === true, 'health');
    const version = await api('GET', '/api/version', undefined, { auth: false });
    assert(/^\d+\.\d+\.\d+$/.test(version.version), 'έκδοση');
  });

  await step('Σύνδεση διαχειριστή', async () => {
    token = (await api('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD }, { auth: false })).access_token;
    assert(token, 'δεν δόθηκε token');
  });

  await step('Δημόσια φόρμα: αίτηση για Pajama Heist & Arrest (χωρίς σύνδεση)', async () => {
    const saved = token; token = '';
    intake = await api('POST', '/api/entities/PajamaIntake', {
      formType: 'modes', name: players[0].name, preferredModes: ['marathon_4h'], adultConfirmed: true,
      safeWordConfirmed: true, boundaries: '', customAnswers: {}, approved: false,
    }, { auth: false });
    token = saved;
    assert(intake?.id, 'δεν αποθηκεύτηκε η αίτηση');
    cleanup.push(() => api('DELETE', `/api/entities/PajamaIntake/${intake.id}`).catch(() => {}));
  });

  await step('Οι αιτήσεις δεν διαβάζονται δημόσια', async () => {
    const saved = token; token = '';
    const res = await fetch(`${BASE}/api/entities/PajamaIntake/filter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    token = saved;
    assert(res.status === 401 || res.status === 403, `δημόσια ανάγνωση αιτήσεων: ${res.status}`);
  });

  await step('Ειδοποίηση καταγράφηκε για τη νέα αίτηση', async () => {
    const status = await api('GET', '/api/push/status');
    assert((status.history || []).some((n) => String(n.body).includes(players[0].name)), 'δεν βρέθηκε ειδοποίηση');
  });

  await step('Έγκριση αίτησης από το Admin', async () => {
    await api('POST', `/api/entities/intake-approvals/PajamaIntake/${encodeURIComponent(intake.id)}`, {});
    const { items } = await api('POST', '/api/entities/PajamaIntake/filter', { query: { name: players[0].name }, limit: 5 });
    assert(items.some((item) => item.id === intake.id && item.approved === true), 'η αίτηση δεν εγκρίθηκε');
    const { items: profiles } = await api('POST', '/api/entities/PlayerIntake/filter', { query: { name: players[0].name }, limit: 20 });
    for (const profile of profiles || []) cleanup.push(() => api('DELETE', `/api/entities/player-intakes/${profile.id}`).catch(() => api('DELETE', `/api/entities/PlayerIntake/${profile.id}`).catch(() => {})));
  });

  await step('Το Tablet ξεκινά παιχνίδι Pajama Heist & Arrest', async () => {
    session = await api('POST', '/api/entities/GameSession', {
      sessionCode: code,
      mode: 'marathon_4h',
      state: {
        mode: 'marathon_4h', players, stage: 1, round: 1, gameStartedAt: Date.now(), gameDurationMinutes: 105, testMode: true,
        mg: { consentRequired: true, consent: { players: {} } },
      },
    });
    assert(session?.id, 'δεν δημιουργήθηκε συνεδρία');
    cleanup.push(() => api('DELETE', `/api/entities/game-events/${encodeURIComponent(code)}`).catch(() => api('DELETE', `/api/entities/GameSession/${session.id}`).catch(() => {})));
  });

  const asPlayer = async (playerId, statePatch, expect) => {
    const saved = token; token = '';
    try { return await api('PATCH', `/api/entities/GameSession/${session.id}`, { statePatch, sessionCode: code, playerId }, { auth: false, expect }); }
    finally { token = saved; }
  };
  const viewAs = async (playerId) => {
    const saved = token; token = '';
    try { return (await api('POST', '/api/entities/GameSession/filter', { query: { sessionCode: code, playerId } }, { auth: false })).items[0]; }
    finally { token = saved; }
  };

  await step('Το κινητό μπαίνει με τον κωδικό και βλέπει την παρτίδα', async () => {
    const view = await viewAs('p0');
    assert(view?.state?.players?.length === 3, 'το κινητό δεν βλέπει τις παίκτριες');
  });

  await step('Consent check-in από κάθε κινητό (μόνο η δική της καταχώρηση)', async () => {
    for (const p of players) await asPlayer(p.id, { mg: { consent: { players: { [p.id]: { confirmed: true, at: Date.now(), optOuts: [] } } } } });
    await asPlayer('p0', { mg: { consent: { players: { p1: { confirmed: false, at: Date.now(), optOuts: [] } } } } }, 403).catch(async (error) => {
      if (!/→ 4\d\d/.test(error.message)) throw error;
    });
  });

  await step('Το Tablet στήνει ταμπλό και ανάκριση', async () => {
    await api('PATCH', `/api/entities/GameSession/${session.id}`, { statePatch: { mg: {
      consentRequired: true, consent: { done: true, players: {} },
      lounge: { stats: {}, pos: { p0: 0, p1: 0, p2: 0 }, turn: 0, round: 1, chief: 'p2', phase: 0, interro: { id: 'ie2e', idx: 0, pid: 'p0', questions: ['Q1', 'Q2', 'Q3'], answers: {} }, finale: { code: '4321', riddle: [], startedAt: Date.now(), winner: null } },
    } } });
  });

  await step('Ζάρι από το κινητό: έγκυρη ενέργεια γίνεται δεκτή, άκυρη απορρίπτεται', async () => {
    await asPlayer('p0', { mg: { playerAction: { playerId: 'p0', type: 'lounge_roll', at: Date.now() } } });
    let rejected = false;
    try { await asPlayer('p0', { mg: { playerAction: { playerId: 'p0', type: 'give_me_points', at: Date.now() } } }); } catch { rejected = true; }
    assert(rejected, 'δέχτηκε άκυρη ενέργεια');
    rejected = false;
    try { await asPlayer('p0', { mg: { lounge: { stats: { p0: { loot: 999999 } } } } }); } catch { rejected = true; }
    assert(rejected, 'το κινητό μπόρεσε να αλλάξει Loot');
  });

  await step('Μυστική ψηφοφορία: κάθε κινητό ψηφίζει μόνο για τον εαυτό του', async () => {
    await asPlayer('p1', { loungeVotes: { p1: 'ie2e:0:lie' } });
    await asPlayer('p2', { loungeVotes: { p2: 'ie2e:0:truth' } });
    let rejected = false;
    try { await asPlayer('p1', { loungeVotes: { p2: 'ie2e:0:lie' } }); } catch { rejected = true; }
    assert(rejected, 'ψήφισε για άλλη παίκτρια');
  });

  await step('Ιδιωτικότητα: οι ψήφοι και ο κωδικός φινάλε δεν φαίνονται στα κινητά', async () => {
    const view = await viewAs('p2');
    const votes = view.state.loungeVotes || {};
    assert(votes.p2 === 'ie2e:0:truth', 'η παίκτρια δεν βλέπει τη δική της ψήφο');
    assert(!Object.values(votes).includes('ie2e:0:lie'), 'φαίνεται ψήφος άλλης παίκτριας');
    assert(!view.state.mg?.lounge?.finale?.code, 'ο κωδικός του φινάλε φαίνεται στο κινητό');
    const { items } = await api('POST', '/api/entities/GameSession/filter', { query: { sessionCode: code } });
    assert(items[0].state.loungeVotes.p1 === 'ie2e:0:lie', 'το Tablet δεν βλέπει τις ψήφους');
  });

  await step('Φινάλε: το κινητό στέλνει κωδικό', async () => {
    await asPlayer('p1', { mg: { playerAction: { playerId: 'p1', type: 'lounge_code', code: '4321', at: Date.now() } } });
    let rejected = false;
    try { await asPlayer('p1', { mg: { playerAction: { playerId: 'p1', type: 'lounge_code', code: '12a4', at: Date.now() } } }); } catch { rejected = true; }
    assert(rejected, 'δέχτηκε μη αριθμητικό κωδικό');
  });

  await step('ΣΤΟΠ από κινητό σταματά την παρτίδα', async () => {
    await asPlayer('p2', { mg: { stop: true, stopAt: Date.now(), stopBy: 'p2' } });
    const { items } = await api('POST', '/api/entities/GameSession/filter', { query: { sessionCode: code } });
    assert(items[0].state.mg.stop === true, 'το ΣΤΟΠ δεν καταγράφηκε');
  });

  await step('Τέλος: αρχειοθέτηση της βραδιάς', async () => {
    await api('POST', '/api/functions/archiveSession', { sessionCode: code, mode: 'marathon_4h', winner: players[1].name, playerNames: players.map((p) => p.name), stats: {}, confessions: [], highlights: [], showScenes: [], episodeSchedule: [], eventHistory: [] });
    const { items } = await api('POST', '/api/entities/SessionArchive/filter', { query: { sessionCode: code }, limit: 1 });
    assert(items[0]?.winner === players[1].name, 'δεν βρέθηκε στο αρχείο');
    cleanup.push(() => api('DELETE', `/api/entities/SessionArchive/${items[0].id}`).catch(() => {}));
  });
}

main()
  .catch(() => {})
  .finally(async () => {
    for (const fn of cleanup.reverse()) await fn();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} βήματα πέρασαν${failed ? ` · ${failed} απέτυχαν` : ''}. Τα δοκιμαστικά δεδομένα σβήστηκαν.`);
    process.exit(failed ? 1 : 0);
  });
