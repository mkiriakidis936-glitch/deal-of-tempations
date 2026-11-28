import React, { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { ART } from '@/data/brandArt';
import SectionErrorBoundary from '@/components/shared/SectionErrorBoundary';
import './admin-theme.css';
import './admin-game.css';
import { useSearchParams } from 'react-router-dom';
import { appApi, request } from '@/api/apiClient';
import { getActiveSessionCode, setActiveSessionCode, subscribeActiveSession } from '@/lib/activeSession';
import {
  LayoutDashboard, Inbox, Ticket, BarChart3, Radio, AudioLines, Video, Users, Layers,
  Images, Globe, Mail, FileText, Link2, History, HardDrive, Settings, Bell, Search, RefreshCw, BookOpen, FlaskConical, Instagram, Lightbulb, Activity, RotateCcw } from 'lucide-react';
import AdminNav, { AdminTabBar } from '@/components/admin/AdminNav';
import AdminSessionBar from '@/components/admin/AdminSessionBar';
const AdminContentHub = lazy(() => import('@/components/admin/AdminContentHub'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const AdminOverview = lazy(() => import('@/components/admin/AdminOverview'));
const AdminInbox = lazy(() => import('@/components/admin/AdminInbox'));
const AdminEventManager = lazy(() => import('@/components/admin/AdminEventManager'));
const AdminInterestParticipation = lazy(() => import('@/components/admin/AdminInterestParticipation'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const AdminSocialCard = lazy(() => import('@/components/admin/AdminSocialCard'));
const AdminPlayerHistory = lazy(() => import('@/components/admin/AdminPlayerHistory'));
const AdminMemories = lazy(() => import('@/components/admin/AdminMemories'));
const AdminRehearsal = lazy(() => import('@/components/admin/AdminRehearsal'));
const AdminGuide = lazy(() => import('@/components/admin/AdminGuide'));
const AdminBackup = lazy(() => import('@/components/admin/AdminBackup'));
const AdminSessions = lazy(() => import('@/components/admin/AdminSessions'));
const AdminPlayers = lazy(() => import('@/components/admin/AdminPlayers'));
const AdminLinks = lazy(() => import('@/components/admin/AdminLinks'));
const AdminMedia = lazy(() => import('@/components/admin/AdminMedia'));
const AdminSite = lazy(() => import('@/components/admin/AdminSite'));
const AdminFormsBuilder = lazy(() => import('@/components/admin/AdminFormsBuilder'));
const AdminNotifications = lazy(() => import('@/components/admin/AdminNotifications'));
const AdminVisits = lazy(() => import('@/components/admin/AdminVisits'));
const AdminDigitalInvitations = lazy(() => import('@/components/admin/AdminDigitalInvitations'));
const AdminProduction = lazy(() => import('@/components/admin/AdminProduction'));
const AdminAVControlRoom = lazy(() => import('@/components/admin/AdminAVControlRoom'));
const AdminLights = lazy(() => import('@/components/admin/AdminLights'));
const AdminLiveShow = lazy(() => import('@/components/admin/AdminLiveShow'));
const AdminStudio = lazy(() => import('@/components/admin/AdminStudio'));
const AdminHealth = lazy(() => import('@/components/admin/AdminHealth'));
const AdminBots = lazy(() => import('@/components/admin/AdminBots'));
const AdminChangeHistory = lazy(() => import('@/components/admin/AdminChangeHistory'));
import { createInitialState } from '@/lib/gameLogic';

// 12.0 · Το Admin σε 5 χώρους, «ανά τι κάνεις εκείνη τη στιγμή»: ετοιμασία, βραδιά, περιεχόμενο, καλεσμένες, σύστημα.
const NAV_GROUPS = [
  {
    id: 'home',
    label: '🏠 Αρχική',
    tabs: [
      { id: 'dashboard', label: 'Έτοιμο για βραδιά', icon: LayoutDashboard },
      { id: 'inbox', label: 'Αιτήσεις', icon: Inbox },
      { id: 'guide', label: 'Οδηγός', icon: BookOpen },
    ],
  },
  {
    id: 'show',
    label: '🎬 Βραδιά',
    tabs: [
      { id: 'studio', label: 'Στούντιο', icon: Video },
      { id: 'show', label: 'Live Show', icon: Radio },
      { id: 'players', label: 'Παίκτριες & ρόλοι', icon: Users },
      { id: 'production', label: 'Παραγωγή & ροή', icon: Video },
      { id: 'av', label: 'Ήχος & εικόνα TV', icon: AudioLines },
      { id: 'lights', label: 'Φώτα & Samsung TV', icon: Lightbulb },
      { id: 'links', label: 'Σύνδεσμοι & QR', icon: Link2 },
      { id: 'rehearsal', label: 'Πρόβα & ψεύτικα κινητά', icon: FlaskConical },
    ],
  },
  {
    id: 'game',
    label: '🧩 Περιεχόμενο',
    tabs: [
      { id: 'modes', label: 'Κάρτες, ταμπλό & κείμενα', icon: Layers },
      { id: 'media', label: 'Φωτογραφίες & βίντεο', icon: Images },
      { id: 'website', label: 'Ιστοσελίδα', icon: Globe },
      { id: 'forms', label: 'Ερωτήσεις φορμών', icon: FileText },
      { id: 'social', label: 'Κάρτα για social', icon: Instagram },
    ],
  },
  {
    id: 'guests',
    label: '👥 Καλεσμένες',
    tabs: [
      { id: 'history', label: 'Κάρτες παικτριών', icon: History },
      { id: 'events', label: 'Διοργανώσεις', icon: Ticket },
      { id: 'invitations', label: 'Προσκλήσεις', icon: Mail },
      { id: 'interest', label: 'Ενδιαφέρον & συμμετοχή', icon: Users },
    ],
  },
  {
    id: 'system',
    label: '⚙️ Σύστημα',
    tabs: [
      { id: 'health', label: 'Υγεία server', icon: Activity },
      { id: 'versions', label: 'Ιστορικό αλλαγών & αναίρεση', icon: RotateCcw },
      { id: 'settings', label: 'Ρυθμίσεις & έκδοση', icon: Settings },
      { id: 'notifications', label: 'Ειδοποιήσεις', icon: Bell },
      { id: 'sessions', label: 'Ιστορικό παρτίδων', icon: History },
      { id: 'backup', label: 'Αντίγραφα ασφαλείας', icon: HardDrive },
      { id: 'statistics', label: 'Στατιστικά & επισκέψεις', icon: BarChart3 },
    ],
  },
];
const LEGACY_TABS = {
  intakes: 'inbox',
  rsvp: 'inbox',
  content: 'modes',
  editor: 'modes',
  pajama: 'modes',
  board: 'modes',
  cards: 'modes',
  classic: 'modes',
  marathon: 'modes',
  arrest_heist: 'modes',
  special: 'modes',
  site: 'website',
  meta: 'modes',
  achievements: 'modes',
  scenarios: 'modes',
  eventinfo: 'events',
  archive: 'sessions',
  recovery: 'sessions',
  visits: 'statistics',
  blitz: 'players',
  leaderboard: 'modes',
  live: 'show',
  casting: 'show',
  promo: 'links',
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
      const { items } = await appApi.entities.GameSession.filter({}, { sort: '-created_date', limit: 50 });
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

  useEffect(() => {
    let mounted = true;
    const unsubscribe = appApi.entities.GameSession.subscribe((event) => {
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

    loadSessions().then(async (items) => {
      if (!mounted || !items?.length) return;
      const currentCode = await getActiveSessionCode();
      if (!mounted) return;
      const saved = currentCode ? sessionsRef.current.find((item) => item.sessionCode === currentCode) : null;
      const active = saved || sessionsRef.current[0] || items[0];
      if (active?.sessionCode) {
        setPickedSession(active);
        setActiveSessionCode(active.sessionCode);
      }
    });

    return () => { mounted = false; unsubscribe(); };
  }, [loadSessions]);

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

  const activeSession = pickedSession || sessions[0] || null;

  const selectSession = useCallback((s) => {
    setPickedSession(s);
    if (s?.sessionCode) setActiveSessionCode(s.sessionCode);
  }, []);

  async function handleUpdateSession(id, statePatch) {
    try {
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
      await appApi.entities.GameSessionSnapshot.create({
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
        ...(state.customScenario ? { customScenario: state.customScenario } : {}),
      };
      await appApi.entities.GameSession.update(session.id, { state: newState });
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
      case 'av':
        return (
          <div className="space-y-4">
            <a href="/av-setup" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-[#1C1C1E] p-4 text-white">
              <span><span className="block font-semibold">🎛️ Συσκευές ήχου & κάμερας</span><span className="text-sm text-white/60">Άνοιξε το /av-setup στη συσκευή της TV ή του Tablet: κάμερα, μικρόφωνο USB-C, κάρτα ήχου USB-C, ασύρματα ακουστικά.</span></span>
              <span className="text-xl text-white/40">›</span>
            </a>
            <AdminAVControlRoom />
          </div>
        );
      case 'lights':
        return <AdminLights />;
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
          <div className="space-y-4">
            <p className="text-[15px] text-white/60">Εδώ προσθέτεις δικές σου ερωτήσεις στις φόρμες. Οι αιτήσεις που στέλνουν οι καλεσμένες είναι στις «Αιτήσεις».</p>
            <AdminFormsBuilder />
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
      case 'social':
        return <AdminSocialCard />;
      case 'history':
        return <AdminPlayerHistory />;
      case 'rehearsal':
        return (
          <div className="space-y-4">
            <AdminBots sessions={sessions} />
            <AdminRehearsal />
          </div>
        );
      case 'guide':
        return <AdminGuide />;
      case 'backup':
        return <AdminBackup />;
      case 'sessions':
        return (
          <div className="space-y-6">
            <AdminMemories />
            <AdminSessions
              sessions={sessions}
              loading={loading}
              onSelect={selectSession}
              onDelete={handleDeleteSession}
              onRestart={handleRestartSession}
              onRefresh={loadSessions}
            />
          </div>
        );
      case 'players':
        return (
          <AdminPlayers
            sessions={sessions}
            selectedSession={activeSession}
            onSelect={selectSession}
            onUpdate={handleUpdateSession}
          />
        );
      case 'studio':
        return <AdminStudio sessions={sessions} selectedSession={activeSession} onSelect={selectSession} onUpdate={handleUpdateSession} />;
      case 'show':
        return (
          <AdminLiveShow
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
      case 'health':
        return <AdminHealth sessions={sessions} />;
      case 'versions':
        return <AdminChangeHistory />;
      default:
        return <AdminOverview sessions={sessions} loading={loading} onNavigate={setTab} />;
    }
  }

  const searchItems = [
    ...NAV_GROUPS.flatMap((group) => group.tabs.map((item) => ({ type: 'tab', id: item.id, label: item.label, detail: group.label }))),
    ...sessions.map((session) => ({ type: 'session', id: session.id, label: session.event?.title || session.mode || 'Game', detail: `${session.sessionCode} · ${(session.state?.players || []).map((player) => player.name).join(', ')}` })),
    // 12.0: παίκτριες → κάρτα παίκτριας (ιστορικό, όρια, βραβεία).
    ...[...new Map(sessions.flatMap((session) => (session.state?.players || []).map((player) => [String(player.name || '').trim().toLocaleLowerCase('el-GR'), player.name]))).values()]
      .filter(Boolean).map((name) => ({ type: 'tab', id: 'history', label: `👤 ${name}`, detail: 'Κάρτα παίκτριας' })),
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
          <img className="adm-mark" src={ART.emblem || '/icons/icon-192.png'} alt="" aria-hidden="true" />
          <div className="adm-titles">
            <h1 className="adm-title">{NAV_GROUPS.flatMap((group) => group.tabs).find((item) => item.id === tab)?.label || 'Κέντρο ελέγχου'}</h1>
            <div className="adm-subtitle">Deal of Temptation · Admin</div>
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

        <div className="adm-tabbar-wrap">
          <AdminTabBar groups={navGroups} active={tab} onChange={setTab} />
        </div>

        <AdminSessionBar sessions={sessions} activeSession={activeSession} onSelect={selectSession} />

        <div className="adm-layout">
          <aside className="adm-sidebar">
            <AdminNav groups={navGroups} active={tab} onChange={setTab} />
          </aside>
          <main className="adm-content">
            <SectionErrorBoundary name={`admin:${tab}`} resetKey={tab}>
              <Suspense fallback={<div className="adm-loading">Φόρτωση ενότητας…</div>}>
                {renderTab()}
              </Suspense>
            </SectionErrorBoundary>
          </main>
        </div>

        <div className="adm-footer">Πίνακας διαχείρισης · {sessions.length} συνεδρίες φορτωμένες</div>
      </div>
    </div>
  );
}
