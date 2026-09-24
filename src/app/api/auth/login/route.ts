import { NextResponse } from "next/server";
import { getSession, loadUsers, verifyPassword, type SessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, password } = (await req.json()) as { username?: string; password?: string };
  if (!username || !password) return NextResponse.json({ error: "Username + password required" }, { status: 400 });
  const users = await loadUsers();
  const u = users.find((x) => x.username === username.trim().toLowerCase());
  if (!u || u.active === false || !verifyPassword(password, u.salt, u.hash)) {
    return NextResponse.json({ error: "Invalid login" }, { status: 401 });
  }
  const session = await getSession();
  const user: SessionUser = {
    username: u.username, displayName: u.displayName, role: u.role, permissions: u.permissions,
  };
  session.user = user;
  await session.save();
  return NextResponse.json({ user });
}
