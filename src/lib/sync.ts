"use client";

import { create } from "zustand";
import { usePosStore } from "@/lib/store";
import { fromRows } from "@/lib/sheet-map";

export type SyncStatus =
  | "idle" | "checking" | "syncing" | "ok" | "error" | "unconfigured" | "unauthenticated";

type SyncState = {
  status: SyncStatus;
  message: string;
  lastSync: string;
  dirty: boolean;
  revision: string;
  configured: boolean;
  check: () => Promise<void>;
  pullNow: (silent?: boolean) => Promise<boolean>;
  pushNow: () => Promise<boolean>;
};

const LAST_SYNC_KEY = "sfxLastSyncAt";

let suppressUntil = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let inited = false;

export const useSyncState = create<SyncState>((setFn) => ({
  status: "idle",
  message: "Not checked",
  lastSync: typeof localStorage !== "undefined" ? localStorage.getItem(LAST_SYNC_KEY) ?? "" : "",
  dirty: false,
  revision: "",
  configured: false,

  check: async () => {
    setFn({ status: "checking", message: "Checking cloud…" });
    try {
      const r = await fetch("/api/sync/status");
      const j = await r.json();
      if (!j.configured) {
        setFn({ status: "unconfigured", configured: false, message: "Sheets not configured — local only" });
        return;
      }
      setFn({ configured: true, status: "ok", message: "Cloud ready" });
    } catch {
      setFn({ status: "error", message: "Status check failed" });
    }
  },

  pullNow: async (silent = false) => {
    if (!silent) setFn({ status: "syncing", message: "Pulling from Sheets…" });
    try {
      const r = await fetch("/api/sync/pull");
      if (r.status === 401) {
        setFn({ status: "unauthenticated", message: "Login required for sync" });
        return false;
      }
      if (!r.ok) throw new Error((await r.json()).error || "Pull failed");
      const { tables } = await r.json();
      const payload = fromRows(tables);
      suppressUntil = Date.now() + 3000;
      await usePosStore.getState().replaceAll(payload);
      const at = new Date().toISOString();
      try { localStorage.setItem(LAST_SYNC_KEY, at); } catch { /* noop */ }
      setFn({ status: "ok", lastSync: at, dirty: false, message: "Up to date" });
      return true;
    } catch (e) {
      setFn({ status: "error", message: e instanceof Error ? e.message : "Pull failed" });
      return false;
    }
  },

  pushNow: async () => {
    setFn({ status: "syncing", message: "Pushing to Sheets…" });
    try {
      const snapshot = usePosStore.getState().snapshot();
      const r = await fetch("/api/sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (r.status === 401) {
        setFn({ status: "unauthenticated", message: "Login required for sync" });
        return false;
      }
      if (!r.ok) throw new Error((await r.json()).error || "Push failed");
      const { revision } = await r.json();
      const at = new Date().toISOString();
      try { localStorage.setItem(LAST_SYNC_KEY, at); } catch { /* noop */ }
      setFn({ status: "ok", lastSync: at, dirty: false, revision, message: "Up to date" });
      return true;
    } catch (e) {
      setFn({ status: "error", message: e instanceof Error ? e.message : "Push failed" });
      return false;
    }
  },
}));

// Call once from PosShell. Marks dirty on local edits, auto-pushes every 45s.
export function initSync(getRole: () => string | undefined) {
  if (inited) return;
  inited = true;
  usePosStore.subscribe(() => {
    if (Date.now() < suppressUntil) return;
    const cur = useSyncState.getState();
    if (!cur.dirty) useSyncState.setState({ dirty: true, message: "Changes waiting to sync" });
  });
  const tick = async () => {
    const st = useSyncState.getState();
    if (!st.configured || !st.dirty) return;
    if (getRole && getRole() !== "admin") return; // viewers never push
    if (!navigator.onLine) return;
    await st.pushNow();
  };
  timer = setInterval(tick, 45000);
  void timer;
  window.addEventListener("online", () => {
    const st = useSyncState.getState();
    if (st.configured) void st.pullNow(true);
  });
}
