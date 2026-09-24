import { NextResponse } from "next/server";
import { sheetsConfigured, exportXlsx } from "@/lib/sheets";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  if (!sheetsConfigured()) return NextResponse.json({ error: "Sheets not configured" }, { status: 501 });
  try {
    const buf = await exportXlsx();
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SFX_DB_${stamp}.xlsx"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 });
  }
}
