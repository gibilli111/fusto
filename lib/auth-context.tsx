"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { getStoredSession, storeSession, clearSession, type StoredSession } from "./session";

type AuthState = {
  session: StoredSession | null;
  loading: boolean;
  login: (session: StoredSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = getStoredSession();
      if (stored) {
        try {
          const { data, error } = await supabase.rpc("verify_session", { p_token: stored.token });
          if (cancelled) return;
          if (error || !data || data.length === 0) {
            clearSession();
          } else {
            setSession(stored);
          }
        } catch {
          if (!cancelled) clearSession();
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function login(newSession: StoredSession) {
    storeSession(newSession);
    setSession(newSession);
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve stare dentro <AuthProvider>");
  return ctx;
}
