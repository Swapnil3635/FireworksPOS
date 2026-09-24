import { NextResponse } from "next/server";
import { sheetsConfigured } from "@/lib/sheets";

export async function GET() {
  return NextResponse.json({
    configured: sheetsConfigured(),
    sheetId: process.env.SFX_SHEET_ID ? "set" : "missing",
    driveFolder: process.env.SFX_DRIVE_FOLDER_ID ? "set" : "missing",
    auth: Boolean(process.env.IRON_SECRET && process.env.ADMIN_USERNAME && process.env.ADMIN_PASS_HASH),
  });
}
