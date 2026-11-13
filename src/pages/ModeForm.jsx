import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { NEW_MODES } from '@/data/modes/modeRegistry';

const NAIL_COLORS = ['Red', 'Pink', 'White', 'Black', 'Nude', 'French', 'Blue', 'Purple', 'Green', 'Orange', 'Gold', 'Silver', 'None'];
const FIELD = 'w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-pink-500/40 text-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-400';
const LEVELS = [
  { id: 'none', label: 'Όχι δεσίματα' },
  { id: 'light', label: 'Ελαφριά (κορδέλες σε καρπούς/αστραγάλους)' },
  { id: 'full', label: 'Και hogtie / δοκάρι (πάντα με ΣΤΟΠ)' },
];

// Φόρμα συμμετοχής για τα 4 νέα modes: η καλεσμένη διαλέγει ένα ή περισσότερα.
export default function ModeForm() {
  const [params] = useSearchParams();
  const first = params.get('mode');
  const [form, setForm] = useState({
    name: '',
    modes: NEW_MODES.some((m) => m.id === first) ? [first] : [],
    adult: false,
    pajamaStyle: '',
    nailColor: 'Pink',
    bringsOwnSlippers: true,
    slipperType: '',
    hasFlipFlops: true,
    alcohol: 'drinks',
    footSensitivity: 3,
    ticklish: 3,
    restraintLevel: 'light',
    blindfoldOk: true,
    boundaries: '',
    safeWordConfirmed: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleMode = (id) => set('modes', form.modes.includes(id) ? form.modes.filter((m) => m !== id) : [...form.modes, id]);
  const has = (...ids) => form.modes.some((m) => ids.includes(m));
  const pajamaish = has('pedi_extended', 'lockdown', 'marathon_4h');
  const beachish = has('beach_bar');
  const canSend = form.name.trim() && form.modes.length > 0 && form.adult && form.safeWordConfirmed && !saving;

  async function submit() {
    if (!canSend) return;
    setSaving(true);
    setError('');
    try {
      await base44.entities.PajamaIntake.create({
        formType: 'modes',
        name: form.name.trim(),
        preferredModes: form.modes,
        adultConfirmed: true,
        pajamaStyle: form.pajamaStyle,
        nailColor: form.nailColor,
        bringsOwnSlippers: form.bringsOwnSlippers,
        slipperType: form.slipperType,
        hasFlipFlops: form.hasFlipFlops,
        alcohol: beachish ? form.alcohol : '',
        footSensitivity: Number(form.footSensitivity),
        ticklish: Number(form.ticklish),
        restraintLevel: form.restraintLevel,
        blindfoldOk: form.blindfoldOk,
        boundaries: form.boundaries,
        safeWordConfirmed: true,
        approved: false,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError('Δεν στάλθηκε. Δοκίμασε ξανά σε λίγο.');
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2 max-w-sm">
          <div className="text-6xl">✨</div>
          <div className="font-heading text-2xl text-pink-100">Ευχαριστώ, {form.name}!</div>
          <div className="text-sm text-pink-300">
            Καταχωρήθηκες για: {form.modes.map((id) => NEW_MODES.find((m) => m.id === id)?.name).join(' · ')}
          </div>
          <div className="text-xs text-pink-400/80">Θα μπεις στο παιχνίδι μόλις η διοργανώτρια εγκρίνει τη φόρμα σου.</div>
        </div>
      </div>
    );
  }

  const TONES = { pink: 'bg-pink-600 border-pink-300 text-white', rose: 'bg-rose-600 border-rose-300 text-white' };
  const Choice = ({ on, onClick, children, tone = 'pink' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-2 rounded-lg text-sm font-bold border ${on ? TONES[tone] : 'bg-slate-950/60 border-pink-500/40 text-pink-200'}`}
    >{children}</button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center pt-4">
          <div className="text-5xl">🎮🩴💅🍹</div>
          <h1 className="font-heading text-2xl sm:text-3xl text-pink-100 drop-shadow-[0_0_18px_rgba(255,105,180,0.85)] mt-1">Deal of Temptation · 18+</h1>
          <p className="text-sm text-pink-300 mt-1">Διάλεξε τι θέλεις να παίξεις και συμπλήρωσε τα στοιχεία σου.</p>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-2">
          <div className="text-sm text-pink-200">Ποιο mode θέλεις; * <span className="opacity-60">(μπορείς πολλά)</span></div>
          <div className="grid gap-2">
            {NEW_MODES.map((m) => {
              const on = form.modes.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMode(m.id)}
                  className={`text-left rounded-lg border p-3 ${on ? 'bg-pink-700/60 border-pink-300' : 'bg-slate-950/60 border-pink-500/40'}`}
                >
                  <div className="font-heading text-lg">{on ? '✅' : '⬜'} {m.icon} {m.name}</div>
                  <div className="text-xs text-pink-200/80">{m.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-3">
          <div>
            <div className="text-sm text-pink-200 mb-1">Όνομα *</div>
            <input className={FIELD} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          {pajamaish && (
            <>
              <div>
                <div className="text-sm text-pink-200 mb-1">Πιτζάμες (χρώμα / σχέδιο)</div>
                <input className={FIELD} value={form.pajamaStyle} onChange={(e) => set('pajamaStyle', e.target.value)} placeholder="π.χ. ροζ σατέν με αστεράκια" />
              </div>
              <div>
                <div className="text-sm text-pink-200 mb-1">Χρώμα νυχιών ποδιών</div>
                <select className={FIELD} value={form.nailColor} onChange={(e) => set('nailColor', e.target.value)}>
                  {NAIL_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-sm text-pink-200 mb-1">Θα φέρεις τις δικές σου παντόφλες;</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice on={form.bringsOwnSlippers} onClick={() => set('bringsOwnSlippers', true)}>🩴 ΝΑΙ</Choice>
                  <Choice on={!form.bringsOwnSlippers} onClick={() => set('bringsOwnSlippers', false)} tone="rose">🙅 ΟΧΙ</Choice>
                </div>
                <input className={`${FIELD} mt-2`} value={form.slipperType} onChange={(e) => set('slipperType', e.target.value)} placeholder={form.bringsOwnSlippers ? 'π.χ. fluffy ροζ' : 'Νούμερο παντόφλας (π.χ. 38)'} />
              </div>
            </>
          )}

          {beachish && (
            <>
              <div>
                <div className="text-sm text-pink-200 mb-1">Έχεις σαγιονάρες; (υποχρεωτικές στο Beach Bar)</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice on={form.hasFlipFlops} onClick={() => set('hasFlipFlops', true)}>🩴 ΝΑΙ</Choice>
                  <Choice on={!form.hasFlipFlops} onClick={() => set('hasFlipFlops', false)} tone="rose">ΟΧΙ, χρειάζομαι</Choice>
                </div>
              </div>
              <div>
                <div className="text-sm text-pink-200 mb-1">Ποτό</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice on={form.alcohol === 'drinks'} onClick={() => set('alcohol', 'drinks')}>🥃 Πίνω</Choice>
                  <Choice on={form.alcohol === 'free'} onClick={() => set('alcohol', 'free')}>🧃 Χωρίς αλκοόλ</Choice>
                </div>
              </div>
            </>
          )}

          <div>
            <div className="text-sm text-pink-200 mb-1">Ευαισθησία πελμάτων (1-5): {form.footSensitivity}</div>
            <input type="range" min="1" max="5" value={form.footSensitivity} onChange={(e) => set('footSensitivity', e.target.value)} className="w-full accent-pink-400" />
          </div>
          <div>
            <div className="text-sm text-pink-200 mb-1">Πόσο γαργαλιέσαι (1-5): {form.ticklish}</div>
            <input type="range" min="1" max="5" value={form.ticklish} onChange={(e) => set('ticklish', e.target.value)} className="w-full accent-pink-400" />
          </div>
          <div>
            <div className="text-sm text-pink-200 mb-1">Δεσίματα: τι σε βολεύει;</div>
            <div className="grid gap-2">
              {LEVELS.map((l) => <Choice key={l.id} on={form.restraintLevel === l.id} onClick={() => set('restraintLevel', l.id)}>{l.label}</Choice>)}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-pink-100/90">
            <input type="checkbox" checked={form.blindfoldOk} onChange={(e) => set('blindfoldOk', e.target.checked)} className="accent-pink-500" />
            Δέχομαι να φορέσω μάσκα ύπνου στις τυφλές δοκιμασίες
          </label>
          <div>
            <div className="text-sm text-pink-200 mb-1">Όρια: τι ΔΕΝ θέλεις</div>
            <textarea rows={3} className={FIELD} value={form.boundaries} onChange={(e) => set('boundaries', e.target.value)} />
          </div>

          <label className="flex items-start gap-2 text-sm text-pink-100/90">
            <input type="checkbox" checked={form.adult} onChange={(e) => set('adult', e.target.checked)} className="mt-1 accent-pink-500" />
            <span>Είμαι 18 ετών ή μεγαλύτερη και συμμετέχω με τη θέλησή μου. *</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-pink-100/90">
            <input type="checkbox" checked={form.safeWordConfirmed} onChange={(e) => set('safeWordConfirmed', e.target.checked)} className="mt-1 accent-pink-500" />
            <span>Κατάλαβα ότι μπορώ να πω ΣΤΟΠ οποιαδήποτε στιγμή και όλα σταματούν. *</span>
          </label>
        </div>

        {error && <div className="text-sm text-red-300 text-center">{error}</div>}
        <button onClick={submit} disabled={!canSend} className="w-full py-3 rounded-xl font-heading text-xl bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-40">
          {saving ? 'ΑΠΟΣΤΟΛΗ...' : 'ΑΠΟΣΤΟΛΗ'}
        </button>
      </div>
    </div>
  );
}
