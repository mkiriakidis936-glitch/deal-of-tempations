import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import { MODE_COVERS } from '@/data/brandArt';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';

const NAIL_COLORS = ['Red', 'Pink', 'White', 'Black', 'Nude', 'French', 'Blue', 'Purple', 'Green', 'Orange', 'Gold', 'Silver', 'None'];
const FIELD = 'w-full px-3 py-2 rounded-lg bg-input border border-primary/40 text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
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
    customAnswers: {},
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleMode = (id) => set('modes', form.modes.includes(id) ? form.modes.filter((m) => m !== id) : [...form.modes, id]);
  const has = (...ids) => form.modes.some((m) => ids.includes(m));
  const pajamaish = has('pedi_extended', 'lockdown', 'marathon_4h');
  const beachish = has('beach_bar');
  const canSend = form.name.trim() && form.modes.length > 0 && form.adult && form.safeWordConfirmed && customQuestionsValid && !saving;

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
        customAnswers: form.customAnswers,
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-center space-y-2 max-w-sm">
          <div className="text-6xl">✨</div>
          <div className="font-heading text-2xl text-foreground">Ευχαριστώ, {form.name}!</div>
          <div className="text-sm text-muted-foreground">
            Καταχωρήθηκες για: {form.modes.map((id) => NEW_MODES.find((m) => m.id === id)?.name).join(' · ')}
          </div>
          <div className="text-xs text-muted-foreground">Θα μπεις στο παιχνίδι μόλις η διοργανώτρια εγκρίνει τη φόρμα σου.</div>
        </div>
      </div>
    );
  }

  const TONES = { pink: 'bg-primary text-primary-foreground border-primary ', rose: 'bg-accent text-accent-foreground border-accent ' };
  const Choice = ({ on, onClick, children, tone = 'pink' }) => (
    <button
      type="button"
      onClick={onClick}
      className={`py-2 px-2 rounded-lg text-sm font-bold border ${on ? TONES[tone] : 'bg-input border-primary/40 text-foreground/80'}`}
    >{children}</button>
  );

  const progress = step === 0 ? 50 : 100;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center pt-4 rounded-2xl border border-primary/30 bg-black/30 p-5 shadow-2xl">
          <div className="text-5xl">🎮🩴💅🍹</div>
          <h1 className="font-heading text-2xl sm:text-3xl text-foreground drop-shadow-[0_0_18px_rgba(255,105,180,0.85)] mt-2">Deal of Temptation · 18+</h1>
          <p className="text-sm text-muted-foreground mt-2">Φόρμα συμμετοχής — επίλεξε τα Modes και συμπλήρωσε τα στοιχεία σου.</p>
          <div className="mt-5 flex items-center justify-between text-xs text-foreground/80"><span>ΒΗΜΑ {step + 1} ΑΠΟ 2</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
        </div>

        {step === 0 && <div className="rounded-xl border border-primary/40 bg-surface-2 p-3 space-y-2">
          <div className="text-sm text-foreground/80">Ποιο mode θέλεις; * <span className="opacity-60">(μπορείς πολλά)</span></div>
          <div className="grid gap-2">
            {NEW_MODES.map((m) => {
              const on = form.modes.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMode(m.id)}
                  className={`text-left rounded-lg border p-3 ${on ? 'bg-primary/25 border-primary' : 'bg-input border-primary/40'}`}
                >
                  <div className="flex items-start gap-3">
                    {MODE_COVERS[`modeCover_${m.id}`] && <img src={MODE_COVERS[`modeCover_${m.id}`]} alt={m.name} loading="lazy" className="w-24 h-20 sm:w-28 sm:h-24 rounded-lg object-cover shrink-0 border border-primary/30" />}
                    <div className="min-w-0"><div className="font-heading text-lg">{on ? '✅' : '⬜'} {m.icon} {m.name}</div><div className="text-xs text-foreground/70 mt-1">{m.desc}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>}

        {step === 1 && <div className="rounded-xl border border-primary/40 bg-surface-2 p-3 space-y-3">
          <div>
            <div className="text-sm text-foreground/80 mb-1">Όνομα *</div>
            <input className={FIELD} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          {pajamaish && (
            <>
              <div>
                <div className="text-sm text-foreground/80 mb-1">Πιτζάμες (χρώμα / σχέδιο)</div>
                <input className={FIELD} value={form.pajamaStyle} onChange={(e) => set('pajamaStyle', e.target.value)} placeholder="π.χ. ροζ σατέν με αστεράκια" />
              </div>
              <div>
                <div className="text-sm text-foreground/80 mb-1">Χρώμα νυχιών ποδιών</div>
                <select className={FIELD} value={form.nailColor} onChange={(e) => set('nailColor', e.target.value)}>
                  {NAIL_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-sm text-foreground/80 mb-1">Θα φέρεις τις δικές σου παντόφλες;</div>
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
                <div className="text-sm text-foreground/80 mb-1">Έχεις σαγιονάρες; (υποχρεωτικές στο Beach Bar)</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice on={form.hasFlipFlops} onClick={() => set('hasFlipFlops', true)}>🩴 ΝΑΙ</Choice>
                  <Choice on={!form.hasFlipFlops} onClick={() => set('hasFlipFlops', false)} tone="rose">ΟΧΙ, χρειάζομαι</Choice>
                </div>
              </div>
              <div>
                <div className="text-sm text-foreground/80 mb-1">Ποτό</div>
                <div className="grid grid-cols-2 gap-2">
                  <Choice on={form.alcohol === 'drinks'} onClick={() => set('alcohol', 'drinks')}>🥃 Πίνω</Choice>
                  <Choice on={form.alcohol === 'free'} onClick={() => set('alcohol', 'free')}>🧃 Χωρίς αλκοόλ</Choice>
                </div>
              </div>
            </>
          )}

          <div>
            <div className="text-sm text-foreground/80 mb-1">Ευαισθησία πελμάτων (1-5): {form.footSensitivity}</div>
            <input type="range" min="1" max="5" value={form.footSensitivity} onChange={(e) => set('footSensitivity', e.target.value)} className="w-full accent-primary" />
          </div>
          <div>
            <div className="text-sm text-foreground/80 mb-1">Πόσο γαργαλιέσαι (1-5): {form.ticklish}</div>
            <input type="range" min="1" max="5" value={form.ticklish} onChange={(e) => set('ticklish', e.target.value)} className="w-full accent-primary" />
          </div>
          <div>
            <div className="text-sm text-foreground/80 mb-1">Δεσίματα: τι σε βολεύει;</div>
            <div className="grid gap-2">
              {LEVELS.map((l) => <Choice key={l.id} on={form.restraintLevel === l.id} onClick={() => set('restraintLevel', l.id)}>{l.label}</Choice>)}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/90">
            <input type="checkbox" checked={form.blindfoldOk} onChange={(e) => set('blindfoldOk', e.target.checked)} className="accent-primary" />
            Δέχομαι να φορέσω μάσκα ύπνου στις τυφλές δοκιμασίες
          </label>
          <div>
            <div className="text-sm text-foreground/80 mb-1">Όρια: τι ΔΕΝ θέλεις</div>
            <textarea rows={3} className={FIELD} value={form.boundaries} onChange={(e) => set('boundaries', e.target.value)} />
          </div>

          <CustomFormQuestions formType="modes" value={form.customAnswers} onChange={(value) => set('customAnswers', value)} onValidityChange={setCustomQuestionsValid} className="space-y-3" />

          <label className="flex items-start gap-2 text-sm text-foreground/90">
            <input type="checkbox" checked={form.adult} onChange={(e) => set('adult', e.target.checked)} className="mt-1 accent-primary" />
            <span>Είμαι 18 ετών ή μεγαλύτερη και συμμετέχω με τη θέλησή μου. *</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-foreground/90">
            <input type="checkbox" checked={form.safeWordConfirmed} onChange={(e) => set('safeWordConfirmed', e.target.checked)} className="mt-1 accent-primary" />
            <span>Κατάλαβα ότι μπορώ να πω ΣΤΟΠ οποιαδήποτε στιγμή και όλα σταματούν. *</span>
          </label>
        </div>}

        {error && <div className="text-sm text-red-300 text-center">{error}</div>}
        {step === 0 ? <button type="button" onClick={() => setStep(1)} disabled={!form.modes.length} className="w-full py-3 rounded-xl font-heading text-xl bg-primary text-primary-foreground hover:bg-primary/90  disabled:opacity-40">ΣΥΝΕΧΕΙΑ ΣΤΑ ΣΤΟΙΧΕΙΑ →</button> : <div className="flex gap-2"><button type="button" onClick={() => setStep(0)} className="px-5 py-3 rounded-xl font-bold border border-primary/40 text-foreground">← ΠΙΣΩ</button><button onClick={submit} disabled={!canSend} className="w-full py-3 rounded-xl font-heading text-xl bg-primary text-primary-foreground hover:bg-primary/90  disabled:opacity-40">
          {saving ? 'ΑΠΟΣΤΟΛΗ...' : 'ΑΠΟΣΤΟΛΗ'}
        </button></div>}
      </div>
    </div>
  );
}
