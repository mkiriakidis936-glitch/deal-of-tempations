import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminNav, { AdminTabBar } from '@/components/admin/AdminNav';
import AdminSessionBar from '@/components/admin/AdminSessionBar';
import AdminContentHub from '@/components/admin/AdminContentHub';
import AdminContent from '@/components/admin/AdminContent';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminSessions from '@/components/admin/AdminSessions';
import AdminSessionRecovery from '@/components/admin/AdminSessionRecovery';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminGuide from '@/components/admin/AdminGuide';
import AdminIntakes from '@/components/admin/AdminIntakes';
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
import { setActiveSessionCode } from '@/lib/activeSession';

const NAV_GROUPS = [
  {
    id: 'overview',
    label: '01 · ΚΕΝΤΡΙΚΟΣ ΠΙΝΑΚΑΣ',
    tabs: [
      { id: 'dashboard', label: '📊 Επισκόπηση' },
      { id: 'statistics', label: '📈 Στατιστικά' },
    ],
  },
  {
    id: 'game-management',
    label: '02 · ΔΙΑΧΕΙΡΙΣΗ ΠΑΙΧΝΙΔΙΟΥ',
    tabs: [
      { id: 'modes', label: '🎮 Game Modes' },
    ],
  },
  {
    id: 'players',
    label: '03 · ΔΙΑΧΕΙΡΙΣΗ ΠΑΙΚΤΩΝ',
    tabs: [
      { id: 'players', label: '👥 Παίκτες & Ρόλοι' },
      { id: 'achievements', label: '🏅 Επιτεύγματα' },
    ],
  },
  {
    id: 'content',
    label: '04 · ΠΕΡΙΕΧΟΜΕΝΟ',
    tabs: [
      { id: 'editor', label: '🃏 Decks & Game Editor' },
      { id: 'scenarios', label: '🎭 Scenarios' },
      { id: 'media', label: '🖼️ Media Library' },
    ],
  },
  {
    id: 'experiences',
    label: '05 · EXPERIENCES',
    tabs: [
      { id: 'website', label: '🌐 Website' },
      { id: 'invitations', label: '✉️ Digital Invitations' },
      { id: 'forms', label: '📝 Forms & RSVP' },
      { id: 'links', label: '🔗 Links & QR' },
    ],
  },
  {
    id: 'live-control',
    label: '06 · LIVE CONTROL',
    tabs: [
      { id: 'live', label: '⏯️ Ζωντανός έλεγχος' },
    ],
  },
  {
    id: 'settings',
    label: '07 · ΡΥΘΜΙΣΕΙΣ',
    tabs: [
      { id: 'settings', label: '⚙️ Κεντρικές ρυθμίσεις' },
      { id: 'notifications', label: '🔔 Ειδοποιήσεις' },
    ],
  },
  {
    id: 'history',
    label: '08 · ΙΣΤΟΡΙΚΟ & ΑΝΑΚΤΗΣΗ',
    tabs: [
      { id: 'sessions', label: '🎲 Ιστορικό παρτίδων' },
      { id: 'recovery', label: '🛟 Ανάκτηση παρτίδων' },
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
      if (target) {
        await base44.entities.GameSessionSnapshot.create({
          sessionId: target.id,
          sessionCode: target.sessionCode,
          mode: target.state?.mode || target.mode || '',
          stage: Number(target.state?.stage ?? 0),
          playerCount: Array.isArray(target.state?.players) ? target.state.players.length : 0,
          label: 'Αυτόματο αντίγραφο πριν από διαγραφή',
          state: JSON.parse(JSON.stringify(target.state || {})),
          sourceUpdatedAt: target.updated_date || target.created_date || null,
        });
      }
      await base44.entities.GameSession.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setPickedSession((prev) => (prev?.id === id ? null : prev));
    } catch (e) { console.error('Delete error', e); }
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
    <div className="admin-root min-h-[100dvh] comic-dots p-2.5 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
      <div className="max-w-6xl mx-auto space-y-3">
        <ComicPanel className="bg-secondary flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-heading text-2xl sm:text-3xl comic-text-stroke text-primary">🔧 CONTROL CENTER</div>
            <div className="text-[11px] sm:text-xs font-bold text-foreground/70 font-body truncate">DEAL OF TEMPTATION — Κεντρική διαχείριση εφαρμογής</div>
          </div>
          <ComicButton variant="dark" size="sm" onClick={loadSessions} disabled={loading}>
            🔄 <span className="hidden sm:inline">{loading ? 'ΦΟΡΤΩΣΗ...' : 'ΑΝΑΝΕΩΣΗ'}</span>
          </ComicButton>
        </ComicPanel>

        {/* Κινητό: μενού που σκρολάρει οριζόντια, πάντα ορατό */}
        <div className="lg:hidden sticky z-30 -mx-2.5 px-2.5 py-1 bg-background/90 backdrop-blur border-b border-border/40" style={{ top: 0 }}>
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
          🔧 Admin Panel — {sessions.length} συνεδρίες φορτωμένες
        </div>
      </div>
    </div>
  );
}