import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44, request } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminNav, { AdminTabBar } from '@/components/admin/AdminNav';
import AdminSessionBar from '@/components/admin/AdminSessionBar';
import AdminContentHub from '@/components/admin/AdminContentHub';
import AdminContent from '@/components/admin/AdminContent';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminInbox from '@/components/admin/AdminInbox';
import AdminEventCenter from '@/components/admin/AdminEventCenter';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminSessions from '@/components/admin/AdminSessions';
import AdminSessionRecovery from '@/components/admin/AdminSessionRecovery';
import AdminEpisodeArchive from '@/components/admin/AdminEpisodeArchive';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminGuide from '@/components/admin/AdminGuide';
import AdminIntakes from '@/components/admin/AdminIntakes';
import AdminShowCasting from '@/components/admin/AdminShowCasting';
import AdminLinks from '@/components/admin/AdminLinks';
import AdminRSVP from '@/components/admin/AdminRSVP';
import AdminEventInfo from '@/components/admin/AdminEventInfo';
import AdminGrandJury from '@/components/admin/AdminGrandJury';
import AdminMeta from '@/components/admin/AdminMeta';
import AdminLeaderboard from '@/components/admin/AdminLeaderboard';
import AdminBlitz from '@/components/admin/AdminBlitz';
import AdminMedia from '@/components/admin/AdminMedia';
import AdminSite from '@/components/admin/AdminSite';
import AdminCustomScenarios from '@/components/admin/AdminCustomScenarios';
import AdminFormsBuilder from '@/components/admin/AdminFormsBuilder';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminVisits from '@/components/admin/AdminVisits';
import AdminDigitalInvitations from '@/components/admin/AdminDigitalInvitations';
import AdminExtra4 from '@/components/admin/AdminExtra4';
import AdminSecretVault from '@/components/admin/AdminSecretVault';
import { setActiveSessionCode } from '@/lib/activeSession';

const NAV_GROUPS = [
  {
    id: 'overview',
    label: '01 · ΚΕΝΤΡΙΚΗ ΕΙΚΟΝΑ',
    tabs: [
      { id: 'dashboard', label: '📊 Επισκόπηση' },
      { id: 'inbox', label: '📥 Εισερχόμενα' },
      { id: 'events', label: '🎟️ Events & καλεσμένοι' },
      { id: 'statistics', label: '📈 Στατιστικά & επισκέψεις' },
    ],
  },
  {
    id: 'game',
    label: '02 · ΠΑΙΧΝΙΔΙ & ΖΩΝΤΑΝΟΣ ΕΛΕΓΧΟΣ',
    tabs: [
      { id: 'modes', label: '🎮 Λειτουργίες παιχνιδιού' },
      { id: 'extra4', label: '✦ EXTRA 4.0' },
      { id: 'live', label: '⏯️ Ζωντανός έλεγχος' },
    ],
  },
  {
    id: 'players',
    label: '03 · ΠΑΙΚΤΕΣ & META-GAME',
    tabs: [
      { id: 'casting', label: '🎬 Επιλογή Επεισοδίου' },
      { id: 'players', label: '👥 Παίκτες & Ρόλοι' },
      { id: 'blitz', label: '⚡ Blitz' },
      { id: 'achievements', label: '🏅 Επιτεύγματα' },
      { id: 'leaderboard', label: '🏆 Κατάταξη' },
      { id: 'meta', label: '🔮 Meta-game & αρχεία' },
      { id: 'grandjury', label: '⚖️ Grand Jury' },
    ],
  },
  {
    id: 'content',
    label: '04 · ΠΕΡΙΕΧΟΜΕΝΟ & ΣΕΝΑΡΙΑ',
    tabs: [
      { id: 'editor', label: '🃏 Κάρτες & επεξεργασία παιχνιδιού' },
      { id: 'scenarios', label: '🎭 Σενάρια' },
      { id: 'media', label: '🖼️ Βιβλιοθήκη πολυμέσων' },
    ],
  },
  {
    id: 'website',
    label: '05 · ΙΣΤΟΣΕΛΙΔΑ',
    tabs: [
      { id: 'website', label: '🌐 Ιστοσελίδα' },
    ],
  },
  {
    id: 'experiences',
    label: '06 · ΠΡΟΣΚΛΗΣΕΙΣ & ΣΥΜΜΕΤΟΧΕΣ',
    tabs: [
      { id: 'invitations', label: '✉️ Ψηφιακές προσκλήσεις' },
      { id: 'forms', label: '📝 Φόρμες & δηλώσεις συμμετοχής' },
      { id: 'secret-vault', label: '🔐 VIP Vault & αιτήσεις' },
      { id: 'links', label: '🔗 Σύνδεσμοι & QR' },
    ],
  },
  {
    id: 'history',
    label: '07 · ΙΣΤΟΡΙΚΟ & ΑΝΑΚΤΗΣΗ',
    tabs: [
      { id: 'sessions', label: '🎲 Ιστορικό παρτίδων' },
      { id: 'archive', label: '🎬 Αρχείο επεισοδίων' },
      { id: 'recovery', label: '🛟 Ανάκτηση παρτίδων' },
    ],
  },
  {
    id: 'settings',
    label: '08 · ΡΥΘΜΙΣΕΙΣ & ΥΠΟΣΤΗΡΙΞΗ',
    tabs: [
      { id: 'settings', label: '⚙️ Ρυθμίσεις εφαρμογής' },
      { id: 'eventinfo', label: '🗓️ Πληροφορίες Event' },
      { id: 'guide', label: '📖 Οδηγός χρήσης' },
      { id: 'notifications', label: '🔔 Ειδοποιήσεις PUSH' },
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
  eventinfo: 'settings',
  notifications: 'notifications',
  backup: 'settings',
  guide: 'settings',
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
  const [loading, setLoading] = useState(true);
  const [pickedSession, setPickedSession] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const navGroups = NAV_GROUPS;

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await base44.entities.GameSession.filter({}, { sort: '-created_date', limit: 50 });
      setSessions(items || []);
    } catch (e) {
      console.error('Admin load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

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

  async function handleUpdateSession(id, newState) {
    try {
      await base44.entities.GameSession.update(id, { state: newState });
      setSessions((prev) => prev.map((s) => s.id === id ? { ...s, state: newState } : s));
      setPickedSession((prev) => (prev?.id === id ? { ...prev, state: newState } : prev));
    } catch (e) { console.error('Update error', e); }
  }

  async function handleDeleteSession(id) {
    try {
      const target = sessions.find((session) => session.id === id);
      if (!target?.sessionCode) throw new Error('Δεν βρέθηκε ο κωδικός Event της παρτίδας.');
      await request('DELETE', `/api/entities/game-events/${encodeURIComponent(target.sessionCode)}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setPickedSession((prev) => (prev?.id === id ? null : prev));
    } catch (e) { console.error('Delete error', e); throw e; }
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
      const players = Array.isArray(state.players) ? state.players.map((p) => ({
        ...p,
        penaltyStep: 0,
        bounty: 0,
        position: 0,
        isChief: false,
      })) : [];
      const newState = {
        ...state,
        stage: 0,
        round: 1,
        currentPlayerId: null,
        currentTeam: state.currentTeam || 'A',
        players,
        history: [],
        activeCard: null,
        stopActive: false,
      };
      await base44.entities.GameSession.update(session.id, { state: newState });
      setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, state: newState } : s));
      setPickedSession((prev) => (prev?.id === session.id ? { ...prev, state: newState } : prev));
    } catch (e) { console.error('Restart error', e); }
  }

  function renderTab() {
    switch (tab) {
      case 'inbox':
        return <AdminInbox sessions={sessions} />;
      case 'events':
        return <AdminEventCenter sessions={sessions} selectedSession={activeSession} onDeleteSession={handleDeleteSession} onRefreshSessions={loadSessions} />;
      case 'modes':
        return <AdminContentHub />;
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
      case 'secret-vault':
        return <AdminSecretVault />;
      case 'notifications':
        return <AdminNotifications />;
      case 'forms':
        return (
          <div className="space-y-6">
            <AdminFormsBuilder />
            <AdminIntakes />
            <AdminRSVP />
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
      case 'extra4':
        return <AdminExtra4 sessions={sessions} selectedSession={activeSession} onSelect={selectSession} onNavigate={setTab} onUpdate={handleUpdateSession} />;
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
      case 'blitz':
        return (
          <AdminBlitz
            sessions={sessions}
            selectedSession={activeSession}
            onSelect={selectSession}
            onUpdate={handleUpdateSession}
          />
        );
      case 'leaderboard':
        return <AdminLeaderboard />;
      case 'visits':
        return <AdminVisits />;
      case 'intakes':
        return <AdminIntakes />;
      case 'rsvp':
        return <AdminRSVP />;
      case 'eventinfo':
        return <AdminEventInfo />;
      case 'grandjury':
        return <AdminGrandJury />;
      case 'guide':
        return <AdminGuide />;
      case 'meta':
        return <AdminMeta />;
      default:
        return <AdminOverview sessions={sessions} loading={loading} onNavigate={setTab} />;
    }
  }

  return (
    <div className="admin-root min-h-[100dvh] comic-dots p-2.5 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">
      <div className="max-w-6xl mx-auto space-y-3">
        {searchOpen && <div className="fixed inset-0 z-[100] bg-black/70 p-3 sm:p-8" onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}><div className="mx-auto mt-[8vh] max-w-xl rounded-2xl border border-primary/40 bg-card p-4 shadow-2xl"><div className="flex items-center gap-2"><input autoFocus value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Αναζήτηση σε ενότητες, Events, παίκτριες..." className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3 text-sm" /><ComicButton size="sm" variant="dark" onClick={() => setSearchOpen(false)}>ΚΛΕΙΣΙΜΟ</ComicButton></div><div className="mt-3 max-h-[60vh] overflow-y-auto space-y-1">{[
          ...NAV_GROUPS.flatMap((group) => group.tabs.map((tab) => ({ type: 'tab', id: tab.id, label: tab.label.replace(/^[^ ]+ /, ''), detail: group.label }))),
          ...sessions.map((session) => ({ type: 'session', id: session.id, label: session.event?.title || session.mode || 'Game', detail: session.sessionCode + ' · ' + (session.state?.players || []).map((player) => player.name).join(', ') })),
        ].filter((item) => !globalSearch || (item.label + ' ' + item.detail).toLocaleLowerCase('el-GR').includes(globalSearch.toLocaleLowerCase('el-GR'))).slice(0, 30).map((item) => <button key={item.type + item.id} className="w-full rounded-lg p-3 text-left hover:bg-secondary" onClick={() => { if (item.type === 'tab') setTab(item.id); else { const found = sessions.find((session) => session.id === item.id); setPickedSession(found || null); setTab('events'); } setSearchOpen(false); }}><div className="text-sm font-bold">{item.label}</div><div className="text-[10px] text-foreground/50">{item.detail}</div></button>)}</div></div></div>}
        <ComicPanel className="bg-secondary flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-heading text-2xl sm:text-3xl comic-text-stroke text-primary">🔧 ΚΕΝΤΡΟ ΕΛΕΓΧΟΥ</div>
            <div className="text-[11px] sm:text-xs font-bold text-foreground/70 font-body truncate">DEAL OF TEMPTATION — Κεντρική διαχείριση εφαρμογής</div>
          </div>
          <ComicButton variant="dark" size="sm" onClick={() => { setGlobalSearch(''); setSearchOpen(true); }}>⌕ <span className="hidden sm:inline">ΑΝΑΖΗΤΗΣΗ · ⌘K</span></ComicButton>
          <ComicButton variant="dark" size="sm" onClick={loadSessions} disabled={loading}>
            🔄 <span className="hidden sm:inline">{loading ? 'ΦΟΡΤΩΣΗ...' : 'ΑΝΑΝΕΩΣΗ'}</span>
          </ComicButton>
        </ComicPanel>

        {/* Κινητό: μενού που σκρολάρει οριζόντια, πάντα ορατό */}
        <div className="lg:hidden fixed z-40 bottom-0 left-0 right-0 px-2 pb-[env(safe-area-inset-bottom,0px)] bg-background/95 backdrop-blur border-t border-border/50 shadow-lg">
          <AdminTabBar groups={navGroups} active={tab} onChange={setTab} />
        </div>

        <AdminSessionBar sessions={sessions} activeSession={activeSession} onSelect={selectSession} />

        <div className="flex flex-col lg:flex-row gap-3 items-start">
          <div className="hidden lg:block w-52 shrink-0 lg:sticky lg:top-3">
            <ComicPanel className="bg-card p-2">
              <AdminNav groups={navGroups} active={tab} onChange={setTab} />
            </ComicPanel>
          </div>
          <div className="flex-1 min-w-0 w-full">
            {renderTab()}
          </div>
        </div>

        <div className="text-center text-xs text-foreground/50 pt-2 font-body">
          🔧 Πίνακας διαχείρισης — {sessions.length} συνεδρίες φορτωμένες
        </div>
      </div>
    </div>
  );
}