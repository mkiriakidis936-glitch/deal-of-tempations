import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { appApi } from '@/api/apiClient';
import { NEW_MODES, durationLabel } from '@/data/modes/modeRegistry';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';
import { WHEELS, GAMES } from '@/data/modes/movieGames';
import { FORMATS } from '@/data/modes/campaignContent';
import { FormShell, Section, Field, TextInput, TextArea, ChoiceGroup, Scale, Toggle, ConsentCheck, FooterBar, SuccessScreen, formImageFor } from '@/components/forms/FormKit';

const NAIL_COLORS = [
  { id: 'Red', label: 'Κόκκινο', icon: '🔴' }, { id: 'Pink', label: 'Ροζ', icon: '🩷' }, { id: 'White', label: 'Άσπρο', icon: '⚪' }, { id: 'Black', label: 'Μαύρο', icon: '⚫' },
  { id: 'Nude', label: 'Nude', icon: '🤎' }, { id: 'French', label: 'Γαλλικό', icon: '💅' }, { id: 'Blue', label: 'Μπλε', icon: '🔵' }, { id: 'Purple', label: 'Μωβ', icon: '🟣' },
  { id: 'Green', label: 'Πράσινο', icon: '🟢' }, { id: 'Orange', label: 'Πορτοκαλί', icon: '🟠' }, { id: 'Gold', label: 'Χρυσό', icon: '✨' }, { id: 'Silver', label: 'Ασημί', icon: '🤍' }, { id: 'None', label: 'Χωρίς', icon: '⭕' },
];
const MOVIE_FORMATS = Object.values(FORMATS).map((f) => ({ id: f.id, label: f.label, icon: '🎬' }));
const SHOES = [{ id: 'sneakers', label: 'Αθλητικά', icon: '👟' }, { id: 'heels', label: 'Τακούνια', icon: '👠' }, { id: 'boots', label: 'Μποτάκια', icon: '🥾' }, { id: 'flats', label: 'Μπαλαρίνες', icon: '🥿' }, { id: 'flipflops', label: 'Σαγιονάρες', icon: '🩴' }];
const SOCKS = [{ id: 'short', label: 'Κοντές', icon: '🧦' }, { id: 'long', label: 'Ψηλές', icon: '🧦' }, { id: 'fluffy', label: 'Χνουδωτές', icon: '☁️' }, { id: 'none', label: 'Χωρίς', icon: '⭕' }];
const MOVIE_LIMITS = [
  ['chairOk', '🪑 Καρέκλα Ανάκρισης (δέσιμο χέρια & πόδια)'], ['cuffsOk', '⛓️ Χειροπέδες / δέσιμο χεριών'], ['tickleOk', '🪶 Γαργάλημα πελμάτων'],
  ['iceOk', '🧊 Παγάκι στο στόμα'], ['alcoholOk', '🥃 Σφηνάκι (αλκοόλ)'], ['shoesOffOk', '👟 Βγάλσιμο παπουτσιών & καλτσών'], ['nightOk', '🌙 Βράδυ στον Ύπνο (μένω τη νύχτα)'], ['photosOk', '📸 Φωτογραφίες μου στην TV & στους τίτλους τέλους'],
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
    footSensitivity: 3,
    ticklish: 3,
    restraintLevel: 'light',
    blindfoldOk: true,
    boundaries: '',
    safeWordConfirmed: false,
    customAnswers: {},
    movieFormat: 'h48', shoeType: 'sneakers', shoeSize: '', sockType: 'short', health: '', favGames: [], wheelNo: [],
    chairOk: true, cuffsOk: true, tickleOk: true, iceOk: true, alcoholOk: true, shoesOffOk: true, nightOk: true, photosOk: true,
  });
  const [step, setStep] = useState(first && NEW_MODES.some((m) => m.id === first) ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customQuestionsValid, setCustomQuestionsValid] = useState(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectMode = (id) => set('mode', id);
  const has = (...ids) => ids.includes(form.mode);
  const pajamaish = has('pedi_glam', 'pedi_extended', 'lockdown', 'marathon_4h', 'villa_takeover', 'deal_movie');
  const movie = has('deal_movie');
  const toggleIn = (k, id) => setForm((f) => ({ ...f, [k]: f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id] }));
  // Όρια της Ταινίας → ένα κείμενο που φαίνεται στο Admin και φιλτράρει τους Τροχούς.
  const movieLimitsText = () => {
    if (!movie) return '';
    const no = MOVIE_LIMITS.filter(([k]) => !form[k]).map(([, l]) => `ΟΧΙ: ${l.replace(/^\S+\s/, '')}`);
    const wheel = WHEELS.flatMap((w) => w.items).filter((i) => form.wheelNo.includes(i.id)).map((i) => `ΟΧΙ ποινή: ${i.title}`);
    return [...no, ...wheel, form.health ? `Υγεία/αλλεργίες: ${form.health}` : ''].filter(Boolean).join('\n');
  };
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
        footSensitivity: Number(form.footSensitivity),
        ticklish: Number(form.ticklish),
        restraintLevel: form.restraintLevel,
        blindfoldOk: form.blindfoldOk,
        boundaries: [form.boundaries, movieLimitsText()].filter(Boolean).join('\n'),
        ...(movie ? {
          movieProfile: {
            format: form.movieFormat, shoeType: form.shoeType, shoeSize: form.shoeSize, sockType: form.sockType, health: form.health,
            favGames: form.favGames, wheelNo: form.wheelNo, ...Object.fromEntries(MOVIE_LIMITS.map(([k]) => [k, !!form[k]])),
          },
          alcohol: form.alcoholOk ? 'yes' : 'no',
          answers: { safetyBoundaries: [!form.cuffsOk || !form.chairOk ? 'restraints' : '', !form.alcoholOk ? 'alcohol' : ''].filter(Boolean) },
        } : {}),
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
      subtitle={selectedMode ? `${durationLabel(selectedMode)} · ${selectedMode.min}–${selectedMode.max} παίκτριες` : 'Μία εμπειρία ανά αίτηση.'}
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
                    <div className="mt-1 text-[11px] font-semibold text-[#E8C26B]">{durationLabel(m)} · {m.min}–{m.max} παίκτριες</div>
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
          {movie && (
            <Section icon="🎬" title="Για την Ταινία" hint="Ροή, παπούτσια & κάλτσες (βγαίνουν ένα-ένα στο παιχνίδι) και τα παιχνίδια που θες.">
              <Field label="Ποια ροή προτιμάς;">
                <ChoiceGroup cols={3} size="sm" options={MOVIE_FORMATS} value={form.movieFormat} onChange={(v) => set('movieFormat', v)} />
              </Field>
              <Field label="Τι παπούτσια θα φοράς;">
                <ChoiceGroup cols={3} size="sm" options={SHOES} value={form.shoeType} onChange={(v) => set('shoeType', v)} />
              </Field>
              <Field label="Νούμερο παπουτσιού" input>
                <TextInput value={form.shoeSize} onChange={(e) => set('shoeSize', e.target.value)} placeholder="π.χ. 38" inputMode="numeric" />
              </Field>
              <Field label="Τι κάλτσες θα φοράς;">
                <ChoiceGroup cols={4} size="sm" options={SOCKS} value={form.sockType} onChange={(v) => set('sockType', v)} />
              </Field>
              <Field label="Σε ποια παιχνίδια θες να πρωταγωνιστήσεις;">
                <div className="grid grid-cols-2 gap-2">
                  {GAMES.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleIn('favGames', g.id)} aria-pressed={form.favGames.includes(g.id)}
                      className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${form.favGames.includes(g.id) ? 'border-[#E8C26B] bg-[#E8C26B]/15' : 'border-white/15 bg-white/5'}`}>{g.icon} {g.name}</button>
                  ))}
                </div>
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
          {movie && (
            <Section icon="🎡" title="Τροχοί Ποινών & Καρέκλα Ανάκρισης" hint="Ό,τι κλείσεις εδώ δεν σου βγαίνει ποτέ από τον Τροχό. Το ΣΤΟΠ ισχύει πάντα.">
              {MOVIE_LIMITS.map(([k, l]) => <Toggle key={k} label={l} checked={form[k]} onChange={(v) => set(k, v)} />)}
              <Field label="Ποινές του Τροχού που ΔΕΝ θέλεις">
                {WHEELS.map((w) => (
                  <div key={w.id} className="mt-2">
                    <div className="mb-1 text-xs font-semibold opacity-70">{w.name} — {w.subtitle}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {w.items.map((i) => (
                        <button key={i.id} type="button" onClick={() => toggleIn('wheelNo', i.id)} aria-pressed={form.wheelNo.includes(i.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.wheelNo.includes(i.id) ? 'border-[#FF453A] bg-[#FF453A]/20 line-through' : 'border-white/15 bg-white/5'}`}>{i.title}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </Field>
              <Field label="Υγεία, αλλεργίες ή κάτι που πρέπει να ξέρουμε" input>
                <TextArea value={form.health} onChange={(e) => set('health', e.target.value)} placeholder="π.χ. αλλεργία σε λάτεξ, ευαίσθητοι καρποί" />
              </Field>
            </Section>
          )}
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
