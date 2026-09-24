import { NextResponse } from "next/server";
import { getSession, hashPassword, hasAnyAdmin, type SessionUser } from "@/lib/auth";
import { sheetsConfigured, pushAll, pullAll } from "@/lib/sheets";
import { toRows, fromRows } from "@/lib/sheet-map";
import { uid } from "@/lib/types";

// First-superuser bootstrap, usable ONLY when no admin exists anywhere and
// the Users tab is reachable. Creates the MASTER admin and signs them in.
export async function POST(req: Request) {
  if (!process.env.IRON_SECRET) {
    return NextResponse.json({ error: "Set IRON_SECRET first, then retry" }, { status: 501 });
  }
  if (await hasAnyAdmin()) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
  }
  if (!sheetsConfigured()) {
    return NextResponse.json({ error: "Sheets not configured — use env master instead" }, { status: 501 });
  }
  const { username, displayName, password } = (await req.json()) as {
    username?: string; displayName?: string; password?: string;
  };
  if (!username || !password || password.length < 8) {
    return NextResponse.json({ error: "Username + 8-char password required" }, { status: 400 });
  }
  try {
    const tables = await pullAll();
    const current = fromRows(tables);
    const existing = current.users ?? [];
    if (existing.some((u) => u.role === "admin" && u.active !== false)) {
      return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
    }
    const { salt, hash } = hashPassword(password);
    const admin = {
      id: uid("user"),
      username: username.trim().toLowerCase(),
      displayName: displayName?.trim() || username.trim(),
      salt, hash, role: "admin" as const,
      permissions: [] as string[], active: true,
      updatedAt: new Date().toISOString(),
    };
    await pushAll(toRows({ ...current, users: [...existing, admin] }));
    const session = await getSession();
    const user: SessionUser = {
      username: admin.username, displayName: admin.displayName,
      role: "admin", permissions: [],
    };
    session.user = user;
    await session.save();
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bootstrap failed" }, { status: 500 });
  }
}
