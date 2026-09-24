"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";
import { ClientBars, CashPie, CollectionArea } from "@/components/magic/charts";

export default function ReportsPage() {
  const events = usePosStore((s) => s.events);
  const fin = usePosStore((s) => s.fin);
  const expenses = usePosStore((s) => s.expenses);
  const stock = usePosStore((s) => s.stock);
  const ledger = usePosStore((s) => s.ledger);

  const r = useMemo(() => {
    let billed = 0, paid = 0, pending = 0;
    const byClient = new Map<string, { events: number; billed: number; paid: number; due: number }>();
    const byItem = new Map<string, number>();
    for (const e of events) {
      const f = fin(e);
      billed += f.gst.roundedTotal; paid += f.paid; pending += f.pending;
      const c = byClient.get(e.client) ?? { events: 0, billed: 0, paid: 0, due: 0 };
      c.events++; c.billed += f.gst.roundedTotal; c.paid += f.paid; c.due += f.pending;
      byClient.set(e.client, c);
      for (const s of e.selected) byItem.set(s.equip, (byItem.get(s.equip) ?? 0) + s.qty);
    }
    const spent = expenses.reduce((s, e) => s + e.grandTotal, 0);
    let inn = 0, out = 0;
    const perDay = new Map<string, number>();
    for (const e of ledger) {
      if (e.direction === "in") { inn += e.amount; perDay.set(e.date, (perDay.get(e.date) ?? 0) + e.amount); }
      else out += e.amount;
    }
    const days = [...perDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const trend = days.map(([date], i) => ({
      date: date.slice(5),
      total: Math.round(days.slice(0, i + 1).reduce((s, [, v]) => s + v, 0)),
    }));
    const low = Object.entries(stock).filter(([, v]) => v > 0 && v <= 5);
    const outList = Object.entries(stock).filter(([, v]) => v <= 0);
    return {
      billed, paid, pending, spent, net: paid - spent, inn, out: out,
      clients: [...byClient.entries()].sort((a, b) => b[1].due - a[1].due),
      bars: [...byClient.entries()].slice(0, 6).map(([name, v]) => ({
        name: name.length > 12 ? name.slice(0, 11) + "…" : name,
        billed: Math.round(v.billed), collected: Math.round(v.paid),
      })),
      trend,
      items: [...byItem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
      low, outList,
    };
  }, [events, fin, expenses, stock, ledger]);

  const card = "glass-card rounded-2xl p-4";
  return (
    <div>
      <PageHeader title="Reports" sub="Financial · clients · inventory · items." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}><p className="text-xs text-zinc-400">Billed (GST)</p><p className="ember-text text-xl font-extrabold">{inr(r.billed)}</p></div>
        <div className={card}><p className="text-xs text-zinc-400">Collected</p><p className="text-xl font-extrabold text-emerald-300">{inr(r.paid)}</p></div>
        <div className={card}><p className="text-xs text-zinc-400">Pending</p><p className="text-xl font-extrabold text-red-300">{inr(r.pending)}</p></div>
        <div className={card}><p className="text-xs text-zinc-400">Net (in − expenses)</p><p className="text-xl font-extrabold">{inr(r.net)}</p></div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {r.bars.length > 0 && <ClientBars data={r.bars} />}
        <CashPie inn={Math.round(r.inn)} out={Math.round(r.out + r.spent)} />
        {r.trend.length > 0 && <CollectionArea data={r.trend} />}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="mb-2 font-bold">Clients by dues</h3>
          {r.clients.map(([c, v]) => (
            <div key={c} className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0">
              <div><b>{c}</b><p className="text-xs text-zinc-500">{v.events} events · billed {inr(v.billed)}</p></div>
              <span className={`font-bold ${v.due > 0 ? "text-red-300" : "text-emerald-300"}`}>{inr(v.due)}</span>
            </div>
          ))}
          {r.clients.length === 0 && <p className="text-sm text-zinc-500">No data.</p>}
        </div>
        <div className="space-y-3">
          <div className="glass-card rounded-2xl p-4">
            <h3 className="mb-2 font-bold">Top firing items</h3>
            {r.items.map(([n, q]) => (
              <div key={n} className="flex justify-between py-1 text-sm"><span>{n}</span><b>×{q}</b></div>
            ))}
            {r.items.length === 0 && <p className="text-sm text-zinc-500">No data.</p>}
          </div>
          <div className="glass-card rounded-2xl p-4">
            <h3 className="mb-2 font-bold">Stock alerts</h3>
            {r.outList.map(([n]) => <p key={n} className="py-0.5 text-sm text-red-300">OUT · {n}</p>)}
            {r.low.map(([n, v]) => <p key={n} className="py-0.5 text-sm text-orange-300">LOW {v} · {n}</p>)}
            {r.outList.length + r.low.length === 0 && <p className="text-sm text-emerald-300">All stocked ✓</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
