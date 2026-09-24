"use client";

import { useMemo, useState } from "react";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";

export function stockBadge(qty: number) {
  if (qty <= 0) return <span className="font-bold text-red-400">OUT</span>;
  if (qty <= 5) return <span className="font-bold text-orange-300">LOW · {qty}</span>;
  return <span className="font-bold text-emerald-300">{qty}</span>;
}

export default function InventoryManager() {
  const inventory = usePosStore((s) => s.inventory);
  const stock = usePosStore((s) => s.stock);
  const rates = usePosStore((s) => s.rates);
  const upsertInventory = usePosStore((s) => s.upsertInventory);
  const deleteInventory = usePosStore((s) => s.deleteInventory);
  const setRate = usePosStore((s) => s.setRate);

  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(0);
  const [cons, setCons] = useState("");
  const [consQty, setConsQty] = useState(1);
  const [rate, setRateInput] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);

  const list = useMemo(() => {
    const names = [...new Set([...inventory.map((r) => r.equip), ...Object.keys(stock)])].sort();
    return names.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  }, [inventory, stock, q]);

  const summary = useMemo(() => {
    const items = Object.keys(stock).length;
    const low = Object.values(stock).filter((v) => v > 0 && v <= 5).length;
    const out = Object.values(stock).filter((v) => v <= 0).length;
    return { items, low, out };
  }, [stock]);

  const openAdd = () => {
    setEditing(null); setName(""); setQty(0); setCons(""); setConsQty(1); setRateInput(0);
    setShowForm(true);
  };

  const openEdit = (equip: string) => {
    const row = inventory.find((r) => r.equip === equip);
    setEditing(equip); setName(equip); setQty(stock[equip] ?? 0);
    setCons(row?.consumable ?? ""); setConsQty(row?.qtyPerUnit ?? 1);
    setRateInput(rates[equip] ?? 0);
    setShowForm(true);
  };

  const submit = async () => {
    if (!name.trim()) return;
    await upsertInventory({ equip: name.trim(), consumable: cons.trim() || undefined, qtyPerUnit: consQty }, qty);
    if (rate > 0) await setRate(name.trim(), rate);
    setShowForm(false);
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Items</p><p className="text-2xl font-extrabold">{summary.items}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Low stock ≤5</p><p className="text-2xl font-extrabold text-orange-300">{summary.low}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Out of stock</p><p className="text-2xl font-extrabold text-red-400">{summary.out}</p></div>
      </div>

      <div className="mt-4 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search equipment…"
          className="max-w-md flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        <button onClick={openAdd} className="ember-btn rounded-xl px-5 text-sm font-bold">+ Add</button>
      </div>

      <div className="mt-3 space-y-2">
        {list.map((n) => {
          const row = inventory.find((r) => r.equip === n);
          return (
            <div key={n} className="glass-card flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-100">{n}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {row?.consumable ? `${row.consumable} × ${row.qtyPerUnit ?? 1}/unit` : "No consumable linked"} · Rate {inr(rates[n] ?? 0)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {stockBadge(stock[n] ?? 0)}
                <button onClick={() => openEdit(n)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/5">Edit</button>
                <button onClick={() => confirm(`Delete ${n}?`) && deleteInventory(n)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10">Del</button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No items. Add your first pyro unit.</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-night-900 p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{editing ? "Edit Item" : "➕ Add Item"}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg bg-white/10 px-3 py-1">✕</button>
            </div>
            <div className="grid gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="EQUIPMENT NAME (e.g. CO2 Jet)" disabled={!!editing}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60 disabled:opacity-60" />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-zinc-400">Stock<input type="number" min={0} value={qty} onChange={(e) => setQty(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" /></label>
                <label className="text-xs text-zinc-400">Rate ₹<input type="number" min={0} value={rate} onChange={(e) => setRateInput(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" /></label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={cons} onChange={(e) => setCons(e.target.value)} placeholder="Consumable (e.g. CO2 Cylinder)"
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500" />
                <input type="number" min={0} value={consQty} onChange={(e) => setConsQty(Number(e.target.value))} placeholder="Qty per unit"
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" />
              </div>
              <button onClick={submit} className="ember-btn mt-1 rounded-xl px-4 py-2.5 text-sm font-bold">Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
