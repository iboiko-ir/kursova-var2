import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getSessionToken, setSessionToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: Boolean(getSessionToken()), user: null });

  useEffect(() => {
    if (!getSessionToken()) {
      return undefined;
    }
    let active = true;
    apiRequest('/auth/me')
      .then((user) => active && setState({ loading: false, user }))
      .catch(() => {
        setSessionToken(null);
        if (active) {
          setState({ loading: false, user: null });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setSessionToken(null);
      setState({ loading: false, user: null });
    };
    window.addEventListener('kursova:unauthorized', onUnauthorized);
    return () => window.removeEventListener('kursova:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await apiRequest('/auth/login', { method: 'POST', body: { username, password } });
    setSessionToken(result.accessToken);
    setState({ loading: false, user: result.user });
  }, []);

  const logout = useCallback(() => {
    setSessionToken(null);
    setState({ loading: false, user: null });
  }, []);

  const authContextValue = useMemo(
    () => ({ ...state, isAdmin: state.user?.role === 'admin', login, logout }),
    [state, login, logout],
  );
  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
