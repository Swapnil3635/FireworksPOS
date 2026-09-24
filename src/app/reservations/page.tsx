"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";

export default function ReservationsPage() {
  const events = usePosStore((s) => s.events);
  const stock = usePosStore((s) => s.stock);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");

  const rows = useMemo(() => {
    // Aggregate required qty per equipment across events overlapping the filter.
    const need = new Map<string, { qty: number; clients: string[] }>();
    for (const e of events) {
      if (date && !e.dates.includes(date)) continue;
      for (const r of e.selected) {
        if (q && !`${r.equip} ${e.client}`.toLowerCase().includes(q.toLowerCase())) continue;
        const cur = need.get(r.equip) ?? { qty: 0, clients: [] };
        cur.qty += r.qty;
        if (!cur.clients.includes(e.client)) cur.clients.push(e.client);
        need.set(r.equip, cur);
      }
    }
    return [...need.entries()].map(([equip, v]) => ({
      equip, ...v, have: stock[equip] ?? 0, short: (stock[equip] ?? 0) - v.qty,
    })).sort((a, b) => a.short - b.short);
  }, [events, stock, q, date]);

  const share = (equip: string) => {
    const r = rows.find((x) => x.equip === equip);
    if (!r) return;
    const txt = `SFX Allocation — ${equip}: need ${r.qty}, stock ${r.have}${r.short < 0 ? ` (SHORT ${-r.short})` : " ✓"}${date ? ` on ${date}` : ""}. Clients: ${r.clients.join(", ")}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
  };

  return (
    <div>
      <PageHeader title="Inventory Allocation" sub="Required vs stock — shortage first." />
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Equipment / client…"
          className="min-w-52 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm" />
        {date && <button onClick={() => setDate("")} className="rounded-xl border border-white/15 px-3 text-sm">Clear</button>}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.equip} className={`glass-card rounded-2xl p-4 ${r.short < 0 ? "border-red-500/40" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{r.equip}</p>
                <p className="text-xs text-zinc-400">Need {r.qty} · Stock {r.have} · {r.clients.join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                {r.short < 0
                  ? <span className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">SHORT {-r.short}</span>
                  : <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">OK +{r.short}</span>}
                <button onClick={() => share(r.equip)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs">📲 Share</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No allocations for this filter.</p>}
      </div>
    </div>
  );
}
