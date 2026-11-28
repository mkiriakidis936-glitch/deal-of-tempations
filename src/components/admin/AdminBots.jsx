import React, { useEffect, useRef, useState } from 'react';
import { appApi } from '@/api/apiClient';
import { nextBotAction } from '@/lib/movieBots';
import { nightSession } from '@/lib/readiness';

// 12.0 · «Ψεύτικα κινητά»: ρομπότ-παίκτριες για πρόβα της Ταινίας χωρίς πραγματικά κινητά.
// Στέλνουν ΑΚΡΙΒΩΣ τις ίδιες ενέργειες με ένα κινητό (ζάρι, ψήφος, Θάρρος/Αλήθεια, κουτί, DEAL/NO DEAL,
// επιβεβαίωση Τροχού, νύχια) — μία κάθε λίγα δευτερόλεπτα. Το Tablet πρέπει να είναι ανοιχτό για να τις «διαβάζει».
export default function AdminBots({ sessions = [] }) {
  const night = nightSession(sessions);
  const [sessionId, setSessionId] = useState('');
  const session = sessions.find((s) => s.id === sessionId) || night;
  // Οι «Ρομπο-» παίκτριες (bot: true) τις κινεί ήδη το Tablet· εδώ μόνο οι πραγματικές.
  const players = (session?.state?.players || []).filter((p) => !p.bot);
  const [bots, setBots] = useState([]);
  const [on, setOn] = useState(false);
  const [log, setLog] = useState([]);
  const botsRef = useRef(bots);
  botsRef.current = bots;
  const nameOf = (id) => players.find((p) => p.id === id)?.name || id;

  useEffect(() => { setBots(players.map((p) => p.id)); }, [session?.id, players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!on || !session?.id) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const { items } = await appApi.entities.GameSession.filter({ sessionCode: session.sessionCode }, { limit: 1 });
        const st = items?.[0]?.state;
        if (!alive || !st || st.mg?.playerAction) return; // περιμένει να «διαβάσει» το Tablet την προηγούμενη
        const a = nextBotAction(st, botsRef.current);
        if (!a) return;
        await appApi.entities.GameSession.update(session.id, { statePatch: { mg: { playerAction: { ...a, at: Date.now() } } } });
        if (alive) setLog((l) => [`${new Date().toLocaleTimeString('el-GR')} · 🤖 ${nameOf(a.playerId)}: ${a.type.replace('cg_', '')}${a.value != null ? ` ${a.value}` : ''}${a.nail ? ` ${a.nail}` : ''}`, ...l].slice(0, 25));
      } catch (e) { if (alive) setLog((l) => [`⚠️ ${e.message}`, ...l].slice(0, 25)); }
    };
    tick();
    const id = setInterval(tick, 3500);
    return () => { alive = false; clearInterval(id); };
  }, [on, session?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="adm-card space-y-3">
      <div className="adm-card-title">🤖 Ψεύτικα κινητά (πρόβα Ταινίας)</div>
      <p className="text-[13px] text-foreground/60">Οι παίκτριες που επιλέγεις «παίζουν» μόνες τους όπως ένα κινητό: ρίχνουν ζάρι, ψηφίζουν, διαλέγουν Θάρρος/Αλήθεια, ανοίγουν κουτιά, επιβεβαιώνουν τον Τροχό. Κράτα ανοιχτό το Tablet (εκείνο εφαρμόζει τις ενέργειες) και την TV. Μόνο για πρόβα — κλείσ' το πριν έρθουν οι καλεσμένες.</p>
      <select className="ui-input" value={session?.id || ''} onChange={(e) => { setOn(false); setSessionId(e.target.value); }} aria-label="Παρτίδα">
        <option value="">— Παρτίδα —</option>
        {sessions.map((s) => <option key={s.id} value={s.id}>{s.sessionCode} · {s.mode}</option>)}
      </select>
      {session?.mode && session.mode !== 'deal_movie' && <p className="text-[13px] text-[#FF9F0A]">Τα ψεύτικα κινητά δουλεύουν στην Ταινία. Σε αυτό το παιχνίδι δεν κάνουν τίποτα.</p>}
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <label key={p.id} className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-sm">
            <input type="checkbox" checked={bots.includes(p.id)} onChange={(e) => setBots((b) => (e.target.checked ? [...b, p.id] : b.filter((x) => x !== p.id)))} />🤖 {p.name}
          </label>
        ))}
      </div>
      <button type="button" className={`adm-pill ${on ? 'is-danger' : ''}`} disabled={!session || !bots.length} onClick={() => setOn((v) => !v)}>{on ? '⏹ Σταμάτα τα ψεύτικα κινητά' : '▶ Ξεκίνα τα ψεύτικα κινητά'}</button>
      {log.length > 0 && <ol className="max-h-60 space-y-0.5 overflow-auto text-[12px] text-foreground/70">{log.map((l, i) => <li key={i}>{l}</li>)}</ol>}
    </section>
  );
}
