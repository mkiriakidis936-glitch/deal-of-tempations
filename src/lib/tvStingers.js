// Ποιο τηλεοπτικό «stinger» πρέπει να παίξει, συγκρίνοντας την προηγούμενη με την τωρινή κατάσταση του ταμπλό.
// Καθαρή συνάρτηση (χωρίς browser), ώστε να ελέγχεται με tests.
export const STINGERS = ['dice', 'loot', 'card', 'market', 'arrest', 'truth', 'lie', 'alert', 'tickle', 'finale', 'winner', 'crown', 'round', 'golden', 'confess', 'weather', 'dossier', 'news', 'drama'];

export function tvStingers(prev = {}, next = {}) {
  const out = [];
  const changed = (get) => {
    const a = get(prev);
    const b = get(next);
    return b != null && b !== a;
  };
  if (changed((s) => s.lastRoll?.at)) {
    out.push('dice');
    if (next.lastRoll?.square === 'loot') out.push('loot');
  }
  if (changed((s) => s.card?.at)) out.push(next.card?.market ? 'market' : 'card');
  if (changed((s) => s.interro?.id)) out.push('arrest');
  if (changed((s) => s.verdict?.at)) out.push(next.verdict?.key === 'allTruth' ? 'truth' : 'lie');
  if (changed((s) => s.alert?.until)) out.push('alert');
  if (changed((s) => s.tickle?.at)) out.push('tickle');
  if (changed((s) => s.finale?.startedAt)) out.push('finale');
  if (changed((s) => s.finale?.winner)) out.push('winner');
  if (changed((s) => s.queen)) out.push('crown');
  if (changed((s) => s.round) && prev.round != null) out.push('round');
  if (changed((s) => s.golden?.at)) out.push('golden');
  if (changed((s) => s.onAir?.at)) out.push('confess');
  if (changed((s) => s.weatherAt)) out.push('weather');
  if (changed((s) => s.dossierQ?.id)) out.push('dossier');
  if (changed((s) => s.dossierQ?.revealed) && next.dossierQ?.revealed) out.push('winner');
  if (changed((s) => s.news?.[0]?.key || s.news?.[0]?.id)) out.push('news');
  if (changed((s) => s.ceremony?.at)) out.push(next.ceremony?.revealed ? 'winner' : 'card');
  return out;
}
