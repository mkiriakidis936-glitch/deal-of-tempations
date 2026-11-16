import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { GAME_MODES } from '@/data/gameConfig';
import { request } from '@/api/base44Client';
import { fetchOverrides } from '@/lib/media';
import { PHOTO_SPOT_IDS, VIDEO_SLOTS } from '@/data/mediaSlots';
import { NEW_MODES } from '@/data/modes/modeRegistry';

const QUICK_LINKS = [
  { id: 'modes', icon: '🎮', title: 'Λειτουργίες παιχνιδιού', detail: 'Διαχείριση λειτουργιών' },
  { id: 'editor', icon: '🃏', title: 'Επεξεργασία παιχνιδιού', detail: 'Περιεχόμενο παιχνιδιού' },
  { id: 'players', icon: '👥', title: 'Παίκτριες', detail: 'Προφίλ και συμμετοχές' },
  { id: 'media', icon: '🖼️', title: 'Κέντρο πολυμέσων', detail: 'Φωτογραφίες και video' },
  { id: 'forms', icon: '📝', title: 'Διαχείριση φορμών', detail: 'Φόρμες και υποβολές' },
  { id: 'settings', icon: '⚙️', title: 'Ρυθμίσεις', detail: 'Κεντρικές ρυθμίσεις' },
];

function MetricCard({ icon, label, value, note, accent }) {
  return <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm"><div className={`absolute inset-x-0 top-0 h-1 ${accent}`} /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-foreground/55">{label}</div><div className="mt-2 font-heading text-3xl sm:text-4xl leading-none">{value}</div><div className="mt-2 text-xs text-foreground/55">{note}</div></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-2xl">{icon}</div></div></div>;
}

export default function AdminOverview({ sessions = [], loading = false, onNavigate = () => {} }) {
  const [extra, setExtra] = useState({ achievements: null, connection: 'loading', newRequests: null, vipInvitations: null, backup: null, emptyPhotos: null, missingVideos: null, missingTrailers: null, pushDevices: null });
  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      base44.entities.Achievement.filter({}, { limit: 500 }),
      Promise.all([base44.entities.PublicFormSubmission.filter({ status: 'new' }, { limit: 500 }), base44.entities.PlayerIntake.filter({}, { limit: 500 }), base44.entities.PajamaIntake.filter({}, { limit: 500 }), base44.entities.BacheloretteIntake.filter({}, { limit: 500 })]),
      base44.entities.VIPInvitation.filter({ active: true }, { limit: 100 }),
      request('GET', '/api/backup/list'),
      request('GET', '/api/push/status'),
      fetchOverrides(),
    ]).then(([achievements, requests, vip, backup, push, media]) => {
      if (!mounted) return;
      setExtra({
        achievements: achievements.status === 'fulfilled' ? (achievements.value.items || []).length : null,
        connection: achievements.status === 'fulfilled' ? 'connected' : 'error',
        newRequests: requests.status === 'fulfilled' ? requests.value.reduce((sum, result) => sum + (result.items || []).filter((item) => !item.status || ['new','Νέο'].includes(item.status)).length, 0) : null,
        vipInvitations: vip.status === 'fulfilled' ? (vip.value.items || []).length : null,
        backup: backup.status === 'fulfilled' ? (backup.value.items || []).sort((a, b) => Number(b.modified) - Number(a.modified))[0] || null : null,
        pushDevices: push.status === 'fulfilled' ? (push.value.devices || []).length : null,
        emptyPhotos: media.status === 'fulfilled' ? (media.value?.value?.emptySlots || []).filter((id) => PHOTO_SPOT_IDS.includes(id)).length : null,
        missingVideos: media.status === 'fulfilled' ? VIDEO_SLOTS.filter((slot) => !media.value?.value?.[slot.id]).length : null,
        missingTrailers: media.status === 'fulfilled' ? NEW_MODES.filter((mode) => !media.value?.value?.modeMedia?.[mode.id]?.trailer).length : null,
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
  const upcomingEvent = sessions.filter((session) => session.event?.scheduledAt && Date.parse(session.event.scheduledAt) >= Date.now()).sort((a, b) => Date.parse(a.event.scheduledAt) - Date.parse(b.event.scheduledAt))[0] || recent[0] || null;
  const playerCount = new Set(sessions.flatMap((session) => (session.state?.players || []).map((player) => player.id || player.name).filter(Boolean).map((value) => String(value).trim().toLowerCase()))).size;
  const dateLabel = (value) => {
    if (!value) return 'Ημερομηνία μη διαθέσιμη';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 'Ημερομηνία μη διαθέσιμη' : d.toLocaleString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return <div className="space-y-5">
    <section className="relative isolate overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#211326] via-[#3b1934] to-[#171923] p-5 sm:p-7 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full border-[30px] border-white/5" />
      <div className="relative max-w-2xl">
        <div className="text-[10px] font-black tracking-[.28em] text-amber-300/90">DEAL OF TEMPTATION · ADMIN</div>
        <h2 className="mt-2 font-heading text-3xl sm:text-4xl">Κέντρο ελέγχου</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">Η κεντρική εικόνα της εφαρμογής. Άμεση πρόσβαση στις βασικές λειτουργίες και στην τρέχουσα κατάσταση των παρτίδων.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate('modes')} className="rounded-xl bg-amber-300 px-4 py-2.5 text-xs font-black text-[#211326] transition hover:bg-amber-200">ΔΙΑΧΕΙΡΙΣΗ MODES →</button>
          <button type="button" onClick={() => onNavigate('sessions')} className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/15">ΠΡΟΒΟΛΗ ΠΑΡΤΙΔΩΝ</button>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 space-y-3">
      <div><div className="font-heading text-xl">Τι να κάνω τώρα</div><p className="text-xs text-foreground/55">Άμεσες εκκρεμότητες από τα αποθηκευμένα δεδομένα.</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΝΕΕΣ ΑΙΤΗΣΕΙΣ</div><div className="mt-1 text-2xl font-bold">{extra.newRequests ?? '—'}</div><button onClick={() => onNavigate('inbox')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα εισερχομένων →</button></div>
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΕΠΟΜΕΝΟ EVENT</div><div className="mt-1 text-sm font-bold">{upcomingEvent?.event?.title || upcomingEvent?.mode || 'Δεν υπάρχει Event'}</div><div className="mt-1 text-[10px] text-foreground/55">{upcomingEvent?.event?.scheduledAt ? new Date(upcomingEvent.event.scheduledAt).toLocaleString('el-GR') : upcomingEvent?.sessionCode || 'Ξεκίνα από Game & Mode'}</div><button onClick={() => onNavigate('events')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα Events →</button></div>
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΕΝΕΡΓΕΣ VIP ΠΡΟΣΚΛΗΣΕΙΣ</div><div className="mt-1 text-2xl font-bold">{extra.vipInvitations ?? '—'}</div><button onClick={() => onNavigate('invitations')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα προσκλήσεων →</button></div>
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΤΕΛΕΥΤΑΙΟ BACKUP</div><div className="mt-1 text-sm font-bold">{extra.backup ? new Date(extra.backup.modified).toLocaleString('el-GR') : 'Μη διαθέσιμο'}</div><button onClick={() => onNavigate('settings')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα αντιγράφων →</button></div>
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΕΛΛΕΙΨΕΙΣ MEDIA</div><div className="mt-1 text-sm font-bold">{extra.emptyPhotos === null ? '—' : extra.emptyPhotos + (extra.missingVideos || 0) + (extra.missingTrailers || 0)}</div><div className="mt-1 text-[10px] text-foreground/55">Κενές φωτογραφίες / βίντεο / trailers</div><button onClick={() => onNavigate('media')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα βιβλιοθήκης →</button></div>
        <div className="rounded-xl bg-secondary/70 p-3"><div className="text-[10px] text-foreground/55">ΣΥΣΚΕΥΕΣ PUSH</div><div className="mt-1 text-2xl font-bold">{extra.pushDevices ?? '—'}</div><button onClick={() => onNavigate('notifications')} className="mt-1 text-xs font-bold text-primary">Άνοιγμα ειδοποιήσεων →</button></div>
      </div>
    </section>
    <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <MetricCard icon="🎮" label="Λειτουργίες παιχνιδιού" value={GAME_MODES.length} note="Διαθέσιμες λειτουργίες" accent="bg-amber-400" />
      <MetricCard icon="👥" label="Παίκτριες" value={playerCount} note="Μοναδικοί παίκτες στις αποθηκευμένες παρτίδες" accent="bg-sky-400" />
      <MetricCard icon="🎲" label="Συνεδρίες παιχνιδιού" value={loading ? '…' : sessions.length} note={`${activity.active.length} ενεργές · ${activity.finished.length} ολοκληρωμένες`} accent="bg-emerald-400" />
      <MetricCard icon="🏆" label="Επιτεύγματα" value={extra.achievements ?? '—'} note={extra.achievements === null ? 'Μη διαθέσιμα δεδομένα' : 'Καταχωρισμένα επιτεύγματα'} accent="bg-fuchsia-400" />
    </section>

    <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-3">
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><div className="font-heading text-xl">Ζωντανή δραστηριότητα</div><p className="mt-0.5 text-xs text-foreground/55">Παρτίδες που βρίσκονται σε εξέλιξη</p></div><span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">{activity.active.length} ΕΝΕΡΓΕΣ</span></div>
        <div className="mt-4 space-y-2">
          {activity.active.slice(0, 4).map((s) => <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/70 px-3 py-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{s.sessionCode || 'Παρτίδα χωρίς κωδικό'}</div><div className="mt-0.5 truncate text-xs text-foreground/55">{s.state?.mode || s.mode || 'Mode μη καταχωρισμένο'} · Stage {s.state?.stage ?? s.stage ?? '—'}</div></div><div className="shrink-0 text-right text-xs text-foreground/55">{s.state?.players?.length || 0} παίκτες</div></div>)}
          {!loading && activity.active.length === 0 && <div className="rounded-xl border border-dashed border-border px-4 py-7 text-center"><div className="text-2xl">🎲</div><div className="mt-2 text-sm font-semibold">Δεν υπάρχουν ενεργές παρτίδες</div><div className="mt-1 text-xs text-foreground/50">Οι νέες ενεργές παρτίδες θα εμφανίζονται εδώ.</div></div>}
          {loading && <div className="py-6 text-center text-sm text-foreground/50">Φόρτωση παρτίδων…</div>}
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
        <div className="font-heading text-xl">Κατάσταση συστήματος</div><p className="mt-0.5 text-xs text-foreground/55">Κατάσταση ανάκτησης δεδομένων Admin</p>
        <div className="mt-4 rounded-xl bg-secondary/70 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Σύνδεση δεδομένων</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${extra.connection === 'connected' ? 'bg-emerald-500/10 text-emerald-500' : extra.connection === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>{extra.connection === 'connected' ? 'ΣΥΝΔΕΔΕΜΕΝΟ' : extra.connection === 'error' ? 'ΣΦΑΛΜΑ' : 'ΕΛΕΓΧΟΣ'}</span></div><div className="mt-1 text-xs text-foreground/55">{extra.connection === 'connected' ? 'Η ανάκτηση των δεδομένων επιτευγμάτων ολοκληρώθηκε.' : extra.connection === 'error' ? 'Δεν ήταν δυνατή η ανάκτηση των δεδομένων.' : 'Έλεγχος σύνδεσης με τα δεδομένα…'}</div></div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/70 p-3"><span className="text-sm font-semibold">Φόρτωση παρτίδων</span><span className={`text-xs font-bold ${loading ? 'text-amber-500' : 'text-emerald-500'}`}>{loading ? 'ΦΟΡΤΩΣΗ' : 'ΕΤΟΙΜΟ'}</span></div>
        <div className="mt-3 text-[11px] leading-relaxed text-foreground/45">Η ένδειξη αφορά τις λειτουργίες ανάκτησης που ελέγχονται εδώ και δεν αποτελεί συνολικό έλεγχο διαθεσιμότητας όλων των υπηρεσιών.</div>
      </div>
    </section>

    <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3"><div><div className="font-heading text-xl">Γρήγορη πρόσβαση</div><p className="mt-0.5 text-xs text-foreground/55">Άμεση μετάβαση στις βασικές ενότητες</p></div><span className="text-[10px] font-bold tracking-wider text-primary">ΚΕΝΤΡΟ ΕΛΕΓΧΟΥ</span></div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {QUICK_LINKS.map((link) => <button key={link.id} type="button" onClick={() => onNavigate(link.id)} className="group flex min-h-[82px] items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-xl">{link.icon}</span><span className="min-w-0"><span className="block truncate text-sm font-extrabold">{link.title}</span><span className="mt-0.5 block text-[10px] leading-snug text-foreground/50">{link.detail}</span></span><span className="ml-auto text-foreground/35">→</span></button>)}
      </div>
    </section>

    <section className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><div className="font-heading text-xl">Πρόσφατη δραστηριότητα</div><p className="mt-0.5 text-xs text-foreground/55">Οι πιο πρόσφατες αποθηκευμένες παρτίδες</p></div><button type="button" onClick={() => onNavigate('sessions')} className="text-xs font-bold text-primary hover:underline">ΟΛΕΣ ΟΙ ΠΑΡΤΙΔΕΣ →</button></div>
      <div className="mt-3 divide-y divide-border/60">
        {recent.map((s) => <div key={s.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary">🎲</span><div className="min-w-0"><div className="truncate text-sm font-bold">{s.sessionCode || 'Παρτίδα χωρίς κωδικό'}</div><div className="truncate text-xs text-foreground/50">{s.state?.mode || s.mode || 'Mode μη καταχωρισμένο'} · {s.state?.players?.length || 0} παίκτες</div></div></div><div className="shrink-0 text-right"><div className="text-[11px] text-foreground/55">{dateLabel(s.updated_date || s.created_date)}</div><div className="mt-0.5 text-[10px] font-bold text-foreground/45">ΣΤΑΔΙΟ {s.state?.stage ?? s.stage ?? '—'}</div></div></div>)}
        {!loading && recent.length === 0 && <div className="py-7 text-center text-sm text-foreground/50">Δεν υπάρχουν πρόσφατες παρτίδες.</div>}
      </div>
    </section>
  </div>;
}
