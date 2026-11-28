import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { trackVisit } from '@/lib/track';
import GlobalDesignProvider from '@/components/GlobalDesignProvider';
import UpdateBanner from '@/components/UpdateBanner';
const Tablet = lazy(() => import('@/pages/Tablet'));
const TVScreen = lazy(() => import('@/pages/TV'));
const Play = lazy(() => import('@/pages/Play'));
const Admin = lazy(() => import('@/pages/Admin'));
const PlayPreview = lazy(() => import('@/pages/PlayPreview'));
const CamPage = lazy(() => import('@/pages/CamPage'));
const VIPInvitationPage = lazy(() => import('@/pages/VIPInvitationPage'));
const Promo = lazy(() => import('@/pages/Promo'));
const GiftUnlock = lazy(() => import('@/pages/GiftUnlock'));
const Site = lazy(() => import('@/pages/Site'));
import AvSetup from '@/pages/AvSetup';
import Memories from '@/pages/Memories';
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PublicForms = lazy(() => import('@/pages/PublicForms'));
const EventPortal = lazy(() => import('@/pages/EventPortal'));
const DealPage = lazy(() => import('@/pages/DealPage'));

// Game-master screens (tablet + admin) need an admin account.
const RequireAdmin = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (user?.role !== 'admin') return <UserNotRegisteredError />;
  return children;
};

const PublicVisitTracker = () => {
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/memories/') || path.startsWith('/play/')) return;
    if (['/', '/tv', '/play', '/cam', '/admin', '/av-setup', '/login', '/register', '/forgot-password', '/reset-password'].includes(path)) return;
    let trackedPath = path;
    if (path === '/site') {
      const event = new URLSearchParams(location.search).get('event');
      if (event && /^[a-z0-9_-]+$/i.test(event)) trackedPath = `/site/${event.toLowerCase()}`;
    } else if (path.startsWith('/vip/')) {
      trackedPath = '/vip';
    }
    trackVisit(trackedPath);
  }, [location.pathname, location.search]);
  return null;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl opacity-80" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background"><img src="/icons/icon-192.png" alt="" className="w-16 h-16 rounded-2xl opacity-80" /></div>}>
    <Routes>
      <Route path="/" element={<RequireAdmin><Tablet /></RequireAdmin>} />
      <Route path="/tv" element={<TVScreen />} />
      <Route path="/play" element={<Play />} />
      <Route path="/play/preview" element={<RequireAdmin><PlayPreview /></RequireAdmin>} />
      <Route path="/cam" element={<CamPage />} />
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/promo" element={<Promo />} />
      <Route path="/vip/:token" element={<VIPInvitationPage />} />
      <Route path="/forms" element={<PublicForms />} />
      <Route path="/portal" element={<EventPortal />} />
      <Route path="/deal" element={<DealPage />} />
      <Route path="/deal/:roomCode" element={<DealPage />} />
      <Route path="/gift-unlock" element={<GiftUnlock />} />
      <Route path="/gift" element={<Navigate to="/gift-unlock" replace />} />
      <Route path="/site" element={<Site />} />
      <Route path="/av-setup" element={<AvSetup />} />
      <Route path="/memories/:token" element={<Memories />} />
      {/* Παλιοί σύνδεσμοι που δεν υπάρχουν πια: πάνε στο Site αντί για «404». */}
      {['/production-consent', '/pajama-form', '/vip', '/vip-access', '/pajama-invite', '/invitation', '/welcome', '/modes-form', '/intake'].map((path) => (
        <Route key={path} path={path} element={<Navigate to="/site" replace />} />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <GlobalDesignProvider />
          <ScrollToTop />
          <PublicVisitTracker />
          <AuthenticatedApp />
          <UpdateBanner />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App