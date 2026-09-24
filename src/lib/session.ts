"use client";

import { create } from "zustand";
import type { SessionUser } from "@/lib/auth";

type SetupInfo = {
  configured: boolean;
  ironSet: boolean;
  hasAdmin: boolean;
  needsSetup: boolean;
};

type SessionState = {
  user: SessionUser | null;
  loading: boolean;
  // Login is mandatory. authRequired is true unless the server can't run
  // sessions at all (missing IRON_SECRET) — then setup screens take over.
  authRequired: boolean;
  setup: SetupInfo;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  bootstrap: (username: string, displayName: string, password: string) => Promise<string | null>;
  setupHash: (password: string) => Promise<{ value?: string; error?: string }>;
};

async function fetchStatus(): Promise<{ auth: boolean; setup: SetupInfo }> {
  const fallback: SetupInfo = { configured: false, ironSet: false, hasAdmin: false, needsSetup: true };
  try {
    const r = await fetch("/api/sync/status");
    const j = await r.json();
    return {
      // Gate the app whenever sessions can exist; setup screens handle the rest.
      auth: Boolean(j.ironSet),
      setup: {
        configured: Boolean(j.configured),
        ironSet: Boolean(j.ironSet),
        hasAdmin: Boolean(j.hasAdmin),
        needsSetup: Boolean(j.needsSetup ?? !j.hasAdmin),
      },
    };
  } catch {
    return { auth: true, setup: fallback };
  }
}

export const useSession = create<SessionState>((setFn) => ({
  user: null,
  loading: true,
  authRequired: true,
  setup: { configured: false, ironSet: false, hasAdmin: false, needsSetup: true },
  refresh: async () => {
    const { auth, setup } = await fetchStatus();
    try {
      const r = await fetch("/api/auth/me");
      if (r.ok) {
        const { user } = await r.json();
        setFn({ user, loading: false, authRequired: auth, setup });
      } else {
        setFn({ user: null, loading: false, authRequired: auth, setup });
      }
    } catch {
      setFn({ loading: false, authRequired: auth, setup });
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
  bootstrap: async (username, displayName, password) => {
    const r = await fetch("/api/auth/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, displayName, password }),
    });
    const j = await r.json();
    if (!r.ok) return j.error || "Bootstrap failed";
    setFn({ user: j.user });
    return null;
  },
  setupHash: async (password) => {
    const r = await fetch("/api/auth/setup-hash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.error || "Failed" };
    return { value: j.value as string };
  },
}));

// Employees (viewer role) are read-only. Only the superuser (admin) mutates.
export function useCanEdit() {
  return useSession((s) => s.user?.role === "admin");
}
