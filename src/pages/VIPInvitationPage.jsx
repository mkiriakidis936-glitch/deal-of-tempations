import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '@/api/apiClient';
import { GAME_MODES } from '@/data/gameConfig';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';
import { FormShell, Section, Field, TextInput, TextArea, ChoiceGroup, Scale, Toggle, ConsentCheck, FooterBar, SuccessScreen, formImageFor } from '@/components/forms/FormKit';
import { PHOTO } from '@/data/brandArt';

const AVATARS = ['♠', '♥', '♦', '♣', '👑', '🖤', '🔥', '✨', '🦂', '🐍', '🦇', '🌙'];
const NAIL_COLORS = ['Κόκκινο', 'Ροζ', 'Λευκό', 'Μαύρο', 'Nude', 'French', 'Μπλε', 'Μωβ', 'Πράσινο', 'Πορτοκαλί', 'Χρυσό', 'Ασημί', 'Χωρίς χρώμα'];
const makeSubmissionId = () => globalThis.crypto?.randomUUID?.() || `vip-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function VIPInvitationPage() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [selectedGameMode, setSelectedGameMode] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [answers, setAnswers] = useState({
    personality: 'bold',
    competitiveness: '3',
    activityPreferences: { questions: 'no', missions: 'no', surprises: 'no', roleplay: 'no', puzzles: 'no' },
    safetyBoundaries: [],
    safeWord: '',
    intensity: '3',
    unexpectedChallenge: 'no',
    activeParticipation: 'yes',
    stayAtVilla: 'no',
  });
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [customAnswers, setCustomAnswers] = useState({});
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);
  const submissionId = useMemo(makeSubmissionId, []);
  const [step, setStep] = useState(0);

  useEffect(() => {
    let active = true;
    request('GET', `/api/entities/vip-invitations/${encodeURIComponent(token)}`)
      .then((data) => {
        if (!active) return;
        setInvitation(data);
        // Αν το Admin έχει ήδη ορίσει mode για την πρόσκληση, προεπιλέγεται.
        if (data?.gameMode && GAME_MODES.some((mode) => mode.id === data.gameMode)) setSelectedGameMode(data.gameMode);
      })
      .catch((e) => { if (active) setError(e.message || 'Η πρόσκληση δεν είναι διαθέσιμη.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const setAnswer = (key, value) => setAnswers((current) => ({ ...current, [key]: value }));
  const setActivity = (key, checked) => setAnswers((current) => ({
    ...current,
    activityPreferences: { ...current.activityPreferences, [key]: checked ? 'yes' : 'no' },
  }));
  const setSafetyBoundary = (key, checked) => setAnswers((current) => ({
    ...current,
    safetyBoundaries: checked ? [...(current.safetyBoundaries || []), key] : (current.safetyBoundaries || []).filter((item) => item !== key),
  }));
  const valid = name.trim().length > 0 && !!selectedGameMode && adultConfirmed && consentConfirmed && String(answers.safeWord || '').trim().length >= 2 && customQuestionsValid && !saving;
  const gameName = GAME_MODES.find((mode) => mode.id === (selectedGameMode || invitation?.gameMode))?.name || selectedGameMode || invitation?.gameMode || 'Δεν έχει επιλεγεί';

  async function submit(event) {
    event?.preventDefault?.();
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await request('POST', `/api/entities/vip-invitations/${encodeURIComponent(token)}/submit`, {
        submissionId, name: name.trim(), avatar, gameMode: selectedGameMode, answers, customAnswers, adultConfirmed, consentConfirmed,
      });
      setDone(true);
    } catch (e) { setError(e.message || 'Δεν αποθηκεύτηκε η συμμετοχή.'); }
    finally { setSaving(false); }
  }

  const modeForImage = selectedGameMode || invitation?.gameMode || 'arrest_heist';
  const image = PHOTO.invitation || formImageFor(modeForImage);
  const STEPS = ['Στοιχεία', 'Χαρακτήρας', 'Όρια', 'VIP'];
  const stepValid = [
    name.trim().length > 0 && !!selectedGameMode,
    true,
    String(answers.safeWord || '').trim().length >= 2,
    adultConfirmed && consentConfirmed && customQuestionsValid,
  ][step];
  const next = () => {
    if (step < 3) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); } else submit();
  };
  const yesNo = (key) => <ChoiceGroup options={[{ id: 'yes', label: 'Ναι', icon: '👍' }, { id: 'no', label: 'Όχι', icon: '✋' }]} value={answers[key]} onChange={(v) => setAnswer(key, v)} />;
  const text = (key, label, placeholder = '') => (
    <Field label={label} input><TextInput value={answers[key] || ''} onChange={(e) => setAnswer(key, e.target.value)} maxLength={2000} placeholder={placeholder} /></Field>
  );

  if (loading) {
    return <FormShell image={image} kicker="VIP · Exclusive access" title="VIP πρόσκληση" subtitle="Φόρτωση πρόσκλησης…"><div className="h-40 animate-pulse rounded-[28px] bg-white/5" /></FormShell>;
  }
  if (error && !invitation) {
    return (
      <FormShell image={image} kicker="VIP · Exclusive access" title="VIP πρόσκληση">
        <Section icon="🔒" title="Η πρόσκληση δεν είναι διαθέσιμη" hint={error}>
          <p className="text-sm text-white/60">Ίσως έληξε ή χρησιμοποιήθηκε ήδη. Ζήτησε νέο link από τη διοργανώτρια.</p>
          <a href="/site" className="inline-flex h-12 items-center rounded-full border border-white/20 px-6 text-sm font-semibold">Επιστροφή στο site</a>
        </Section>
      </FormShell>
    );
  }
  if (done) return <SuccessScreen name={name.trim()} modeName={gameName} image={image} text="Οι απαντήσεις σου αποθηκεύτηκαν και συνδέθηκαν με το παιχνίδι. Θα ενημερωθείς μόλις εγκριθεί η συμμετοχή σου." />;

  return (
    <FormShell
      image={image}
      kicker="VIP · Exclusive access"
      title={invitation?.title || 'VIP πρόσκληση'}
      subtitle={invitation?.intro || (invitation?.eventTitle ? `${invitation.eventTitle}${invitation.roomCode ? ` · ${invitation.roomCode}` : ''}` : '')}
      steps={STEPS}
      step={step}
      footer={(
        <FooterBar
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
          onNext={next}
          nextLabel={step < 3 ? 'Συνέχεια' : 'Επιβεβαίωση συμμετοχής'}
          disabled={!stepValid}
          busy={saving}
          hint={error || (step === 0 && !stepValid ? 'Γράψε όνομα και διάλεξε παιχνίδι.' : step === 2 && !stepValid ? 'Όρισε την προσωπική σου λέξη ΣΤΟΠ.' : step === 3 && !stepValid ? 'Επιβεβαίωσε τις δύο δηλώσεις.' : '')}
        />
      )}
    >
      {step === 0 && (
        <>
          <Section icon="🎲" title="Ποιο παιχνίδι θέλεις;" hint="Η επιλογή σου εμφανίζεται στο Admin και στο Tablet μετά την έγκριση.">
            <div className="grid gap-2">
              {GAME_MODES.map((mode) => {
                const on = selectedGameMode === mode.id;
                return (
                  <button key={mode.id} type="button" role="radio" aria-checked={on} onClick={() => setSelectedGameMode(mode.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-2 text-left transition-all ${on ? 'border-[#E8C26B] bg-[#E8C26B]/12 shadow-[0_0_0_1px_#E8C26B]' : 'border-white/10 bg-white/[0.03]'}`}>
                    <img src={formImageFor(mode.id)} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0 flex-1 font-semibold text-white">{mode.icon} {mode.name}</span>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs ${on ? 'border-[#E8C26B] bg-[#E8C26B] text-black' : 'border-white/30'}`}>{on ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </Section>
          <Section icon="👤" title="Τα στοιχεία σου">
            <Field label="Ονοματεπώνυμο ή nickname" required input><TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Το όνομά σου" autoComplete="name" /></Field>
            {text('displayName', 'Πώς θέλεις να σε φωνάζουν στο παιχνίδι;', 'Όνομα εμφάνισης')}
            <Field label="Το avatar σου">
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((item) => (
                  <button key={item} type="button" aria-pressed={avatar === item} onClick={() => setAvatar(item)}
                    className={`flex h-12 items-center justify-center rounded-2xl text-xl transition-all ${avatar === item ? 'bg-[#E8C26B] text-black' : 'bg-white/[0.05] text-white'}`}>{item}</button>
                ))}
              </div>
            </Field>
          </Section>
        </>
      )}

      {step === 1 && (
        <>
          <Section icon="🎭" title="Ο χαρακτήρας σου">
            <Field label="Είσαι περισσότερο…">
              <ChoiceGroup options={[{ id: 'bold', label: 'Τολμηρή', icon: '🔥' }, { id: 'reserved', label: 'Συγκρατημένη', icon: '🌙' }]} value={answers.personality} onChange={(v) => setAnswer('personality', v)} />
            </Field>
            <Scale label="Πόσο ανταγωνιστική είσαι;" icon="🏆" value={answers.competitiveness} onChange={(v) => setAnswer('competitiveness', String(v))} low="Χαλαρή" high="Θέλω να κερδίσω" />
          </Section>
          <Section icon="🎯" title="Τι σου αρέσει στο παιχνίδι;" hint="Διάλεξε όσα θες.">
            {[['questions', 'Ερωτήσεις', '💬'], ['missions', 'Αποστολές', '🎯'], ['surprises', 'Εκπλήξεις', '🎁'], ['roleplay', 'Role-play', '🎭'], ['puzzles', 'Γρίφοι', '🧩']].map(([key, label, icon]) => (
              <Toggle key={key} label={`${icon} ${label}`} checked={answers.activityPreferences?.[key] === 'yes'} onChange={(v) => setActivity(key, v)} />
            ))}
            <Field label="Θα διάλεγες μια απρόβλεπτη πρόκληση;">{yesNo('unexpectedChallenge')}</Field>
          </Section>
        </>
      )}

      {step === 2 && (
        <>
          <Section icon="🛑" title="Ασφάλεια" hint="Τα όριά σου τα βλέπει μόνο η διοργανώτρια.">
            <Field label="Η προσωπική σου λέξη ΣΤΟΠ" required hint="Αν την πεις, όλα σταματούν αμέσως." input>
              <TextInput value={answers.safeWord || ''} onChange={(e) => setAnswer('safeWord', e.target.value)} maxLength={40} placeholder="π.χ. καρπούζι" />
            </Field>
            <Field label="Θέλεις να συμμετέχεις ενεργά;">{yesNo('activeParticipation')}</Field>
            <Scale label="Ένταση δοκιμασιών" icon="🔥" value={answers.intensity} onChange={(v) => setAnswer('intensity', String(v))} low="Ήπια" high="Έντονη" />
          </Section>
          <Section icon="🔒" title="Δεν επιθυμώ…" hint="Ενεργοποίησε ό,τι θέλεις να αποφύγουμε.">
            {[['touch', 'Σωματική επαφή'], ['restraints', 'Δεσίματα / περιορισμοί'], ['blindfolds', 'Κάλυψη ματιών'], ['alcohol', 'Αλκοόλ'], ['personal-disclosure', 'Προσωπικές αποκαλύψεις']].map(([key, label]) => (
              <Toggle key={key} label={label} checked={(answers.safetyBoundaries || []).includes(key)} onChange={(v) => setSafetyBoundary(key, v)} />
            ))}
            <Field label="Κάτι άλλο που δεν θέλεις;" input>
              <TextArea value={answers.boundaries || ''} onChange={(e) => setAnswer('boundaries', e.target.value)} maxLength={2000} placeholder="Προαιρετικά γράψε ό,τι άλλο θέλεις να γνωρίζει η διοργανώτρια." />
            </Field>
          </Section>
        </>
      )}

      {step === 3 && (
        <>
          <Section icon="✨" title="Μυστικές επιλογές VIP" hint="Όλα προαιρετικά — κάνουν τη βραδιά πιο προσωπική.">
            {text('surpriseWish', 'Ποια έκπληξη θα ήθελες;')}
            <div className="grid grid-cols-2 gap-3">
              {text('shoeSize', 'Νούμερο παπουτσιού', 'π.χ. 38')}
              {text('favoriteDrink', 'Αγαπημένο ποτό')}
            </div>
            {text('plannedOutfit', 'Τι σκέφτεσαι να φορέσεις;')}
            {text('shoesToWear', 'Τι παπούτσια θα φορέσεις;')}
            <Field label="Χρώμα στα νύχια">
              <ChoiceGroup cols={4} size="sm" options={NAIL_COLORS.map((c) => ({ id: c, label: c }))} value={answers.nailColor || ''} onChange={(v) => setAnswer('nailColor', v)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {text('slipperType', 'Παντόφλα / σαγιονάρα')}
              {text('pajamaType', 'Τύπος πιτζάμας')}
            </div>
            <Field label="Θέλεις να μείνεις στο σπίτι / villa;">{yesNo('stayAtVilla')}</Field>
          </Section>
          {invitation?.questions?.length > 0 && (
            <Section icon="📝" title="Επιπλέον ερωτήσεις">
              <CustomFormQuestions formType="invitation" questionsOverride={invitation.questions} value={customAnswers} onChange={setCustomAnswers} onValidityChange={setCustomQuestionsValid} className="space-y-3" />
            </Section>
          )}
          <Section icon="✅" title="Δηλώσεις">
            <ConsentCheck checked={adultConfirmed} onChange={setAdultConfirmed}>Επιβεβαιώνω ότι είμαι <b>18 ετών ή μεγαλύτερη</b>.</ConsentCheck>
            <ConsentCheck checked={consentConfirmed} onChange={setConsentConfirmed}>Συμμετέχω <b>εθελοντικά</b>, έχω δηλώσει τα όριά μου και μπορώ να σταματήσω οποιαδήποτε στιγμή.</ConsentCheck>
          </Section>
        </>
      )}
    </FormShell>
  );
}
