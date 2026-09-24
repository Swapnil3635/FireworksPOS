// One Google Sheet (in your GDrive) with these tabs = the whole DB.
// P2 will implement /api/sheets/[tab] against this schema.

export const SHEET_TABS = [
  "Events",
  "Inventory",
  "Stock",
  "Rates",
  "BillPayments",
  "BillAdjustments",
  "Ledger",
  "Expenses",
  "Vendors",
  "VendorItems",
  "WalletAccounts",
  "Users",
  "_Meta",
] as const;

export type SheetTab = (typeof SHEET_TABS)[number];

export const SHEET_HEADERS: Record<SheetTab, string[]> = {
  Events: ["recordId", "client", "eventType", "venue", "dates", "subEvents", "selected", "grandTotal", "updatedAt"],
  Inventory: ["equip", "consumable", "qtyPerUnit", "consumable2", "qtyPerUnit2", "consumable3", "qtyPerUnit3", "updatedAt"],
  Stock: ["equip", "stock", "updatedAt"],
  Rates: ["equip", "rate", "updatedAt"],
  BillPayments: ["id", "billKey", "billNo", "clientName", "amount", "date", "mode", "receivedAccount", "updatedAt"],
  BillAdjustments: ["id", "billKey", "type", "amount", "reason", "date", "updatedAt"],
  Ledger: ["id", "date", "clientName", "billNo", "direction", "amount", "account", "sourceType", "sourceId", "remarks", "status", "updatedAt"],
  Expenses: ["id", "expenseType", "eventId", "vendor", "category", "items", "expenseDate", "paymentMethod", "paidAccount", "grandTotal", "status", "updatedAt"],
  Vendors: ["id", "name", "mobile", "updatedAt"],
  VendorItems: ["id", "name", "defaultRate", "unit", "updatedAt"],
  WalletAccounts: ["name", "updatedAt"],
  Users: ["id", "username", "displayName", "salt", "hash", "role", "permissions", "active", "updatedAt"],
  _Meta: ["key", "value", "updatedAt"],
};

export const SHEET_ENV = {
  sheetId: "SFX_SHEET_ID",
  clientEmail: "SFX_GOOGLE_CLIENT_EMAIL",
  privateKey: "SFX_GOOGLE_PRIVATE_KEY",
  driveFolder: "SFX_DRIVE_FOLDER_ID",
} as const;
