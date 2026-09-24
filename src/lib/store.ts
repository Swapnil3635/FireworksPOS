import { create } from "zustand";
import { get, set } from "idb-keyval";
import type {
  SfxEvent, InventoryRow, Payment, Adjustment, LedgerEntry, Expense,
} from "@/lib/types";
import { uid, eventTotal } from "@/lib/types";
import type { SyncPayload } from "@/lib/sheet-map";
import { billKey, gstBreakup, type GstMode } from "@/lib/money";
import seed from "../../seed/sfx-seed.json";

const K = {
  events: "sfxRecords",
  inventory: "sfxInventoryData",
  stock: "sfxMasterInventory",
  rates: "sfxInventoryRates",
  payments: "sfxBillPayments",
  adjustments: "sfxBillAdjustments",
  ledger: "sfxLedgerEntries",
  deleted: "sfxLedgerDeletedEntries",
  expenses: "sfxExpensesRecords",
  vendors: "sfxVendorMasterVendors",
  vendorItems: "sfxVendorMasterItems",
  wallets: "sfxWalletAccounts",
  settings: "sfxPosSettings",
} as const;

export type Settings = {
  businessName: string;
  gstin: string;
  address: string;
  phone: string;
  billPrefix: string;
  gstRate: number;
  gstMode: GstMode;
  upiId: string;
};

const defaultSettings: Settings = {
  businessName: "Shreyas SFX",
  gstin: "",
  address: "",
  phone: "",
  billPrefix: "SFX-",
  gstRate: 18,
  gstMode: "CGST_SGST",
  upiId: "",
};

export type BillFin = {
  taxable: number;
  adjTotal: number;
  gst: ReturnType<typeof gstBreakup>;
  paid: number;
  pending: number;
  status: "Unpaid" | "Pending" | "Paid";
};

async function persist(patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    try { await set(k, v); } catch { /* idb unavailable */ }
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ }
  }
}

async function load<T>(key: string, fb: T): Promise<T> {
  try {
    const v = await get(key);
    if (v !== undefined && v !== null) return v as T;
  } catch { /* noop */ }
  try {
    const ls = typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    if (ls) return JSON.parse(ls) as T;
  } catch { /* noop */ }
  return fb;
}

export const eventBillKey = (ev: SfxEvent) => billKey(ev.client, ev.venue, ev.dates);
export const eventBillNo = (ev: SfxEvent, settings: Settings, idx: number) =>
  `${settings.billPrefix}${String(idx + 1).padStart(3, "0")}`;

function computeFin(
  ev: SfxEvent, payments: Payment[], adjustments: Adjustment[], settings: Settings
): BillFin {
  const adjTotal = adjustments.reduce((s, a) => s + a.amount, 0);
  const taxable = Math.round((ev.grandTotal + adjTotal) * 100) / 100;
  const gst = gstBreakup(taxable, settings.gstRate, settings.gstMode, true);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const pending = Math.max(0, Math.round((gst.roundedTotal - paid) * 100) / 100);
  const status = paid <= 0 ? "Unpaid" : pending <= 0.5 ? "Paid" : "Pending";
  return { taxable, adjTotal, gst, paid, pending, status };
}

type PosState = {
  ready: boolean;
  events: SfxEvent[];
  inventory: InventoryRow[];
  stock: Record<string, number>;
  rates: Record<string, number>;
  payments: Record<string, Payment[]>;
  adjustments: Record<string, Adjustment[]>;
  ledger: LedgerEntry[];
  deletedIds: string[];
  expenses: Expense[];
  vendors: { id: string; name: string; mobile?: string }[];
  vendorItems: { id: string; name: string; defaultRate?: number; unit?: string }[];
  wallets: string[];
  settings: Settings;
  hydrate: () => Promise<void>;
  rebuildLedger: () => void;
  saveEvent: (e: Omit<SfxEvent, "recordId" | "createdAt" | "grandTotal"> & { recordId?: string }) => Promise<string>;
  deleteEvent: (id: string) => Promise<void>;
  upsertInventory: (row: InventoryRow, stockQty: number) => Promise<void>;
  deleteInventory: (equip: string) => Promise<void>;
  setRate: (equip: string, rate: number) => Promise<void>;
  addPayment: (ev: SfxEvent, p: Omit<Payment, "id">) => Promise<void>;
  deletePayment: (ev: SfxEvent, pid: string) => Promise<void>;
  addAdjustment: (ev: SfxEvent, a: Omit<Adjustment, "id">) => Promise<void>;
  deleteAdjustment: (ev: SfxEvent, aid: string) => Promise<void>;
  deleteLedgerEntry: (id: string) => Promise<void>;
  restoreLedgerEntry: (id: string) => Promise<void>;
  saveExpense: (e: Omit<Expense, "id"> & { id?: string }) => Promise<string>;
  deleteExpense: (id: string) => Promise<void>;
  saveVendor: (v: { id?: string; name: string; mobile?: string }) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  saveVendorItem: (v: { id?: string; name: string; defaultRate?: number; unit?: string }) => Promise<void>;
  deleteVendorItem: (id: string) => Promise<void>;
  saveSettings: (s: Partial<Settings>) => Promise<void>;
  replaceAll: (p: SyncPayload) => Promise<void>;
  snapshot: () => SyncPayload;
  fin: (ev: SfxEvent) => BillFin;
  balances: () => Record<string, number>;
};

export const usePosStore = create<PosState>((setFn, getFn) => {
  // Ledger is always derived — same rule as legacy rebuildLedgerFromAllSources.
  const rebuildLedger = () => {
    const st = getFn();
    const entries: LedgerEntry[] = [];
    st.events.forEach((ev, idx) => {
      const key = eventBillKey(ev);
      const billNo = eventBillNo(ev, st.settings, idx);
      for (const p of st.payments[key] ?? []) {
        entries.push({
          id: `led_${p.id}`, date: p.date, clientName: ev.client, billNo,
          direction: "in", amount: p.amount, account: p.receivedAccount || "Cash",
          sourceType: "payment", sourceId: p.id,
          remarks: `${p.mode || "Payment"} · ${ev.venue}`,
        });
      }
      for (const a of st.adjustments[key] ?? []) {
        if (a.type === "Discount") continue; // discount reduces bill, not a cash move
        entries.push({
          id: `led_${a.id}`, date: a.date, clientName: ev.client, billNo,
          direction: "in", amount: Math.abs(a.amount), account: "Receivable",
          sourceType: "adjustment", sourceId: a.id,
          remarks: `${a.type}: ${a.reason}`,
        });
      }
    });
    for (const ex of st.expenses) {
      entries.push({
        id: `led_${ex.id}`, date: ex.expenseDate, clientName: ex.vendor || ex.category || "Expense",
        billNo: "", direction: "out", amount: ex.grandTotal, account: ex.paidAccount || "Cash",
        sourceType: "expense", sourceId: ex.id,
        remarks: `${ex.expenseType} · ${(ex.items || []).map((i) => i.name).join(", ")}`,
      });
    }
    const blocked = new Set(st.deletedIds);
    const ledger = entries
      .filter((e) => !blocked.has(e.id))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    setFn({ ledger });
    persist({ [K.ledger]: ledger }).catch(() => {});
  };

  return {
    ready: false,
    events: [],
    inventory: [],
    stock: {},
    rates: {},
    payments: {},
    adjustments: {},
    ledger: [],
    deletedIds: [],
    expenses: [],
    vendors: [],
    vendorItems: [],
    wallets: ["Cash", "Axis Bank", "SBI", "Janata"],
    settings: defaultSettings,

    hydrate: async () => {
      const s = seed as unknown as {
        records: SfxEvent[]; inventoryData: InventoryRow[];
        masterInventory: Record<string, number>; inventoryRates: Record<string, number>;
        billPayments: Record<string, Payment[]>; billAdjustments: Record<string, Adjustment[]>;
        expenses: Expense[]; vendors: PosState["vendors"]; vendorItems: PosState["vendorItems"];
        walletAccounts: string[];
      };
      const seededFlag = await load<string | null>(K.settings + ":seeded", null);
      const fb = (v: unknown, sv: unknown) => (seededFlag ? v as never : (sv ?? v) as never);
      const events = await load<SfxEvent[]>(K.events, fb([], s.records));
      const inventory = await load<InventoryRow[]>(K.inventory, fb([], s.inventoryData));
      const stock = await load<Record<string, number>>(K.stock, fb({}, s.masterInventory));
      const rates = await load<Record<string, number>>(K.rates, fb({}, s.inventoryRates));
      const payments = await load<Record<string, Payment[]>>(K.payments, fb({}, s.billPayments));
      const adjustments = await load<Record<string, Adjustment[]>>(K.adjustments, fb({}, s.billAdjustments));
      const expenses = await load<Expense[]>(K.expenses, fb([], s.expenses));
      const vendors = await load<PosState["vendors"]>(K.vendors, fb([], s.vendors));
      const vendorItems = await load<PosState["vendorItems"]>(K.vendorItems, fb([], s.vendorItems));
      const wallets = await load<string[]>(K.wallets, fb(["Cash"], s.walletAccounts));
      const settings = await load<Settings>(K.settings, defaultSettings);
      const deletedIds = await load<string[]>(K.deleted, []);
      if (!seededFlag && events.length > 0) {
        await persist({
          [K.events]: events, [K.inventory]: inventory, [K.stock]: stock,
          [K.rates]: rates, [K.payments]: payments, [K.adjustments]: adjustments,
          [K.expenses]: expenses, [K.vendors]: vendors, [K.vendorItems]: vendorItems,
          [K.wallets]: wallets, [K.settings]: settings,
          [K.settings + ":seeded"]: "1",
        });
      }
      setFn({ events, inventory, stock, rates, payments, adjustments, expenses, vendors, vendorItems, wallets, settings, deletedIds, ready: true });
      getFn().rebuildLedger();
    },

    rebuildLedger,

    saveEvent: async (e) => {
      const st = getFn();
      const recordId = e.recordId ?? uid("rec");
      const selected = e.selected.map((r) => ({ ...r, rate: r.rate || st.rates[r.equip] || 0 }));
      const full: SfxEvent = {
        recordId, client: e.client.trim(), eventType: e.eventType, venue: e.venue.trim(),
        dates: [...e.dates].sort(), subEvents: e.subEvents, selected,
        grandTotal: eventTotal(selected), createdAt: new Date().toISOString(),
      };
      const exists = st.events.some((x) => x.recordId === recordId);
      const events = exists ? st.events.map((x) => (x.recordId === recordId ? full : x)) : [full, ...st.events];
      setFn({ events });
      await persist({ [K.events]: events });
      return recordId;
    },

    deleteEvent: async (id) => {
      const events = getFn().events.filter((x) => x.recordId !== id);
      setFn({ events });
      await persist({ [K.events]: events });
    },

    upsertInventory: async (row, stockQty) => {
      const st = getFn();
      const equip = row.equip.trim();
      if (!equip) return;
      const exists = st.inventory.some((r) => r.equip.toLowerCase() === equip.toLowerCase());
      const inventory = exists
        ? st.inventory.map((r) => (r.equip.toLowerCase() === equip.toLowerCase() ? { ...row, equip } : r))
        : [...st.inventory, { ...row, equip }];
      const stock = { ...st.stock, [equip]: Math.max(0, stockQty) };
      setFn({ inventory, stock });
      await persist({ [K.inventory]: inventory, [K.stock]: stock });
    },

    deleteInventory: async (equip) => {
      const st = getFn();
      const inventory = st.inventory.filter((r) => r.equip !== equip);
      const stock = { ...st.stock };
      delete stock[equip];
      setFn({ inventory, stock });
      await persist({ [K.inventory]: inventory, [K.stock]: stock });
    },

    setRate: async (equip, rate) => {
      const rates = { ...getFn().rates, [equip]: Math.max(0, rate) };
      setFn({ rates });
      await persist({ [K.rates]: rates });
    },

    addPayment: async (ev, p) => {
      const key = eventBillKey(ev);
      const list = [...(getFn().payments[key] ?? []), { ...p, id: uid("pay") }];
      const payments = { ...getFn().payments, [key]: list };
      setFn({ payments });
      await persist({ [K.payments]: payments });
      getFn().rebuildLedger();
    },

    deletePayment: async (ev, pid) => {
      const key = eventBillKey(ev);
      const payments = { ...getFn().payments, [key]: (getFn().payments[key] ?? []).filter((p) => p.id !== pid) };
      setFn({ payments });
      await persist({ [K.payments]: payments });
      getFn().rebuildLedger();
    },

    addAdjustment: async (ev, a) => {
      const key = eventBillKey(ev);
      const list = [...(getFn().adjustments[key] ?? []), { ...a, id: uid("adj") }];
      const adjustments = { ...getFn().adjustments, [key]: list };
      setFn({ adjustments });
      await persist({ [K.adjustments]: adjustments });
      getFn().rebuildLedger();
    },

    deleteAdjustment: async (ev, aid) => {
      const key = eventBillKey(ev);
      const adjustments = { ...getFn().adjustments, [key]: (getFn().adjustments[key] ?? []).filter((a) => a.id !== aid) };
      setFn({ adjustments });
      await persist({ [K.adjustments]: adjustments });
      getFn().rebuildLedger();
    },

    deleteLedgerEntry: async (id) => {
      const deletedIds = [...getFn().deletedIds, id];
      setFn({ deletedIds });
      await persist({ [K.deleted]: deletedIds });
      getFn().rebuildLedger();
    },

    restoreLedgerEntry: async (id) => {
      const deletedIds = getFn().deletedIds.filter((x) => x !== id);
      setFn({ deletedIds });
      await persist({ [K.deleted]: deletedIds });
      getFn().rebuildLedger();
    },

    saveExpense: async (e) => {
      const st = getFn();
      const id = e.id ?? uid("exp");
      const full: Expense = { ...e, id };
      const exists = st.expenses.some((x) => x.id === id);
      const expenses = exists ? st.expenses.map((x) => (x.id === id ? full : x)) : [full, ...st.expenses];
      setFn({ expenses });
      await persist({ [K.expenses]: expenses });
      getFn().rebuildLedger();
      return id;
    },

    deleteExpense: async (id) => {
      const expenses = getFn().expenses.filter((x) => x.id !== id);
      setFn({ expenses });
      await persist({ [K.expenses]: expenses });
      getFn().rebuildLedger();
    },

    saveVendor: async (v) => {
      const st = getFn();
      const id = v.id ?? uid("v");
      const full = { id, name: v.name.trim(), mobile: v.mobile?.trim() || undefined };
      const vendors = st.vendors.some((x) => x.id === id)
        ? st.vendors.map((x) => (x.id === id ? full : x)) : [...st.vendors, full];
      setFn({ vendors });
      await persist({ [K.vendors]: vendors });
    },

    deleteVendor: async (id) => {
      const vendors = getFn().vendors.filter((x) => x.id !== id);
      setFn({ vendors });
      await persist({ [K.vendors]: vendors });
    },

    saveVendorItem: async (v) => {
      const st = getFn();
      const id = v.id ?? uid("vi");
      const full = { id, name: v.name.trim(), defaultRate: v.defaultRate, unit: v.unit?.trim() || undefined };
      const vendorItems = st.vendorItems.some((x) => x.id === id)
        ? st.vendorItems.map((x) => (x.id === id ? full : x)) : [...st.vendorItems, full];
      setFn({ vendorItems });
      await persist({ [K.vendorItems]: vendorItems });
    },

    deleteVendorItem: async (id) => {
      const vendorItems = getFn().vendorItems.filter((x) => x.id !== id);
      setFn({ vendorItems });
      await persist({ [K.vendorItems]: vendorItems });
    },

    saveSettings: async (s) => {
      const settings = { ...getFn().settings, ...s };
      setFn({ settings });
      await persist({ [K.settings]: settings });
      getFn().rebuildLedger();
    },

    replaceAll: async (p) => {
      setFn({
        events: p.events, inventory: p.inventory, stock: p.stock, rates: p.rates,
        payments: p.payments, adjustments: p.adjustments, expenses: p.expenses,
        vendors: p.vendors, vendorItems: p.vendorItems,
        wallets: p.wallets.length ? p.wallets : getFn().wallets,
      });
      const st = getFn();
      await persist({
        [K.events]: st.events, [K.inventory]: st.inventory, [K.stock]: st.stock,
        [K.rates]: st.rates, [K.payments]: st.payments, [K.adjustments]: st.adjustments,
        [K.expenses]: st.expenses, [K.vendors]: st.vendors,
        [K.vendorItems]: st.vendorItems, [K.wallets]: st.wallets,
      });
      getFn().rebuildLedger();
    },

    snapshot: () => {
      const st = getFn();
      return {
        events: st.events, inventory: st.inventory, stock: st.stock, rates: st.rates,
        payments: st.payments, adjustments: st.adjustments, expenses: st.expenses,
        vendors: st.vendors, vendorItems: st.vendorItems, wallets: st.wallets,
      };
    },

    fin: (ev) => {
      const st = getFn();
      const key = eventBillKey(ev);
      return computeFin(ev, st.payments[key] ?? [], st.adjustments[key] ?? [], st.settings);
    },

    balances: () => {
      const out: Record<string, number> = {};
      for (const e of getFn().ledger) {
        out[e.account] = (out[e.account] ?? 0) + (e.direction === "in" ? e.amount : -e.amount);
      }
      return out;
    },
  };
});
