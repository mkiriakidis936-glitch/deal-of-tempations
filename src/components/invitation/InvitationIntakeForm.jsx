import React, { useState, useEffect } from 'react';
import { request } from '@/api/apiClient';
import { ARREST_HEIST_INTENSITY } from '@/data/gameConfig';
import { ART } from '@/data/brandArt';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';
import { FormShell, Section, Field, TextInput, TextArea, ChoiceGroup, Scale, ConsentCheck, FooterBar, formImageFor } from '@/components/forms/FormKit';
import { GAME_MODES } from '@/data/gameConfig';


const SHOE_OPTIONS = [
  { id: 'boots', label: 'Μπότες / Ψηλά Τακούνια', icon: '👢' },
  { id: 'sneakers', label: 'Αθλητικά / Sneakers', icon: '👟' },
  { id: 'sandals', label: 'Πέδιλα / Σανδάλια', icon: '👡' },
  { id: 'barefoot', label: 'Ξυπόλυτη', icon: '🦶' },
];

const NAIL_COLORS = [
  { id: 'red', label: 'Κόκκινο', icon: '🔴' },
  { id: 'pink', label: 'Ροζ', icon: '🩷' },
  { id: 'white', label: 'Άσπρο', icon: '⚪' },
  { id: 'black', label: 'Μαύρο', icon: '⚫' },
  { id: 'nude', label: 'Nude/Φυσικό', icon: '🤎' },
  { id: 'french', label: 'Γαλλικό', icon: '💅' },
  { id: 'blue', label: 'Γαλάζιο', icon: '🔵' },
  { id: 'purple', label: 'Μωβ', icon: '🟣' },
  { id: 'green', label: 'Πράσινο', icon: '🟢' },
  { id: 'orange', label: 'Πορτοκαλί', icon: '🟠' },
  { id: 'gold', label: 'Χρυσό', icon: '✨' },
  { id: 'silver', label: 'Ασημί', icon: '🤍' },
  { id: 'none', label: 'Χωρίς', icon: '⭕' },
];

const COMFORT_FIELDS = [
  { key: 'comfortTruth', label: 'Αλήθειες', icon: '💬' },
  { key: 'comfortDare', label: 'Θάρρη', icon: '🔥' },
  { key: 'comfortTickle', label: 'Αύρα', icon: '🍃' },
  { key: 'comfortBondage', label: 'Σκοτάδι', icon: '🌙' },
  { key: 'comfortDrinking', label: 'Ποτό', icon: '🍹' },
];

const DRAFT_KEY = 'dot_invitation_draft';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const createSubmissionId = () => window.crypto?.randomUUID?.() || `dot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const INITIAL_FORM = {
  name: '',
  accommodation: '',
  shoeType: 'sneakers',
  shoeSize: '',
  nailColor: '',
  intensity: 'medium',
  comfortTruth: 3,
  comfortDare: 3,
  comfortTickle: 3,
  comfortBondage: 3,
  comfortDrinking: 3,
  secrets: '',
  musicPreferences: '',
  allergies: '',
  dressCode: '',
  safeWordConfirmed: false,
  customAnswers: {},
};

export default function InvitationIntakeForm({ onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!saved || !saved.savedAt || Date.now() - saved.savedAt > DRAFT_TTL_MS || !saved.form) {
        localStorage.removeItem(DRAFT_KEY);
        return { ...INITIAL_FORM, submissionId: createSubmissionId() };
      }
      return { ...INITIAL_FORM, ...saved.form, submissionId: saved.form.submissionId || createSubmissionId() };
    } catch {
      return { ...INITIAL_FORM, submissionId: createSubmissionId() };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        savedAt: Date.now(),
        form: { ...form, safeWordConfirmed: false },
      }));
    } catch { /* ignore */ }
  }, [form]);
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);
  const [submitError, setSubmitError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setSaving(true);
    setSubmitError('');
    try {
      await request('POST', '/api/entities/invitation-intake', {
        ...form,
        name: form.name.trim(),
        adultConfirmed: form.safeWordConfirmed,
        customAnswers: form.customAnswers,
        submissionId: form.submissionId,
        sessionCode: new URLSearchParams(window.location.search).get('event') || new URLSearchParams(window.location.search).get('sessionCode') || new URLSearchParams(window.location.search).get('code') || '',
        gameMode: new URLSearchParams(window.location.search).get('mode') || 'classic',
        preferredModes: [new URLSearchParams(window.location.search).get('mode') || 'classic'],
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      onDone(form.name.trim());
    } catch (e) {
      console.error('Intake submit error', e);
      setSubmitError('Δεν στάλθηκε. Έλεγξε τη σύνδεση και δοκίμασε ξανά.');
    } finally {
      setSaving(false);
    }
  }

  const canNext = step === 0 ? form.name.trim().length > 0 && form.accommodation : step === 3 ? form.safeWordConfirmed && customQuestionsValid : true;
  const modeId = new URLSearchParams(window.location.search).get('mode') || 'classic';
  const mode = GAME_MODES.find((m) => m.id === modeId);
  const image = (modeId === 'arrest_heist' && ART.extraHeistRoom) || formImageFor(modeId);
  const next = () => {
    if (step < 3) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } else handleSubmit();
  };

  return (
    <FormShell
      image={image}
      kicker="Πρόσκληση συμμετοχής · 18+"
      title={mode?.name || 'Deal of Temptation'}
      subtitle="Συμπλήρωσε τα παρακάτω. Όλα αποκαλύπτονται επιτόπου."
      steps={['Στοιχεία', 'Ένταση', 'Προαιρετικά', 'Ασφάλεια']}
      step={step}
      footer={(
        <FooterBar
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
          onNext={next}
          nextLabel={step < 3 ? 'Συνέχεια' : 'Αποστολή αίτησης'}
          disabled={!canNext}
          busy={saving}
          hint={submitError || (step === 0 && !canNext ? 'Συμπλήρωσε όνομα και διαμονή.' : step === 3 && !canNext ? 'Επιβεβαίωσε τη δήλωση για να στείλεις.' : '')}
        />
      )}
    >
      {step === 0 && (
        <>
          <Section icon="👤" title="Τα στοιχεία σου">
            <Field label="Όνομα ή ψευδώνυμο" required input>
              <TextInput value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="π.χ. Μαρία, Κόκκινη…" autoComplete="given-name" />
            </Field>
            <Field label="Θα μείνετε στο σπίτι ή είναι για μία μέρα;" required hint="Επηρεάζει τις επιλογές του παιχνιδιού.">
              <ChoiceGroup options={[{ id: 'house', label: 'Μένουμε', icon: '🏠', hint: 'Airbnb / Villa' }, { id: 'oneday', label: 'Μία μέρα', icon: '🕐', hint: 'επιστροφή ίδια μέρα' }]} value={form.accommodation} onChange={(v) => update('accommodation', v)} />
            </Field>
          </Section>
          <Section icon="👟" title="Η εμφάνισή σου">
            <Field label="Τι παπούτσια θα φορέσεις;">
              <ChoiceGroup options={SHOE_OPTIONS} value={form.shoeType} onChange={(v) => update('shoeType', v)} />
            </Field>
            <Field label="Νούμερο παπουτσιού" hint="Για την προετοιμασία του εξοπλισμού." input>
              <TextInput type="number" inputMode="numeric" min={35} max={46} value={form.shoeSize} onChange={(e) => update('shoeSize', e.target.value ? parseInt(e.target.value, 10) : '')} placeholder="π.χ. 38" />
            </Field>
            <Field label="Χρώμα βερνικιού (πόδια)">
              <ChoiceGroup cols={4} size="sm" options={NAIL_COLORS} value={form.nailColor} onChange={(v) => update('nailColor', v)} />
            </Field>
          </Section>
        </>
      )}

      {step === 1 && (
        <>
          <Section icon="🔥" title="Επίπεδο έντασης">
            <ChoiceGroup cols={3} options={ARREST_HEIST_INTENSITY.map((i) => ({ id: i.id, label: i.name, icon: i.icon }))} value={form.intensity} onChange={(v) => update('intensity', v)} />
          </Section>
          <Section icon="🎚️" title="Πόσο άνετα είσαι με…" hint="1 = καθόλου, 5 = απόλυτα">
            {COMFORT_FIELDS.map((f) => <Scale key={f.key} label={f.label} icon={f.icon} value={form[f.key]} onChange={(v) => update(f.key, v)} />)}
          </Section>
        </>
      )}

      {step === 2 && (
        <Section icon="✨" title="Προαιρετικά" hint="Όσα μας πεις κάνουν τη βραδιά πιο προσωπική.">
          <Field label="🤫 Μυστικά" input><TextArea value={form.secrets} onChange={(e) => update('secrets', e.target.value)} placeholder="Στοιχεία που θέλεις να γνωρίζουμε…" /></Field>
          <Field label="🎵 Μουσικές προτιμήσεις" input><TextArea value={form.musicPreferences} onChange={(e) => update('musicPreferences', e.target.value)} placeholder="Αγαπημένα τραγούδια / είδη…" /></Field>
          <Field label="⚠️ Αλλεργίες / υγεία" input><TextArea value={form.allergies} onChange={(e) => update('allergies', e.target.value)} placeholder="Οτιδήποτε πρέπει να ξέρουμε…" /></Field>
          <Field label="👗 Τι σκέφτεσαι να φορέσεις;" input><TextArea value={form.dressCode} onChange={(e) => update('dressCode', e.target.value)} placeholder="π.χ. μαύρο φόρεμα, κάτι θεαματικό…" /></Field>
        </Section>
      )}

      {step === 3 && (
        <>
          <Section icon="🛑" title="Ασφάλεια" hint="Υπάρχει λέξη ασφαλείας: αν ειπωθεί, όλα σταματούν αμέσως. Τα όριά σου τα βλέπει μόνο η διοργανώτρια.">
            <CustomFormQuestions formType="invitation" value={form.customAnswers} onChange={(value) => update('customAnswers', value)} onValidityChange={setCustomQuestionsValid} className="space-y-3" />
            <ConsentCheck checked={form.safeWordConfirmed} onChange={(v) => update('safeWordConfirmed', v)}>Είμαι <b>18+</b>, κατανοώ τη λέξη ασφαλείας και συμμετέχω υπεύθυνα και με τη θέλησή μου.</ConsentCheck>
          </Section>
        </>
      )}
    </FormShell>
  );
}
