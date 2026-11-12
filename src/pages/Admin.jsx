import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ComicPanel from '@/components/comic/ComicPanel';
import ComicButton from '@/components/comic/ComicButton';
import AdminNav, { AdminTabBar } from '@/components/admin/AdminNav';
import AdminSessionBar from '@/components/admin/AdminSessionBar';
import AdminContentHub from '@/components/admin/AdminContentHub';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminSessions from '@/components/admin/AdminSessions';
import AdminPlayers from '@/components/admin/AdminPlayers';
import AdminGuide from '@/components/admin/AdminGuide';
import AdminIntakes from '@/components/admin/AdminIntakes';
import AdminLinks from '@/components/admin/AdminLinks';
import AdminRSVP from '@/components/admin/AdminRSVP';
import AdminEventInfo from '@/components/admin/AdminEventInfo';
import AdminGrandJury from '@/components/admin/AdminGrandJury';
import AdminMeta from '@/components/admin/AdminMeta';
import AdminPajama from '@/components/admin/AdminPajama';
import AdminLeaderboard from '@/components/admin/AdminLeaderboard';
import AdminBlitz from '@/components/admin/AdminBlitz';
import AdminMedia from '@/components/admin/AdminMedia';
import AdminSite from '@/components/admin/AdminSite';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminVisits from '@/components/admin/AdminVisits';
import { setActiveSessionCode } from '@/lib/activeSession';

const NAV_GROUPS = [
  {
    id: 'game',
    label: 'ΠΑΙΧΝΙΔΙ',
    tabs: [
      { id: 'dashboard', label: '📊 Dashboard' },
      { id: 'sessions', label: '🎮 Συνεδρίες' },
      { id: 'players', label: '👥 Παίκτριες' },
      { id: 'blitz', label: '⚡ 8 Δευτερόλεπτα' },
      { id: 'links', label: '🔗 Σύνδεση & QR' },
      { id: 'leaderboard', label: '🏅 Κατάταξη' },
    ],
  },
  {
    id: 'content',
    label: 'ΠΕΡΙΕΧΟΜΕΝΟ',
    tabs: [
      { id: 'content', label: '📦 Περιεχόμενο & Κουτιά' },
      { id: 'pajama', label: '🩴 Pajama Mode' },
      { id: 'site', label: '🌐 Site & Σενάριο' },
      { id: 'media', label: '🖼️ Φωτογραφίες & Βίντεο' },
    ],
  },
  {
    id: 'event',
    label: 'ΔΙΟΡΓΑΝΩΣΗ',
    tabs: [
      { id: 'intakes', label: '📝 Ερωτηματολόγια' },
      { id: 'rsvp', label: '💌 Προσκλήσεις' },
      { id: 'eventinfo', label: '📅 Πρακτικά' },
      { id: 'grandjury', label: '📜 Κατηγορητήριο' },
    ],
  },
  {
    id: 'system',
    label: 'ΣΥΣΤΗΜΑ',
    tabs: [
      { id: 'notifications', label: '🔔 Ειδοποιήσεις' },
      { id: 'visits', label: '📈 Επισκέψεις Site' },
      { id: 'guide', label: '📖 Οδηγός' },
      { id: 'meta', label: '🔮 Meta-Game' },
    ],
  },
];

const LEGACY_TABS = {
  board: 'content',
  cards: 'content',
  classic: 'content',
  marathon: 'content',
  arrest_heist: 'content',
  special: 'content',
};

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = LEGACY_TABS[params.get('tab')] || params.get('tab') || 'dashboard';
  const setTab = (id) => setParams({ tab: id }, { replace: true });

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickedSession, setPickedSession] = useState(null);

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
      await base44.entities.GameSession.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setPickedSession((prev) => (prev?.id === id ? null : prev));
    } catch (e) { console.error('Delete error', e); }
  }

  async function handleRestartSession(session) {
    try {
      const state = session.state || {};
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
      case 'content':
        return <AdminContentHub />;
      case 'pajama':
        return <AdminPajama />;
      case 'site':
        return <AdminSite />;
      case 'media':
        return <AdminMedia />;
      case 'notifications':
        return <AdminNotifications />;
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
        return <AdminDashboard sessions={sessions} loading={loading} />;
    }
  }

  return (
    <div className="admin-root min-h-[100dvh] comic-dots p-2.5 sm:p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
      <div className="max-w-6xl mx-auto space-y-3">
        <ComicPanel className="bg-secondary flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-heading text-2xl sm:text-3xl comic-text-stroke text-primary">🔧 ADMIN PANEL</div>
            <div className="text-[11px] sm:text-xs font-bold text-foreground/70 font-body truncate">DEAL OF TEMPTATION — Διαχείριση</div>
          </div>
          <ComicButton variant="dark" size="sm" onClick={loadSessions} disabled={loading}>
            🔄 <span className="hidden sm:inline">{loading ? 'ΦΟΡΤΩΣΗ...' : 'ΑΝΑΝΕΩΣΗ'}</span>
          </ComicButton>
        </ComicPanel>

        {/* Κινητό: μενού που σκρολάρει οριζόντια, πάντα ορατό */}
        <div className="lg:hidden sticky z-30 -mx-2.5 px-2.5 py-1 bg-background/90 backdrop-blur border-b border-border/40" style={{ top: 0 }}>
          <AdminTabBar groups={NAV_GROUPS} active={tab} onChange={setTab} />
        </div>

        <AdminSessionBar sessions={sessions} activeSession={activeSession} onSelect={selectSession} />

        <div className="flex flex-col lg:flex-row gap-3 items-start">
          <div className="hidden lg:block w-52 shrink-0 lg:sticky lg:top-3">
            <ComicPanel className="bg-card p-2">
              <AdminNav groups={NAV_GROUPS} active={tab} onChange={setTab} />
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