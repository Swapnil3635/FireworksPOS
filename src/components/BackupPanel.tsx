"use client";

import { useEffect, useState } from "react";
import { usePosStore } from "@/lib/store";
import { useSyncState } from "@/lib/sync";
import { useSession } from "@/lib/session";
import type { SyncPayload } from "@/lib/sheet-map";

function download(name: string, text: string, type = "application/json") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function BackupPanel() {
  const snapshot = usePosStore((s) => s.snapshot);
  const replaceAll = usePosStore((s) => s.replaceAll);
  const settings = usePosStore((s) => s.settings);
  const saveSettings = usePosStore((s) => s.saveSettings);
  const { configured, check, pullNow, pushNow, status, message } = useSyncState();
  const [busy, setBusy] = useState("");

  useEffect(() => { check(); }, [check]);

  const exportJson = () => {
    const data = { format: "ShreyasSFXBackup", version: 1, createdAt: new Date().toISOString(), ...snapshot(), settings };
    download(`ShreyasSFX_Backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  };

  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!data.events || !data.stock) throw new Error("Not a supported SFX backup");
      if (!confirm("Restore this backup? Current local data will be replaced.")) return;
      await replaceAll(data as SyncPayload);
      if (data.settings) await saveSettings(data.settings);
      alert("Restored. Push to Sheets to sync everywhere.");
    } catch {
      alert("Invalid backup file.");
    }
  };

  const setup = async () => {
    setBusy("setup");
    const r = await fetch("/api/sync/setup", { method: "POST" });
    const j = await r.json();
    if (r.ok) {
      await pushNow();
      alert("Sheet tabs created + data pushed.");
    } else alert(j.error || "Setup failed");
    setBusy("");
  };

  const btn = "rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5 disabled:opacity-40";

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-bold">💾 Backup & Sheets sync</h3>
      <p className="mt-1 text-xs text-zinc-400">Status: {message} ({status})</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={exportJson} className={btn}>⬇ JSON backup</button>
        <label className={`${btn} cursor-pointer`}>⬆ Restore JSON
          <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
        <a href="/api/backup/excel" className={btn}>📗 Excel (.xlsx) from Drive</a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
        <button onClick={() => pullNow()} disabled={!configured} className={btn}>⬇ Pull from Sheets</button>
        <button onClick={() => pushNow()} disabled={!configured} className={btn}>⬆ Push to Sheets</button>
        <button onClick={setup} disabled={!configured || busy === "setup"} className="ember-btn rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-40">
          {busy === "setup" ? "Working…" : "⚙ Init sheet tabs + push"}
        </button>
      </div>
      {!configured && (
        <p className="mt-2 text-xs text-zinc-500">Set SFX_SHEET_ID + service-account env to enable cloud sync (see SETUP_SHEETS.md).</p>
      )}
    </div>
  );
}

type UserRow = { id: string; username: string; displayName: string; role: string; permissions: string[]; active: boolean };

export function UsersPanel() {
  const { user } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [sheets, setSheets] = useState(false);
  const [uname, setUname] = useState("");
  const [dname, setDname] = useState("");
  const [pass, setPass] = useState("");
  const [perms, setPerms] = useState<string[]>(["events"]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.role !== "admin") return;
      const r = await fetch("/api/users");
      if (cancelled || !r.ok) return;
      const j = await r.json();
      setUsers(j.users);
      setSheets(j.sheets);
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  const reload = async () => {
    const r = await fetch("/api/users");
    if (!r.ok) return;
    const j = await r.json();
    setUsers(j.users);
    setSheets(j.sheets);
  };

  if (user?.role !== "admin") return null;

  const add = async () => {
    if (!uname || !pass) return;
    const r = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: uname, displayName: dname, password: pass, permissions: perms }),
    });
    if (r.ok) { setUname(""); setDname(""); setPass(""); reload(); } else alert((await r.json()).error);
  };

  const toggle = async (u: UserRow) => {
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    reload();
  };

  const resetPass = async (u: UserRow) => {
    const p = prompt(`New password for ${u.username}`);
    if (!p) return;
    await fetch(`/api/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: p }),
    });
    alert("Password updated.");
  };

  const input = "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-zinc-500";

  return (
    <div className="glass-card mt-3 rounded-2xl p-5">
      <h3 className="font-bold">👥 Viewer accounts</h3>
      {!sheets && <p className="mt-1 text-xs text-zinc-500">Sheets required — viewers are stored in the Users tab.</p>}
      {sheets && (
        <>
          <div className="mt-2 space-y-1.5">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                <span><b>{u.displayName}</b> <span className="text-zinc-500">@{u.username} · {u.role} · {(u.permissions || []).join(",") || "—"}</span>
                  {!u.active && <span className="ml-2 text-xs text-red-300">disabled</span>}</span>
                <span className="flex gap-1.5">
                  <button onClick={() => resetPass(u)} className="rounded-lg border border-white/15 px-2 py-1 text-xs">Reset PW</button>
                  <button onClick={() => toggle(u)} className="rounded-lg border border-white/15 px-2 py-1 text-xs">{u.active ? "Disable" : "Enable"}</button>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <input value={uname} onChange={(e) => setUname(e.target.value)} placeholder="username" className={input} />
            <input value={dname} onChange={(e) => setDname(e.target.value)} placeholder="Display name" className={input} />
            <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="password" className={input} />
            <button onClick={add} className="ember-btn rounded-xl px-3 py-2 text-sm font-bold">+ Add viewer</button>
          </div>
          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            {["events", "calendar", "reservations"].map((p) => (
              <label key={p} className="flex items-center gap-1">
                <input type="checkbox" checked={perms.includes(p)} onChange={() => setPerms(perms.includes(p) ? perms.filter((x) => x !== p) : [...perms, p])} /> {p}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
