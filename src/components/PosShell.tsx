"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { POS_NAV, VIEWER_SAFE_ROUTES } from "@/lib/nav";

import { usePosStore } from "@/lib/store";
import { useSession } from "@/lib/session";
import { useSyncState, initSync } from "@/lib/sync";

function allowedHrefs(role: string | undefined, permissions: string[]): string[] {
  if (role !== "viewer") return POS_NAV.map((r) => r.href);
  const map: Record<string, string> = { events: "/events", calendar: "/calendar", reservations: "/reservations" };
  return permissions.map((p) => map[p]).filter(Boolean);
}

function NavList({ onNav, visible }: { onNav?: () => void; visible: string[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1 p-3">
      {POS_NAV.filter((r) => visible.includes(r.href)).map((r) => {
        const active = pathname === r.href;
        return (
          <li key={r.href}>
            <Link
              href={r.href}
              onClick={onNav}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-amber-500/25 via-orange-600/15 to-transparent text-amber-100 ring-1 ring-amber-400/30 shadow-[0_8px_24px_-10px_rgba(234,88,12,0.7)]"
                  : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-amber-300 to-orange-600 shadow-[0_0_12px_2px_rgba(245,158,11,0.6)]" />
              )}
              <span className={`text-lg transition-transform duration-200 ${active ? "" : "group-hover:scale-110"}`}>{r.icon}</span>
              <span className="flex-1">{r.label}</span>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_2px_rgba(251,191,36,0.8)]" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SyncStrip() {
  const { status, message, lastSync, dirty, check, pullNow } = useSyncState();
  useEffect(() => { check(); }, [check]);
  if (status === "unconfigured") return null;
  const dot =
    status === "ok" && !dirty ? "bg-emerald-400"
    : status === "syncing" || status === "checking" ? "bg-amber-400 animate-pulse"
    : status === "error" ? "bg-red-400" : "bg-zinc-500";
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 pt-2 text-xs text-zinc-400 md:px-8" role="status">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="flex-1 truncate">
        {dirty ? "Changes waiting to sync" : message}
        {lastSync ? ` · ${new Date(lastSync).toLocaleString("en-IN")}` : ""}
      </span>
      <button onClick={() => pullNow()} className="rounded-lg border border-white/15 px-2.5 py-1 font-semibold hover:bg-white/5">
        Refresh
      </button>
    </div>
  );
}

function LoginScreen() {
  const login = useSession((s) => s.login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    const e = await login(username, password);
    setErr(e ?? "");
    setBusy(false);
  };
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="glass-card w-full max-w-sm rounded-3xl p-6">
        <p className="ember-text text-center text-2xl font-extrabold">🎆 SHREYAS SFX</p>
        <p className="mt-1 text-center text-xs text-zinc-400">Sign in to the POS</p>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoComplete="username"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
          type="password" placeholder="Password" autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        {err && <p className="mt-2 text-xs font-semibold text-red-300">{err}</p>}
        <button onClick={submit} disabled={busy} className="ember-btn mt-3 w-full rounded-xl py-2.5 text-sm font-bold disabled:opacity-50">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

export default function PosShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ready = usePosStore((s) => s.ready);
  const hydrate = usePosStore((s) => s.hydrate);
  const { user, loading, authRequired, refresh, logout } = useSession();
  const pathname = usePathname();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    initSync(() => useSession.getState().user?.role);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-zinc-400">Loading POS data…</div>
      </div>
    );
  }

  if (authRequired && !user) return <LoginScreen />;

  const visible = allowedHrefs(user?.role, user?.permissions ?? []);
  const blocked = user?.role === "viewer" && pathname && !visible.includes(pathname) &&
    !VIEWER_SAFE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-gradient-to-b from-night-900 via-night-950 to-[#0a0605] md:flex md:flex-col">
        <div className="flex items-center gap-3 px-5 pb-5 pt-6">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-orange-700 text-xl shadow-[0_8px_24px_-6px_rgba(234,88,12,0.8),inset_0_1px_0_rgba(255,255,255,0.5)]" aria-hidden>🎆</span>
          <div>
            <p className="ember-text font-display text-lg font-semibold leading-none tracking-tight">SHREYAS SFX</p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Pyro POS · 2026</p>
          </div>
        </div>
        <div className="mx-5 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
        <nav className="flex-1 overflow-y-auto py-2">
          <NavList visible={visible} />
        </nav>
        <div className="space-y-2 border-t border-white/[0.06] p-4 text-xs text-zinc-500">
          <p className="font-semibold text-zinc-400">{user ? `${user.displayName}` : "Local mode"} <span className="font-normal text-zinc-600">{user ? `· ${user.role}` : "· no login"}</span></p>
          {user && <button onClick={logout} className="btn-ghost w-full rounded-lg px-3 py-1.5 font-semibold text-zinc-300">🚪 Logout</button>}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-night-950/80 px-4 backdrop-blur-xl md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="btn-ghost rounded-lg px-3 py-1.5 text-lg"
          >
            ☰
          </button>
          <p className="ember-text font-display font-semibold tracking-tight">🎆 SHREYAS SFX</p>
          <Link href="/wallet" aria-label="Wallet" className="btn-ghost rounded-lg px-3 py-1.5">
            👛
          </Link>
        </header>

        <SyncStrip />

        {/* Ember hero strip */}
        <div className="pointer-events-none relative overflow-hidden">
          <div className="absolute -top-10 left-1/4 h-24 w-24 rounded-full bg-orange-600/25 blur-2xl" />
          <div className="absolute -top-8 right-1/4 h-20 w-20 rounded-full bg-amber-400/20 blur-2xl" style={{ animation: "spark-float 5s ease-in-out infinite" }} />
        </div>

        <main className="page-in mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 md:px-8 md:pt-6">
          {blocked ? (
            <div className="glass-card mx-auto mt-10 max-w-md rounded-2xl p-8 text-center">
              <h2 className="font-bold text-zinc-100">No pages assigned</h2>
              <p className="mt-2 text-sm text-zinc-400">Your viewer account has no access to this page. Ask the administrator to grant access.</p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col border-r border-white/10 bg-night-900 md:hidden"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div className="flex items-center justify-between px-5 pb-4 pt-6">
                <p className="ember-text text-lg font-extrabold">🎆 SHREYAS SFX</p>
                <button onClick={() => setOpen(false)} aria-label="Close navigation" className="rounded-lg border border-white/15 px-3 py-1">
                  ✕
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto">
                <NavList visible={visible} onNav={() => setOpen(false)} />
              </nav>
              {user && (
                <div className="p-4">
                  <button onClick={logout} className="w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold">🚪 Logout ({user.displayName})</button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
