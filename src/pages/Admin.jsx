import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import './admin-theme.css';
import { useSearchParams } from 'react-router-dom';
import { base44, request } from '@/api/base44Client';
import { setActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import {
  LayoutDashboard, Inbox, Ticket, BarChart3, Gamepad2, Radio, Clapperboard, Video, Users, Award, Layers, Drama,
  Images, Globe, Mail, FileText, Link2, History, Film, HardDrive, LifeBuoy, Settings, CalendarDays, Bell, Search, RefreshCw,
} from 'lucide-react';
import AdminNav, { AdminTabBar } from '@/components/admin/AdminNav';
import AdminSessionBar from '@/components/admin/AdminSessionBar';
const AdminContentHub = lazy(() => import('@/components/admin/AdminContentHub'));
const AdminContent = lazy(() => import('@/components/admin/AdminContent'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminInbox = lazy(() => import('@/components/admin/AdminInbox'));
const AdminEventManager = lazy(() => import('@/components/admin/AdminEventManager'));
const AdminInterestParticipation = lazy(() => import('@/components/admin/AdminInterestParticipation'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const AdminBackup = lazy(() => import('@/components/admin/AdminBackup'));
const AdminSessions = lazy(() => import('@/components/admin/AdminSessions'));
const AdminSessionRecovery = lazy(() => import('@/components/admin/AdminSessionRecovery'));
const AdminEpisodeArchive = lazy(() => import('@/components/admin/AdminEpisodeArchive'));
const AdminPlayers = lazy(() => import('@/components/admin/AdminPlayers'));
const AdminIntakes = lazy(() => import('@/components/admin/AdminIntakes'));
const AdminShowCasting = lazy(() => import('@/components/admin/AdminShowCasting'));
const AdminLinks = lazy(() => import('@/components/admin/AdminLinks'));
const AdminRSVP = lazy(() => import('@/components/admin/AdminRSVP'));
const AdminEventInfo = lazy(() => import('@/components/admin/AdminEventInfo'));
const AdminMeta = lazy(() => import('@/components/admin/AdminMeta'));
const AdminMedia = lazy(() => import('@/components/admin/AdminMedia'));
const AdminSite = lazy(() => import('@/components/admin/AdminSite'));
const AdminCustomScenarios = lazy(() => import('@/components/admin/AdminCustomScenarios'));
const AdminFormsBuilder = lazy(() => import('@/components/admin/AdminFormsBuilder'));
const AdminNotifications = lazy(() => import('@/components/admin/AdminNotifications'));
const AdminVisits = lazy(() => import('@/components/admin/AdminVisits'));
const AdminDigitalInvitations = lazy(() => import('@/components/admin/AdminDigitalInvitations'));
const AdminPublicSubmissions = lazy(() => import('@/components/admin/AdminPublicSubmissions'));
const AdminProduction = lazy(() => import('@/components/admin/AdminProduction'));
import { createInitialState } from '@/lib/gameLogic';

const NAV_GROUPS = [
  {
    id: 'overview',
    label: '01 · Κεντρική εικόνα',
    tabs: [
      { id: 'dashboard', label: 'Επισκόπηση', icon: LayoutDashboard },
      { id: 'inbox', label: 'Εισερχόμενα', icon: Inbox },
      { id: 'events', label: 'Διοργανώσεις & καλεσμένοι', icon: Ticket },
      { id: 'interest', label: 'Ενδιαφέρον & συμμετοχή', icon: Users },
      { id: 'statistics', label: 'Στατιστικά & επισκέψεις', icon: BarChart3 },
    ],
  },
  {
    id: 'game',
    label: '02 · Παιχνίδι & ζωντανός έλεγχος',
    tabs: [
      { id: 'modes', label: 'Λειτουργίες παιχνιδιού', icon: Gamepad2 },
      { id: 'live', label: 'Ζωντανός έλεγχος', icon: Radio },
      { id: 'casting', label: 'Επιλογή επεισοδίου', icon: Clapperboard },
    ],
  },
  {
    id: 'production',
    label: '03 · Παραγωγή εκπομπής',
    tabs: [
      { id: 'production', label: 'Χώρος παραγωγής', icon: Video },
    ],
  },
  {
    id: 'players',
    label: '04 · Παίκτες',
    tabs: [
      { id: 'players', label: 'Παίκτες & ρόλοι', icon: Users },
      { id: 'achievements', label: 'Επιτεύγματα', icon: Award },
    ],
  },
  {
    id: 'content',
    label: '05 · Περιεχόμενο & σενάρια',
    tabs: [
      { id: 'editor', label: 'Κάρτες & επεξεργασία', icon: Layers },
      { id: 'scenarios', label: 'Σενάρια', icon: Drama },
      { id: 'media', label: 'Βιβλιοθήκη πολυμέσων', icon: Images },
    ],
  },
  {
    id: 'website',
    label: '06 · Ιστοσελίδα',
    tabs: [
      { id: 'website', label: 'Ιστοσελίδα', icon: Globe },
    ],
  },
  {
    id: 'experiences',
    label: '07 · Προσκλήσεις & συμμετοχές',
    tabs: [
      { id: 'invitations', label: 'Ψηφιακές προσκλήσεις', icon: Mail },
      { id: 'forms', label: 'Φόρμες & δηλώσεις', icon: FileText },
      { id: 'links', label: 'Σύνδεσμοι & QR', icon: Link2 },
    ],
  },
  {
    id: 'history',
    label: '08 · Ιστορικό & ανάκτηση',
    tabs: [
      { id: 'sessions', label: 'Ιστορικό παρτίδων', icon: History },
      { id: 'archive', label: 'Αρχείο επεισοδίων', icon: Film },
      { id: 'backup', label: 'Αντίγραφα ασφαλείας', icon: HardDrive },
      { id: 'recovery', label: 'Ανάκτηση παρτίδων', icon: LifeBuoy },
    ],
  },
  {
    id: 'settings',
    label: '09 · Ρυθμίσεις & υποστήριξη',
    tabs: [
      { id: 'settings', label: 'Ρυθμίσεις εφαρμογής', icon: Settings },
      { id: 'eventinfo', label: 'Πληροφορίες event', icon: CalendarDays },
      { id: 'notifications', label: 'Ειδοποιήσεις push', icon: Bell },
    ],
  },
];
const LEGACY_TABS = {
  content: 'editor',
  modes: 'modes',
  pajama: 'editor',
  board: 'editor',
  cards: 'editor',
  classic: 'editor',
  marathon: 'editor',
  arrest_heist: 'editor',
  special: 'editor',
  site: 'website',
  eventinfo: 'eventinfo',
  notifications: 'notifications',
  backup: 'backup',
  guide: 'guide',
  meta: 'achievements',
  visits: 'statistics',
  intakes: 'forms',
  rsvp: 'forms',
  blitz: 'players',
  leaderboard: 'achievements',
};

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = LEGACY_TABS[params.get('tab')] || params.get('tab') || 'dashboard';
  const setTab = (id) => setParams({ tab: id }, { replace: true });

  const [sessions, setSessions] = useState([]);
  const sessionsRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [pickedSession, setPickedSession] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const navGroups = NAV_GROUPS;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 50 });
      const next = items || [];
      sessionsRef.current = next;
      setSessions(next);
      setPickedSession((current) => current ? (next.find((item) => item.id === current.id) || null) : null);
      return next;
    } catch (e) {
      console.error('Admin load error', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Η λίστα συνεδριών ενημερώνεται από το υπάρχον SSE stream, χωρίς polling.
  useEffect(() => {
    let mounted = true;
    const unsubscribe = base44.entities.GameSession.subscribe((event) => {
      if (!mounted || !event?.id) return;
      if (event.type === 'delete') {
        setSessions((current) => {
          const next = current.filter((item) => item.id !== event.id);
          sessionsRef.current = next;
          if (current[0]?.id === event.id) {
            const replacement = next[0];
            if (replacement?.sessionCode) setActiveSessionCode(replacement.sessionCode);
          }
          return next;
        });
        setPickedSession((current) => current?.id === event.id ? null : current);
        return;
      }

      if (!event.data) return;
      setSessions((current) => {
        const exists = current.some((item) => item.id === event.id);
        const merged = exists
          ? current.map((item) => item.id === event.id ? { ...item, ...event.data } : item)
          : [...current, event.data];
        const next = merged.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)).slice(0, 50);
        sessionsRef.current = next;
        return next;
      });
      setPickedSession((current) => current?.id === event.id ? { ...current, ...event.data } : current);
      if (event.type === 'create' && event.data.sessionCode) setActiveSessionCode(event.data.sessionCode);
    });

    loadSessions().then((items) => {
      if (!mounted || !items?.length) return;
      // Η πιο πρόσφατη συνεδρία που εμφανίζεται πρώτη στο Admin γίνεται η κοινή ενεργή.
      const latest = sessionsRef.current[0] || items[0];
      if (latest?.sessionCode) setActiveSessionCode(latest.sessionCode);
    });

    return () => { mounted = false; unsubscribe(); };
  }, [loadSessions]);

  // Αλλαγή ενεργής συνεδρίας από άλλο Admin συγχρονίζεται και στην τρέχουσα οθόνη.
  useEffect(() => subscribeActiveSession((code) => {
    if (!code) return;
    const match = sessionsRef.current.find((item) => item.sessionCode === code);
    if (match) setPickedSession(match);
    else loadSessions();
  }), [loadSessions]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Μία κοινή ενεργή συνεδρία για όλες τις καρτέλες — προεπιλογή η πιο πρόσφατη (ό,τι δείχνει η TV).
  const activeSession = pickedSession || sessions[0] || null;

  // Αλλαγή συνεδρίας στο Admin = αλλαγή και στο Tablet/TV (γράφεται ως ενεργή συνεδρία).
  const selectSession = useCallback((s) => {
    setPickedSession(s);
    if (s?.sessionCode) setActiveSessionCode(s.sessionCode);
  }, []);

  async function handleUpdateSession(id, statePatch) {
    try {
      // Περιορισμένο patch: ο server το συγχωνεύει με την πιο πρόσφατη DB κατάσταση
      // μέσα σε transaction, χωρίς αντικατάσταση ολόκληρου του state.
      const updated = await request('PATCH', `/api/entities/GameSession/${encodeURIComponent(id)}`, { statePatch });
      if (updated?.state) {
        setSessions((prev) => prev.map((session) => session.id === id ? updated : session));
        setPickedSession((prev) => (prev?.id === id ? updated : prev));
        return updated;
      }
      return null;
    } catch (e) {
      console.error('Update error', e);
      window.alert('Η αποθήκευση της συνεδρίας απέτυχε. Οι αλλαγές δεν καταχωρήθηκαν.');
      return null;
    }
  }

  async function handleDeleteSession(id) {
    try {
      const target = sessions.find((session) => session.id === id);
      if (!target?.sessionCode) throw new Error('Δεν βρέθηκε ο κωδικός Event της παρτίδας.');
      await request('DELETE', `/api/entities/game-events/${encodeURIComponent(target.sessionCode)}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setPickedSession((prev) => (prev?.id === id ? null : prev));
    } catch (e) {
      console.error('Delete error', e);
      throw e;
    }
  }

  async function handleRestartSession(session) {
    try {
      const state = session.state || {};
      await base44.entities.GameSessionSnapshot.create({
        sessionId: session.id,
        sessionCode: session.sessionCode,
        mode: state.mode || session.mode || '',
        stage: Number(state.stage ?? 0),
        playerCount: Array.isArray(state.players) ? state.players.length : 0,
        label: 'Αυτόματο αντίγραφο πριν από restart',
        state: JSON.parse(JSON.stringify(state)),
        sourceUpdatedAt: session.updated_date || session.created_date || null,
      });
      const roster = Array.isArray(state.players) ? state.players : [];
      const fresh = createInitialState(
        state.mode || session.mode,
        state.intensity || session.intensity || 'standard',
        roster.map((player) => ({ ...player, footwearLevel: player.footwearLevel ?? 2 })),
      );
      const newState = {
        ...fresh,
        gameDurationMinutes: state.gameDurationMinutes ?? 300,
        gameStartedAt: Date.now(),
        gamePausedMs: 0,
        gamePausedAt: null,
        safetyProfile: state.safetyProfile || null,
        testMode: !!state.testMode,
        ...(state.customScenario ? { customScenario: state.customScenario } : {}),
      };
      await base44.entities.GameSession.update(session.id, { state: newState });
      setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, state: newState } : s));
      setPickedSession((prev) => (prev?.id === session.id ? { ...prev, state: newState } : prev));
    } catch (e) {
      console.error('Restart error', e);
      window.alert('Το restart δεν ολοκληρώθηκε. Η προηγούμενη κατάσταση της συνεδρίας διατηρήθηκε.');
    }
  }

  function renderTab() {
    switch (tab) {
      case 'inbox':
        return <AdminInbox sessions={sessions} />;
      case 'events':
        return <AdminEventManager />;
      case 'interest':
        return <AdminInterestParticipation />;
      case 'modes':
        return <AdminContentHub />;
      case 'production':
        return <AdminProduction sessions={sessions} selectedSession={activeSession} onSelect={selectSession} />;
      case 'editor':
        return <AdminContent />;
      case 'achievements':
        return <AdminMeta initialTab="achievements" />;
      case 'scenarios':
        return <AdminCustomScenarios />;
      case 'website':
        return <AdminSite />;
      case 'media':
        return <AdminMedia />;
      case 'invitations':
        return <AdminDigitalInvitations />;
      case 'notifications':
        return <AdminNotifications />;
      case 'forms':
        return (
          <div className="space-y-6">
            <AdminFormsBuilder />
            <AdminIntakes />
            <AdminRSVP />
            <AdminPublicSubmissions />
          </div>
        );
      case 'statistics':
        return (
          <div className="space-y-6">
            <AdminDashboard sessions={sessions} loading={loading} />
            <AdminVisits />
          </div>
        );
      case 'settings':
        return <AdminSettings />;
      case 'backup':
        return <AdminBackup />;
      case 'recovery':
        return <AdminSessionRecovery />;
      case 'archive':
        return <AdminEpisodeArchive />;
      case 'sessions':
        return (
          <AdminSessions
            sessions={sessions}
            loading={loading}
            onSelect={selectSession}
            onDelete={handleDeleteSession}
            onRestart={handleRestartSession}
            onRefresh={loadSessions}
          />
        );
      case 'casting':
        return <AdminShowCasting />;
      case 'players':
      case 'live':
        return (
          <AdminPlayers
            sessions={sessions}
            selectedSession={activeSession}
            onSelect={selectSession}
            onUpdate={handleUpdateSession}
          />
        );
      case 'links':
        return <AdminLinks sessions={sessions} selectedSession={activeSession} />;
      case 'visits':
        return <AdminVisits />;
      case 'intakes':
        return <AdminIntakes />;
      case 'rsvp':
        return <AdminRSVP />;
      case 'eventinfo':
        return <AdminEventInfo />;
      default:
        return <AdminOverview sessions={sessions} loading={loading} onNavigate={setTab} />;
    }
  }

  const searchItems = [
    ...NAV_GROUPS.flatMap((group) => group.tabs.map((item) => ({ type: 'tab', id: item.id, label: item.label, detail: group.label.replace(/^\d+ · /, '') }))),
    ...sessions.map((session) => ({ type: 'session', id: session.id, label: session.event?.title || session.mode || 'Game', detail: `${session.sessionCode} · ${(session.state?.players || []).map((player) => player.name).join(', ')}` })),
  ];
  const needle = globalSearch.toLocaleLowerCase('el-GR');
  const searchResults = searchItems.filter((item) => !needle || `${item.label} ${item.detail}`.toLocaleLowerCase('el-GR').includes(needle)).slice(0, 30);
  const pickResult = (item) => {
    if (!item) return;
    if (item.type === 'tab') setTab(item.id);
    else { setPickedSession(sessions.find((session) => session.id === item.id) || null); setTab('sessions'); }
    setSearchOpen(false);
  };

  return (
    <div id="admin-root" className="admin-root min-h-[100dvh] p-2.5 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] lg:pb-6">
      <div className="adm-shell">
        {searchOpen && (
          <div className="adm-overlay" role="dialog" aria-modal="true" aria-label="Αναζήτηση" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
            <div className="adm-sheet">
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') pickResult(searchResults[0]); }}
                  placeholder="Αναζήτηση σε ενότητες, events, παίκτριες…"
                  className="min-w-0 flex-1 px-4 text-sm"
                />
                <button type="button" className="adm-pill" onClick={() => setSearchOpen(false)}>Κλείσιμο</button>
              </div>
              <div className="mt-3 max-h-[60vh] overflow-y-auto">
                {searchResults.length === 0 && <div className="adm-empty">Δεν βρέθηκε τίποτα.</div>}
                {searchResults.map((item) => (
                  <button type="button" key={item.type + item.id} className="adm-result" onClick={() => pickResult(item)}>
                    <b>{item.label}</b>
                    <small>{item.detail}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <header className="adm-header">
          <div className="adm-mark" aria-hidden="true">D</div>
          <div className="adm-titles">
            <h1 className="adm-title">{NAV_GROUPS.flatMap((group) => group.tabs).find((item) => item.id === tab)?.label || 'Κέντρο ελέγχου'}</h1>
            <div className="adm-subtitle">Deal of Temptations · Admin</div>
          </div>
          <div className="adm-actions">
            <button type="button" className="adm-pill" onClick={() => { setGlobalSearch(''); setSearchOpen(true); }} aria-label="Αναζήτηση">
              <Search size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Αναζήτηση</span>
              <span className="adm-kbd hidden md:inline">⌘K</span>
            </button>
            <button type="button" className="adm-pill" onClick={loadSessions} disabled={loading} aria-label="Ανανέωση">
              <RefreshCw size={16} strokeWidth={2} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{loading ? 'Φόρτωση…' : 'Ανανέωση'}</span>
            </button>
          </div>
        </header>

        {/* Κινητό: πλωτή γυάλινη μπάρα πλοήγησης */}
        <div className="adm-tabbar-wrap">
          <AdminTabBar groups={navGroups} active={tab} onChange={setTab} />
        </div>

        <AdminSessionBar sessions={sessions} activeSession={activeSession} onSelect={selectSession} />

        <div className="adm-layout">
          <aside className="adm-sidebar">
            <AdminNav groups={navGroups} active={tab} onChange={setTab} />
          </aside>
          <main className="adm-content">
            <Suspense fallback={<div className="adm-loading">Φόρτωση ενότητας…</div>}>
              {renderTab()}
            </Suspense>
          </main>
        </div>

        <div className="adm-footer">Πίνακας διαχείρισης · {sessions.length} συνεδρίες φορτωμένες</div>
      </div>
    </div>
  );
}
