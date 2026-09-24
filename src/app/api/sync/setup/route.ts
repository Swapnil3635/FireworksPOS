import { NextResponse } from "next/server";
import { sheetsConfigured, pushAll } from "@/lib/sheets";
import { SHEET_TABS } from "@/lib/sheets-schema";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets not configured" }, { status: 501 });
  try {
    // Create tabs with headers only; pushAll writes headers + zero rows.
    const empty: Record<string, string[][]> = Object.fromEntries(SHEET_TABS.map((t) => [t, []]));
    // Seed _Meta with created marker (pushAll always rewrites revision).
    const revision = await pushAll(empty);
    return NextResponse.json({ ok: true, revision });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Setup failed" }, { status: 500 });
  }
}
