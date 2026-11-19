import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import GlobalDesignProvider from '@/components/GlobalDesignProvider';
// Add page imports here
const Tablet = lazy(() => import('@/pages/Tablet'));
const TVScreen = lazy(() => import('@/pages/TV'));
const Play = lazy(() => import('@/pages/Play'));
const Admin = lazy(() => import('@/pages/Admin'));
const VIPInvitationPage = lazy(() => import('@/pages/VIPInvitationPage'));
const Promo = lazy(() => import('@/pages/Promo'));
const GiftUnlock = lazy(() => import('@/pages/GiftUnlock'));
const Site = lazy(() => import('@/pages/Site'));
const ProductionConsent = lazy(() => import('@/pages/ProductionConsent'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PublicForms = lazy(() => import('@/pages/PublicForms'));

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>}>
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<RequireAdmin><Tablet /></RequireAdmin>} />
      <Route path="/tv" element={<TVScreen />} />
      <Route path="/play" element={<Play />} />
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/promo" element={<Promo />} />
      <Route path="/vip/:token" element={<VIPInvitationPage />} />
      <Route path="/forms" element={<PublicForms />} />
      <Route path="/gift-unlock" element={<GiftUnlock />} />
      <Route path="/site" element={<Site />} />
      <Route path="/production-consent" element={<ProductionConsent />} />
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App