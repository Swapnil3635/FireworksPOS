// Usage:
// 1. Open Masterrrrrrrrr.html in browser → DevTools → Application → Local Storage → copy all sfx* keys into legacy-dump.json
// 2. node scripts/import-legacy-json.mjs ./legacy-dump.json ./seed/sfx-seed.json
// P1 will load seed/sfx-seed.json into IndexedDB + Sheets tabs.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [, , srcArg, outArg] = process.argv;
if (!srcArg || !outArg) {
  console.error("Usage: node scripts/import-legacy-json.mjs <legacy-dump.json> <out-seed.json>");
  process.exit(1);
}
const src = resolve(srcArg);
const out = resolve(outArg);
const raw = JSON.parse(readFileSync(src, "utf8"));
const pick = (k, fb) => (raw[k] !== undefined ? raw[k] : fb);
const seed = {
  exportedAt: new Date().toISOString(),
  source: "Masterrrrrrrrr.html localStorage",
  records: pick("sfxRecords", []),
  inventoryData: pick("sfxInventoryData", []),
  masterInventory: pick("sfxMasterInventory", {}),
  inventoryRates: pick("sfxInventoryRates", {}),
  billingData: pick("sfxBillingData", {}),
  billPayments: pick("sfxBillPayments", {}),
  billAdjustments: pick("sfxBillAdjustments", {}),
  ledgerEntries: pick("sfxLedgerEntries", []),
  ledgerDeleted: pick("sfxLedgerDeletedEntries", pick("sfx_planner_ledger_deleted_entries", [])),
  expenses: pick("sfxExpensesRecords", []),
  vendors: pick("sfxVendorMasterVendors", []),
  vendorItems: pick("sfxVendorMasterItems", []),
  walletAccounts: pick("sfxWalletAccounts", ["Cash", "Axis Bank", "SBI", "Janata"]),
};
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(seed, null, 2));
console.log(`Seed written: ${out}`);
console.log(`Events=${seed.records.length} Ledger=${seed.ledgerEntries.length} Expenses=${seed.expenses.length}`);
