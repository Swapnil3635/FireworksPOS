import { NextResponse } from "next/server";
import { hashPassword, hasAnyAdmin } from "@/lib/auth";

// Exposed ONLY before any superuser exists: turns a chosen password into the
// exact ADMIN_PASS_HASH env value, so the owner can finish setup without CLI.
export async function POST(req: Request) {
  if (await hasAnyAdmin()) {
    return NextResponse.json({ error: "Setup already complete" }, { status: 403 });
  }
  const { password } = (await req.json()) as { password?: string };
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters" }, { status: 400 });
  }
  const { salt, hash } = hashPassword(password);
  return NextResponse.json({ value: `${salt}:${hash}` });
}
