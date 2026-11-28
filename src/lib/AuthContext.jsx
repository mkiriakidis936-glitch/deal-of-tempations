import React, { createContext, useState, useContext, useEffect } from 'react';
import { appApi, getToken } from '@/api/apiClient';
import { hydrateGameContent } from '@/lib/gameContentStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => { checkAppState(); }, []);

  const checkAppState = async () => {
    setAuthError(null);
    setIsLoadingPublicSettings(true);
    // Best-effort: load DB-backed game content before any screen renders.
    try { await hydrateGameContent(); } catch (e) { /* keep static defaults */ }
    setAppPublicSettings(await appApi.app.getPublicSettings());
    setIsLoadingPublicSettings(false);
    if (getToken()) await checkUserAuth();
    else { setIsLoadingAuth(false); setIsAuthenticated(false); setAuthChecked(true); }
  };

  const checkUserAuth = async (attempt = 0) => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await appApi.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      const invalid = error?.status === 401 || error?.status === 403;
      // Πτώση WiFi / επανεκκίνηση server: κρατάμε το token και ξαναδοκιμάζουμε (όχι νέο login μέσα στη βραδιά).
      if (!invalid && attempt < 12 && getToken()) {
        setTimeout(() => checkUserAuth(attempt + 1), 2500);
        return;
      }
      // Μόνο όταν ο server λέει ρητά «άκυρο/ληγμένο» (ή μετά από ~30″ χωρίς server) σβήνουμε τη σύνδεση.
      if (invalid) appApi.auth.setToken('');
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    appApi.auth.logout(shouldRedirect ? window.location.href : undefined);
  };

  const navigateToLogin = () => appApi.auth.redirectToLogin(window.location.pathname);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
      appPublicSettings, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
