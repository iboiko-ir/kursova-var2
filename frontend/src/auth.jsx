import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getSessionToken, setSessionToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: Boolean(getSessionToken()), user: null });

  useEffect(() => {
    if (!getSessionToken()) {
      return undefined;
    }
    let active = true;
    api('/auth/me')
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
    const result = await api('/auth/login', { method: 'POST', body: { username, password } });
    setSessionToken(result.accessToken);
    setState({ loading: false, user: result.user });
  }, []);

  const logout = useCallback(() => {
    setSessionToken(null);
    setState({ loading: false, user: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, isAdmin: state.user?.role === 'admin', login, logout }),
    [state, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
