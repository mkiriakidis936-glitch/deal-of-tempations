import React, { useEffect, useMemo, useState } from 'react';
import { appApi, request } from '@/api/apiClient';
import { modeDisplayName } from '@/data/gameConfig';

// Ιστορικό παικτριών: βραδιές, νίκες, αγαπημένο mode, τελευταία βραδιά και τα όρια της πιο πρόσφατης αίτησης.
const keyOf = (name) => String(name || '').trim().toLocaleLowerCase('el-GR');
const SAFETY = { touch: 'Χωρίς σωματική επαφή', restraints: 'Χωρίς δεσίματα', blindfolds: 'Χωρίς κάλυψη ματιών', alcohol: 'Χωρίς αλκοόλ', 'personal-disclosure': 'Χωρίς προσωπικές αποκαλύψεις' };

function limitsOf(app) {
  const out = [];
  const a = app?.answers || app?.vipProfile?.answers || {};
  (a.safetyBoundaries || []).forEach((id) => out.push(SAFETY[id] || id));
  if (app?.alcohol === 'no' || app?.drinksAlcohol === false || app?.alcohol === false) out.push('Χωρίς αλκοόλ');
  const free = app?.boundaries || a.boundaries;
  if (free) out.push(String(free));
  return [...new Set(out)];
}

export default function AdminPlayerHistory() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [withApps, setWithApps] = useState(false);

  const load = () => {
    const list = (entity) => appApi.entities[entity].filter({}, { sort: '-created_date', limit: 1000 }).then((r) => (r.items || []).map((item) => ({ ...item, _entity: entity }))).catch(() => []);
    return Promise.all([list('PlayerProfile'), list('SessionArchive'), list('PlayerIntake'), list('PajamaIntake'), list('VIPInvitationSubmission')])
      .then(([profiles, archives, ...apps]) => setData({ profiles, archives, apps: apps.flat() }));
  };
  useEffect(() => { load(); }, []);

  const deleteApp = (app) => {
    if (app._entity === 'VIPInvitationSubmission') return request('DELETE', `/api/entities/vip-submissions/${app.id}`);
    if (app._entity === 'PlayerIntake') return request('DELETE', `/api/entities/player-intakes/${app.id}`);
    return appApi.entities[app._entity].delete(app.id);
  };

  // Σβήνει το ιστορικό για τα ονόματα που δίνονται (ή για όλες, όταν names = null):
  // προφίλ (βραδιές/νίκες), το όνομα από κάθε αρχειοθετημένη βραδιά και —αν το ζητήσεις— τις αιτήσεις.
  async function wipe(names, includeApps) {
    const keys = names ? new Set(names.map(keyOf)) : null;
    const hit = (name) => !!keyOf(name) && (!keys || keys.has(keyOf(name)));
    setBusy(true); setMsg('');
    let profiles = 0; let nights = 0; let apps = 0;
    try {
      for (const p of data.profiles.filter((p) => hit(p.playerName))) { await appApi.entities.PlayerProfile.delete(p.id); profiles += 1; }
      for (const arc of data.archives) {
        const list = arc.playerNames || [];
        const kept = list.filter((name) => !hit(name));
        if (kept.length === list.length && !hit(arc.winner)) continue;
        await appApi.entities.SessionArchive.update(arc.id, { playerNames: kept, ...(hit(arc.winner) ? { winner: '' } : {}) });
        nights += 1;
      }
      if (includeApps) {
        for (const app of data.apps.filter((a) => hit(a.displayName || a.name))) { await deleteApp(app); apps += 1; }
      }
      setMsg(`Καθαρίστηκε ✓ — ${profiles} προφίλ, ${nights} βραδιές ενημερώθηκαν${includeApps ? `, ${apps} αιτήσεις διαγράφηκαν` : ''}.`);
      setOpen('');
      await load();
    } catch (e) {
      setMsg(`Η διαγραφή σταμάτησε: ${e.message || 'σφάλμα'}. Πάτα ξανά για να συνεχίσει.`);
      await load();
    } finally { setBusy(false); }
  }

  function deleteOne(r) {
    if (!window.confirm(`Οριστική διαγραφή του ιστορικού της «${r.name}»;\n\n• Σβήνονται βραδιές, νίκες και αγαπημένο mode.\n• Το όνομά της βγαίνει από τις αρχειοθετημένες βραδιές.\n• Διαγράφονται και οι ${r.apps.length} αιτήσεις της (με όρια και στοιχεία επικοινωνίας).\n\nΔεν αναιρείται.`)) return;
    wipe([r.name], true);
  }
  function deleteAll() {
    if (!window.confirm(`Οριστική διαγραφή ΟΛΟΥ του ιστορικού παικτριών (${rows.length} παίκτριες);\n\n• Σβήνονται όλα τα προφίλ (βραδιές, νίκες).\n• Τα ονόματα βγαίνουν από όλες τις αρχειοθετημένες βραδιές.${withApps ? '\n• Διαγράφονται ΚΑΙ ΟΛΕΣ οι αιτήσεις (και οι εκκρεμείς στο Inbox).' : '\n• Οι αιτήσεις ΜΕΝΟΥΝ στο Inbox.'}\n\nΔεν αναιρείται.`)) return;
    wipe(null, withApps);
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const map = new Map();
    const row = (name) => {
      const k = keyOf(name);
      if (!k) return null;
      if (!map.has(k)) map.set(k, { name: String(name).trim(), nights: 0, wins: 0, modes: {}, last: '', apps: [] });
      return map.get(k);
    };
    data.archives.forEach((arc) => (arc.playerNames || []).forEach((name) => {
      const r = row(name); if (!r) return;
      r.nights += 1;
      if (keyOf(arc.winner) === keyOf(name)) r.wins += 1;
      if (arc.mode) r.modes[arc.mode] = (r.modes[arc.mode] || 0) + 1;
      const date = arc.eventDate || arc.created_date || '';
      if (date > r.last) r.last = date;
    }));
    data.profiles.forEach((p) => { const r = row(p.playerName); if (r) { r.nights = Math.max(r.nights, p.totalSessions || 0); r.wins = Math.max(r.wins, p.totalWins || 0); } });
    data.apps.forEach((app) => { const r = row(app.displayName || app.name); if (r) r.apps.push(app); });
    return [...map.values()].map((r) => {
      const fav = Object.entries(r.modes).sort((a, b) => b[1] - a[1])[0]?.[0];
      const latest = [...r.apps].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))[0];
      const wanted = latest ? (latest.preferredModes?.length ? latest.preferredModes : [latest.vipGameMode || latest.gameMode].filter(Boolean)) : [];
      return { ...r, fav, latest, wanted, limits: limitsOf(latest), contact: latest?.contact || latest?.phone || latest?.email || '' };
    }).sort((a, b) => b.nights - a.nights || b.wins - a.wins || a.name.localeCompare(b.name, 'el'));
  }, [data]);

  const shown = rows.filter((r) => !q || keyOf(r.name).includes(keyOf(q)));
  if (!data) return <div className="text-white/60">Φόρτωση…</div>;
  return (
    <div className="mx-auto max-w-4xl space-y-4 text-white">
      <p className="text-[15px] text-white/60">Κάθε παίκτρια που έχει κάνει αίτηση ή έχει παίξει: πόσες βραδιές, νίκες, αγαπημένο mode και τα όρια της πιο πρόσφατης αίτησής της — έτοιμα για την επόμενη πρόσκληση.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση ονόματος…" className="h-11 w-full rounded-xl bg-[#1C1C1E] px-4 text-[15px]" />
      {msg && <div role="status" className="rounded-xl bg-[#2C2C2E] px-3 py-2 text-sm">{msg}</div>}
      <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
        {shown.length === 0 && <div className="p-4 text-white/55">Δεν υπάρχουν παίκτριες ακόμα.</div>}
        {shown.map((r) => (
          <div key={r.name} className="border-b border-white/10 last:border-0">
            <button type="button" onClick={() => setOpen(open === r.name ? '' : r.name)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2C2C2E] font-bold">{r.name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.name}</span><span className="text-[13px] text-white/55">{r.nights} βραδιές · {r.wins} νίκες{r.fav ? ` · ❤️ ${modeDisplayName(r.fav)}` : ''}</span></span>
              <span className="text-white/40">{open === r.name ? '−' : '›'}</span>
            </button>
            {open === r.name && (
              <div className="space-y-1.5 px-4 pb-4 text-sm text-white/80">
                {r.last && <div>Τελευταία βραδιά: {new Date(r.last).toLocaleDateString('el-GR')}</div>}
                {r.wanted.length > 0 && <div>Ζήτησε: {r.wanted.map(modeDisplayName).join(', ')}</div>}
                <div>Όρια: {r.limits.length ? r.limits.join(' · ') : 'δεν έχουν δηλωθεί'}</div>
                {r.contact && <div>Επικοινωνία: {r.contact}</div>}
                <div className="text-white/45">{r.apps.length} αιτήσεις · τελευταία: {r.latest?.approved ? '✓ εγκεκριμένη' : 'σε αναμονή'}</div>
                <button type="button" disabled={busy} onClick={() => deleteOne(r)} className="mt-2 h-10 rounded-full bg-[#FF453A]/15 px-4 text-sm font-semibold text-[#FF8A80] disabled:opacity-50">🗑 Διαγραφή ιστορικού της {r.name}</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-4">
          <div className="font-semibold text-[#FF8A80]">Καθαρισμός όλου του ιστορικού</div>
          <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={withApps} onChange={(e) => setWithApps(e.target.checked)} /> Να διαγραφούν και όλες οι αιτήσεις (και όσες περιμένουν στο Inbox)</label>
          <button type="button" disabled={busy} onClick={deleteAll} className="h-11 rounded-full bg-[#FF453A] px-5 font-bold text-white disabled:opacity-50">{busy ? 'Διαγραφή…' : '🗑 Διαγραφή όλου του ιστορικού'}</button>
        </div>
      )}
    </div>
  );
}
