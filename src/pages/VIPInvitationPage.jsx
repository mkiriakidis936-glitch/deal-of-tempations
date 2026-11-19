import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '@/api/base44Client';
import { GAME_MODES } from '@/data/gameConfig';
import CustomFormQuestions from '@/components/forms/CustomFormQuestions';

const AVATARS = ['♠', '♥', '♦', '♣', '👑', '🖤', '🔥', '✨', '🦂', '🐍', '🦇', '🌙'];
const NAIL_COLORS = ['Κόκκινο', 'Ροζ', 'Λευκό', 'Μαύρο', 'Nude', 'French', 'Μπλε', 'Μωβ', 'Πράσινο', 'Πορτοκαλί', 'Χρυσό', 'Ασημί', 'Χωρίς χρώμα'];
const makeSubmissionId = () => globalThis.crypto?.randomUUID?.() || `vip-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function VIPInvitationPage() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
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

  useEffect(() => {
    let active = true;
    request('GET', `/api/entities/vip-invitations/${encodeURIComponent(token)}`)
      .then((data) => { if (active) setInvitation(data); })
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
  const valid = name.trim().length > 0 && adultConfirmed && consentConfirmed && String(answers.safeWord || '').trim().length >= 2 && customQuestionsValid && !saving;
  const gameName = GAME_MODES.find((mode) => mode.id === invitation?.gameMode)?.name || invitation?.gameMode || '—';

  async function submit(event) {
    event.preventDefault();
    if (!valid) return;
    setSaving(true);
    setError('');
    try {
      await request('POST', `/api/entities/vip-invitations/${encodeURIComponent(token)}/submit`, {
        submissionId, name: name.trim(), avatar, answers, customAnswers, adultConfirmed, consentConfirmed,
      });
      setDone(true);
    } catch (e) { setError(e.message || 'Δεν αποθηκεύτηκε η συμμετοχή.'); }
    finally { setSaving(false); }
  }

  const inputStyle = { width: '100%', background: '#111', border: '1px solid rgba(207,174,91,.45)', borderRadius: 10, color: '#f7edcf', padding: '12px 14px', outline: 'none' };
  const labelStyle = { display: 'block', color: '#d7bd78', fontSize: 13, fontWeight: 700, marginBottom: 7 };
  const sectionStyle = { border: '1px solid rgba(207,174,91,.28)', borderRadius: 13, padding: 16, marginBottom: 15, background: 'rgba(22,18,11,.55)' };
  const fieldStyle = { marginBottom: 16 };
  const choice = (key, value, label) => (
    <button type="button" onClick={() => setAnswer(key, value)} aria-pressed={answers[key] === value}
      style={{ border: answers[key] === value ? '2px solid #e5c76c' : '1px solid rgba(207,174,91,.35)', background: answers[key] === value ? 'rgba(201,169,78,.2)' : '#111', color: '#f4e8c5', borderRadius: 9, padding: '10px 13px', flex: 1 }}>
      {label}
    </button>
  );
  const yesNo = (key) => <div style={{ display: 'flex', gap: 8 }}>{choice(key, 'yes', 'ΝΑΙ')}{choice(key, 'no', 'ΟΧΙ')}</div>;
  const textInput = (key, placeholder = '') => <input value={answers[key] || ''} onChange={(e) => setAnswer(key, e.target.value)} maxLength={2000} style={inputStyle} placeholder={placeholder} />;
  const range = (key) => <div><input type="range" min="1" max="5" step="1" value={answers[key] || '3'} onChange={(e) => setAnswer(key, e.target.value)} style={{ width: '100%', accentColor: '#E8C26B' }} /><div style={{ display: 'flex', justifyContent: 'space-between', color: '#9e906d', fontSize: 11 }}><span>1 · Χαμηλά</span><strong style={{ color: '#e5cf91' }}>{answers[key] || 3} / 5</strong><span>5 · Πολύ</span></div></div>;

  return <main style={{ minHeight: '100dvh', background: 'radial-gradient(ellipse at top, #29200f 0%, #090909 52%, #050505 100%)', color: '#f4e8c5', padding: '28px 14px', fontFamily: 'Georgia,serif' }}>
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', border: '1px solid rgba(207,174,91,.65)', borderRadius: 18, padding: '25px 18px', background: 'linear-gradient(145deg,rgba(31,25,13,.96),rgba(8,8,8,.98))', boxShadow: '0 18px 70px rgba(0,0,0,.55)' }}>
        <div style={{ color: '#E8C26B', letterSpacing: '.42em', fontSize: 11 }}>EXCLUSIVE ACCESS</div>
        <div style={{ color: '#F7E3A8', fontSize: 'clamp(30px,8vw,44px)', letterSpacing: '.12em', margin: '14px 0' }}>VIP INVITATION</div>
        <div style={{ height: 1, maxWidth: 180, margin: '0 auto 14px', background: 'linear-gradient(90deg,transparent,#E8C26B,transparent)' }} />
        <div style={{ color: '#d6c28c', fontSize: 12, letterSpacing: '.24em' }}>DEAL OF TEMPTATION</div>
        {invitation && <div style={{ color: '#e5cf91', fontSize: 12, marginTop: 14 }}>ΣΥΝΔΕΔΕΜΕΝΟ ΠΑΙΧΝΙΔΙ: {gameName}</div>}
      </header>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#E8C26B' }}>Φόρτωση πρόσκλησης…</div> :
      error && !invitation ? <section style={{ textAlign: 'center', padding: 36, border: '1px solid #654747', borderRadius: 14, marginTop: 20 }}>{error}</section> :
      done ? <section style={{ textAlign: 'center', padding: 38, border: '1px solid rgba(207,174,91,.6)', borderRadius: 16, marginTop: 20, background: '#100f0c' }}>
        <div style={{ fontSize: 38, color: '#d7bd78' }}>✦</div>
        <h1 style={{ color: '#e7ce89', fontSize: 27, margin: '12px 0' }}>Η ΣΥΜΜΕΤΟΧΗ ΚΑΤΑΧΩΡΗΘΗΚΕ</h1>
        <p style={{ color: '#cbbd99', lineHeight: 1.7 }}>Οι απαντήσεις σου αποθηκεύτηκαν και συνδέθηκαν με το επιλεγμένο παιχνίδι.</p>
      </section> :
      invitation && <form onSubmit={submit} style={{ marginTop: 18, border: '1px solid rgba(207,174,91,.35)', borderRadius: 16, padding: 18, background: 'rgba(12,12,12,.94)' }}>
        <div style={{ color: '#e4cf91', fontSize: 20, textAlign: 'center', marginBottom: 5 }}>{invitation.title}</div>
        <p style={{ color: '#bfb08c', textAlign: 'center', lineHeight: 1.6, fontSize: 13, marginBottom: 20 }}>{invitation.intro}</p>

        <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>1. ΠΡΟΣΩΠΙΚΑ ΣΤΟΙΧΕΙΑ</h2>
          <div style={fieldStyle}><label style={labelStyle}>ΟΝΟΜΑΤΕΠΩΝΥΜΟ Ή NICKNAME *</label><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required style={inputStyle} placeholder="Το όνομά σου" /></div>
          <div style={fieldStyle}><label style={labelStyle}>ΠΩΣ ΘΕΛΕΙΣ ΝΑ ΣΕ ΑΠΟΚΑΛΟΥΝ ΣΤΟ ΠΑΙΧΝΙΔΙ;</label>{textInput('displayName', 'Όνομα εμφάνισης')}</div>
          <label style={labelStyle}>ΕΠΙΛΟΓΗ AVATAR</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 }}>
            {AVATARS.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} aria-pressed={avatar === item} style={{ minHeight: 46, borderRadius: 10, border: avatar === item ? '2px solid #e4c66d' : '1px solid rgba(207,174,91,.25)', background: avatar === item ? 'rgba(201,169,78,.18)' : '#111', color: '#f4e8c5', fontSize: 22 }}>{item}</button>)}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>2. ΠΡΟΣΩΠΙΚΟΤΗΤΑ ΚΑΙ ΧΑΡΑΚΤΗΡΑΣ</h2>
          <div style={fieldStyle}><label style={labelStyle}>ΕΙΣΑΙ ΠΕΡΙΣΣΟΤΕΡΟ…</label><div style={{ display: 'flex', gap: 8 }}>{choice('personality', 'bold', 'ΤΟΛΜΗΡΟΣ/Η')}{choice('personality', 'reserved', 'ΣΥΓΚΡΑΤΗΜΕΝΟΣ/Η')}</div></div>
          <div style={fieldStyle}><label style={labelStyle}>ΠΟΣΟ ΑΝΤΑΓΩΝΙΣΤΙΚΟΣ/Η ΕΙΣΑΙ;</label>{range('competitiveness')}</div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>3. ΠΡΟΤΙΜΗΣΕΙΣ ΠΑΙΧΝΙΔΙΟΥ</h2>
          <div style={fieldStyle}><label style={labelStyle}>ΠΡΟΤΙΜΑΣ… (ΜΠΟΡΕΙΣ ΝΑ ΕΠΙΛΕΞΕΙΣ ΠΕΡΙΣΣΟΤΕΡΑ)</label>{[['questions','ΕΡΩΤΗΣΕΙΣ'],['missions','ΑΠΟΣΤΟΛΕΣ'],['surprises','ΕΚΠΛΗΞΕΙΣ'],['roleplay','ROLE-PLAY'],['puzzles','ΓΡΙΦΟΙ']].map(([key,label]) => <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', color: '#f4e8c5' }}><input type="checkbox" checked={answers.activityPreferences?.[key] === 'yes'} onChange={(e) => setActivity(key, e.target.checked)} style={{ accentColor: '#E8C26B', width: 17, height: 17 }} />{label}</label>)}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΘΑ ΕΠΕΛΕΓΕΣ ΜΙΑ ΑΠΡΟΒΛΕΠΤΗ ΠΡΟΚΛΗΣΗ;</label>{yesNo('unexpectedChallenge')}</div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>4. ΣΥΜΜΕΤΟΧΗ ΚΑΙ ΟΡΙΑ</h2>
          <div style={fieldStyle}><label style={labelStyle}>ΘΕΛΕΙΣ ΝΑ ΣΥΜΜΕΤΕΧΕΙΣ ΕΝΕΡΓΑ;</label>{yesNo('activeParticipation')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΠΡΟΣΩΠΙΚΗ ΛΕΞΗ STOP / SAFE WORD *</label><input value={answers.safeWord || ''} onChange={(e) => setAnswer('safeWord', e.target.value)} maxLength={40} required style={inputStyle} placeholder="Η προσωπική σου λέξη STOP" /></div>
          <div style={fieldStyle}><label style={labelStyle}>ΕΝΤΑΣΗ ΔΟΚΙΜΑΣΙΩΝ: {answers.intensity || '3'}/5</label><input type="range" min="1" max="5" step="1" value={answers.intensity || '3'} onChange={(e) => setAnswer('intensity', e.target.value)} style={{ width: '100%', accentColor: '#E8C26B' }} /><div style={{ display: 'flex', justifyContent: 'space-between', color: '#9e906d', fontSize: 11 }}><span>1 · Ήπια</span><span>5 · Έντονη</span></div></div>
          <div style={fieldStyle}><label style={labelStyle}>ΟΡΙΑ / ΔΕΝ ΕΠΙΘΥΜΩ</label>{[['touch','Σωματική επαφή'],['restraints','Δεσίματα / περιορισμοί'],['blindfolds','Κάλυψη ματιών'],['alcohol','Αλκοόλ'],['personal-disclosure','Προσωπικές αποκαλύψεις']].map(([key,label]) => <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', color: '#f4e8c5' }}><input type="checkbox" checked={(answers.safetyBoundaries || []).includes(key)} onChange={(e) => setSafetyBoundary(key, e.target.checked)} style={{ accentColor: '#E8C26B', width: 17, height: 17 }} />{label}</label>)}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΥΠΑΡΧΕΙ ΚΑΤΙ ΑΛΛΟ ΠΟΥ ΔΕΝ ΕΠΙΘΥΜΕΙΣ ΝΑ ΠΕΡΙΛΑΜΒΑΝΕΙ ΤΟ ΠΑΙΧΝΙΔΙ;</label><textarea rows={3} value={answers.boundaries || ''} onChange={(e) => setAnswer('boundaries', e.target.value)} maxLength={2000} style={inputStyle} placeholder="Προαιρετικά γράψε ό,τι άλλο θέλεις να γνωρίζει ο διοργανωτής." /></div>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>5. ΜΥΣΤΙΚΕΣ ΕΠΙΛΟΓΕΣ VIP</h2>
          <div style={fieldStyle}><label style={labelStyle}>ΠΟΙΑ ΕΚΠΛΗΞΗ ΘΑ ΗΘΕΛΕΣ ΝΑ ΥΠΑΡΧΕΙ ΣΤΟ ΠΑΙΧΝΙΔΙ;</label>{textInput('surpriseWish')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΝΟΥΜΕΡΟ ΠΑΠΟΥΤΣΙΟΥ</label>{textInput('shoeSize', 'π.χ. 38')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΤΙ ΣΚΕΦΤΕΣΑΙ ΝΑ ΦΟΡΕΣΕΙΣ;</label>{textInput('plannedOutfit')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΤΙ ΠΑΠΟΥΤΣΙΑ ΘΑ ΦΟΡΕΣΕΙΣ;</label>{textInput('shoesToWear')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΧΡΩΜΑ ΣΤΑ ΝΥΧΙΑ</label><select value={answers.nailColor || ''} onChange={(e) => setAnswer('nailColor', e.target.value)} style={inputStyle}><option value="">Επίλεξε…</option>{NAIL_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}</select></div>
          <div style={fieldStyle}><label style={labelStyle}>ΤΥΠΟΣ ΠΑΝΤΟΦΛΑΣ / ΣΑΓΙΟΝΑΡΑΣ</label>{textInput('slipperType')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΤΥΠΟΣ ΠΙΤΖΑΜΑΣ</label>{textInput('pajamaType')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΕΠΙΘΥΜΕΙΣ ΝΑ ΜΕΙΝΕΙΣ ΣΤΟ ΣΠΙΤΙ / VILLA;</label>{yesNo('stayAtVilla')}</div>
          <div style={fieldStyle}><label style={labelStyle}>ΑΓΑΠΗΜΕΝΟ ΠΟΤΟ</label>{textInput('favoriteDrink')}</div>
        </section>

        {invitation.questions?.length > 0 && <section style={sectionStyle}>
          <h2 style={{ color: '#e5cf91', fontSize: 16, margin: '0 0 16px' }}>6. ΕΠΙΠΛΕΟΝ ΕΡΩΤΗΣΕΙΣ</h2>
          <CustomFormQuestions
            formType="invitation"
            questionsOverride={invitation.questions}
            value={customAnswers}
            onChange={setCustomAnswers}
            onValidityChange={setCustomQuestionsValid}
            className="space-y-3"
          />
        </section>}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#f4e8c5', fontSize: 13, margin: '18px 0 8px' }}><input type="checkbox" checked={adultConfirmed} onChange={(e) => setAdultConfirmed(e.target.checked)} style={{ accentColor: '#E8C26B', marginTop: 3 }} /><span>Επιβεβαιώνω ότι είμαι 18 ετών ή μεγαλύτερη. *</span></label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#f4e8c5', fontSize: 13, margin: '8px 0 18px' }}><input type="checkbox" checked={consentConfirmed} onChange={(e) => setConsentConfirmed(e.target.checked)} style={{ accentColor: '#E8C26B', marginTop: 3 }} /><span>Επιβεβαιώνω ότι συμμετέχω εθελοντικά, έχω δηλώσει τα όριά μου και μπορώ να σταματήσω οποιαδήποτε στιγμή. *</span></label>
        {error && <p role="alert" style={{ color: '#f1a0a0', fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button type="submit" disabled={!valid} style={{ width: '100%', borderRadius: 10, padding: '14px 16px', border: '1px solid #e0c36b', background: !valid ? '#4a4025' : 'linear-gradient(110deg,#8b6a24,#d9bd68,#8b6a24)', color: '#100e09', fontWeight: 800, letterSpacing: '.12em', opacity: !valid ? .65 : 1 }}>
          {saving ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΕΠΙΒΕΒΑΙΩΣΗ ΣΥΜΜΕΤΟΧΗΣ'}
        </button>
      </form>}
      <footer style={{ textAlign: 'center', color: '#796d50', fontSize: 10, letterSpacing: '.18em', marginTop: 24 }}>PRIVATE INVITATION · DEAL OF TEMPTATION</footer>
    </div>
  </main>;
}
