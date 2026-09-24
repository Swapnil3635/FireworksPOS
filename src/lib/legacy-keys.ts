// Maps every localStorage key in Masterrrrrrrrr.html to a Sheets tab.
// Single source of truth for P2 Sheets-as-DB sync.

export const LEGACY_KEYS = {
  records: "sfxRecords",
  inventoryData: "sfxInventoryData",
  masterInventory: "sfxMasterInventory",
  inventoryRates: "sfxInventoryRates",
  billingData: "sfxBillingData",
  billPayments: "sfxBillPayments",
  billAdjustments: "sfxBillAdjustments",
  ledgerEntries: "sfxLedgerEntries",
  ledgerDeleted: "sfxLedgerDeletedEntries",
  ledgerDeletedAlt: "sfx_planner_ledger_deleted_entries",
  expenses: "sfxExpensesRecords",
  vendors: "sfxVendorMasterVendors",
  vendorItems: "sfxVendorMasterItems",
  walletAccounts: "sfxWalletAccounts",
  eventDraft: "sfxEventDraft",
  adminUser: "sfxAdminUser",
  adminPass: "sfxAdminPass",
} as const;

export type LegacyKey = (typeof LEGACY_KEYS)[keyof typeof LEGACY_KEYS];
