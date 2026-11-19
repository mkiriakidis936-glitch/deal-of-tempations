import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, getToken } from '@/api/base44Client';
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
    setAppPublicSettings(await base44.app.getPublicSettings());
    setIsLoadingPublicSettings(false);
    if (getToken()) await checkUserAuth();
    else { setIsLoadingAuth(false); setIsAuthenticated(false); setAuthChecked(true); }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      // expired / invalid token: just behave as logged out
      base44.auth.setToken('');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    base44.auth.logout(shouldRedirect ? window.location.href : undefined);
  };

  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.pathname);

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
