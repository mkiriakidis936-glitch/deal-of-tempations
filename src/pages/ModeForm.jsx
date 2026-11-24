import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appApi } from '@/api/apiClient';
import { NEW_MODES } from '@/data/modes/modeRegistry';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';
import { FormShell, Section, Field, TextInput, TextArea, ChoiceGroup, Scale, Toggle, ConsentCheck, FooterBar, SuccessScreen, formImageFor } from '@/components/forms/FormKit';

const NAIL_COLORS = [
  { id: 'Red', label: 'Κόκκινο', icon: '🔴' }, { id: 'Pink', label: 'Ροζ', icon: '🩷' }, { id: 'White', label: 'Άσπρο', icon: '⚪' }, { id: 'Black', label: 'Μαύρο', icon: '⚫' },
  { id: 'Nude', label: 'Nude', icon: '🤎' }, { id: 'French', label: 'Γαλλικό', icon: '💅' }, { id: 'Blue', label: 'Μπλε', icon: '🔵' }, { id: 'Purple', label: 'Μωβ', icon: '🟣' },
  { id: 'Green', label: 'Πράσινο', icon: '🟢' }, { id: 'Orange', label: 'Πορτοκαλί', icon: '🟠' }, { id: 'Gold', label: 'Χρυσό', icon: '✨' }, { id: 'Silver', label: 'Ασημί', icon: '🤍' }, { id: 'None', label: 'Χωρίς', icon: '⭕' },
];
const LEVELS = [
  { id: 'none', label: 'Όχι', icon: '🙅', hint: 'καθόλου δέσιμο' },
  { id: 'light', label: 'Ελαφριά', icon: '🎀', hint: 'κορδέλες' },
  { id: 'full', label: 'Πλήρη', icon: '⛓️', hint: 'πάντα με ΣΤΟΠ' },
];

// Φόρμα συμμετοχής για τα διαθέσιμα νέα modes: η καλεσμένη διαλέγει ένα ή περισσότερα.
export default function ModeForm() {
  const [params] = useSearchParams();
  const first = params.get('mode');
  const sessionCode = params.get('sessionCode') || params.get('code') || params.get('event') || '';
  const dotEventId = params.get('eventId') || params.get('dotEventId') || '';
  const roomCode = (params.get('roomCode') || params.get('event') || '').trim().toUpperCase();
  const [form, setForm] = useState({
    name: '',
    mode: NEW_MODES.some((m) => m.id === first) ? first : '',
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
  const [step, setStep] = useState(first && NEW_MODES.some((m) => m.id === first) ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectMode = (id) => set('mode', id);
  const has = (...ids) => ids.includes(form.mode);
  const pajamaish = has('pedi_glam', 'pedi_extended', 'lockdown', 'marathon_4h', 'villa_takeover');
  const beachish = has('beach_bar');
  const canSend = form.name.trim() && NEW_MODES.some((m) => m.id === form.mode) && form.adult && form.safeWordConfirmed && customQuestionsValid && !saving;

  async function submit() {
    if (!canSend) return;
    setSaving(true);
    setError('');
    try {
      await appApi.entities.PajamaIntake.create({
        formType: 'modes',
        ...(sessionCode ? { sessionCode: sessionCode.trim().toUpperCase() } : {}),
        ...(dotEventId ? { dotEventId } : {}),
        ...(roomCode ? { roomCode } : {}),
        name: form.name.trim(),
        preferredModes: [form.mode],
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

  const selectedMode = NEW_MODES.find((m) => m.id === form.mode);
  const image = formImageFor(form.mode || first || 'lockdown');

  if (saved) return <SuccessScreen name={form.name.trim()} modeName={selectedMode?.name} image={image} />;

  const stepValid = step === 0 ? !!selectedMode : step === 1 ? form.name.trim().length > 0 : canSend;
  const next = () => {
    if (step < 2) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } else submit();
  };

  return (
    <FormShell
      image={image}
      kicker="Φόρμα συμμετοχής · 18+"
      title={selectedMode ? selectedMode.name : 'Διάλεξε εμπειρία'}
      subtitle={selectedMode ? `${selectedMode.minutes}′ · ${selectedMode.min}–${selectedMode.max} παίκτριες` : 'Μία εμπειρία ανά αίτηση.'}
      steps={['Εμπειρία', 'Στοιχεία', 'Όρια']}
      step={step}
      footer={(
        <FooterBar
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
          onNext={next}
          nextLabel={step < 2 ? 'Συνέχεια' : 'Αποστολή αίτησης'}
          disabled={!stepValid}
          busy={saving}
          hint={step === 2 && !canSend ? 'Επιβεβαίωσε τις δύο δηλώσεις για να στείλεις.' : error || ''}
        />
      )}
    >
      {step === 0 && (
        <Section title="Ποια εμπειρία θέλεις;" hint="Επίλεξε ακριβώς μία.">
          <div className="grid gap-3">
            {NEW_MODES.map((m) => {
              const on = form.mode === m.id;
              return (
                <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => selectMode(m.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all ${on ? 'border-[#E8C26B] bg-[#E8C26B]/12 shadow-[0_0_0_1px_#E8C26B]' : 'border-white/10 bg-white/[0.03]'}`}>
                  <img src={formImageFor(m.id)} alt="" loading="lazy" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">{m.icon} {m.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-white/55">{m.desc}</div>
                    <div className="mt-1 text-[11px] font-semibold text-[#E8C26B]">{m.minutes}′ · {m.min}–{m.max} παίκτριες</div>
                  </div>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${on ? 'border-[#E8C26B] bg-[#E8C26B] text-black' : 'border-white/30'}`}>{on ? '✓' : ''}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {step === 1 && (
        <>
          <Section icon="👤" title="Τα στοιχεία σου">
            <Field label="Όνομα ή ψευδώνυμο" required input>
              <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="π.χ. Μαρία" autoComplete="given-name" />
            </Field>
          </Section>
          {pajamaish && (
            <Section icon="🩴" title="Η εμφάνισή σου">
              <Field label="Πιτζάμες (χρώμα / σχέδιο)" input>
                <TextInput value={form.pajamaStyle} onChange={(e) => set('pajamaStyle', e.target.value)} placeholder="π.χ. ροζ σατέν με αστεράκια" />
              </Field>
              <Field label="Χρώμα νυχιών ποδιών">
                <ChoiceGroup cols={4} size="sm" options={NAIL_COLORS} value={form.nailColor} onChange={(v) => set('nailColor', v)} />
              </Field>
              <Toggle label="Φέρνω τις δικές μου παντόφλες" checked={form.bringsOwnSlippers} onChange={(v) => set('bringsOwnSlippers', v)} />
              <Field label={form.bringsOwnSlippers ? 'Τι παντόφλες;' : 'Νούμερο παντόφλας'} input>
                <TextInput value={form.slipperType} onChange={(e) => set('slipperType', e.target.value)} placeholder={form.bringsOwnSlippers ? 'π.χ. fluffy ροζ' : 'π.χ. 38'} />
              </Field>
            </Section>
          )}
          {beachish && (
            <Section icon="🍹" title="Beach Bar">
              <Toggle label="Έχω σαγιονάρες" hint="Είναι απαραίτητες στο Beach Bar" checked={form.hasFlipFlops} onChange={(v) => set('hasFlipFlops', v)} />
              <Field label="Ποτό">
                <ChoiceGroup options={[{ id: 'drinks', label: 'Πίνω', icon: '🥃' }, { id: 'free', label: 'Χωρίς αλκοόλ', icon: '🧃' }]} value={form.alcohol} onChange={(v) => set('alcohol', v)} />
              </Field>
            </Section>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <Section icon="🎚️" title="Οι προτιμήσεις σου" hint="Μας βοηθούν να διαλέξουμε τις σωστές δοκιμασίες για σένα.">
            <Scale label="Ευαισθησία πελμάτων" icon="🦶" value={form.footSensitivity} onChange={(v) => set('footSensitivity', v)} />
            <Scale label="Πόσο γαργαλιέσαι" icon="🪶" value={form.ticklish} onChange={(v) => set('ticklish', v)} />
            <Field label="Δεσίματα">
              <ChoiceGroup cols={3} options={LEVELS} value={form.restraintLevel} onChange={(v) => set('restraintLevel', v)} />
            </Field>
            <Toggle label="Δέχομαι μάσκα ύπνου" hint="Στις «τυφλές» δοκιμασίες" checked={form.blindfoldOk} onChange={(v) => set('blindfoldOk', v)} />
          </Section>
          <Section icon="🔒" title="Τα όριά σου" hint="Τα βλέπει μόνο η διοργανώτρια — ποτέ οι υπόλοιπες.">
            <Field label="Τι ΔΕΝ θέλεις να σου συμβεί" input>
              <TextArea value={form.boundaries} onChange={(e) => set('boundaries', e.target.value)} placeholder="Γράψε ελεύθερα — όλα γίνονται σεβαστά." />
            </Field>
            <CustomFormQuestions formType="modes" value={form.customAnswers} onChange={(value) => set('customAnswers', value)} onValidityChange={setCustomQuestionsValid} className="space-y-3" />
          </Section>
          <Section icon="✅" title="Δηλώσεις">
            <ConsentCheck checked={form.adult} onChange={(v) => set('adult', v)}>Είμαι <b>18 ετών ή μεγαλύτερη</b> και συμμετέχω με τη θέλησή μου.</ConsentCheck>
            <ConsentCheck checked={form.safeWordConfirmed} onChange={(v) => set('safeWordConfirmed', v)}>Ξέρω ότι μπορώ να πω <b>ΣΤΟΠ</b> οποιαδήποτε στιγμή και όλα σταματούν αμέσως.</ConsentCheck>
          </Section>
        </>
      )}
    </FormShell>
  );
}
