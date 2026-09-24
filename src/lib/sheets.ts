// Server-only Google Sheets + Drive client (service account).
// All no-ops returning { configured: false } when env is missing.

import { google } from "googleapis";
import { SHEET_HEADERS, SHEET_TABS, type SheetTab } from "@/lib/sheets-schema";

const SHEET_ID = process.env.SFX_SHEET_ID ?? "";
const CLIENT_EMAIL = process.env.SFX_GOOGLE_CLIENT_EMAIL ?? "";
const PRIVATE_KEY = (process.env.SFX_GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

export const sheetsConfigured = () => Boolean(SHEET_ID && CLIENT_EMAIL && PRIVATE_KEY);

function auth() {
  return new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });
}

export function sheetsApi() {
  return google.sheets({ version: "v4", auth: auth() });
}

export function driveApi() {
  return google.drive({ version: "v3", auth: auth() });
}

export async function pullAll(): Promise<Record<string, { headers: string[]; rows: string[][] }>> {
  const sheets = sheetsApi();
  const ranges = SHEET_TABS.map((t) => `'${t}'!A1:Z5000`);
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges,
    majorDimension: "ROWS",
  });
  const out: Record<string, { headers: string[]; rows: string[][] }> = {};
  (res.data.valueRanges ?? []).forEach((vr, i) => {
    const tab = SHEET_TABS[i];
    const values = (vr.values ?? []).map((r) => r.map((c) => String(c ?? "")));
    out[tab] = { headers: values[0] ?? [], rows: values.slice(1) };
  });
  return out;
}

export async function pushAll(tables: Record<string, string[][]>) {
  const sheets = sheetsApi();
  // Ensure every tab exists first (ignore "already exists" errors).
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: SHEET_TABS.filter((t) => tables[t] !== undefined).map((t) => ({
          addSheet: { properties: { title: t } },
        })),
      },
    });
  } catch { /* sheets usually already exist */ }

  for (const [tab, rows] of Object.entries(tables)) {
    const headers = SHEET_HEADERS[tab as SheetTab] ?? [];
    await sheets.spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `'${tab}'!A:Z` });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [headers, ...rows] },
    });
  }
  const revision = String(Date.now());
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "'_Meta'!A1",
    valueInputOption: "RAW",
    requestBody: { values: [["key", "value", "updatedAt"], ["revision", revision, new Date().toISOString()]] },
  });
  return revision;
}

export async function exportXlsx(): Promise<Buffer> {
  const drive = driveApi();
  const res = await drive.files.export(
    { fileId: SHEET_ID, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer);
}
