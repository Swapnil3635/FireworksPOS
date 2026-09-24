import { NextResponse } from "next/server";
import { requireUser, hashPassword } from "@/lib/auth";
import { sheetsConfigured, pushAll, pullAll } from "@/lib/sheets";
import { toRows, fromRows } from "@/lib/sheet-map";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets required" }, { status: 501 });
  const { id } = await params;
  const patch = (await req.json()) as {
    displayName?: string; password?: string; permissions?: string[]; active?: boolean;
  };
  const tables = await pullAll();
  const current = fromRows(tables);
  const users = (current.users ?? []).map((u) => {
    if (u.id !== id) return u;
    const next = { ...u, updatedAt: new Date().toISOString() };
    if (patch.displayName) next.displayName = patch.displayName;
    if (patch.password) {
      const { salt, hash } = hashPassword(patch.password);
      next.salt = salt; next.hash = hash;
    }
    if (patch.permissions) next.permissions = patch.permissions.filter((p) => ["events", "calendar", "reservations"].includes(p));
    if (typeof patch.active === "boolean") next.active = patch.active;
    return next;
  });
  await pushAll(toRows({ ...current, users }));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets required" }, { status: 501 });
  const { id } = await params;
  const tables = await pullAll();
  const current = fromRows(tables);
  const users = current.users ?? [];
  const target = users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === "admin-env") {
    return NextResponse.json({ error: "Env master can't be deleted here — remove ADMIN_USERNAME instead" }, { status: 400 });
  }
  const remainingAdmins = users.filter((u) => u.id !== id && u.role === "admin" && u.active !== false);
  if (target.role === "admin" && remainingAdmins.length === 0) {
    return NextResponse.json({ error: "Can't delete the last superuser" }, { status: 400 });
  }
  await pushAll(toRows({ ...current, users: users.filter((u) => u.id !== id) }));
  return NextResponse.json({ ok: true });
}
