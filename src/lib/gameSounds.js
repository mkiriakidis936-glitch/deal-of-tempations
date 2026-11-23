// Δικοί σου ήχοι για το παιχνίδι (Admin → Φωτογραφίες & βίντεο → Site & TV → Ήχοι παιχνιδιού).
// Αν μια θέση έχει αρχείο, παίζει αυτό· αλλιώς παίζει ο ενσωματωμένος συνθετικός ήχος.

export const GAME_SOUND_SLOTS = [
  { id: 'sfx.ok', label: '✅ Σωστό', where: 'Tablet & κινητά — επιτυχία' },
  { id: 'sfx.fail', label: '❌ Λάθος', where: 'Tablet & κινητά — αποτυχία' },
  { id: 'sfx.alarm', label: '🚨 Συναγερμός', where: 'ΣΤΟΠ, Lockdown, προειδοποιήσεις' },
  { id: 'sfx.horn', label: '📯 Κόρνα', where: 'Λήξη χρόνου, αλλαγή φάσης' },
  { id: 'tv.dice', label: '🎲 Ζάρι', where: 'TV — ζαριά' },
  { id: 'tv.card', label: '🃏 Κάρτα', where: 'TV — αποκάλυψη κάρτας' },
  { id: 'tv.loot', label: '💰 Λεία', where: 'TV — κέρδος λείας' },
  { id: 'tv.arrest', label: '🚔 Σύλληψη', where: 'TV — χειροπέδες / σύλληψη' },
  { id: 'tv.market', label: '🕶️ Μαύρη αγορά', where: 'TV — μαύρη αγορά' },
  { id: 'tv.truth', label: '🟢 Αλήθεια', where: 'TV — ετυμηγορία αλήθεια' },
  { id: 'tv.lie', label: '🔴 Ψέμα', where: 'TV — ετυμηγορία ψέμα' },
  { id: 'tv.alert', label: '⚠️ Ειδοποίηση', where: 'TV — σημαντική ανακοίνωση' },
  { id: 'tv.round', label: '🔁 Νέος γύρος', where: 'TV — αρχή γύρου' },
  { id: 'tv.golden', label: '✨ Χρυσό λεπτό', where: 'TV — Golden Minute' },
  { id: 'tv.finale', label: '🥁 Φινάλε', where: 'TV — έναρξη φινάλε' },
  { id: 'tv.winner', label: '🏆 Νικήτρια', where: 'TV — ανακοίνωση νικήτριας' },
  { id: 'tv.crown', label: '👑 Στέψη', where: 'TV — τελετή στεφανώματος' },
  { id: 'tv.drama', label: '🎭 Δραματική στιγμή', where: 'TV — δραματική ανακοίνωση' },
];

export const GAME_SOUNDS = {};

export function setGameSounds(map = {}) {
  for (const key of Object.keys(GAME_SOUNDS)) delete GAME_SOUNDS[key];
  for (const [key, url] of Object.entries(map || {})) if (typeof url === 'string' && url) GAME_SOUNDS[key] = url;
}

let lastAudio = null;
export function playSoundFile(url, volume = 0.9) {
  try {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {});
    lastAudio = audio;
    return audio;
  } catch { return null; }
}
export const stopSoundFile = () => { try { lastAudio?.pause(); } catch { /* ignore */ } };

// Τυλίγει ένα αντικείμενο ήχων: αν υπάρχει δικό σου αρχείο για τη θέση, παίζει εκείνο.
export function withCustomSounds(prefix, sounds) {
  for (const key of Object.keys(sounds)) {
    const synth = sounds[key];
    sounds[key] = (...args) => {
      const url = GAME_SOUNDS[`${prefix}.${key}`];
      if (url) { playSoundFile(url); return undefined; }
      return synth(...args);
    };
  }
  return sounds;
}
