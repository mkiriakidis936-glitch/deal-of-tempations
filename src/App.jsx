import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import MediaEditMode from '@/components/shared/MediaEditMode';
import GlobalDesignProvider from '@/components/GlobalDesignProvider';
// Add page imports here
import Tablet from '@/pages/Tablet';
import TVScreen from '@/pages/TV';
import Play from '@/pages/Play';
import Intake from '@/pages/Intake';
import Admin from '@/pages/Admin';
import Invitation from '@/pages/Invitation';
import Promo from '@/pages/Promo';
import GiftUnlock from '@/pages/GiftUnlock';
import PajamaForm from '@/pages/PajamaForm';
import ModeForm from '@/pages/ModeForm';
import PajamaInvite from '@/pages/PajamaInvite';
import Site from '@/pages/Site';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

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
    <Routes>
      {/* Add your page Route elements here */}
      <Route path="/" element={<RequireAdmin><Tablet /></RequireAdmin>} />
      <Route path="/tv" element={<TVScreen />} />
      <Route path="/play" element={<Play />} />
      <Route path="/intake" element={<Intake />} />
      <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/promo" element={<Promo />} />
      <Route path="/invitation" element={<Invitation />} />
      <Route path="/welcome" element={<Navigate to="/invitation" replace />} />
      <Route path="/pajama-form" element={<PajamaForm />} />
      <Route path="/modes-form" element={<ModeForm />} />
      <Route path="/gift-unlock" element={<GiftUnlock />} />
      <Route path="/pajama-invite" element={<PajamaInvite />} />
      <Route path="/site" element={<Site />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
          <MediaEditMode />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App