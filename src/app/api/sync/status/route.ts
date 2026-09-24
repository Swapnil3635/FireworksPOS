import { NextResponse } from "next/server";
import { sheetsConfigured } from "@/lib/sheets";
import { hasAnyAdmin } from "@/lib/auth";

export async function GET() {
  const ironSet = Boolean(process.env.IRON_SECRET);
  let hasAdmin = false;
  try {
    hasAdmin = await hasAnyAdmin();
  } catch {
    hasAdmin = false;
  }
  return NextResponse.json({
    configured: sheetsConfigured(),
    sheetId: process.env.SFX_SHEET_ID ? "set" : "missing",
    driveFolder: process.env.SFX_DRIVE_FOLDER_ID ? "set" : "missing",
    ironSet,
    hasAdmin,
    // Login is mandatory unless the server can't run sessions at all.
    auth: ironSet && hasAdmin,
    needsSetup: !hasAdmin,
  });
}
