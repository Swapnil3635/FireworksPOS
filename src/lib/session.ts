"use client";

import { create } from "zustand";
import type { SessionUser } from "@/lib/auth";

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  authRequired: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

async function fetchStatus(): Promise<boolean> {
  try {
    const r = await fetch("/api/sync/status");
    const j = await r.json();
    return Boolean(j.auth);
  } catch {
    return false;
  }
}

export const useSession = create<SessionState>((setFn) => ({
  user: null,
  loading: true,
  authRequired: false,
  refresh: async () => {
    const authRequired = await fetchStatus();
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) {
        const { user } = await r.json();
        setFn({ user, loading: false, authRequired });
      } else {
        setFn({ user: null, loading: false, authRequired });
      }
    } catch {
      setFn({ loading: false, authRequired });
    }
  },
  login: async (username, password) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (!r.ok) return j.error || "Login failed";
    setFn({ user: j.user });
    return null;
  },
  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setFn({ user: null });
  },
}));
