import React, { useEffect, useMemo, useState } from 'react';
import { appApi } from '@/api/apiClient';
import { GAME_MODES, modeDisplayName } from '@/data/gameConfig';
import { request } from '@/api/apiClient';
import { fetchOverrides } from '@/lib/media';
import { listMedia } from '@/lib/media';
import { buildMediaManifest, manifestSummary } from '@/lib/mediaManifest';
import { computeReadiness } from '@/lib/readiness';
import { AdminReadiness } from '@/components/admin/AdminGameUI';

const QUICK_LINKS = [
  { id: 'modes', icon: '🎮', title: 'Λειτουργίες παιχνιδιού', detail: 'Διαχείριση λειτουργιών' },
  { id: 'editor', icon: '🃏', title: 'Επεξεργασία παιχνιδιού', detail: 'Περιεχόμενο παιχνιδιού' },
  { id: 'players', icon: '👥', title: 'Παίκτριες', detail: 'Προφίλ και συμμετοχές' },
  { id: 'media', icon: '🖼️', title: 'Κέντρο πολυμέσων', detail: 'Φωτογραφίες και video' },
  { id: 'forms', icon: '📝', title: 'Διαχείριση φορμών', detail: 'Φόρμες και υποβολές' },
  { id: 'settings', icon: '⚙️', title: 'Ρυθμίσεις', detail: 'Κεντρικές ρυθμίσεις' },
];

function MetricCard({ icon, label, value, note, accent }) {
  return <div className="adm-card adm-metric"><div className="adm-metric-bar" /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="adm-label adm-label--caps">{label}</div><div className="adm-metric-value">{value}</div><div className="mt-2 text-xs text-[#e5c76b]/70">{note}</div></div><div className="adm-icon adm-icon--lg">{icon}</div></div></div>;
}

export default function AdminOverview({ sessions = [], loading = false, onNavigate = () => {} }) {
  const [extra, setExtra] = useState({ achievements: null, connection: 'loading', newRequests: null, vipInvitations: null, backup: undefined, media: null, pushDevices: null });
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      appApi.entities.Achievement.filter({}, { limit: 500 }),
      Promise.all([appApi.entities.PublicFormSubmission.filter({ status: 'new' }, { limit: 500 }), appApi.entities.PlayerIntake.filter({}, { limit: 1000 }), appApi.entities.PajamaIntake.filter({}, { limit: 1000 }), appApi.entities.VIPInvitationSubmission.filter({}, { limit: 1000 })]),
      appApi.entities.VIPInvitation.filter({ active: true }, { limit: 100 }),
      request('GET', '/api/backup/list'),
      request('GET', '/api/push/status'),
      Promise.all([fetchOverrides(), listMedia().catch(() => null)]),
    ]).then(([achievements, requests, vip, backup, push, media]) => {
      if (!mounted) return;
      setExtra({
        achievements: achievements.status === 'fulfilled' ? (achievements.value.items || []).length : null,
        connection: achievements.status === 'fulfilled' ? 'connected' : 'error',
        newRequests: requests.status === 'fulfilled' ? requests.value.reduce((sum, result, index) => sum + (result.items || []).filter((item) => index === 0 ? true : (item.approved !== true && item.approvalStatus !== 'rejected' && item.rejected !== true)).length, 0) : null,
        vipInvitations: vip.status === 'fulfilled' ? (vip.value.items || []).length : null,
        backup: backup.status === 'fulfilled' ? (backup.value.items || []).sort((a, b) => Number(b.modified) - Number(a.modified))[0] || null : undefined,
        pushDevices: push.status === 'fulfilled' ? (push.value.devices || []).length : null,
        media: media.status === 'fulfilled' ? manifestSummary(buildMediaManifest(media.value[0]?.value || {}, media.value[1])) : null,
      });
    });
    return () => { mounted = false; };
  }, []);

  const activity = useMemo(() => {
    const active = sessions.filter((s) => [1, 2].includes(Number(s.state?.stage ?? s.stage ?? 0)));
    const finished = sessions.filter((s) => Number(s.state?.stage ?? s.stage ?? 0) >= 3);
    return { active, finished };
  }, [sessions]);
  const recent = sessions.slice(0, 5);
  const readiness = useMemo(() => computeReadiness({ sessions, media: extra.media, backup: extra.backup, newRequests: extra.newRequests, pushDevices: extra.pushDevices, connection: extra.connection }), [sessions, extra]);
  const upcomingEvent = sessions.filter((session) => session.event?.scheduledAt && Date.parse(session.event.scheduledAt) >= Date.now()).sort((a, b) => Date.parse(a.event.scheduledAt) - Date.parse(b.event.scheduledAt))[0] || recent[0] || null;
  const playerCount = new Set(sessions.flatMap((session) => (session.state?.players || []).map((player) => player.id || player.name).filter(Boolean).map((value) => String(value).trim().toLowerCase()))).size;
  const dateLabel = (value) => {
    if (!value) return 'Ημερομηνία μη διαθέσιμη';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Ημερομηνία μη διαθέσιμη' : d.toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return <div className="space-y-5">
    <section className="adm-hero">
      <div className="adm-hero-art" aria-hidden="true" />
      <div className="adm-hero-body">
        <div className="adm-eyebrow">DEAL OF TEMPTATION · ADMIN</div>
        <h2 className="adm-hero-title">Κέντρο ελέγχου</h2>
        <p className="adm-hero-text">Η κεντρική εικόνα της εφαρμογής. Άμεση πρόσβαση στις βασικές λειτουργίες και στην τρέχουσα κατάσταση των παρτίδων.</p>
        <div className="adm-hero-actions">
          <button type="button" onClick={() => onNavigate('modes')} className="adm-btn adm-btn--primary">Διαχείριση modes →</button>
          <button type="button" onClick={() => onNavigate('sessions')} className="adm-btn">Προβολή παρτίδων</button>
        </div>
      </div>
    </section>

    <AdminReadiness readiness={readiness} onNavigate={onNavigate} />

    <section className="adm-card space-y-3">
      <div><div className="adm-card-title">Τι να κάνω τώρα</div><p className="text-xs text-[#e5c76b]/70">Άμεσες εκκρεμότητες από τα αποθηκευμένα δεδομένα.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        <div className="adm-tile"><div className="adm-label">Νέες αιτήσεις</div><div className="mt-1 text-2xl font-bold">{extra.newRequests ?? '—'}</div><button onClick={() => onNavigate('inbox')} className="adm-link">Άνοιγμα εισερχομένων →</button></div>
        <div className="adm-tile"><div className="adm-label">Επόμενο EVENT</div><div className="mt-1 text-sm font-bold">{upcomingEvent?.event?.title || (upcomingEvent?.mode ? modeDisplayName(upcomingEvent.mode) : 'Δεν υπάρχει Event')}</div><div className="mt-1 text-[10px] text-[#e5c76b]/70">{upcomingEvent?.event?.scheduledAt ? new Date(upcomingEvent.event.scheduledAt).toLocaleString('el-GR') : upcomingEvent?.sessionCode || 'Ξεκίνα από Game & Mode'}</div><button onClick={() => onNavigate('events')} className="adm-link">Άνοιγμα Events →</button></div>
        <div className="adm-tile"><div className="adm-label">Ενεργές VIP προσκλήσεις</div><div className="mt-1 text-2xl font-bold">{extra.vipInvitations ?? '—'}</div><button onClick={() => onNavigate('invitations')} className="adm-link">Άνοιγμα προσκλήσεων →</button></div>
        <div className="adm-tile"><div className="adm-label">Τελευταίο BACKUP</div><div className="mt-1 text-sm font-bold">{extra.backup ? new Date(extra.backup.modified).toLocaleString('el-GR') : 'Μη διαθέσιμο'}</div><button onClick={() => onNavigate('backup')} className="adm-link">Άνοιγμα αντιγράφων →</button></div>
        <div className="adm-tile"><div className="adm-label">Ελλείψεις MEDIA</div><div className="mt-1 text-2xl font-bold">{extra.media ? extra.media.attention : '—'}</div><div className="mt-1 text-[10px] text-[#e5c76b]/70">{extra.media ? `${extra.media.missingRequired} υποχρεωτικά · ${extra.media.missingRecommended} προτεινόμενα · ${extra.media.broken} σβησμένα` : 'Υποχρεωτικά & προτεινόμενα που λείπουν'}</div><button onClick={() => onNavigate('media')} className="adm-link">Άνοιγμα χάρτη media →</button></div>
        <div className="adm-tile"><div className="adm-label">Συσκευές PUSH</div><div className="mt-1 text-2xl font-bold">{extra.pushDevices ?? '—'}</div><button onClick={() => onNavigate('notifications')} className="adm-link">Άνοιγμα ειδοποιήσεων →</button></div>
      </div>
    </section>
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <MetricCard icon="🎮" label="Modes παιχνιδιού" value={GAME_MODES.filter((m) => !m.retired).length} note={`${GAME_MODES.filter((m) => !m.retired && m.kind === 'engine').length} μηχανές · ${GAME_MODES.filter((m) => !m.retired && m.kind !== 'engine').length} ψηφιακά`} accent="bg-[#d4af37]" />
      <MetricCard icon="👥" label="Παίκτριες" value={playerCount} note="Μοναδικοί παίκτες στις αποθηκευμένες παρτίδες" accent="bg-[#d4af37]" />
      <MetricCard icon="🎲" label="Συνεδρίες παιχνιδιού" value={loading ? '…' : sessions.length} note={`${activity.active.length} ενεργές · ${activity.finished.length} ολοκληρωμένες`} accent="bg-[#d4af37]" />
      <MetricCard icon="📨" label="Νέες αιτήσεις" value={extra.newRequests ?? '—'} note="Περιμένουν έγκριση στις Αιτήσεις" accent="bg-[#d4af37]" />
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-3">
      <div className="adm-card">
        <div className="flex items-center justify-between gap-3"><div><div className="adm-card-title">Ζωντανή δραστηριότητα</div><p className="mt-0.5 text-xs text-[#e5c76b]/70">Παρτίδες που βρίσκονται σε εξέλιξη</p></div><span className="rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-2.5 py-1 text-[10px] font-bold text-[#e5c76b]">{activity.active.length} ΕΝΕΡΓΕΣ</span></div>
        <div className="mt-4 space-y-2">
          {activity.active.slice(0, 4).map((s) => <div key={s.id} className="adm-tile flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{s.sessionCode || 'Παρτίδα χωρίς κωδικό'}</div><div className="mt-0.5 truncate text-xs text-[#e5c76b]/70">{s.state?.mode || s.mode || 'Mode μη καταχωρισμένο'} · Stage {s.state?.stage ?? s.stage ?? '—'}</div></div><div className="shrink-0 text-right text-xs text-[#e5c76b]/70">{s.state?.players?.length || 0} παίκτες</div></div>)}
          {!loading && activity.active.length === 0 && <div className="rounded-xl border border-dashed border-[#d4af37]/50 px-4 py-7 text-center"><div className="text-2xl">🎲</div><div className="mt-2 text-sm font-semibold">Δεν υπάρχουν ενεργές παρτίδες</div><div className="mt-1 text-xs text-[#e5c76b]/65">Οι νέες ενεργές παρτίδες θα εμφανίζονται εδώ.</div></div>}
          {loading && <div className="py-6 text-center text-sm text-[#e5c76b]/65">Φόρτωση παρτίδων…</div>}
        </div>
      </div>
      <div className="adm-card">
        <div className="adm-card-title">Κατάσταση συστήματος</div><p className="mt-0.5 text-xs text-[#e5c76b]/70">Κατάσταση ανάκτησης δεδομένων Admin</p>
        <div className="adm-tile mt-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Σύνδεση δεδομένων</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${extra.connection === 'connected' ? 'bg-[#d4af37]/10 text-[#e5c76b]' : extra.connection === 'error' ? 'bg-[#d4af37]/10 text-[#e5c76b]' : 'bg-[#d4af37]/10 text-[#e5c76b]'}`}>{extra.connection === 'connected' ? 'Συνδεδεμένο' : extra.connection === 'error' ? 'Σφάλμα' : 'Έλεγχος'}</span></div><div className="mt-1 text-xs text-[#e5c76b]/70">{extra.connection === 'connected' ? 'Η ανάκτηση των δεδομένων επιτευγμάτων ολοκληρώθηκε.' : extra.connection === 'error' ? 'Δεν ήταν δυνατή η ανάκτηση των δεδομένων.' : 'Έλεγχος σύνδεσης με τα δεδομένα…'}</div></div>
        <div className="adm-tile mt-3 flex items-center justify-between"><span className="text-sm font-semibold">Φόρτωση παρτίδων</span><span className={`text-xs font-bold ${loading ? 'text-[#e5c76b]' : 'text-[#e5c76b]'}`}>{loading ? 'Φόρτωση' : 'Έτοιμο'}</span></div>
        <div className="mt-3 text-[11px] leading-relaxed text-[#e5c76b]/60">Η ένδειξη αφορά τις λειτουργίες ανάκτησης που ελέγχονται εδώ και δεν αποτελεί συνολικό έλεγχο διαθεσιμότητας όλων των υπηρεσιών.</div>
      </div>
    </section>

    <section className="adm-card">
      <div className="flex items-end justify-between gap-3"><div><div className="adm-card-title">Γρήγορη πρόσβαση</div><p className="mt-0.5 text-xs text-[#e5c76b]/70">Άμεση μετάβαση στις βασικές ενότητες</p></div><span className="text-[10px] font-bold tracking-wider text-[#d4af37]">Κέντρο ελέγχου</span></div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {QUICK_LINKS.map((link) => <button key={link.id} type="button" onClick={() => onNavigate(link.id)} className="adm-quick group"><span className="adm-icon">{link.icon}</span><span className="min-w-0"><span className="block truncate text-sm font-extrabold">{link.title}</span><span className="mt-0.5 block text-[10px] leading-snug text-[#e5c76b]/65">{link.detail}</span></span><span className="ml-auto text-[#e5c76b]/55">→</span></button>)}
      </div>
    </section>

    <section className="adm-card">
      <div className="flex items-center justify-between gap-3"><div><div className="adm-card-title">Πρόσφατη δραστηριότητα</div><p className="mt-0.5 text-xs text-[#e5c76b]/70">Οι πιο πρόσφατες αποθηκευμένες παρτίδες</p></div><button type="button" onClick={() => onNavigate('sessions')} className="text-xs font-bold text-[#d4af37] hover:underline">Όλες οι παρτίδες →</button></div>
      <div className="mt-3 divide-y divide-[#d4af37]/20">
        {recent.map((s) => <div key={s.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="adm-icon adm-icon--sm">🎲</span><div className="min-w-0"><div className="truncate text-sm font-bold">{s.sessionCode || 'Παρτίδα χωρίς κωδικό'}</div><div className="truncate text-xs text-[#e5c76b]/65">{s.state?.mode || s.mode || 'Mode μη καταχωρισμένο'} · {s.state?.players?.length || 0} παίκτες</div></div></div><div className="shrink-0 text-right"><div className="text-[11px] text-[#e5c76b]/70">{dateLabel(s.updated_date || s.created_date)}</div><div className="mt-0.5 text-[10px] font-bold text-[#e5c76b]/60">ΣΤΑΔΙΟ {s.state?.stage ?? s.stage ?? '—'}</div></div></div>)}
        {!loading && recent.length === 0 && <div className="py-7 text-center text-sm text-[#e5c76b]/65">Δεν υπάρχουν πρόσφατες παρτίδες.</div>}
      </div>
    </section>
  </div>;
}
