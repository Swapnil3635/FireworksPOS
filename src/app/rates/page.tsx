"use client";
import { useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";

export default function RatesPage() {
  const inventory = usePosStore((s) => s.inventory);
  const rates = usePosStore((s) => s.rates);
  const setRate = usePosStore((s) => s.setRate);
  const stock = usePosStore((s) => s.stock);
  const [q, setQ] = useState("");
  const names = [...new Set([...inventory.map((r) => r.equip), ...Object.keys(stock)])]
    .sort().filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader title="Rate Chart" sub="Per-unit hire rates feed bills + event estimates." />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search…"
        className="mb-3 w-full max-w-md rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
      <div className="space-y-2">
        {names.map((n) => (
          <div key={n} className="glass-card flex items-center justify-between gap-3 rounded-2xl p-4">
            <div><p className="font-semibold">{n}</p><p className="text-xs text-zinc-500">Stock {stock[n] ?? 0}</p></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">₹</span>
              <input type="number" min={0} defaultValue={rates[n] ?? 0} key={`${n}-${rates[n] ?? 0}`}
                onBlur={(e) => setRate(n, Number(e.target.value))}
                className="w-28 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-right text-sm font-bold" />
            </div>
          </div>
        ))}
        {names.length === 0 && <p className="text-sm text-zinc-500">No items. Add them in Inventory first.</p>}
      </div>
      <p className="mt-3 text-xs text-zinc-500">Rates auto-fill new event lines, e.g. CO2 Jet {inr(rates["CO2 Jet"] ?? 0)}/unit.</p>
    </div>
  );
}
