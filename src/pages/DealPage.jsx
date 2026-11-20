import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const field = 'w-full rounded-xl border border-[#b99a45]/50 bg-black px-4 py-3 text-[#f5ebd1] outline-none focus:border-[#E8C26B]';
const panel = 'w-full max-w-lg rounded-2xl border border-[#b99a45]/60 bg-[#111] p-6 shadow-2xl';

export default function DealPage() {
  const { roomCode: routeCode } = useParams();
  const roomCode = String(routeCode || '').trim().toUpperCase();
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('one_night');
  const [choice, setChoice] = useState('yes');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (roomCode) {
        await base44.entities.Participation.create({ roomCode, name: name.trim(), choice });
        setMessage('Η δήλωσή σου για το συγκεκριμένο Event καταχωρήθηκε.');
      } else {
        await base44.entities.Interest.create({ name: name.trim(), eventType, declaration: choice });
        setMessage('Η δήλωσή σου καταχωρήθηκε. Η διοργανώτρια θα ενημερωθεί.');
      }
      setName('');
    } catch (e) {
      setError(e.message || 'Δεν ήταν δυνατή η αποθήκευση. Έλεγξε τα στοιχεία και δοκίμασε ξανά.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080808] px-4 py-10 text-[#f5ebd1]">
      <form onSubmit={submit} className={panel}>
        <div className="text-center">
          <div className="text-xs tracking-[.4em] text-[#E8C26B]">DEAL OF TEMPTATIONS</div>
          <h1 className="mt-3 font-display text-3xl text-[#F7E3A8]">{roomCode ? 'ΔΗΛΩΣΗ ΣΥΜΜΕΤΟΧΗΣ' : 'ΔΗΛΩΣΗ ΕΝΔΙΑΦΕΡΟΝΤΟΣ'}</h1>
          <p className="mt-2 text-sm text-[#b6aa8b]">{roomCode ? 'Η δήλωση αφορά αποκλειστικά το συγκεκριμένο Event.' : 'Η δήλωση είναι ανεξάρτητη από Event, πρόσκληση ή παιχνίδι.'}</p>
        </div>

        <label className="mt-6 block space-y-2 text-sm font-bold text-[#E8C26B]">
          ΟΝΟΜΑ / NICKNAME
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoComplete="nickname" placeholder="Το όνομά σου ή το nickname σου" />
        </label>

        {!roomCode && (
          <fieldset className="mt-5 space-y-2">
            <legend className="text-sm font-bold text-[#E8C26B]">ΤΥΠΟΣ ΕΜΠΕΙΡΙΑΣ</legend>
            <label className="flex items-center gap-3 rounded-xl border border-[#806a35] bg-black/50 p-3">
              <input type="radio" name="eventType" checked={eventType === 'one_night'} onChange={() => setEventType('one_night')} />
              <span>ONE NIGHT</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[#806a35] bg-black/50 p-3">
              <input type="radio" name="eventType" checked={eventType === 'villa_48h'} onChange={() => setEventType('villa_48h')} />
              <span>48H VILLA</span>
            </label>
          </fieldset>
        )}

        <fieldset className="mt-5 space-y-2">
          <legend className="text-sm font-bold text-[#E8C26B]">ΔΗΛΩΣΗ</legend>
          <label className="flex items-center gap-3 rounded-xl border border-[#806a35] bg-black/50 p-3">
            <input type="radio" name="choice" checked={choice === 'yes'} onChange={() => setChoice('yes')} />
            <span>ΘΕΛΩ ΝΑ ΣΥΜΜΕΤΕΧΩ</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#806a35] bg-black/50 p-3">
            <input type="radio" name="choice" checked={choice === 'no'} onChange={() => setChoice('no')} />
            <span>ΔΕΝ ΜΠΟΡΩ ΝΑ ΣΥΜΜΕΤΕΧΩ</span>
          </label>
        </fieldset>

        <button type="submit" disabled={saving || !name.trim()} className="mt-6 w-full rounded-xl border border-[#E8C26B] bg-[#b99a45] px-4 py-3 font-bold tracking-wide text-black disabled:opacity-50">
          {saving ? 'ΑΠΟΘΗΚΕΥΣΗ…' : 'ΥΠΟΒΟΛΗ ΔΗΛΩΣΗΣ'}
        </button>
        {message && <p role="status" className="mt-4 rounded-xl border border-emerald-700/60 bg-emerald-950/40 p-3 text-center text-sm text-emerald-200">{message}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-700/60 bg-red-950/40 p-3 text-center text-sm text-red-200">{error}</p>}
      </form>
    </main>
  );
}
