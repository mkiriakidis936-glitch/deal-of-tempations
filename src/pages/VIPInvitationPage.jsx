import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '@/api/base44Client';

const AVATARS = ['♠', '♥', '♦', '♣', '👑', '🖤', '🔥', '✨', '🦂', '🐍', '🦇', '🌙'];
const makeSubmissionId = () => globalThis.crypto?.randomUUID?.() || `vip-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function VIPInvitationPage() {
  const { token } = useParams();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const submissionId = useMemo(makeSubmissionId, []);

  useEffect(() => {
    let active = true;
    request('GET', `/api/entities/vip-invitations/${encodeURIComponent(token)}`)
      .then((data) => { if (active) setInvitation(data); })
      .catch((e) => { if (active) setError(e.message || 'Η πρόσκληση δεν είναι διαθέσιμη.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const questions = invitation?.questions || [];
  const updateAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }));
  const valid = name.trim().length > 0 && questions.every((question) => !question.required || String(answers[question.id] || '').trim().length > 0);

  async function submit(event) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await request('POST', `/api/entities/vip-invitations/${encodeURIComponent(token)}/submit`, {
        submissionId, name: name.trim(), avatar, answers,
      });
      setDone(true);
    } catch (e) { setError(e.message || 'Δεν αποθηκεύτηκε η συμμετοχή.'); }
    finally { setSaving(false); }
  }

  const inputStyle = { width: '100%', background: '#111', border: '1px solid rgba(207,174,91,.45)', borderRadius: 10, color: '#f7edcf', padding: '12px 14px', outline: 'none' };
  const labelStyle = { display: 'block', color: '#d7bd78', fontSize: 13, fontWeight: 700, marginBottom: 7 };

  return <main style={{ minHeight: '100dvh', background: 'radial-gradient(ellipse at top, #29200f 0%, #090909 52%, #050505 100%)', color: '#f4e8c5', padding: '32px 16px', fontFamily: 'Georgia,serif' }}>
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', border: '1px solid rgba(207,174,91,.65)', borderRadius: 18, padding: '28px 20px', background: 'linear-gradient(145deg,rgba(31,25,13,.96),rgba(8,8,8,.98))', boxShadow: '0 18px 70px rgba(0,0,0,.55)' }}>
        <div style={{ color: '#c9a94e', letterSpacing: '.42em', fontSize: 11 }}>EXCLUSIVE ACCESS</div>
        <div style={{ color: '#f3df9e', fontSize: 'clamp(30px,8vw,44px)', letterSpacing: '.12em', margin: '14px 0', textShadow: '0 0 25px rgba(201,169,78,.2)' }}>VIP INVITATION</div>
        <div style={{ height: 1, maxWidth: 180, margin: '0 auto 14px', background: 'linear-gradient(90deg,transparent,#c9a94e,transparent)' }} />
        <div style={{ color: '#d6c28c', fontSize: 12, letterSpacing: '.24em' }}>DEAL OF TEMPTATION</div>
      </header>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#c9a94e' }}>Φόρτωση πρόσκλησης…</div> :
      error && !invitation ? <section style={{ textAlign: 'center', padding: 36, border: '1px solid #654747', borderRadius: 14, marginTop: 20 }}>{error}</section> :
      done ? <section style={{ textAlign: 'center', padding: 38, border: '1px solid rgba(207,174,91,.6)', borderRadius: 16, marginTop: 20, background: '#100f0c' }}>
        <div style={{ fontSize: 38, color: '#d7bd78' }}>✦</div>
        <h1 style={{ color: '#e7ce89', fontSize: 27, margin: '12px 0' }}>Η ΣΥΜΜΕΤΟΧΗ ΚΑΤΑΧΩΡΗΘΗΚΕ</h1>
        <p style={{ color: '#cbbd99', lineHeight: 1.7 }}>Η θέση σου καταγράφηκε. Οι λεπτομέρειες θα αποκαλυφθούν την κατάλληλη στιγμή.</p>
      </section> :
      invitation && <form onSubmit={submit} style={{ marginTop: 20, border: '1px solid rgba(207,174,91,.35)', borderRadius: 16, padding: 22, background: 'rgba(12,12,12,.94)' }}>
        <div style={{ color: '#e4cf91', fontSize: 21, textAlign: 'center', marginBottom: 8 }}>{invitation.title}</div>
        <p style={{ color: '#bfb08c', textAlign: 'center', lineHeight: 1.7, fontSize: 14, marginBottom: 22 }}>{invitation.intro}</p>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>ΟΝΟΜΑ / ΨΕΥΔΩΝΥΜΟ *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required style={inputStyle} placeholder="Το όνομα που θα εμφανίζεται στο παιχνίδι" />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>ΕΠΙΛΟΓΗ AVATAR</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 8 }}>
            {AVATARS.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} aria-pressed={avatar === item} style={{ minHeight: 48, borderRadius: 10, border: avatar === item ? '2px solid #e4c66d' : '1px solid rgba(207,174,91,.25)', background: avatar === item ? 'rgba(201,169,78,.18)' : '#111', color: '#f4e8c5', fontSize: 23 }}>{item}</button>)}
          </div>
        </div>
        {questions.map((question) => <div key={question.id} style={{ marginBottom: 18 }}>
          {question.image && <img src={question.image} alt="" loading="lazy" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 9 }} />}
          <label style={labelStyle}>{question.label}{question.required ? ' *' : ''}</label>
          {question.type === 'textarea' ? <textarea rows={3} required={question.required} value={answers[question.id] || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} style={inputStyle} /> :
          question.type === 'select' ? <select required={question.required} value={answers[question.id] || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} style={inputStyle}><option value="">Επίλεξε…</option>{(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> :
          <input required={question.required} value={answers[question.id] || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} style={inputStyle} />}
        </div>)}
        {error && <p role="alert" style={{ color: '#f1a0a0', fontSize: 13, marginBottom: 14 }}>{error}</p>}
        <button type="submit" disabled={!valid || saving} style={{ width: '100%', borderRadius: 10, padding: '14px 16px', border: '1px solid #e0c36b', background: !valid || saving ? '#4a4025' : 'linear-gradient(110deg,#8b6a24,#d9bd68,#8b6a24)', color: '#100e09', fontWeight: 800, letterSpacing: '.12em', opacity: !valid || saving ? .65 : 1 }}>
          {saving ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΕΠΙΒΕΒΑΙΩΣΗ ΣΥΜΜΕΤΟΧΗΣ'}
        </button>
      </form>}
      <footer style={{ textAlign: 'center', color: '#796d50', fontSize: 10, letterSpacing: '.18em', marginTop: 24 }}>PRIVATE INVITATION · DEAL OF TEMPTATION</footer>
    </div>
  </main>;
}
