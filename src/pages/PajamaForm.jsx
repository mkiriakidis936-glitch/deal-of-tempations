import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ART } from '@/data/brandArt';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';
const PAJAMA_TITLE = 'Pajama Pedi-Glam';

const NAIL_COLORS = ['Red', 'Pink', 'White', 'Black', 'Nude', 'French', 'Blue', 'Purple', 'Green', 'Orange', 'Gold', 'Silver', 'None'];

const FIELD = 'w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-pink-500/40 text-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-400';

export default function PajamaForm() {
  const [form, setForm] = useState({
    name: '',
    pajamaStyle: '',
    nailColor: 'Pink',
    slipperType: '',
    bringsOwnSlippers: true,
    footSensitivity: 3,
    ticklish: 3,
    boundaries: '',
    safeWordConfirmed: false,
    customAnswers: {},
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);

  const progress = Math.round(([form.name.trim(), form.safeWordConfirmed].filter(Boolean).length / 2) * 100);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.safeWordConfirmed || !customQuestionsValid) return;
    setSaving(true);
    try {
      await base44.entities.PajamaIntake.create({
        ...form,
        name: form.name.trim(),
        footSensitivity: Number(form.footSensitivity),
        ticklish: Number(form.ticklish),
        approved: false,
        customAnswers: form.customAnswers,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="text-6xl">🩴💅</div>
          <div className="font-heading text-2xl text-pink-100">Ευχαριστώ, {form.name}!</div>
          <div className="text-sm text-pink-300">Το προφίλ σου για το {PAJAMA_TITLE} καταχωρήθηκε.</div>
          <div className="text-xs text-pink-400/80">Θα μπεις στο παιχνίδι μόλις η διοργανώτρια εγκρίνει τη φόρμα σου.</div>
          {!form.bringsOwnSlippers && (
            <div className="text-xs text-amber-200">🩴 Οι παντόφλες σου θα σε περιμένουν εκεί.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-xl mx-auto space-y-3">
        <div className="text-center pt-4 rounded-2xl border border-pink-400/30 bg-black/30 p-4 shadow-2xl">
          <img src={ART.photoPediGlam} alt="Pajama Pedi-Glam" className="w-full h-44 sm:h-56 object-cover rounded-xl mb-4" />
          <div className="text-5xl">🛏️🩴💅🎀</div>
          <h1 className="font-heading text-2xl sm:text-3xl text-pink-100 drop-shadow-[0_0_18px_rgba(255,105,180,0.85)] mt-1">
            {PAJAMA_TITLE}
          </h1>
          <p className="text-sm text-pink-300 mt-1">Συμπλήρωσε τα στοιχεία σου πριν το πιτζάμα πάρτι.</p>
          <div className="mt-4 flex justify-between text-xs text-pink-200"><span>ΠΡΟΟΔΟΣ ΦΟΡΜΑΣ</span><span>{progress}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-300 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3 space-y-3">
          <div>
            <div className="text-sm text-pink-200 mb-1">Όνομα *</div>
            <input className={FIELD} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
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
            <div className="text-sm text-pink-200 mb-1">Θα φέρεις τις δικές σου παντόφλες; *</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set('bringsOwnSlippers', true)}
                className={`py-2 rounded-lg text-sm font-bold border ${form.bringsOwnSlippers ? 'bg-pink-600 border-pink-300 text-white' : 'bg-slate-950/60 border-pink-500/40 text-pink-200'}`}
              >
                🩴 ΝΑΙ, δικές μου
              </button>
              <button
                type="button"
                onClick={() => set('bringsOwnSlippers', false)}
                className={`py-2 rounded-lg text-sm font-bold border ${!form.bringsOwnSlippers ? 'bg-rose-600 border-rose-300 text-white' : 'bg-slate-950/60 border-pink-500/40 text-pink-200'}`}
              >
                🙅 ΟΧΙ
              </button>
            </div>
            <input
              className={`${FIELD} mt-2`}
              value={form.slipperType}
              onChange={(e) => set('slipperType', e.target.value)}
              placeholder={form.bringsOwnSlippers ? 'π.χ. fluffy ροζ, σαγιονάρα' : 'Νούμερο παντόφλας (π.χ. 38)'}
            />
            {!form.bringsOwnSlippers && (
              <div className="mt-2 text-xs text-amber-100 bg-amber-950/40 border border-amber-400/40 rounded-lg p-2">
                🩴 Μην αγχώνεσαι — οι παντόφλες θα σε περιμένουν εκεί. Η διοργανώτρια τις προμηθεύεται.
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-pink-200 mb-1">Ευαισθησία πελμάτων (1-5): {form.footSensitivity}</div>
            <input type="range" min="1" max="5" value={form.footSensitivity} onChange={(e) => set('footSensitivity', e.target.value)} className="w-full accent-pink-400" />
          </div>
          <div>
            <div className="text-sm text-pink-200 mb-1">Πόσο γαργαλιέσαι (1-5): {form.ticklish}</div>
            <input type="range" min="1" max="5" value={form.ticklish} onChange={(e) => set('ticklish', e.target.value)} className="w-full accent-pink-400" />
          </div>
          <div>
            <div className="text-sm text-pink-200 mb-1">Όρια — τι ΔΕΝ θέλεις</div>
            <textarea rows={3} className={FIELD} value={form.boundaries} onChange={(e) => set('boundaries', e.target.value)} />
          </div>
          <CustomFormQuestions formType="pajama" value={form.customAnswers} onChange={(value) => set('customAnswers', value)} onValidityChange={setCustomQuestionsValid} className="space-y-3" />
          <label className="flex items-start gap-2 text-sm text-pink-100/90">
            <input type="checkbox" checked={form.safeWordConfirmed} onChange={(e) => set('safeWordConfirmed', e.target.checked)} className="mt-1 accent-pink-500" />
            <span>Διάβασα τα όρια και συμφωνώ με το STOP / safe word. *</span>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving || !form.name.trim() || !form.safeWordConfirmed || !customQuestionsValid}
          className="w-full py-3 rounded-xl font-heading text-xl bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-40"
        >
          {saving ? 'ΑΠΟΣΤΟΛΗ...' : 'ΑΠΟΣΤΟΛΗ'}
        </button>
      </div>
    </div>
  );
}