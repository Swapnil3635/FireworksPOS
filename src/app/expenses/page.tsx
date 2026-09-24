"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import type { ExpenseItem } from "@/lib/types";
import { inr } from "@/lib/money";

const TYPES = ["Event", "Business", "Owner"];

export default function ExpensesPage() {
  const events = usePosStore((s) => s.events);
  const vendors = usePosStore((s) => s.vendors);
  const vendorItems = usePosStore((s) => s.vendorItems);
  const wallets = usePosStore((s) => s.wallets);
  const saveExpense = usePosStore((s) => s.saveExpense);

  const [type, setType] = useState("Business");
  const [eventId, setEventId] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("Consumables");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Cash");
  const [account, setAccount] = useState("Cash");
  const [rows, setRows] = useState<ExpenseItem[]>([{ name: "", qty: 1, rate: 0 }]);
  const [saved, setSaved] = useState(false);

  const total = useMemo(() => rows.reduce((s, r) => s + r.qty * r.rate, 0), [rows]);
  const input = "rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60";

  const pickItem = (i: number, name: string) => {
    const found = vendorItems.find((v) => v.name === name);
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], name, rate: found?.defaultRate ?? next[i].rate };
      return next;
    });
  };

  const save = async () => {
    const items = rows.filter((r) => r.name.trim() && r.qty > 0);
    if (items.length === 0) return;
    await saveExpense({
      expenseType: type, eventId: eventId || undefined, vendor: vendor || undefined,
      category, items, expenseDate: date, paymentMethod: method, paidAccount: account,
      grandTotal: Math.round(total * 100) / 100, status: "Paid",
    });
    setRows([{ name: "", qty: 1, rate: 0 }]); setVendor("");
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader title="Add Expenses" sub="Event / Business / Owner + item rows." />
      <div className="flex gap-2">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 rounded-2xl border-2 py-3 text-sm font-bold ${type === t ? "border-amber-500/70 bg-amber-500/10 text-amber-200" : "border-white/10 text-zinc-300"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {type === "Event" && (
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={input}>
            <option value="">Link event…</option>
            {events.map((e) => <option key={e.recordId} value={e.recordId}>{e.client} · {e.dates.join(",")}</option>)}
          </select>
        )}
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Vendor" list="vendor-list" className={input} />
        <datalist id="vendor-list">{vendors.map((v) => <option key={v.id} value={v.name} />)}</datalist>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={input} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={input}>
          {["Cash", "UPI", "Bank", "Card"].map((m) => <option key={m}>{m}</option>)}
        </select>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={input}>
          {wallets.map((w) => <option key={w}>{w}</option>)}
        </select>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_64px_90px_32px] gap-2">
            <input value={r.name} onChange={(e) => pickItem(i, e.target.value)} placeholder="Item" list="item-list" className={input} />
            <datalist id="item-list">{vendorItems.map((v) => <option key={v.id} value={v.name} />)}</datalist>
            <input type="number" min={1} value={r.qty} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, qty: Number(e.target.value) } : x))} className={input} placeholder="Qty" />
            <input type="number" min={0} value={r.rate} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, rate: Number(e.target.value) } : x))} className={input} placeholder="₹" />
          </div>
        ))}
        <button onClick={() => setRows([...rows, { name: "", qty: 1, rate: 0 }])}
          className="rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm text-zinc-300">+ Add row</button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm">Total: <b className="ember-text text-xl">{inr(total)}</b></p>
        <button onClick={save} disabled={total <= 0} className="ember-btn rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-40">
          {saved ? "✓ Saved" : "💾 Save Expense"}
        </button>
      </div>
    </div>
  );
}
