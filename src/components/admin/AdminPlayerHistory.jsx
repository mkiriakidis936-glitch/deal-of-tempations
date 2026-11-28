import React, { useEffect, useMemo, useState } from 'react';
import { appApi, request } from '@/api/apiClient';
import { modeDisplayName } from '@/data/gameConfig';
import { WHEELS, GAMES } from '@/data/modes/movieGames';

// 12.3 · Κάρτα παίκτριας: προτιμήσεις & όρια της Ταινίας (από τη φόρμα), όπως τα βλέπει η διοργανώτρια.
const MOVIE_LIMIT_LABELS = { chairOk: 'Καρέκλα Ανάκρισης', cuffsOk: 'Χειροπέδες / δέσιμο χεριών', tickleOk: 'Γαργάλημα πελμάτων', iceOk: 'Παγάκι', alcoholOk: 'Σφηνάκι (αλκοόλ)', shoesOffOk: 'Βγάλσιμο παπουτσιών & καλτσών', nightOk: 'Βράδυ στον Ύπνο', photosOk: 'Φωτογραφίες στην TV' };
const SHOE = { sneakers: 'Αθλητικά', heels: 'Τακούνια', boots: 'Μποτάκια', flats: 'Μπαλαρίνες', flipflops: 'Σαγιονάρες' };
const SOCK = { short: 'Κοντές', long: 'Ψηλές', fluffy: 'Χνουδωτές', none: 'Χωρίς' };
const FORMAT = { quick: 'Γρήγορο σετ', h48: '48 ώρες', h72: '72 ώρες' };
const wheelTitle = (id) => WHEELS.flatMap((w) => w.items).find((i) => i.id === id)?.title || id;
function movieInfo(app) {
  const m = app?.movieProfile;
  if (!m) return null;
  return {
    no: Object.entries(MOVIE_LIMIT_LABELS).filter(([k]) => m[k] === false).map(([, l]) => l),
    wheelNo: (m.wheelNo || []).map(wheelTitle),
    prefs: [m.format && `Ροή: ${FORMAT[m.format] || m.format}`, m.shoeType && `Παπούτσια: ${SHOE[m.shoeType] || m.shoeType}${m.shoeSize ? ` (${m.shoeSize})` : ''}`, m.sockType && `Κάλτσες: ${SOCK[m.sockType] || m.sockType}`, (m.favGames || []).length ? `Παιχνίδια: ${m.favGames.map((g) => GAMES.find((x) => x.id === g)?.name || g).join(', ')}` : ''].filter(Boolean),
    health: m.health || '',
  };
}
import { AdminAvatar } from '@/components/admin/AdminGameUI';

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
    return Promise.all([list('PlayerProfile'), list('SessionArchive'), list('Achievement'), list('PlayerIntake'), list('PajamaIntake'), list('VIPInvitationSubmission')])
      .then(([profiles, archives, awards, ...apps]) => setData({ profiles, archives, awards, apps: apps.flat() }));
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
      if (!map.has(k)) map.set(k, { name: String(name).trim(), nights: 0, wins: 0, modes: {}, last: '', apps: [], awards: [] });
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
    (data.awards || []).forEach((a) => { const k = keyOf(a.playerName); if (k && map.has(k)) map.get(k).awards.push(a); });
    return [...map.values()].map((r) => {
      const fav = Object.entries(r.modes).sort((a, b) => b[1] - a[1])[0]?.[0];
      const latest = [...r.apps].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')))[0];
      const wanted = latest ? (latest.preferredModes?.length ? latest.preferredModes : [latest.vipGameMode || latest.gameMode].filter(Boolean)) : [];
      return { ...r, fav, latest, wanted, limits: limitsOf(latest), movie: movieInfo(latest), nail: latest?.nailColor || '', pajama: latest?.pajamaStyle || '', slipper: latest?.slipperType || '', contact: latest?.contact || latest?.phone || latest?.email || '' };
    }).sort((a, b) => b.nights - a.nights || b.wins - a.wins || a.name.localeCompare(b.name, 'el'));
  }, [data]);

  const shown = rows.filter((r) => !q || keyOf(r.name).includes(keyOf(q)));
  if (!data) return <div className="text-white/60">Φόρτωση…</div>;
  return (
    <div className="mx-auto max-w-4xl space-y-4 text-white">
      <p className="text-[15px] text-white/60">Η κάρτα κάθε παίκτριας: βραδιές, νίκες, βραβεία, αγαπημένο mode, τα όρια και οι προτιμήσεις της πιο πρόσφατης αίτησης (και της Ταινίας) — έτοιμα για την επόμενη πρόσκληση και για τη βραδιά.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Αναζήτηση ονόματος…" className="h-11 w-full rounded-xl bg-[#1C1C1E] px-4 text-[15px]" />
      {msg && <div role="status" className="rounded-xl bg-[#2C2C2E] px-3 py-2 text-sm">{msg}</div>}
      <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
        {shown.length === 0 && <div className="p-4 text-white/55">Δεν υπάρχουν παίκτριες ακόμα.</div>}
        {shown.map((r) => (
          <div key={r.name} className="border-b border-white/10 last:border-0">
            <button type="button" onClick={() => setOpen(open === r.name ? '' : r.name)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <AdminAvatar name={r.name} size={40} />
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.name}</span><span className="text-[13px] text-white/55">{r.nights} βραδιές · {r.wins} νίκες{r.awards.length ? ` · 🏅 ${r.awards.length}` : ''}{r.fav ? ` · ❤️ ${modeDisplayName(r.fav)}` : ''}{(r.limits.length || r.movie?.no.length || r.movie?.wheelNo.length) ? ' · ⚠️ όρια' : ''}</span></span>
              <span className="text-white/40">{open === r.name ? '−' : '›'}</span>
            </button>
            {open === r.name && (
              <div className="space-y-1.5 px-4 pb-4 text-sm text-white/80">
                {r.last && <div>Τελευταία βραδιά: {new Date(r.last).toLocaleDateString('el-GR')}</div>}
                {r.wanted.length > 0 && <div>Ζήτησε: {r.wanted.map(modeDisplayName).join(', ')}</div>}
                <div>Όρια: {r.limits.length ? r.limits.join(' · ') : 'δεν έχουν δηλωθεί'}</div>
                {r.movie && (r.movie.no.length > 0 || r.movie.wheelNo.length > 0 || r.movie.health) && (
                  <div className="rounded-xl bg-[#FF453A]/10 p-2.5">
                    <div className="font-semibold text-[#FF8A80]">🎬 Ταινία — δεν θέλει</div>
                    {r.movie.no.length > 0 && <div>{r.movie.no.join(' · ')}</div>}
                    {r.movie.wheelNo.length > 0 && <div className="text-white/70">Ποινές Τροχού: {r.movie.wheelNo.join(' · ')}</div>}
                    {r.movie.health && <div className="text-white/70">Υγεία/αλλεργίες: {r.movie.health}</div>}
                  </div>
                )}
                {((r.movie?.prefs.length || 0) > 0 || r.nail || r.pajama || r.slipper) && (
                  <div className="rounded-xl bg-white/5 p-2.5">
                    <div className="font-semibold text-[#F7E3A8]">✨ Προτιμήσεις</div>
                    <div>{[...(r.movie?.prefs || []), r.nail && `Νύχια: ${r.nail}`, r.pajama && `Πιτζάμες: ${r.pajama}`, r.slipper && `Παντόφλες: ${r.slipper}`].filter(Boolean).join(' · ')}</div>
                  </div>
                )}
                {r.awards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{r.awards.slice(0, 12).map((a, i) => <span key={a.id || i} className="rounded-full bg-[#E8C26B]/15 px-2.5 py-1 text-[12px] text-[#F7E3A8]">{a.icon || '🏅'} {a.achievementName || a.achievementId}</span>)}</div>
                )}
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
