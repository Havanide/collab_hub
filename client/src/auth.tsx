import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, Me } from './api';

type AuthState = {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, acceptPrivacy: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.me();
      setMe(data);
    } catch {
      setMe(null);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    await api.login(email, password);
    await refresh();
  }

  async function register(email: string, password: string, displayName: string, acceptPrivacy: boolean) {
    await api.register(email, password, displayName, acceptPrivacy);
    await refresh();
  }

  async function logout() {
    await api.logout();
    setMe(null);
  }

  const value = useMemo(() => ({ me, loading, refresh, login, register, logout }), [me, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('AuthProvider is missing');
  return ctx;
}
