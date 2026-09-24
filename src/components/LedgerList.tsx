"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";
import { AnimatedItem } from "@/components/magic/animated-list";

export default function LedgerList({ showDeleted = false }: { showDeleted?: boolean }) {
  const ledger = usePosStore((s) => s.ledger);
  const deletedIds = usePosStore((s) => s.deletedIds);
  const deleteLedgerEntry = usePosStore((s) => s.deleteLedgerEntry);
  const restoreLedgerEntry = usePosStore((s) => s.restoreLedgerEntry);
  const balances = usePosStore((s) => s.balances);
  const [q, setQ] = useState("");

  const bal = balances();
  const totals = useMemo(() => {
    let inn = 0, out = 0;
    for (const e of ledger) { if (e.direction === "in") inn += e.amount; else out += e.amount; }
    return { inn, out, net: inn - out };
  }, [ledger]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof ledger>();
    const filtered = ledger.filter((e) =>
      !q || `${e.clientName} ${e.billNo} ${e.remarks} ${e.account}`.toLowerCase().includes(q.toLowerCase())
    );
    if (showDeleted) return new Map<string, typeof ledger>();
    for (const e of filtered) {
      if (!m.has(e.date)) m.set(e.date, []);
      m.get(e.date)!.push(e);
    }
    return m;
  }, [ledger, q, showDeleted]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Money In</p><p className="text-xl font-extrabold text-emerald-300">{inr(totals.inn)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Money Out</p><p className="text-xl font-extrabold text-red-300">{inr(totals.out)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Net</p><p className="ember-text text-xl font-extrabold">{inr(totals.net)}</p></div>
      </div>

      {Object.keys(bal).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(bal).map(([a, v]) => (
            <span key={a} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {a}: <b className={v < 0 ? "text-red-300" : "text-emerald-300"}>{inr(v)}</b>
            </span>
          ))}
          <Link href="/ledger/deleted" className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200">
            🗑 Bin ({deletedIds.length})
          </Link>
        </div>
      )}

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search client / bill / account…"
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />

      <div className="mt-3 space-y-4">
        {[...groups.entries()].map(([date, items], gi) => (
          <AnimatedItem key={date} index={gi}>
            <p className="mb-1.5 px-1 text-xs font-extrabold uppercase tracking-wider text-amber-200/80">{date}</p>
            <div className="space-y-1.5">
              {items.map((e, ii) => (
                <AnimatedItem key={e.id} index={ii}>
                <div key={e.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border bg-white/[0.03] p-3 ${e.direction === "in" ? "border-emerald-500/20" : "border-red-500/20"}`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-100">{e.clientName} {e.billNo && <span className="font-normal text-zinc-500">{e.billNo}</span>}</p>
                    <p className="truncate text-xs text-zinc-400">{e.remarks} · {e.account}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className={`text-sm font-extrabold ${e.direction === "in" ? "text-emerald-300" : "text-red-300"}`}>
                      {e.direction === "in" ? "+" : "−"}{inr(e.amount)}
                    </p>
                    <button onClick={() => deleteLedgerEntry(e.id)} className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:text-red-300" title="Move to bin">🗑</button>
                  </div>
                </div>
                </AnimatedItem>
              ))}
            </div>
          </AnimatedItem>
        ))}
        {groups.size === 0 && !showDeleted && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No entries. Record a payment on a bill.</p>}
      </div>

      {showDeleted && (
        <DeletedBinList deletedIds={deletedIds} onRestore={restoreLedgerEntry} />
      )}
    </div>
  );
}

function DeletedBinList({ deletedIds, onRestore }: { deletedIds: string[]; onRestore: (id: string) => void }) {
  if (deletedIds.length === 0) return <p className="mt-3 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">Bin is empty.</p>;
  return (
    <div className="mt-3 space-y-1.5">
      {deletedIds.map((id) => (
        <div key={id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm">
          <span className="text-zinc-400">{id}</span>
          <button onClick={() => onRestore(id)} className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">Restore</button>
        </div>
      ))}
    </div>
  );
}
