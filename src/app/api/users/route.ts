import { NextResponse } from "next/server";
import { requireUser, loadUsers, hashPassword } from "@/lib/auth";
import { sheetsConfigured, pushAll } from "@/lib/sheets";
import { toRows, fromRows, type SheetUser } from "@/lib/sheet-map";
import { pullAll } from "@/lib/sheets";
import { uid } from "@/lib/types";

const safe = (u: SheetUser) => ({
  id: u.id, username: u.username, displayName: u.displayName,
  role: u.role, permissions: u.permissions, active: u.active,
});

export async function GET() {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const users = await loadUsers();
  return NextResponse.json({ users: users.map(safe), sheets: sheetsConfigured() });
}

export async function POST(req: Request) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets required to manage viewers" }, { status: 501 });
  const { username, displayName, password, permissions } = (await req.json()) as {
    username?: string; displayName?: string; password?: string; permissions?: string[];
  };
  if (!username || !password) return NextResponse.json({ error: "Username + password required" }, { status: 400 });
  const tables = await pullAll();
  const current = fromRows(tables);
  const { salt, hash } = hashPassword(password);
  const users: SheetUser[] = [
    ...(current.users ?? []),
    {
      id: uid("user"), username: username.trim().toLowerCase(),
      displayName: displayName?.trim() || username.trim(),
      salt, hash, role: "viewer",
      permissions: (permissions ?? []).filter((p) => ["events", "calendar", "reservations"].includes(p)),
      active: true, updatedAt: new Date().toISOString(),
    },
  ];
  await pushAll(toRows({ ...current, users }));
  return NextResponse.json({ ok: true });
}
