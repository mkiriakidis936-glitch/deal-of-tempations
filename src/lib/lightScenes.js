// 11.1.0 · Φώτα του σπιτιού (Samsung SmartThings: λάμπες & LED ταινίες Tapo κ.ά.) που «παίζουν» με το παιχνίδι.
// Καθαρή συνάρτηση, κοινή για server και τεστ: από την κατάσταση → τι χρώμα/ένταση θέλουμε τώρα.
// Δεν αλλάζει τίποτα στο παιχνίδι. Οι λάμπες Tapo περνούν από cloud (καθυστέρηση 1–2″, όριο εντολών),
// γι' αυτό οι αλλαγές είναι ήπιες: καμία γρήγορη αναλαμπή/strobe — η πιο γρήγορη εναλλαγή είναι κάθε 6″.
// ΑΣΦΑΛΕΙΑ: σε ΣΤΟΠ ανάβουν όλα σε δυνατό, ζεστό λευκό φως.

// Χρώματα σε κλίμακα SmartThings: hue 0–100 (= 0–360°), saturation 0–100. «warm» = ζεστό λευκό (Kelvin).
import { currentAct, isNight as engineNight } from './campaignEngine.js';

export const C = {
  gold: { hue: 11, saturation: 85 },
  red: { hue: 0, saturation: 95 },
  blue: { hue: 64, saturation: 95 },
  violet: { hue: 76, saturation: 90 },
  pink: { hue: 89, saturation: 85 },
  magenta: { hue: 83, saturation: 100 },
  teal: { hue: 49, saturation: 85 },
  cyan: { hue: 53, saturation: 90 },
  orange: { hue: 7, saturation: 100 },
  warm: { kelvin: 2700 },
  white: { kelvin: 4000 },
};

// Χρώμα βάσης ανά ήπειρο (λάμπες = ατμόσφαιρα, ταινίες = έντονο χρώμα).
export const CONTINENT_LIGHT = {
  classic: { lamp: C.gold, strip: C.gold, alt: C.orange },
  arrest_heist: { lamp: C.red, strip: C.blue, alt: C.red }, // σειρήνα: κόκκινο/μπλε
  lockdown: { lamp: C.violet, strip: C.violet, alt: C.magenta },
  marathon_4h: { lamp: C.pink, strip: C.magenta, alt: C.blue },
  villa_takeover: { lamp: C.teal, strip: C.cyan, alt: C.gold },
};

export const MIN_CYCLE_MS = 6000;

const light = (color, level, extra = {}) => ({ on: true, level, ...color, ...extra });
const OFF = { on: false };

// state: η κατάσταση της συνεδρίας. opts: { calm } = χωρίς εναλλαγές χρωμάτων.
// Επιστρέφει null όταν τα φώτα δεν πρέπει να αγγιχτούν (π.χ. απενεργοποιημένα ή χωρίς Ταινία).
export function lightScene(state = {}, now = Date.now(), opts = {}) {
  if (!state || state.lightsOn === false) return null;
  const mg = state.mg || {};
  // 1) Ασφάλεια πάνω απ' όλα.
  if (state.stopActive || mg.stop) return { id: 'safety', lamp: light(C.white, 100), strip: light(C.warm, 70) };
  // 2) Χειροκίνητο από το Tablet.
  if (state.lightsManual === 'normal') return { id: 'normal', lamp: light(C.warm, 90), strip: light(C.warm, 60) };
  if (state.lightsManual === 'dim') return { id: 'dim', lamp: light(C.warm, 25), strip: light(C.warm, 15) };
  const cg = mg.cg;
  if (!cg) return null;
  const pal = CONTINENT_LIGHT[currentContinent(cg)] || CONTINENT_LIGHT.classic;
  const cycle = (colors, level, period = MIN_CYCLE_MS) => {
    if (opts.calm) return light(colors[0], level);
    const i = Math.floor(now / Math.max(MIN_CYCLE_MS, period)) % colors.length;
    return light(colors[i], level, { cycle: true });
  };
  const status = cg.status || 'transition';

  if (status === 'finale') return { id: 'finale', lamp: light(C.gold, 100), strip: cycle([C.gold, C.pink, C.cyan], 100) };
  if (status === 'standby') return { id: 'standby', lamp: light(C.warm, 45), strip: light(C.warm, 30) };
  if (cg.mandatory?.pending) return { id: 'mandatory', lamp: light(C.violet, 35), strip: cycle([C.violet, C.red], 90) };
  if (status === 'transition') return { id: 'transition', lamp: light(pal.lamp, 55), strip: light(pal.strip, 80) };

  // Ενεργή πράξη: πρώτα ό,τι συμβαίνει τώρα στην TV.
  const w = cg.wheel;
  if (w && !w.done && now - w.at < 4500) return { id: 'wheel-spin', lamp: light(pal.lamp, 20), strip: cycle([C.pink, C.blue, C.gold], 100) };
  if (w && !w.done && now - w.at < 15000) return { id: 'wheel-result', lamp: light(C.red, 35), strip: light(C.red, 100) };
  if (cg.board?.roll && now - cg.board.roll.at < 3000) return { id: 'dice', lamp: light(pal.lamp, 40), strip: light(C.white, 100) };
  const d = cg.dond;
  if (cg.game === 'dond' && d && ['final', 'offer'].includes(d.status)) return { id: 'dond-tension', lamp: light(C.gold, 25), strip: cycle([C.gold, C.orange], 90) };
  if (cg.game === 'dond' && d?.status === 'won' && d.awardedAt && now - d.awardedAt < 20000) return { id: 'dond-win', lamp: light(C.gold, 90), strip: light(C.gold, 100) };
  if (cg.trial && !cg.trial.done) return { id: 'trial', lamp: light(C.red, 30), strip: light(C.red, 85) };
  if (cg.drawn && now - cg.drawn.at < 8000) return { id: 'draw', lamp: light(pal.lamp, 40), strip: light(C.gold, 100) };

  // Νύχτα: πιο σκοτεινά.
  if (isNight(cg)) return { id: 'night', lamp: light(C.violet, 15), strip: light(pal.strip, 35) };
  return { id: 'act', lamp: light(pal.lamp, 50), strip: light(pal.strip, 75) };
}

function currentContinent(cg) {
  try { return currentAct(cg).continent; } catch { return 'classic'; }
}
function isNight(cg) {
  try { return engineNight(cg) && cg.status === 'active'; } catch { return false; }
}

// Μετατροπή επιθυμητής κατάστασης → εντολές SmartThings για μία συσκευή.
// caps: οι δυνατότητες της συσκευής (switch, switchLevel, colorControl, colorTemperature).
export function commandsFor(want, caps = []) {
  if (!want) return [];
  const has = (c) => caps.includes(c);
  if (!want.on) return has('switch') ? [{ component: 'main', capability: 'switch', command: 'off' }] : [];
  const out = [];
  if (has('switch')) out.push({ component: 'main', capability: 'switch', command: 'on' });
  if (want.kelvin && has('colorTemperature')) out.push({ component: 'main', capability: 'colorTemperature', command: 'setColorTemperature', arguments: [want.kelvin] });
  else if (want.hue !== undefined && has('colorControl')) out.push({ component: 'main', capability: 'colorControl', command: 'setColor', arguments: [{ hue: want.hue, saturation: want.saturation }] });
  if (has('switchLevel') && want.level !== undefined) out.push({ component: 'main', capability: 'switchLevel', command: 'setLevel', arguments: [Math.max(1, Math.min(100, Math.round(want.level)))] });
  return out;
}

// Κλειδί σύγκρισης: στέλνουμε εντολή μόνο αν άλλαξε κάτι.
export const wantKey = (want) => (want ? JSON.stringify([want.on, want.level, want.hue, want.saturation, want.kelvin]) : 'none');

export const OFF_LIGHT = OFF;
