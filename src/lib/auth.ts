// Server-only session + user auth (simple username/password).
// Users live in the Sheets Users tab when configured, else env-seeded admin.

import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { sheetsConfigured, sheetsApi } from "@/lib/sheets";
import type { SheetUser } from "@/lib/sheet-map";

export type SessionUser = {
  username: string;
  displayName: string;
  role: "admin" | "viewer";
  permissions: string[];
};

type SessionData = {
  user?: SessionUser;
};

const IRON_SECRET = process.env.IRON_SECRET ?? "";

export const sessionOptions = {
  password: IRON_SECRET || "dev-only-placeholder-please-set-IRON_SECRET-32chars",
  cookieName: "sfx_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireUser(): Promise<SessionUser | null> {
  if (!IRON_SECRET) return null;
  const s = await getSession();
  return s.user ?? null;
}

export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return { salt: s, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  try {
    const h = scryptSync(password, salt, 64);
    const e = Buffer.from(hash, "hex");
    return h.length === e.length && timingSafeEqual(h, e);
  } catch {
    return false;
  }
}

function envAdmin(): SheetUser | null {
  const u = process.env.ADMIN_USERNAME ?? "";
  const combined = process.env.ADMIN_PASS_HASH ?? "";
  if (!u || !combined.includes(":")) return null;
  const [salt, hash] = combined.split(":");
  return {
    id: "admin-env", username: u.toLowerCase(), displayName: "Administrator",
    salt, hash, role: "admin", permissions: [], active: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function loadUsers(): Promise<SheetUser[]> {
  const list: SheetUser[] = [];
  const admin = envAdmin();
  if (admin) list.push(admin);
  if (!sheetsConfigured()) return list;
  try {
    const sheets = sheetsApi();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SFX_SHEET_ID ?? "",
      range: "'Users'!A1:Z5000",
    });
    const values = (res.data.values ?? []).map((r) => r.map((c) => String(c ?? "")));
    const headers = values[0] ?? [];
    for (const row of values.slice(1)) {
      const r = Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""]));
      if (!r.id || !r.username) continue;
      let permissions: string[] = [];
      try { permissions = JSON.parse(r.permissions || "[]"); } catch { permissions = []; }
      list.push({
        id: r.id, username: r.username.toLowerCase(), displayName: r.displayName || r.username,
        salt: r.salt, hash: r.hash, role: r.role === "admin" ? "admin" : "viewer",
        permissions, active: r.active !== "FALSE", updatedAt: r.updatedAt || "",
      });
    }
  } catch {
    /* sheets unreachable — fall back to env admin */
  }
  return list;
}
