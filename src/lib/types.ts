// Core POS domain types — mirrors Masterrrrrrrrr.html entities, cleaned up.

export type EventType = "Wedding" | "Concert" | "Corporate" | "Birthday" | "Roadshow" | "Other";

export type SubEvent = {
  id: string;
  date: string; // YYYY-MM-DD
  time: "Morning" | "Afternoon" | "Evening" | "Night";
  name: string;
};

export type SelectedItem = {
  equip: string;
  qty: number;
  rate: number;
};

export type SfxEvent = {
  recordId: string;
  client: string;
  eventType: EventType | string;
  venue: string;
  dates: string[];
  subEvents: SubEvent[];
  selected: SelectedItem[];
  grandTotal: number;
  createdAt: string;
};

export type InventoryRow = {
  equip: string;
  consumable?: string;
  qtyPerUnit?: number;
  consumable2?: string;
  qtyPerUnit2?: number;
  consumable3?: string;
  qtyPerUnit3?: number;
};

export type Payment = {
  id: string;
  amount: number;
  date: string;
  mode: string;
  receivedAccount: string;
  clientName?: string;
  billNo?: string;
};

export type Adjustment = {
  id: string;
  type: "Discount" | "Extra Charge" | "Transport" | "Other";
  amount: number; // + adds to payable, - discount
  reason: string;
  date: string;
};

export type LedgerEntry = {
  id: string;
  date: string;
  clientName: string;
  billNo: string;
  direction: "in" | "out";
  amount: number;
  account: string;
  sourceType: "payment" | "adjustment" | "expense";
  sourceId: string;
  remarks: string;
  status?: string;
};

export type ExpenseItem = { name: string; qty: number; rate: number };

export type Expense = {
  id: string;
  expenseType: string;
  eventId?: string;
  vendor?: string;
  category?: string;
  items: ExpenseItem[];
  expenseDate: string;
  paymentMethod?: string;
  paidAccount?: string;
  grandTotal: number;
  status?: string;
};

export const uid = (p = "id") => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const eventTotal = (sel: SelectedItem[]) =>
  Math.round(sel.reduce((s, r) => s + r.qty * r.rate, 0) * 100) / 100;
