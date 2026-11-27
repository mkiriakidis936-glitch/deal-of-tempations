import React, { useCallback, useEffect, useState } from 'react';
import { Tablet, Tv, Smartphone, Square, Play, Copy } from 'lucide-react';
import { appApi, request } from '@/api/apiClient';
import ComicPanel from '@/components/comic/ComicPanel';
import { publishProductionCue, stopProductionCue } from '@/lib/productionCue';
import { useTick } from '@/lib/modeKit';

const QUICK_CUES = [
  { kind: 'scene', label: 'Καλώς ήρθατε', title: 'Τίτλοι αρχής' },
  { kind: 'transition', label: 'Επόμενο κεφάλαιο', title: 'Μετάβαση' },
  { kind: 'break', label: 'Διάλειμμα', title: 'Διάλειμμα' },
  { kind: 'scene', label: 'Μεγάλος τελικός', title: 'Τελικός' },
];

const CUE_STATUS = { pending: 'αναμονή TV', ready: 'στην οθόνη', playing: 'παίζει', paused: 'σε παύση', error: 'σφάλμα', closing: 'κλείνει' };

const pad = (n) => String(n).padStart(2, '0');
const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

function elapsedMs(state, now) {
  if (!state?.gameStartedAt) return 0;
  const pausedNow = state.gamePausedAt ? now - state.gamePausedAt : 0;
  return now - state.gameStartedAt - Number(state.gamePausedMs || 0) - pausedNow;
}

function ShowClock({ state }) {
  useTick(!!state?.gameStartedAt, 1000);
  const now = Date.now();
  const total = Number(state?.gameDurationMinutes || 0) * 60000;
  const spent = elapsedMs(state, now);
  return (
    <div className="text-right">
      <div className="font-mono text-3xl font-semibold tabular-nums sm:text-4xl">{clock(spent)}</div>
      <div className="text-[11px] text-foreground/55">{total ? `απομένουν ${clock(total - spent)}` : 'χρόνος εκπομπής'}</div>
    </div>
  );
}

function TvPreview({ code }) {
  const [on, setOn] = useState(false);
  const [scale, setScale] = useState(0.4);
  const box = useCallback((node) => {
    if (!node) return;
    const fit = () => setScale(node.clientWidth / 1280);
    fit();
    new ResizeObserver(fit).observe(node);
  }, []);
  return (
    <ComicPanel className="bg-card space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="font-heading text-lg">Πρόγραμμα · TV</div>
        <button type="button" className="adm-pill" onClick={() => setOn((v) => !v)}>{on ? 'Απόκρυψη' : 'Προβολή'}</button>
      </div>
      <div ref={box} className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {on ? (
          <iframe
            title="Προεπισκόπηση TV"
            src={`/tv?code=${encodeURIComponent(code)}&preview=1`}
            style={{ width: 1280, height: 720, transform: `scale(${scale})`, transformOrigin: 'top left', border: 0 }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-foreground/50">Η προεπισκόπηση είναι κλειστή για εξοικονόμηση ενέργειας.</div>
        )}
      </div>
    </ComicPanel>
  );
}

export default function AdminLiveShow({ sessions = [], selectedSession, onSelect, onUpdate }) {
  const [cue, setCue] = useState(null);
  const [production, setProduction] = useState(null);
  const [presence, setPresence] = useState({});
  const [customText, setCustomText] = useState('');
  const [winner, setWinner] = useState('');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  const code = selectedSession?.sessionCode || '';
  const state = selectedSession?.state || {};
  const players = state.players || [];
  const paused = !!(state.stopActive || state.mg?.stop);
  const running = !!state.gameStartedAt && !paused;

  useEffect(() => {
    if (!code) return undefined;
    let alive = true;
    const loadCue = () => appApi.entities.ProductionCue.filter({ sessionCode: code }, { limit: 1 })
      .then(({ items = [] }) => { if (alive) setCue(items[0] || null); }).catch(() => {});
    const loadProduction = () => appApi.entities.ShowProduction.filter({ sessionCode: code }, { sort: '-updated_date', limit: 1 })
      .then(({ items = [] }) => { if (alive) setProduction(items[0] || null); }).catch(() => {});
    const loadPresence = () => request('GET', `/api/entities/player-presence/${encodeURIComponent(code)}`)
      .then(({ players: list = [] }) => { if (alive) setPresence(Object.fromEntries(list.map((item) => [item.playerId, Number(item.lastSeenAt)]))); }).catch(() => {});
    loadCue();
    loadProduction();
    loadPresence();
    const presenceTimer = setInterval(loadPresence, 20000);
    const offCue = appApi.entities.ProductionCue.subscribe((event) => {
      if (event?.type === 'resync' || event?.data?.sessionCode === code) loadCue();
    }, { sessionCode: code });
    const offProduction = appApi.entities.ShowProduction.subscribe((event) => {
      if (event?.type === 'resync' || event?.data?.sessionCode === code) loadProduction();
    });
    const offPresence = appApi.entities.PlayerPresence.subscribe((event) => {
      if (event?.data?.sessionCode !== code || !event.data.playerId) return;
      setPresence((current) => ({ ...current, [event.data.playerId]: Number(event.data.lastSeenAt) || Date.now() }));
    });
    return () => { alive = false; clearInterval(presenceTimer); offCue(); offProduction(); offPresence(); };
  }, [code]);

  useTick(Object.keys(presence).length > 0, 10000);
  const online = new Set(Object.entries(presence).filter(([, at]) => Date.now() - at <= 45000).map(([id]) => id));

  async function run(label, action, ok) {
    if (busy) return;
    setBusy(label);
    setMessage('');
    try {
      const result = await action();
      if (result === null || result === false) throw new Error('Η ενέργεια δεν αποθηκεύτηκε.');
      if (ok) setMessage(ok);
    } catch (error) {
      setMessage(error?.message || 'Η ενέργεια απέτυχε.');
    } finally {
      setBusy('');
    }
  }

  const togglePause = () => {
    const now = Date.now();
    const patch = paused
      ? { stopActive: false, mg: { stop: false, stopAt: null, stopBy: null }, gamePausedMs: Number(state.gamePausedMs || 0) + (state.gamePausedAt ? Math.max(0, now - state.gamePausedAt) : 0), gamePausedAt: null }
      : { stopActive: true, mg: { stop: true, stopAt: now, stopBy: 'admin' }, gamePausedAt: now };
    return run('pause', () => onUpdate(selectedSession.id, patch), paused ? 'Η εκπομπή συνεχίζεται.' : 'ΣΤΟΠ σε όλες τις οθόνες.');
  };

  const sendCue = (data, ok) => run('cue', () => publishProductionCue(code, data), ok || `Στην TV: «${data.label}»`);
  const clearTv = () => run('clear', () => stopProductionCue(code), 'Η TV επέστρεψε στο παιχνίδι.');

  const rundown = Array.isArray(production?.rundown) ? production.rundown : [];
  const liveSegmentId = production?.liveSegmentId || '';
  const goSegment = (segment) => run('segment', async () => {
    await publishProductionCue(code, { kind: 'scene', label: segment.title });
    if (production?.id) {
      const saved = await appApi.entities.ShowProduction.update(production.id, { liveSegmentId: segment.id, liveSegmentAt: new Date().toISOString() });
      setProduction(saved);
    }
    return true;
  }, `ON AIR: ${segment.title}`);

  if (!selectedSession) {
    return (
      <ComicPanel className="bg-card py-10 text-center">
        <div className="font-heading text-xl">Δεν υπάρχει ενεργή παρτίδα</div>
        <div className="mt-1 text-sm text-foreground/60">Ξεκίνα παιχνίδι από το Tablet.</div>
        <a href="/" target="_blank" rel="noreferrer" className="adm-pill mt-4 inline-flex">Άνοιγμα Tablet</a>
      </ComicPanel>
    );
  }

  const cueOnAir = cue?.active && cue.playbackCommand !== 'close' && !['closed', 'ended', 'stopped'].includes(cue.playbackStatus);
  const links = [
    { label: 'Tablet', href: `/?code=${code}`, icon: Tablet },
    { label: 'TV', href: `/tv?code=${code}`, icon: Tv },
    { label: 'Κινητά', href: `/play?code=${code}`, icon: Smartphone },
  ];

  return (
    <div className="space-y-3">
      <ComicPanel className="bg-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-md px-3 py-1.5 text-sm font-black tracking-widest ${running ? 'bg-[#FF453A] text-white' : paused ? 'bg-amber-400 text-black' : 'bg-secondary text-foreground/70'}`}>
            {running ? '● ON AIR' : paused ? 'ΣΤΟΠ' : 'OFF AIR'}
          </span>
          <select
            aria-label="Επιλογή παρτίδας"
            value={selectedSession.id}
            onChange={(e) => onSelect(sessions.find((s) => s.id === e.target.value) || null)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:flex-none"
          >
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.sessionCode} · {s.state?.mode || s.mode || '—'}</option>)}
          </select>
          <div className="text-xs text-foreground/60">{players.length} παίκτριες · {online.size} κινητά συνδεδεμένα</div>
          <div className="ml-auto"><ShowClock state={state} /></div>
        </div>
      </ComicPanel>

      {message && <div role="status" className="rounded-lg border border-border bg-card px-3 py-2 text-sm">{message}</div>}

      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
        <TvPreview code={code} />
        <ComicPanel className="bg-card space-y-3">
          <div className="font-heading text-lg">Κεντρικός έλεγχος</div>
          <button
            type="button"
            disabled={!!busy}
            onClick={togglePause}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl py-5 text-lg font-black ${paused ? 'bg-emerald-600 text-white' : 'bg-[#FF453A] text-white'}`}
          >
            {paused ? <><Play size={20} /> Συνέχεια εκπομπής</> : <><Square size={20} /> Στοπ σε όλες τις οθόνες</>}
          </button>
          <div className="rounded-xl border border-border/50 p-3 text-sm">
            <div className="text-[11px] text-foreground/55">Στην TV τώρα</div>
            <div className="font-heading">{cueOnAir ? `${cue.label || cue.kind} · ${CUE_STATUS[cue.playbackStatus] || 'ενεργό'}` : 'Παιχνίδι (χωρίς γραφικό)'}</div>
            {cueOnAir && <button type="button" className="adm-pill mt-2" disabled={!!busy} onClick={clearTv}>Επιστροφή στο παιχνίδι</button>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {links.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="adm-chip justify-center"><Icon aria-hidden="true" />{label}</a>
            ))}
          </div>
          <button type="button" className="adm-pill w-full justify-center" onClick={() => navigator.clipboard?.writeText(`${location.origin}/play?code=${code}`).then(() => setMessage('Αντιγράφηκε ο σύνδεσμος για τα κινητά.'))}>
            <Copy size={14} /> Σύνδεσμος κινητών
          </button>
        </ComicPanel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ComicPanel className="bg-card space-y-3">
          <div className="font-heading text-lg">Γραφικά TV</div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_CUES.map((item) => (
              <button key={item.title} type="button" disabled={!!busy} onClick={() => sendCue({ kind: item.kind, label: item.label })} className="rounded-xl border border-border bg-secondary px-3 py-3 text-left">
                <div className="text-sm font-semibold">{item.title}</div>
                <div className="text-[11px] text-foreground/55">{item.label}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={customText} onChange={(e) => setCustomText(e.target.value)} placeholder="Δικό σου μήνυμα στην TV" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <button type="button" className="adm-pill" disabled={!customText.trim() || !!busy} onClick={() => { sendCue({ kind: 'scene', label: customText.trim() }); setCustomText(''); }}>Στην TV</button>
          </div>
          <div className="flex gap-2">
            <input value={winner} onChange={(e) => setWinner(e.target.value)} list="live-show-players" placeholder="Νικήτρια" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <datalist id="live-show-players">{players.map((p) => <option key={p.id} value={p.name} />)}</datalist>
            <button type="button" className="adm-pill" disabled={!winner.trim() || !!busy} onClick={() => sendCue({ kind: 'winner', label: 'Νικήτρια', winnerName: winner.trim() })}>Ανακοίνωση</button>
          </div>
        </ComicPanel>

        <ComicPanel className="bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="font-heading text-lg">Rundown</div>
            <a href="/admin?tab=production" className="text-xs text-primary">Επεξεργασία</a>
          </div>
          {rundown.length === 0 && <div className="text-sm text-foreground/55">Δεν υπάρχει ροή. Φτιάξε τη στην ενότητα «Παραγωγή».</div>}
          {rundown.map((segment, index) => {
            const live = segment.id === liveSegmentId;
            return (
              <button
                key={segment.id || index}
                type="button"
                disabled={!!busy}
                onClick={() => goSegment(segment)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left ${live ? 'border-[#FF453A] bg-[#FF453A]/10' : 'border-border/50'}`}
              >
                <span className="w-6 text-xs text-foreground/50">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{segment.title}</span>
                <span className="text-xs text-foreground/55">{segment.duration}′</span>
                {live && <span className="text-[10px] font-black text-[#FF453A]">LIVE</span>}
              </button>
            );
          })}
        </ComicPanel>
      </div>

      <ComicPanel className="bg-card space-y-2">
        <div className="font-heading text-lg">Παίκτριες</div>
        {players.length === 0 && <div className="text-sm text-foreground/55">Δεν υπάρχουν παίκτριες στην παρτίδα.</div>}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2">
              <span className={`h-2.5 w-2.5 rounded-full ${online.has(p.id) ? 'bg-emerald-400' : 'bg-foreground/25'}`} aria-label={online.has(p.id) ? 'Συνδεδεμένη' : 'Εκτός σύνδεσης'} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
              <span className="text-xs text-foreground/55">{p.score ?? p.points ?? ''}</span>
            </div>
          ))}
        </div>
      </ComicPanel>
    </div>
  );
}
