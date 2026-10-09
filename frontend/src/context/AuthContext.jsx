import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { getSession, setSession, subscribe, updateSession } from '../api/session.js';
import { logoutAPI } from '../api/userApi.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(getSession);

  // Stay in sync with token refreshes, forced logouts and other tabs
  useEffect(() => subscribe(setSessionState), []);

  const login = useCallback(({ accessToken, refreshToken, user }) => {
    setSession({ accessToken, refreshToken, user });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getSession()?.refreshToken;
    setSession(null);
    toast.info('Logged out successfully');
    if (refreshToken) logoutAPI(refreshToken).catch(() => {});
  }, []);

  // Replace the signed-in user's details, e.g. after renaming
  const updateUser = useCallback((nextUser) => updateSession({ user: nextUser }), []);

  // Sign out locally without calling the API (used after "sign out everywhere")
  const clearSession = useCallback(() => setSession(null), []);

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, logout, updateUser, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
