import { NextResponse } from "next/server";
import { sheetsConfigured, pushAll } from "@/lib/sheets";
import { toRows, type SyncPayload } from "@/lib/sheet-map";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets not configured" }, { status: 501 });
  try {
    const payload = (await req.json()) as SyncPayload;
    const revision = await pushAll(toRows(payload));
    return NextResponse.json({ ok: true, revision });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Push failed" }, { status: 500 });
  }
}
