// Pure mappers between local POS shapes and Sheets rows.
// Shared by client (apply pull) and server routes (build push). No store imports.

import type { SfxEvent, InventoryRow, Payment, Adjustment, Expense } from "@/lib/types";

export type SheetUser = {
  id: string; username: string; displayName: string;
  salt: string; hash: string; role: "admin" | "viewer";
  permissions: string[]; active: boolean; updatedAt: string;
};

export type SyncPayload = {
  events: SfxEvent[];
  inventory: InventoryRow[];
  stock: Record<string, number>;
  rates: Record<string, number>;
  payments: Record<string, Payment[]>;
  adjustments: Record<string, Adjustment[]>;
  expenses: Expense[];
  vendors: { id: string; name: string; mobile?: string }[];
  vendorItems: { id: string; name: string; defaultRate?: number; unit?: string }[];
  wallets: string[];
  users?: SheetUser[];
  revision?: string;
};

const J = {
  str: (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v ?? null)),
  obj: <T>(v: string | undefined, fb: T): T => {
    if (!v) return fb;
    try { const p = JSON.parse(v); return p as T; } catch { return fb; }
  },
};

const num = (v: unknown, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

const now = () => new Date().toISOString();

// ---- to rows (client -> sheets) ----

export function toRows(p: SyncPayload): Record<string, string[][]> {
  const t = now();
  return {
    Events: p.events.map((e) => [e.recordId, e.client, e.eventType, e.venue, J.str(e.dates), J.str(e.subEvents), J.str(e.selected), String(e.grandTotal), t]),
    Inventory: p.inventory.map((r) => [r.equip, r.consumable ?? "", String(r.qtyPerUnit ?? ""), r.consumable2 ?? "", String(r.qtyPerUnit2 ?? ""), r.consumable3 ?? "", String(r.qtyPerUnit3 ?? ""), t]),
    Stock: Object.entries(p.stock).map(([equip, stock]) => [equip, String(stock), t]),
    Rates: Object.entries(p.rates).map(([equip, rate]) => [equip, String(rate), t]),
    BillPayments: Object.entries(p.payments).flatMap(([billKey, list]) =>
      list.map((x) => [x.id, billKey, x.billNo ?? "", x.clientName ?? "", String(x.amount), x.date, x.mode, x.receivedAccount, t])),
    BillAdjustments: Object.entries(p.adjustments).flatMap(([billKey, list]) =>
      list.map((x) => [x.id, billKey, x.type, String(x.amount), x.reason, x.date, t])),
    Expenses: p.expenses.map((e) => [e.id, e.expenseType, e.eventId ?? "", e.vendor ?? "", e.category ?? "", J.str(e.items), e.expenseDate, e.paymentMethod ?? "", e.paidAccount ?? "", String(e.grandTotal), e.status ?? "", t]),
    Vendors: p.vendors.map((v) => [v.id, v.name, v.mobile ?? "", t]),
    VendorItems: p.vendorItems.map((v) => [v.id, v.name, String(v.defaultRate ?? ""), v.unit ?? "", t]),
    WalletAccounts: p.wallets.map((w) => [w, t]),
    ...(p.users ? { Users: p.users.map((u) => [u.id, u.username, u.displayName, u.salt, u.hash, u.role, J.str(u.permissions), u.active ? "TRUE" : "FALSE", t]) } : {}),
  };
}

// ---- from rows (sheets -> client) ----

type Row = string[];

function keyed(rows: Row[], headers: string[]): Record<string, string>[] {
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

export function fromRows(tables: Record<string, { headers: string[]; rows: Row[] }>): SyncPayload {
  const g = (tab: string) => tables[tab] ?? { headers: [], rows: [] };
  const K = (tab: string, headers: string[]) => keyed(g(tab).rows, g(tab).headers.length ? g(tab).headers : headers);

  const events: SfxEvent[] = K("Events", []).map((r) => ({
    recordId: r.recordId, client: r.client, eventType: r.eventType, venue: r.venue,
    dates: J.obj<string[]>(r.dates, []), subEvents: J.obj(r.subEvents, []),
    selected: J.obj(r.selected, []), grandTotal: num(r.grandTotal), createdAt: r.updatedAt || now(),
  }));
  const inventory: InventoryRow[] = K("Inventory", []).map((r) => ({
    equip: r.equip, consumable: r.consumable || undefined,
    qtyPerUnit: r.qtyPerUnit ? num(r.qtyPerUnit) : undefined,
    consumable2: r.consumable2 || undefined,
    qtyPerUnit2: r.qtyPerUnit2 ? num(r.qtyPerUnit2) : undefined,
    consumable3: r.consumable3 || undefined,
    qtyPerUnit3: r.qtyPerUnit3 ? num(r.qtyPerUnit3) : undefined,
  }));
  const stock: Record<string, number> = {};
  for (const r of K("Stock", [])) if (r.equip) stock[r.equip] = num(r.stock);
  const rates: Record<string, number> = {};
  for (const r of K("Rates", [])) if (r.equip) rates[r.equip] = num(r.rate);

  const payments: Record<string, Payment[]> = {};
  for (const r of K("BillPayments", [])) {
    if (!r.id) continue;
    (payments[r.billKey] ??= []).push({
      id: r.id, billNo: r.billNo || undefined, clientName: r.clientName || undefined,
      amount: num(r.amount), date: r.date, mode: r.mode, receivedAccount: r.receivedAccount,
    });
  }
  const adjustments: Record<string, Adjustment[]> = {};
  for (const r of K("BillAdjustments", [])) {
    if (!r.id) continue;
    (adjustments[r.billKey] ??= []).push({
      id: r.id, type: (r.type as Adjustment["type"]) || "Other",
      amount: num(r.amount), reason: r.reason, date: r.date,
    });
  }
  const expenses: Expense[] = K("Expenses", []).map((r) => ({
    id: r.id, expenseType: r.expenseType, eventId: r.eventId || undefined,
    vendor: r.vendor || undefined, category: r.category || undefined,
    items: J.obj(r.items, []), expenseDate: r.expenseDate,
    paymentMethod: r.paymentMethod || undefined, paidAccount: r.paidAccount || undefined,
    grandTotal: num(r.grandTotal), status: r.status || undefined,
  }));
  const vendors = K("Vendors", []).filter((r) => r.id).map((r) => ({ id: r.id, name: r.name, mobile: r.mobile || undefined }));
  const vendorItems = K("VendorItems", []).filter((r) => r.id).map((r) => ({
    id: r.id, name: r.name,
    defaultRate: r.defaultRate ? num(r.defaultRate) : undefined, unit: r.unit || undefined,
  }));
  const wallets = K("WalletAccounts", []).map((r) => r.name).filter(Boolean);
  const users: SheetUser[] = K("Users", []).filter((r) => r.id).map((r) => ({
    id: r.id, username: r.username, displayName: r.displayName, salt: r.salt, hash: r.hash,
    role: r.role === "admin" ? "admin" : "viewer",
    permissions: J.obj<string[]>(r.permissions, []),
    active: r.active !== "FALSE", updatedAt: r.updatedAt || now(),
  }));

  return { events, inventory, stock, rates, payments, adjustments, expenses, vendors, vendorItems, wallets, users };
}
