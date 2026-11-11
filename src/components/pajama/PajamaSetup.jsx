import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PAJAMA_TITLE, PAJAMA_SUBTITLE, PAJAMA_EQUIPMENT, PAJAMA_GEAR, PAJAMA_FLOW, PAJAMA_SCORING } from '@/data/pajamaContent';

const ORIGIN = window.location.origin;

export default function PajamaSetup({ players = [], sessionCode = '', onStart }) {
  const [names, setNames] = useState(players.map((p) => p.name));
  const [approved, setApproved] = useState([]);
  const [copied, setCopied] = useState(false);
  const [teamMode, setTeamMode] = useState(false);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadApproved = React.useCallback(async () => {
    try {
      const { items } = await base44.entities.PajamaIntake.filter({}, { sort: '-created_date', limit: 100 });
      const list = (items || []).filter((i) => i.approved === true && i.name);
      setApproved(list);
      setLoadError(false);
      setNames((prev) => {
        const merged = prev.map((n) => (n || '').trim()).filter(Boolean);
        list.forEach((i) => {
          const nm = i.name.trim();
          if (!merged.includes(nm)) merged.push(nm);
        });
        return merged.length > 0 ? merged : [''];
      });
    } catch (e) {
      console.error('approved intake load error', e);
      setLoadError(true);
    }
    setLoadingApproved(false);
  }, []);

  useEffect(() => {
    loadApproved();
    let unsub;
    try {
      unsub = base44.entities.PajamaIntake.subscribe(() => loadApproved());
    } catch (e) { console.error('intake subscribe failed', e); }
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [loadApproved]);

  const joinUrl = `${ORIGIN}/play?code=${encodeURIComponent(sessionCode)}`;
  const filled = names.map((n) => (n || '').trim()).filter(Boolean);

  function update(i, value) {
    setNames(names.map((n, idx) => (idx === i ? value : n)));
  }

  function addRow() {
    setNames([...names, '']);
  }

  function removeRow(i) {
    setNames(names.filter((_, idx) => idx !== i));
  }

  function addApproved(name) {
    if (names.includes(name)) return;
    setNames([...names.filter((n) => (n || '').trim()), name]);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { console.error('copy failed', e); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-pink-950 to-slate-950 text-pink-50 p-4 pb-16">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="text-center pt-6">
          <div className="text-5xl mb-2">🛏️🧸🩴💅🎀</div>
          <h1 className="font-heading text-3xl sm:text-4xl text-pink-100 drop-shadow-[0_0_20px_rgba(255,105,180,0.85)]">
            {PAJAMA_TITLE}
          </h1>
          <p className="text-sm text-pink-300 mt-1">{PAJAMA_SUBTITLE}</p>
        </div>

        {sessionCode && (
          <div className="rounded-xl border-2 border-pink-400/70 bg-pink-900/40 p-3 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-pink-300">Κωδικός συνεδρίας</div>
            <div className="font-heading text-4xl tracking-[0.25em] text-pink-50 my-1">{sessionCode}</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button onClick={copyCode} className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold">
                {copied ? '✅ ΑΝΤΙΓΡΑΦΗΚΕ' : '📋 COPY ΚΩΔΙΚΟΥ'}
              </button>
              <a href={joinUrl} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-slate-900/70 border border-pink-400/50 text-pink-100 text-sm font-bold">
                📲 Link κινητού
              </a>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-heading text-lg text-pink-200">✅ Εγκεκριμένες από το Admin ({approved.length})</div>
            <button onClick={loadApproved} className="px-2 py-1 rounded-lg bg-pink-700 hover:bg-pink-600 text-white text-xs font-bold">
              🔄 ΑΝΑΝΕΩΣΗ
            </button>
          </div>
          {approved.length === 0 ? (
            <div className="text-xs text-pink-300/80">
              {loadingApproved
                ? 'Φόρτωση εγκρίσεων...'
                : loadError
                  ? '⚠️ Δεν φορτώθηκαν οι εγκρίσεις — πάτα «ΑΝΑΝΕΩΣΗ».'
                  : 'Καμία έγκριση ακόμα. Άνοιξε Admin → Intakes → Pajama και πάτα «Έγκριση» στις φόρμες που θες να παίξουν, μετά ξαναπάτα «ΑΝΑΝΕΩΣΗ» εδώ.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {approved.map((i) => (
                <button
                  key={i.id}
                  onClick={() => addApproved(i.name)}
                  className="text-left rounded-lg border border-pink-400/50 bg-slate-950/50 px-2 py-1 hover:bg-pink-900/50"
                >
                  <div className="font-bold text-sm">{i.name}</div>
                  <div className="text-xs text-pink-300/80">
                    💅 {i.nailColor || '—'} · 🩴 {i.slipperType || '—'} · 🦶 {i.footSensitivity || 3}/5 · 🍃 {i.ticklish || 3}/5
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border-2 border-rose-400/60 bg-rose-950/50 p-3">
          <div className="font-heading text-lg text-rose-200 mb-1">⛓️ Gear Check — πριν το START</div>
          <p className="text-sm text-pink-100/90">
            Βεβαιωθείτε ότι έχετε έτοιμες τις σατέν κορδέλες και τις ζώνες πιτζάμας για τα δεσίματα:
          </p>
          <ul className="mt-1 space-y-0.5 text-sm text-pink-100/80">
            {PAJAMA_GEAR.map((line) => <li key={line}>• {line}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="font-heading text-lg text-pink-200 mb-1">🧺 Εξοπλισμός Δωματίου</div>
          <p className="text-sm text-pink-100/80">{PAJAMA_EQUIPMENT}</p>
        </div>

        <div className="rounded-xl border border-pink-500/30 bg-pink-950/40 p-3">
          <div className="font-heading text-lg text-pink-200 mb-1">📜 Ροή</div>
          <ul className="space-y-1 text-sm text-pink-100/80">
            {PAJAMA_FLOW.map((line) => <li key={line}>• {line}</li>)}
          </ul>
          <div className="font-heading text-lg text-pink-200 mt-3 mb-1">🏆 Πόντοι</div>
          <ul className="space-y-1 text-sm text-pink-100/80">
            {PAJAMA_SCORING.map((line) => <li key={line}>• {line}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-heading text-lg text-pink-200">👯 Παίκτριες ({filled.length})</div>
            <button onClick={addRow} className="px-2 py-1 rounded-lg bg-pink-700 hover:bg-pink-600 text-white text-xs font-bold">➕ ΠΡΟΣΘΗΚΗ</button>
          </div>
          <div className="space-y-2">
            {names.map((n, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={n}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder={`Όνομα ${i + 1}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-pink-500/40 text-pink-50 text-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button onClick={() => removeRow(i)} className="px-2 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-100 text-sm">✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-pink-500/40 bg-pink-950/50 p-3">
          <div className="font-heading text-lg text-pink-200 mb-2">⚔️ Τρόπος παιχνιδιού</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTeamMode(false)}
              className={`py-2 rounded-lg font-heading text-sm ${!teamMode ? 'bg-pink-600 text-white' : 'bg-pink-950/70 border border-pink-500/40 text-pink-200'}`}
            >
              ΑΤΟΜΙΚΟ
            </button>
            <button
              onClick={() => setTeamMode(true)}
              disabled={filled.length < 4}
              className={`py-2 rounded-lg font-heading text-sm disabled:opacity-40 ${teamMode ? 'bg-pink-600 text-white' : 'bg-pink-950/70 border border-pink-500/40 text-pink-200'}`}
            >
              ΟΜΑΔΕΣ 2v2
            </button>
          </div>
          <div className="text-xs text-pink-300/80 mt-1">
            {teamMode
              ? 'Τα σκορ μετράνε ανά ομάδα (A/B). Θέλει τουλάχιστον 4 παίκτριες.'
              : 'Κάθε παίκτρια κρατάει το δικό της σκορ.'}
          </div>
        </div>

        <button
          onClick={() => onStart(filled, teamMode)}
          disabled={filled.length < 2 || (teamMode && filled.length < 4)}
          className="w-full py-4 rounded-xl font-heading text-2xl bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_30px_rgba(255,105,180,0.6)] disabled:opacity-40"
        >
          START
        </button>
      </div>
    </div>
  );
}