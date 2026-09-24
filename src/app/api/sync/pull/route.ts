import { NextResponse } from "next/server";
import { sheetsConfigured, pullAll } from "@/lib/sheets";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets not configured" }, { status: 501 });
  try {
    const tables = await pullAll();
    return NextResponse.json({ tables });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Pull failed" }, { status: 500 });
  }
}
