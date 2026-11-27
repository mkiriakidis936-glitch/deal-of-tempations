import { useEffect, useState } from 'react';
import { appApi } from '@/api/apiClient';
import * as EXT from '@/data/modes/extendedContent';
import * as LD from '@/data/modes/lockdownContent';
import * as LG from '@/data/modes/loungeContent';
import * as VL from '@/data/modes/villaContent';

// Λίστες περιεχομένου των νέων modes που επεξεργάζονται από Admin → 🎮 Νέα Modes.
// Οι αλλαγές αποθηκεύονται στο AppSetting (key modes_content) και εφαρμόζονται "επί τόπου" στις λίστες.
export const MODES_KEY = 'modes_content';

const T = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });
const A = (key, label, extra = {}) => ({ key, label, type: 'area', ...extra });
const N = (key, label, extra = {}) => ({ key, label, type: 'number', ...extra });
const C = (key, label) => ({ key, label, type: 'check' });
const I = (key = 'image', label = 'Εικόνα κάρτας') => ({ key, label, type: 'image' });

export const COLLECTIONS = [
  { id: 'glam_cards', group: '💅 Pedi-Glam & Marathon (Act 1)', label: 'Glam Route κάρτες', arr: EXT.GLAM_CARDS, blank: { id: '', title: '', text: '' }, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'chaos_cards', group: '💅 Pedi-Glam & Marathon (Act 1)', label: 'Chaos Route κάρτες', arr: EXT.CHAOS_CARDS, blank: { id: '', title: '', text: '' }, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), C('restraint', 'Έχει δέσιμο (δείχνει υπενθύμιση ασφάλειας)'), C('trap', 'Παγίδα γαργαλητού (πληρώνεις 2 tokens)'), I()] },
  { id: 'secret_missions', group: '💅 Pedi-Glam & Marathon (Act 1)', label: 'Μυστικές αποστολές (κινητό)', arr: EXT.SECRET_MISSIONS, blank: { id: '', title: '', text: '', reward: 2, mins: 5 }, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο που βλέπει στο κινητό'), N('reward', 'Glam Tokens επιτυχίας'), N('mins', 'Λεπτά διορίας'), I()] },
  { id: 'chaos_powers', group: '💅 Pedi-Glam & Marathon (Act 1)', label: 'Chaos Powers', arr: EXT.CHAOS_POWERS, fixedItems: true, blank: {}, fields: [T('name', 'Όνομα'), T('icon', 'Εικονίδιο'), A('text', 'Περιγραφή')] },
  { id: 'shop_items', group: '💅 Pedi-Glam & Marathon (Act 1)', label: 'Glam Token Shop', arr: EXT.SHOP, fixedItems: true, blank: {}, fields: [T('name', 'Όνομα'), T('icon', 'Εικονίδιο'), N('cost', 'Κόστος tokens'), A('desc', 'Περιγραφή'), C('needsTarget', 'Απαιτεί επιλογή συμπαίκτριας')] },
  { id: 'blind_textures', group: '🌙 Midnight Vault (Act 2)', label: 'Blind ASMR υφές', arr: EXT.BLIND_TEXTURES, blank: { id: '', name: '', text: '' }, fields: [T('name', 'Όνομα'), A('text', 'Περιγραφή')] },
  { id: 'whisper_questions', group: '🌙 Midnight Vault (Act 2)', label: 'Midnight Whispers ερωτήσεις', arr: EXT.WHISPER_QUESTIONS, strings: true },
  { id: 'asmr_clips', group: '🌙 Midnight Vault (Act 2)', label: 'ASMR clips', arr: EXT.ASMR_CLIPS, blank: { id: '', say: '', keyword: '', hint: '' }, fields: [T('say', 'Φράση ψιθύρου'), T('keyword', 'Λέξη-κλειδί'), T('hint', 'Τύπος ήχου')] },
  { id: 'morning_clues', group: '☀️ Morning Escape (Act 4)', label: 'Ψήγματα πρωινού', arr: EXT.MORNING_CLUES, blank: { id: '', app: '', where: '' }, fields: [T('app', 'Στοιχείο στην εφαρμογή'), A('where', 'Πού κρύβεται το ψηφίο')] },
  { id: 'vip_vault', group: '☀️ Morning Escape (Act 4)', label: 'VIP Vault κάρτες', arr: EXT.VIP_VAULT, strings: true },
  { id: 'lockdown_settings', group: '🚨 Pajama Lockdown', label: 'Βασικές ρυθμίσεις Lockdown', arr: [LD.getLockdownSettings()], fixedItems: true, blank: {}, validate: (items) => /^\d{4}$/.test(items[0]?.exitCode || '') ? null : 'Ο κωδικός εξόδου πρέπει να αποτελείται από ακριβώς 4 ψηφία.', fields: [T('exitCode', 'Κωδικός εξόδου (4 ψηφία)'), A('message', 'Μήνυμα έναρξης')], toRuntime: (items) => { LD.applyLockdownSettings(items[0] || {}); return [LD.getLockdownSettings()]; } },
  { id: 'binding_options', group: '🚨 Pajama Lockdown', label: 'Επιλογές δεσίματος', arr: LD.BINDING_OPTIONS, strings: true },
  { id: 'villa2_questions', group: '🏝️ Villa Takeover 48/72', label: '20 σκληρές ερωτήσεις 18+ (Ανάκριση · Truth · Πειράγματα)', arr: VL.VILLA_QUESTIONS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_dares', group: '🏝️ Villa Takeover 48/72', label: '20 τολμηρά Dares 18+ & πειράγματα', arr: VL.VILLA_DARES, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_nails', group: '🏝️ Villa Takeover 48/72', label: '15 κάρτες σαγιονάρες, χρώμα νυχιών, δεσίματα & μύτες', arr: VL.VILLA_NAIL_CARDS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_flirt', group: '🏝️ Villa Takeover 48/72', label: '20 ερωτήσεις 18+ φλερτ, σαγιονάρες, νύχια & ίντριγκα', arr: VL.VILLA_FLIRT_QUESTIONS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_commands', group: '🏝️ Villa Takeover 48/72', label: '15 κάρτες Απόλυτων Διαταγών & Σκληρών Τιμωριών', arr: VL.VILLA_COMMAND_CARDS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_hunt', group: '🏝️ Villa Takeover 48/72', label: '10 κάρτες Κυνήγι Ψηφίου & Τυφλή Ταυτοποίηση', arr: VL.VILLA_HUNT_CARDS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_night', group: '🏝️ Villa Takeover 48/72', label: 'Νυχτερινές δοκιμασίες', arr: VL.VILLA_NIGHT_CHALLENGES, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_special', group: '🏝️ Villa Takeover 48/72', label: 'Ειδικές κάρτες μηχανισμών', arr: VL.VILLA_SPECIAL_CARDS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'villa2_royal', group: '🏝️ Villa Takeover 48/72', label: 'Απόλυτες Διαταγές (Royal Commands)', arr: VL.VILLA_ROYAL_COMMANDS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Εντολή')] },
  { id: 'villa2_twists', group: '🏝️ Villa Takeover 48/72', label: 'Ανατροπές (Plot Twists)', arr: VL.VILLA_TWISTS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Τι γίνεται'), A('tv', 'Μήνυμα TV')] },
  { id: 'villa2_wheel', group: '🏝️ Villa Takeover 48/72', label: 'Τροχός Τιμωρίας', arr: VL.VILLA_PUNISH_WHEEL, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Τιμωρία'), N('secs', 'Χρονόμετρο (δευτ.)')] },
  { id: 'villa2_missions', group: '🏝️ Villa Takeover 48/72', label: 'Μυστικές αποστολές (κινητό)', arr: VL.VILLA_MISSIONS, blank: { id: '', title: '', text: '', mins: 60 }, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο που βλέπει στο κινητό'), N('mins', 'Λεπτά διορίας'), I()] },
  { id: 'villa2_roles', group: '🏝️ Villa Takeover 48/72', label: 'Μυστικοί ρόλοι', arr: VL.VILLA_ROLES, fixedItems: true, blank: {}, fields: [T('icon', 'Εικονίδιο'), T('name', 'Όνομα'), A('text', 'Τι μπορεί να κάνει')] },
  { id: 'villa2_alerts', group: '🏝️ Villa Takeover 48/72', label: 'Έτοιμες ειδοποιήσεις κινητών', arr: VL.VILLA_ALERTS, blank: { id: '', title: '', text: '' }, fields: [T('title', 'Τίτλος'), A('text', 'Μήνυμα')] },
  { id: 'villa2_awards', group: '🏝️ Villa Takeover 48/72', label: 'Τελικά βραβεία', arr: VL.VILLA_AWARDS, strings: true },
  { id: 'whisper_clues', group: '🚨 Pajama Lockdown', label: 'Audio Whisper clues', arr: LD.WHISPER_CLUES, blank: { say: '', keyword: '' }, fields: [T('say', 'Φράση ψιθύρου'), T('keyword', 'Λέξη-κλειδί')] },
  { id: 'mini_games', group: '🚨 Pajama Lockdown', label: 'Mini-games (κείμενα & ποινές)', arr: LD.MINI_GAMES, fixedItems: true, blank: {}, fields: [T('icon', 'Εικονίδιο'), T('name', 'Όνομα'), A('desc', 'Περιγραφή'), A('fail', 'Κείμενο αποτυχίας'), N('failSecs', 'Ποινή (δευτ.)'), C('wheel', 'Άνοιγμα Spicy Truth Wheel')] },
  { id: 'true_false', group: '🚨 Pajama Lockdown', label: 'True / False ερωτήσεις', arr: LD.TRUE_FALSE.map(([question, answer], i) => ({ id: `tf${i + 1}`, question, answer })), targetArr: LD.TRUE_FALSE, toRuntime: (items) => items.map((item) => [item.question, !!item.answer]), blank: { question: '', answer: true }, fields: [A('question', 'Ερώτηση'), C('answer', 'Σωστή απάντηση: TRUE')] },
  { id: 'hostage_questions', group: '🚨 Pajama Lockdown', label: 'Level 1 · ερωτήσεις Hostage', arr: LD.HOSTAGE_QUESTIONS, strings: true },
  { id: 'confession_lock', group: '🚨 Pajama Lockdown', label: 'Secret Confession Lock', arr: LD.CONFESSION_LOCK, strings: true },
  { id: 'spicy_wheel', group: '🚨 Pajama Lockdown', label: 'Spicy Truth Wheel', arr: LD.SPICY_WHEEL, strings: true },
  { id: 'foot_id', group: '🚨 Pajama Lockdown', label: 'Blind Foot ID (υφή → ψηφίο)', arr: LD.FOOT_ID, blank: { digit: '0', name: '', text: '' }, fields: [T('digit', 'Ψηφίο'), T('name', 'Όνομα'), A('text', 'Περιγραφή')] },
  { id: 'lounge_cards', group: '🚔 Pajama Heist & Arrest', label: 'Deck 36 καρτών', arr: LG.LOUNGE_CARDS, blank: { id: '', title: '', text: '' }, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο'), N('secs', 'Χρονόμετρο (δευτ.)'), I()] },
  { id: 'lounge_questions', group: '🚔 Pajama Heist & Arrest', label: 'Ερωτήσεις ανάκρισης 18+', arr: LG.INTERROGATION_QUESTIONS, strings: true },
  { id: 'lounge_mechanics', group: '🚔 Pajama Heist & Arrest', label: 'Μηχανισμοί (σαγιονάρες, χειροπέδες)', arr: LG.LOUNGE_MECHANICS, fixedItems: true, blank: {}, fields: [T('title', 'Τίτλος'), A('text', 'Κείμενο')] },
  { id: 'lounge_restraints', group: '🚔 Pajama Heist & Arrest', label: 'Κλιμάκωση δεσιμάτων (αστέρια)', arr: LG.RESTRAINT_LEVELS, fixedItems: true, blank: {}, fields: [T('name', 'Όνομα'), A('text', 'Περιγραφή')] },
  { id: 'lounge_phases', group: '🚔 Pajama Heist & Arrest', label: 'Φάσεις βραδιάς', arr: LG.LOUNGE_PHASES, fixedItems: true, blank: {}, fields: [T('name', 'Όνομα'), N('minutes', 'Λεπτά'), A('text', 'Περιγραφή')] },
  { id: 'lounge_hell_wheel', group: '🚔 Pajama Heist & Arrest', label: 'Τροχός της Κόλασης', arr: LG.HELL_WHEEL, strings: true },
];

// Σε ποιο mode ανήκει κάθε λίστα (για την καρτέλα «Κάρτες & περιεχόμενο» ανά mode).
const GROUP_MODE = [
  [/Pajama Lockdown/, 'lockdown'], [/Pajama Heist & Arrest/, 'marathon_4h'], [/Villa Takeover/, 'villa_takeover'],
];
export const modeOfCollection = (collection) => GROUP_MODE.find(([re]) => re.test(collection.group))?.[1] || 'retired';

const DEFAULTS = Object.fromEntries(COLLECTIONS.map((c) => [c.id, JSON.parse(JSON.stringify(c.arr))]));
export const defaultsOf = (id) => JSON.parse(JSON.stringify(DEFAULTS[id]));

function clean(c, list) {
  if (!Array.isArray(list)) return null;
  const out = c.strings
    ? list.map((x) => String(x ?? '').trim()).filter(Boolean)
    : list.filter((x) => x && typeof x === 'object').map((x, i) => ({ ...x, id: x.id || `${c.id}_${Date.now().toString(36)}_${i}` }));
  return out.length ? out : null;
}

// Αντικαθιστά το περιεχόμενο των λιστών στη μνήμη (ή επαναφέρει τα αρχικά αν λείπει).
export function applyModesContent(overrides = {}) {
  COLLECTIONS.forEach((c) => {
    const next = clean(c, overrides[c.id]) || DEFAULTS[c.id];
    const runtimeNext = c.toRuntime ? c.toRuntime(next) : next;
    const target = c.targetArr || c.arr;
    target.splice(0, target.length, ...JSON.parse(JSON.stringify(runtimeNext)));
    if (c.toRuntime) c.arr.splice(0, c.arr.length, ...JSON.parse(JSON.stringify(next)));
  });
}

export async function fetchModesRecord() {
  const { items } = await appApi.entities.AppSetting.filter({ key: MODES_KEY }, { limit: 1 });
  return items?.[0] || null;
}

let loading = null;
export function loadModesContent(force = false) {
  if (!loading || force) {
    loading = fetchModesRecord()
      .then((rec) => { applyModesContent(rec?.value || {}); return true; })
      .catch((e) => { console.warn('[modes] χρήση αρχικού περιεχομένου:', e.message); return false; });
  }
  return loading;
}

export function subscribeModesContent(onChange) {
  return appApi.entities.AppSetting.subscribe((event) => {
    if (event?.type === 'resync') { loadModesContent(true).then(() => onChange()); return; }
    if (event?.data?.key !== MODES_KEY) return;
    applyModesContent(event.type === 'delete' ? {} : (event.data.value || {}));
    loading = Promise.resolve(true);
    onChange();
  });
}

export async function saveModesContent(next) {
  const rec = await fetchModesRecord();
  if (rec?.id) await appApi.entities.AppSetting.update(rec.id, { value: next });
  else await appApi.entities.AppSetting.create({ key: MODES_KEY, value: next });
  applyModesContent(next);
  loading = null;
}

// Applies a scenario's selected existing content collections only for the active game session.
export function applyScenarioCollections(modeId, selectedIds = []) {
  const selected = new Set(selectedIds);
  const relevant = COLLECTIONS.filter((collection) => {
    if (modeId === 'pedi_extended') return /Pedi-Glam|Act 1|Act 2|Act 4|Marathon/i.test(collection.group);
    if (modeId === 'lockdown') return /Pajama Lockdown/i.test(collection.group);
    if (modeId === 'marathon_4h') return /Pajama Heist & Arrest/i.test(collection.group);
    if (modeId === 'villa_takeover') return /Villa Takeover/i.test(collection.group);
    return false;
  });
  const snapshots = [];
  const seen = new Set();
  relevant.forEach((collection) => {
    const target = collection.targetArr || collection.arr;
    if (seen.has(target)) return;
    seen.add(target);
    snapshots.push({ target, values: JSON.parse(JSON.stringify(collection.targetArr ? collection.arr : target)), collection });
    if (!selected.has(collection.id)) {
      const defaults = defaultsOf(collection.id);
      const runtimeDefaults = collection.toRuntime ? collection.toRuntime(defaults) : defaults;
      target.splice(0, target.length, ...JSON.parse(JSON.stringify(runtimeDefaults)));
    }
  });
  return () => snapshots.forEach(({ target, values, collection }) => {
    const restored = collection.targetArr && collection.toRuntime ? collection.toRuntime(values) : values;
    target.splice(0, target.length, ...restored);
    if (!collection.targetArr && collection.toRuntime) collection.toRuntime(values);
  });
}

// TV & κινητά: φορτώνουν το περιεχόμενο του Admin και ξανασχεδιάζονται όταν αλλάζει.
export function useModesContentRev() {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    let alive = true;
    loadModesContent().then(() => { if (alive) setRev((n) => n + 1); });
    const off = subscribeModesContent(() => { if (alive) setRev((n) => n + 1); });
    return () => { alive = false; off?.(); };
  }, []);
  return rev;
}
