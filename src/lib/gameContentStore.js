// Loads all GameContent records from DB and mutates the static arrays/objects
// in gameConfig.js / gameContent.js IN PLACE, so every existing import site
// picks up the DB-backed content without code changes. Falls back to the
// static defaults if the DB is empty or the call fails.

import { base44 } from '@/api/base44Client';

import {
  BOARD, SQUARE_TYPES, FULL_PENALTY_LADDER, FOOTWEAR_LEVELS, TOENAIL_PERKS,
  HIDDEN_ROLES, INTENSITY_LEVELS, GAME_MODES, MARATHON_STAGES,
  BOMB_TYPING_TYPES, BOMB_RIDDLES_ALPHA, BOMB_RIDDLES_BETA, BOMB_PASO_TRIALS,
  ARREST_HEIST_LADDER, ARREST_HEIST_INTENSITY,
  WHEEL_BINDING_MATERIALS, WHEEL_TICKLE_TOOLS,
} from '@/data/gameConfig';

import {
  WARRANT_CARDS, GLITCH_CARDS, BLACK_MARKET_OPTIONS,
  STREET_TRUTHS, STREET_DARES, HARDCORE_TRUTHS, ULTIMATE_TRUTHS,
  MARATHON_TRIALS, VAULT_TRIAL_PROMPTS, LOCKDOWN_COMMANDS,
  MARATHON_GROUP_PENALTIES, MARATHON_LOCKDOWN, EXTREME_PROTOCOLS,
  ARREST_HEIST_DARES, ARREST_HEIST_TRUTHS, MINI_GAMES, PLOT_TWISTS,
  DIGITAL_CARDS, ORACLE_DILEMMAS, CRYPT_RIDDLE_TEMPLATES, MIDNIGHT_PACT_OFFER,
  GRAND_JURY_REWARDS,
} from '@/data/gameContent';

let hydrated = false;

function replaceArray(arr, items) {
  arr.length = 0;
  arr.push(...items);
}

function replaceObject(obj, newObj) {
  Object.keys(obj).forEach((k) => { delete obj[k]; });
  Object.assign(obj, newObj);
}

// Map category id -> { target (array/object), shape, build(item) }
const TARGETS = {
  board: { target: BOARD, shape: 'list', build: (d, i) => ({ ...d, position: i, zone: Math.floor(i / 11) + 1 }) },
  penalties: { target: FULL_PENALTY_LADDER, shape: 'list' },
  footwear_levels: { target: FOOTWEAR_LEVELS, shape: 'list' },
  hidden_roles: { target: HIDDEN_ROLES, shape: 'list' },
  toenail_perks: { target: TOENAIL_PERKS, shape: 'list' },
  warrant_cards: { target: WARRANT_CARDS, shape: 'list' },
  glitch_cards: { target: GLITCH_CARDS, shape: 'list' },
  black_market_options: { target: BLACK_MARKET_OPTIONS, shape: 'list' },
  street_truths: { target: STREET_TRUTHS, shape: 'list' },
  street_dares: { target: STREET_DARES, shape: 'list' },
  hardcore_truths: { target: HARDCORE_TRUTHS, shape: 'list' },
  ultimate_truths: { target: ULTIMATE_TRUTHS, shape: 'list' },
  extreme_protocols: { target: EXTREME_PROTOCOLS, shape: 'list' },
  marathon_stages: { target: MARATHON_STAGES, shape: 'list' },
  marathon_trials: { target: MARATHON_TRIALS, shape: 'list' },
  marathon_group_penalties: { target: MARATHON_GROUP_PENALTIES, shape: 'list' },
  marathon_lockdown: { target: MARATHON_LOCKDOWN, shape: 'list' },
  arrest_heist_ladder: { target: ARREST_HEIST_LADDER, shape: 'list' },
  arrest_heist_dares: { target: ARREST_HEIST_DARES, shape: 'list' },
  arrest_heist_truths: { target: ARREST_HEIST_TRUTHS, shape: 'list' },
  arrest_heist_intensity: { target: ARREST_HEIST_INTENSITY, shape: 'list' },
  bomb_typing_types: { target: BOMB_TYPING_TYPES, shape: 'list' },
  bomb_riddles_alpha: { target: BOMB_RIDDLES_ALPHA, shape: 'list' },
  bomb_riddles_beta: { target: BOMB_RIDDLES_BETA, shape: 'list' },
  bomb_paso_trials: { target: BOMB_PASO_TRIALS, shape: 'list' },
  mini_games: { target: MINI_GAMES, shape: 'list' },
  plot_twists: { target: PLOT_TWISTS, shape: 'list' },
  digital_cards: { target: DIGITAL_CARDS, shape: 'list' },
  game_modes: { target: GAME_MODES, shape: 'list', mergeById: true },
  intensity_levels: { target: INTENSITY_LEVELS, shape: 'list' },
  oracle_dilemmas: { target: ORACLE_DILEMMAS, shape: 'list' },
  crypt_riddle_templates: { target: CRYPT_RIDDLE_TEMPLATES, shape: 'list' },
  lockdown_commands: { target: LOCKDOWN_COMMANDS, shape: 'stringList', build: (d) => d.text },
  wheel_binding_materials: { target: WHEEL_BINDING_MATERIALS, shape: 'stringList', build: (d) => d.text },
  wheel_tickle_tools: { target: WHEEL_TICKLE_TOOLS, shape: 'stringList', build: (d) => d.text },
  midnight_pact_offer: { target: MIDNIGHT_PACT_OFFER, shape: 'single', apply: (d) => { replaceObject(MIDNIGHT_PACT_OFFER, d.text || ''); } },
  grand_jury_rewards: { target: GRAND_JURY_REWARDS, shape: 'single', apply: (d) => { replaceObject(GRAND_JURY_REWARDS, d.text || ''); } },
  vault_trial_prompts: { target: VAULT_TRIAL_PROMPTS, shape: 'json', apply: (d) => { try { replaceObject(VAULT_TRIAL_PROMPTS, JSON.parse(d.json || '{}')); } catch (e) { /* keep default */ } } },
  square_types: { target: SQUARE_TYPES, shape: 'json', apply: (d) => { try { replaceObject(SQUARE_TYPES, JSON.parse(d.json || '{}')); } catch (e) { /* keep default */ } } },
};

export async function hydrateGameContent() {
  if (hydrated) return true;
  try {
    const { items } = await base44.entities.GameContent.filter({}, { sort: 'order', limit: 1000 });
    if (!items || items.length === 0) {
      hydrated = true;
      return true; // DB empty → keep static defaults
    }
    const byCat = {};
    items.forEach((r) => {
      if (!byCat[r.category]) byCat[r.category] = [];
      byCat[r.category].push(r);
    });
    Object.keys(byCat).forEach((cat) => {
      const t = TARGETS[cat];
      if (!t) return;
      const recs = byCat[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
      if (t.shape === 'single' || t.shape === 'json') {
        const d = recs[0]?.data;
        if (d && t.apply) t.apply(d);
      } else if (t.shape === 'stringList') {
        const arr = recs.map((r) => (t.build ? t.build(r.data) : r.data?.text)).filter((x) => x !== undefined && x !== '');
        replaceArray(t.target, arr);
      } else {
        const arr = recs.map((r, i) => (t.build ? t.build(r.data, i) : r.data));
        if (t.mergeById) {
          // Keep every mode defined in code; DB only overrides matching ids.
          const byId = {};
          arr.forEach((x) => { if (x && x.id) byId[x.id] = x; });
          const merged = t.target.map((base) => byId[base.id] || base);
          arr.forEach((x) => {
            if (x && x.id && !merged.some((m) => m.id === x.id)) merged.push(x);
          });
          replaceArray(t.target, merged);
        } else {
          replaceArray(t.target, arr);
        }
      }
    });
    hydrated = true;
    return true;
  } catch (e) {
    console.warn('hydrateGameContent failed, using static defaults', e);
    hydrated = true; // don't retry forever; fall back to static
    return false;
  }
}

export function isGameContentHydrated() {
  return hydrated;
}
