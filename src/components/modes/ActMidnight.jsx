import React, { useState } from 'react';
import { Panel, Btn } from '@/components/modes/ModeShell';
import { GATE_TOKENS, BLIND_TEXTURES, WHISPER_QUESTIONS, ASMR_CLIPS } from '@/data/modes/extendedContent';
import { pick, sfx, whisper, useLocalCountdown } from '@/lib/modeKit';

// Act 2 — The Midnight ASMR & Tickle Vault
export default function ActMidnight({ ctx, onDone }) {
  const { players, mg, setMg, log } = ctx;
  const tokens = mg.tokens || {};
  const entered = mg.entered || {};
  const [tab, setTab] = useState('blind');
  const seatIdx = (mg.seat || 0) % Math.max(1, players.length);
  const seat = players[seatIdx];
  const nextSeat = () => setMg({ seat: (seatIdx + 1) % players.length });

  const canPlay = (p) => (tokens[p.id] || 0) >= GATE_TOKENS || entered[p.id];

  return (
    <div className="space-y-3">
      <Panel title="🚪 Είσοδος στο Vault" accent="#8B5CF6">
        <p className="text-xs opacity-75">Χρειάζονται {GATE_TOKENS} Glam Tokens. Όσες δεν τα κατάφεραν «αγοράζουν» την είσοδο με αστεία αγγαρεία ή με tokens από συμπαίκτριες.</p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <span key={p.id} className={`px-2 py-1 rounded text-sm ${canPlay(p) ? 'bg-emerald-800' : 'bg-red-900'}`}>
              {p.name} · {tokens[p.id] || 0}🪙
              {!canPlay(p) && (
                <button className="ml-2 underline text-xs" onClick={() => { setMg({ entered: { ...entered, [p.id]: true } }); log(`🧹 ${p.name} αγόρασε είσοδο με αγγαρεία`); }}>αγγαρεία ✓</button>
              )}
            </span>
          ))}
        </div>
      </Panel>

      <div className="flex gap-2 flex-wrap">
        {[['blind', '🙈 Blind ASMR Test'], ['whisper', '🤫 Midnight Whispers'], ['clips', '🎧 ASMR Clues']].map(([id, label]) => (
          <Btn key={id} color={tab === id ? 'bg-violet-700' : 'bg-secondary'} onClick={() => setTab(id)}>{label}</Btn>
        ))}
      </div>

      <div className="text-sm opacity-80">Στη «ζεστή καρέκλα»: <b>{seat?.name}</b> {seat && !canPlay(seat) && '(δεν έχει μπει στο Vault)'}</div>

      {tab === 'blind' && <BlindTest ctx={ctx} seat={seat} onDone={nextSeat} />}
      {tab === 'whisper' && <Whispers ctx={ctx} seat={seat} onDone={nextSeat} />}
      {tab === 'clips' && <Clips />}

      <div className="text-center"><Btn color="bg-emerald-700" className="!text-lg !px-8 !py-4" onClick={onDone}>Επόμενη φάση →</Btn></div>
    </div>
  );
}

function BlindTest({ ctx, seat, onDone }) {
  const { mg, setMg, log, addTokens } = ctx;
  const [tex, setTex] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [run, setRun] = useState(false);
  const [penalty, setPenalty] = useState(false);
  const left = useLocalCountdown(penalty ? 30 : 20, run, () => { sfx.alarm(); setRun(false); });

  function newRound() { setTex(pick(BLIND_TEXTURES)); setReveal(false); setRun(false); setPenalty(false); }

  function result(ok) {
    if (ok) {
      addTokens(seat.id, 3);
      setMg({ immune: [...(ctx.mg.immune || []), seat.id] });
      log(`🙈 ${seat.name} μάντεψε σωστά «${tex.name}»: +3 🪙 και ασυλία`);
      sfx.ok();
      setTex(null);
      onDone();
    } else {
      log(`🙈 ${seat.name} έκανε λάθος στο «${tex.name}» — 30″ αργό γαργάλημα με φτερό/δάχτυλα`);
      sfx.fail();
      setPenalty(true);
      setRun(false);
    }
  }

  return (
    <Panel title="🙈 The Blind ASMR Test" accent="#8B5CF6">
      <p className="text-sm opacity-80">Η {seat?.name} φοράει μάσκα ύπνου και κάθεται αναπαυτικά με τα πέλματα ελεύθερα. Οι υπόλοιπες εφαρμόζουν την κρυφή υφή για 20″. Στόχος: να μαντέψει υφή και ποια την αγγίζει.</p>
      {!tex ? (
        <Btn color="bg-violet-700" onClick={newRound}>🎴 Νέα κρυφή κάρτα υφής</Btn>
      ) : (
        <div className="space-y-2">
          <div className="rounded bg-violet-950/70 p-3">
            {reveal ? (<><b>{tex.name}</b><div className="text-sm">{tex.text}</div></>) : <div className="opacity-70 text-sm">🔒 Κρυφή υφή (δείξτο μόνο στις «Therapists»)</div>}
            <button className="text-xs underline mt-1" onClick={() => setReveal((r) => !r)}>{reveal ? 'Απόκρυψη' : '👁 Εμφάνιση'}</button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn color="bg-sky-700" onClick={() => setRun(true)} disabled={run}>⏱ {Math.ceil(run ? left : (penalty ? 30 : 20))}″ {penalty ? 'ποινή' : 'ερέθισμα'}</Btn>
            {!penalty && <Btn color="bg-emerald-700" onClick={() => result(true)}>✅ Σωστά (+3🪙, ασυλία)</Btn>}
            {!penalty && <Btn color="bg-red-800" onClick={() => result(false)}>❌ Λάθος</Btn>}
            {penalty && <Btn color="bg-emerald-700" onClick={() => { setTex(null); setPenalty(false); onDone(); }}>Τέλος ποινής →</Btn>}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Whispers({ ctx, seat, onDone }) {
  const { log } = ctx;
  const [q, setQ] = useState(null);
  const [run, setRun] = useState(false);
  const left = useLocalCountdown(15, run, () => { sfx.alarm(); setRun(false); });
  return (
    <Panel title="🤫 The Midnight Whispers" accent="#8B5CF6">
      <p className="text-sm opacity-80">Φώτα στο ελάχιστο, κύκλος σε απόσταση αναπνοής. Η ερώτηση φαίνεται ΜΟΝΟ στο tablet — ψιθυρίζεται, δεν δείχνεται στην τηλεόραση. Όποια γελάσει δυνατά τρώει «Whisper Penalty»: 15″ απαλό δέσιμο καρπών με σατέν κορδέλα και ελαφρύ γαργάλημα.</p>
      {!q ? (
        <Btn color="bg-violet-700" onClick={() => setQ(pick(WHISPER_QUESTIONS))}>🎴 Νέα ερώτηση για {seat?.name}</Btn>
      ) : (
        <div className="space-y-2">
          <div className="rounded bg-violet-950/70 p-3 font-body text-lg">{q}</div>
          <div className="flex flex-wrap gap-2 items-center">
            <Btn color="bg-red-800" onClick={() => { setRun(true); log(`🤫 Whisper Penalty — ${seat?.name} ή όποια γέλασε (15″)`); sfx.fail(); }}>😂 Γέλασε! Ποινή 15″</Btn>
            {run && <b>{Math.ceil(left)}″</b>}
            <Btn color="bg-emerald-700" onClick={() => { setQ(null); setRun(false); onDone(); }}>Επόμενη →</Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Clips() {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const clip = ASMR_CLIPS[i];
  return (
    <Panel title="🎧 ASMR Clues" accent="#8B5CF6">
      <p className="text-sm opacity-80">Το κινητό παίζει παραμορφωμένο ψίθυρο. Η ομάδα βρίσκει τη λέξη-κλειδί.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <Btn color="bg-violet-700" onClick={() => { whisper(clip.say); setShow(false); }}>▶ Clip #{i + 1} ({clip.hint})</Btn>
        <Btn onClick={() => setShow((s) => !s)}>{show ? `Λέξη: ${clip.keyword}` : '👁 Λέξη-κλειδί'}</Btn>
        <Btn onClick={() => { setI((i + 1) % ASMR_CLIPS.length); setShow(false); }}>Επόμενο clip →</Btn>
      </div>
    </Panel>
  );
}
