import React, { useEffect, useState } from 'react';
import { request } from '@/api/apiClient';
import { fetchOverrides, listMedia } from '@/lib/media';
import { readinessChecks } from '@/lib/nightReadiness';
import { useConnectionStatus } from '@/components/shared/ConnectionBanner';
import { buildMediaManifest, manifestSummary } from '@/lib/mediaManifest';

// 12.0.0 · «Έτοιμοι για βραδιά;» στο Tablet. Ανανεώνεται κάθε 10″.
const ICON = { ok: '✅', warn: '🟠', bad: '⛔', info: 'ℹ️' };

export function useReadiness(state, sessionCode) {
  const [presence, setPresence] = useState({});
  const [tv, setTv] = useState(null);
  const [lights, setLights] = useState(null);
  const [media, setMedia] = useState(null);
  const status = useConnectionStatus();
  useEffect(() => {
    if (!sessionCode) return undefined;
    let alive = true;
    const code = encodeURIComponent(sessionCode);
    const load = () => {
      request('GET', `/api/entities/player-presence/${code}`).then((d) => alive && setPresence(Object.fromEntries((d.players || []).map((p) => [p.playerId, p.lastSeenAt])))).catch(() => {});
      request('GET', `/api/entities/tv-presence/${code}`).then((d) => alive && setTv(d)).catch(() => {});
      request('GET', '/api/lights/status').then((d) => alive && setLights(d)).catch(() => alive && setLights(null));
    };
    load();
    // Χάρτης φωτογραφιών/βίντεο: μία φορά (βαρύ)
    Promise.all([fetchOverrides(), listMedia().catch(() => null)])
      .then(([ov, assets]) => { if (alive) setMedia(manifestSummary(buildMediaManifest(ov?.[0]?.value || ov?.value || {}, assets))); })
      .catch(() => {});
    const t = setInterval(load, 10000);
    return () => { alive = false; clearInterval(t); };
  }, [sessionCode]);
  const hours = (state?.gameDurationMinutes || 360) / 60;
  return readinessChecks({ state, presence, tv, lights, media, tabletOnline: status.ok, eventHours: Math.min(24, hours) });
}

export default function ReadinessCheck({ state, sessionCode, compact = false }) {
  const r = useReadiness(state, sessionCode);
  const [open, setOpen] = useState(!compact);
  return (
    <div className="mvg-glass p-4">
      <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>
          <span className="show-kicker block text-[11px]">Πριν ξεκινήσεις</span>
          <span className="show-title block text-[24px]">{r.ready ? (r.warn ? 'Σχεδόν έτοιμοι' : 'Έτοιμοι για βραδιά!') : `Θέλει ${r.bad} ${r.bad > 1 ? 'διορθώσεις' : 'διόρθωση'}`}</span>
        </span>
        <span className="text-3xl" aria-hidden="true">{r.ready ? (r.warn ? '🟠' : '🟢') : '🔴'}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-1.5">
          {r.checks.map((c) => (
            <li key={c.id} className="flex gap-2 rounded-xl bg-black/25 px-3 py-2 text-sm">
              <span aria-hidden="true">{ICON[c.level]}</span>
              <span className="min-w-0"><b>{c.title}</b>{c.level !== 'ok' && c.fix && <span className="block text-xs opacity-70">{c.fix}</span>}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
