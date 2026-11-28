import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { request } from '@/api/apiClient';
import { watchCamera } from '@/lib/liveCamera';
import { FILM } from '@/data/brandArt';
import { VIDEO_SLOTS } from '@/data/mediaSlots';
import { modeDisplayName } from '@/data/gameConfig';
import { rankPlayers, pointsOf } from '@/lib/modeRanking';
import { fmt, timerLeft, useTick } from '@/lib/modeKit';
import * as E from '@/lib/campaignEngine';
import { turnPid } from '@/lib/movieBoardEngine';
import { squareOf } from '@/data/modes/movieBoard';
import { wheelItem } from '@/data/modes/movieGames';
import { STATUS_LABEL } from '@/data/modes/campaignContent';
import { AdminAvatar } from '@/components/admin/AdminGameUI';
import { Scaled, TabletSummary } from '@/components/admin/AdminTriplePreview';
import SectionErrorBoundary from '@/components/shared/SectionErrorBoundary';

const PANELS = {
  live: { label: '📡 Live Show', C: lazy(() => import('@/components/admin/AdminLiveShow')) },
  players: { label: '👥 Παίκτριες', C: lazy(() => import('@/components/admin/AdminPlayers')) },
  production: { label: '🎞 Παραγωγή', C: lazy(() => import('@/components/admin/AdminProduction')) },
  lights: { label: '💡 Φώτα', C: lazy(() => import('@/components/admin/AdminLights')) },
};

// 🎬 ΣΤΟΥΝΤΙΟ: μία οθόνη σαν αίθουσα ελέγχου τηλεόρασης.
// Στον αέρα (TV) · Κάμερες με TAKE · Tablet & όλα τα κινητά · «Πού είμαστε» · ΣΤΟΠ, διάλειμμα, stingers.
// Τίποτα εδώ δεν αλλάζει τους κανόνες: μόνο προβολή + εντολές παραγωγής προς την TV.

const enc = encodeURIComponent;

function CamTile({ code, cam, onAir, onTake, onOff }) {
  const video = useRef(null);
  const [status, setStatus] = useState('connecting');
  useEffect(() => watchCamera({
    sessionCode: code,
    camId: cam.camId,
    onStatus: setStatus,
    onStream: (stream) => { if (video.current) { video.current.srcObject = stream; video.current.play().catch(() => {}); } },
  }), [code, cam.camId]);
  return (
    <div className={`studio-cam ${onAir ? 'is-air' : ''}`}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video ref={video} muted playsInline autoPlay className="h-full w-full object-cover" />
        {status !== 'live' && <div className="absolute inset-0 flex items-center justify-center text-xs text-white/60">{status === 'retry' ? 'Επανασύνδεση…' : 'Σύνδεση…'}</div>}
        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold">{onAir ? '🔴 ΣΤΟΝ ΑΕΡΑ' : `📷 ${cam.label}`}</div>
        {!cam.online && <div className="absolute right-2 top-2 rounded-full bg-[#FF453A] px-2 py-0.5 text-[10px] font-bold">εκτός</div>}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-1">
        <button type="button" className="studio-btn is-gold" onClick={() => onTake(cam.camId, 'pip')}>TAKE γωνία</button>
        <button type="button" className="studio-btn is-red" onClick={() => onTake(cam.camId, 'full')}>TAKE πλήρης</button>
        <button type="button" className="studio-btn" disabled={!onAir} onClick={onOff}>OFF</button>
      </div>
    </div>
  );
}

// «Πού είμαστε»: κατάσταση του παιχνιδιού με μια ματιά.
function WhereWeAre({ state, nameOf }) {
  const mg = state.mg || {};
  const cg = mg.cg;
  const left = mg.timer ? timerLeft(mg.timer) : null;
  const rank = rankPlayers(state.players || [], mg).slice(0, 4);
  const rows = [['🎮 Παιχνίδι', modeDisplayName(state.mode) || state.mode || '—']];
  if (cg) {
    const act = E.currentAct(cg);
    rows.push(['🎬 Κατάσταση', STATUS_LABEL[cg.status] || cg.status || '—']);
    rows.push(['🗺️ Πράξη', `${act.index + 1}/${act.total} · ${act.info.name} — ${act.title}`]);
    const b = cg.board;
    if (b?.on) {
      const t = turnPid(cg);
      rows.push(['🎲 Ζάρι', b.allDone ? 'Όλες τερμάτισαν' : `Σειρά: ${nameOf(t)}${b.pending ? ` · εκκρεμεί «${squareOf(b.pending.index).title}» (${nameOf(b.pending.pid)})` : ''}`]);
      if (b.roll) rows.push(['🎯 Τελευταία ζαριά', `${nameOf(b.roll.pid)} έφερε ${b.roll.value} → ${squareOf(b.roll.to).title}`]);
    }
    if (cg.wheel && !cg.wheel.done) rows.push(['🎡 Τροχός', `${nameOf(cg.wheel.pid)}: ${wheelItem(cg.wheel.id, cg.wheel.itemId)?.title || '—'}`]);
    if (cg.trial && !cg.trial.done) rows.push(['⛓️ Δοκιμασία', `${nameOf(cg.trial.pid)} · ${cg.trial.id}`]);
    if (cg.game) rows.push(['🎮 Παιχνίδι σκηνής', cg.game]);
    if (cg.chair?.active) rows.push(['🪑 Καρέκλα', nameOf(cg.chair.pid)]);
    if (cg.mandatory?.pending) rows.push(['⚠️ Υποχρεωτική κλήρωση', cg.mandatory.pid ? nameOf(cg.mandatory.pid) : 'εκκρεμεί']);
  } else {
    if (state.round) rows.push(['🔁 Γύρος', String(state.round)]);
    if (state.stage != null) rows.push(['📍 Στάδιο', String(state.stage)]);
  }
  if (left !== null) rows.push(['⏱ Χρόνος', fmt(left)]);
  return (
    <div className="studio-panel">
      <div className="studio-title">📍 Πού είμαστε</div>
      <dl className="space-y-1 text-[13px]">
        {rows.map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-[42%] shrink-0 text-white/55">{k}</dt><dd className="min-w-0 font-semibold">{v}</dd></div>)}
      </dl>
      {rank.length > 0 && (
        <ol className="mt-2 space-y-1 border-t border-white/10 pt-2 text-[13px]">
          {rank.map((p, i) => <li key={p.id} className="flex items-center gap-2"><span className="w-4 text-white/45">{i + 1}</span><AdminAvatar name={p.name} seed={p.id} size={20} /><span className="min-w-0 flex-1 truncate">{p.name}</span><b className="tabular-nums text-[#E8C26B]">{pointsOf(mg, p.id)}</b></li>)}
        </ol>
      )}
    </div>
  );
}

export default function AdminStudio({ sessions = [], selectedSession, onSelect, onUpdate }) {
  useTick(true, 2000);
  const code = selectedSession?.sessionCode || '';
  const state = selectedSession?.state || {};
  const players = state.players || [];
  const nameOf = (id) => players.find((p) => p.id === id)?.name || '—';
  const paused = !!(state.stopActive || state.mg?.stop);
  const [cams, setCams] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [presence, setPresence] = useState({});
  const [msg, setMsg] = useState('');
  const [phones, setPhones] = useState(true);
  const [panel, setPanel] = useState('');
  const root = useRef(null);

  // Κάμερες & συνδέσεις κινητών (κάθε 3″).
  useEffect(() => {
    if (!code) return undefined;
    let alive = true;
    const load = () => {
      request('GET', `/api/camera/${enc(code)}/cams`).then((r) => { if (alive) setCams(r.cams || []); }).catch(() => {});
      request('GET', `/api/entities/player-presence/${enc(code)}`).then(({ players: list = [] }) => { if (alive) setPresence(Object.fromEntries(list.map((x) => [x.playerId, Number(x.lastSeenAt)]))); }).catch(() => {});
    };
    load();
    const id = setInterval(load, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [code]);

  const act = async (label, fn) => { setMsg(''); try { await fn(); setMsg(label); } catch (e) { setMsg(e?.message || 'Απέτυχε.'); } };
  const update = (patch) => onUpdate(selectedSession.id, patch);
  const take = (camId, layout) => act(layout === 'full' ? '🔴 Κάμερα σε πλήρη οθόνη στην TV' : '🔴 Κάμερα στη γωνία της TV', () => update({ camera: { live: true, camId, layout, at: Date.now() } }));
  const camOff = () => act('Η κάμερα βγήκε από την TV', () => update({ camera: null }));
  const cue = (id, label) => act(`▶ Στην TV: ${label}`, () => update({ showCue: { id, at: Date.now() } }));
  const togglePause = () => {
    const now = Date.now();
    const patch = paused
      ? { stopActive: false, mg: { stop: false, stopAt: null, stopBy: null }, gamePausedMs: Number(state.gamePausedMs || 0) + (state.gamePausedAt ? Math.max(0, now - state.gamePausedAt) : 0), gamePausedAt: null }
      : { stopActive: true, camera: null, mg: { stop: true, stopAt: now, stopBy: 'admin' }, gamePausedAt: now };
    return act(paused ? 'Η εκπομπή συνεχίζεται.' : '⏹ ΣΤΟΠ σε όλες τις οθόνες.', () => update(patch));
  };
  const newTicket = () => act('QR κάμερας έτοιμο (ισχύει 15′)', async () => {
    const r = await request('POST', `/api/camera/${enc(code)}/ticket`, {});
    setTicket({ url: `${window.location.origin}/cam?code=${enc(code)}&t=${enc(r.ticket)}`, expiresAt: r.expiresAt });
  });
  const removeCam = (camId) => act('Η κάμερα αφαιρέθηκε', async () => {
    await request('DELETE', `/api/camera/${enc(code)}/cam/${enc(camId)}`, {});
    if (state.camera?.camId === camId) await update({ camera: null });
  });
  const fullscreen = () => { const el = root.current; if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); };

  const shows = VIDEO_SLOTS.filter((s) => (s.group === 'show' || s.group === 'stinger') && FILM[s.id]);

  if (!selectedSession) {
    return (
      <div className="studio-root studio-empty">
        <div className="text-2xl font-black">🎬 Στούντιο</div>
        <p className="text-white/60">Δεν υπάρχει ενεργή βραδιά. Ξεκίνα παιχνίδι από το Tablet και το Στούντιο ανοίγει εδώ.</p>
        {sessions.length > 0 && <select className="ui-input max-w-sm" value="" onChange={(e) => onSelect?.(sessions.find((s) => s.id === e.target.value))}><option value="">— Διάλεξε βραδιά —</option>{sessions.map((s) => <option key={s.id} value={s.id}>{s.sessionCode} · {modeDisplayName(s.mode) || s.mode}</option>)}</select>}
      </div>
    );
  }

  return (
    <div ref={root} className="studio-root">
      <header className="studio-bar">
        <span className={`studio-live ${paused ? 'is-stop' : ''}`}>{paused ? '⏹ ΣΤΟΠ' : '● LIVE'}</span>
        <b className="tracking-wide">{code}</b>
        <span className="text-white/60">{modeDisplayName(state.mode) || state.mode} · {players.length} παίκτριες · {Object.values(presence).filter((at) => Date.now() - at < 45000).length} κινητά online · {cams.length}/4 κάμερες</span>
        {sessions.length > 1 && <select className="studio-select" value={selectedSession.id} onChange={(e) => onSelect?.(sessions.find((s) => s.id === e.target.value))}>{sessions.map((s) => <option key={s.id} value={s.id}>{s.sessionCode}</option>)}</select>}
        <span className="ml-auto flex gap-2">
          <button type="button" className="studio-btn" onClick={fullscreen}>⛶ Πλήρης οθόνη</button>
          <button type="button" className={`studio-btn ${paused ? 'is-gold' : 'is-red'}`} onClick={togglePause}>{paused ? '▶ ΣΥΝΕΧΕΙΑ' : '⏹ ΣΤΟΠ'}</button>
        </span>
      </header>
      {msg && <div className="studio-msg" role="status">{msg}</div>}

      <div className="studio-grid">
        <section className="studio-program">
          <div className="studio-title">📺 Στον αέρα — TV</div>
          <div className="studio-screen">
            <Scaled width={1280} height={720}>
              <iframe title="TV στον αέρα" src={`/tv?code=${enc(code)}&preview=1`} style={{ width: 1280, height: 720, border: 0 }} />
            </Scaled>
          </div>
          <div className="studio-row">
            <button type="button" className="studio-btn" disabled={!FILM.breakOutVideo} onClick={() => cue('breakOutVideo', 'Διάλειμμα — έξοδος')}>⏸ Διάλειμμα</button>
            <button type="button" className="studio-btn" disabled={!FILM.breakBackVideo} onClick={() => cue('breakBackVideo', 'Επιστροφή')}>▶ Επιστροφή</button>
            {shows.filter((s) => s.group === 'stinger').map((s) => <button key={s.id} type="button" className="studio-btn" onClick={() => cue(s.id, s.label)}>{s.label.replace('STINGER · ', '🎞 ')}</button>)}
            {!shows.length && <span className="text-xs text-white/50">Ανέβασε βίντεο stingers/διαλείμματος στον Χάρτη media για να εμφανιστούν εδώ.</span>}
          </div>
        </section>

        <section className="studio-cams">
          <div className="flex items-center justify-between">
            <div className="studio-title">📷 Κάμερες</div>
            <button type="button" className="studio-btn is-gold" disabled={cams.length >= 4} onClick={newTicket}>➕ Κάμερα</button>
          </div>
          {ticket && (
            <div className="studio-panel flex items-center gap-3">
              <div className="rounded-xl bg-white p-1.5"><QRCodeSVG value={ticket.url} size={104} level="M" /></div>
              <div className="min-w-0 text-[12px] text-white/70">Σκάναρε με το κινητό που θα γίνει κάμερα. Ισχύει 15′ για έως 4 κάμερες.<div className="mt-1 break-all text-[10px] text-white/40">{ticket.url}</div><button type="button" className="mt-1 underline" onClick={() => setTicket(null)}>Κλείσιμο</button></div>
            </div>
          )}
          {cams.map((cam) => (
            <div key={cam.camId}>
              <CamTile code={code} cam={cam} onAir={!!state.camera?.live && state.camera.camId === cam.camId} onTake={take} onOff={camOff} />
              <button type="button" className="mt-1 text-[11px] text-white/45 underline" onClick={() => removeCam(cam.camId)}>Αφαίρεση κάμερας</button>
            </div>
          ))}
          {!cams.length && !ticket && <p className="text-[12px] text-white/50">Καμία κάμερα. Πάτα «➕ Κάμερα» και σκάναρε το QR με ένα κινητό (ή άνοιξε «📷 Κάμερα» στο Tablet).</p>}
        </section>

        <section className="studio-side">
          <WhereWeAre state={state} nameOf={nameOf} />
          <div className="studio-panel">
            <div className="studio-title">🧰 Πάνελ (χωρίς να φύγεις από το Στούντιο)</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PANELS).map(([id, p]) => <button key={id} type="button" className={`studio-btn ${panel === id ? 'is-gold' : ''}`} onClick={() => setPanel(panel === id ? '' : id)}>{p.label}</button>)}
            </div>
          </div>
          <div className="studio-panel">
            <div className="studio-title">📟 Tablet</div>
            <div className="studio-screen"><Scaled width={1024} height={768}><SectionErrorBoundary name="studio-tablet"><TabletSummary state={state} /></SectionErrorBoundary></Scaled></div>
          </div>
        </section>

        {panel && (() => {
          const P = PANELS[panel].C;
          return (
            <section className="studio-drawer">
              <div className="flex items-center justify-between"><div className="studio-title">{PANELS[panel].label}</div><button type="button" className="studio-btn" onClick={() => setPanel('')}>✕ Κλείσιμο</button></div>
              <div className="studio-drawer-body">
                <SectionErrorBoundary name={`studio-panel:${panel}`} resetKey={panel}>
                  <Suspense fallback={<div className="p-4 text-white/60">Φόρτωση…</div>}>
                    <P sessions={sessions} selectedSession={selectedSession} onSelect={onSelect} onUpdate={onUpdate} />
                  </Suspense>
                </SectionErrorBoundary>
              </div>
            </section>
          );
        })()}

        <section className="studio-phones">
          <div className="flex items-center justify-between">
            <div className="studio-title">📱 Κινητά ({players.length})</div>
            <button type="button" className="studio-btn" onClick={() => setPhones((v) => !v)}>{phones ? 'Απόκρυψη' : 'Προβολή'}</button>
          </div>
          {phones && (
            <div className="studio-phone-grid">
              {players.map((p) => {
                const online = Date.now() - (presence[p.id] || 0) < 45000;
                return (
                  <div key={p.id} className="studio-phone">
                    <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold"><span className={`studio-dot ${online ? 'is-on' : ''}`} />{p.name}</div>
                    <div className="studio-phone-screen">
                      <Scaled width={390} height={844}>
                        <iframe title={`Κινητό · ${p.name}`} tabIndex={-1} loading="lazy" src={`/play/preview?code=${enc(code)}&player=${enc(p.id)}`} style={{ width: 390, height: 844, border: 0, pointerEvents: 'none' }} />
                      </Scaled>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
