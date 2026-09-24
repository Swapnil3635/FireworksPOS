"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";

export default function ExpensesHistoryPage() {
  const expenses = usePosStore((s) => s.expenses);
  const deleteExpense = usePosStore((s) => s.deleteExpense);
  const [q, setQ] = useState("");

  const list = useMemo(() => expenses.filter((e) =>
    !q || `${e.vendor ?? ""} ${e.category ?? ""} ${e.expenseType}`.toLowerCase().includes(q.toLowerCase())
  ), [expenses, q]);
  const total = list.reduce((s, e) => s + e.grandTotal, 0);

  return (
    <div>
      <PageHeader title="Expenses History" sub="Cash-flow out with search." />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Total spent</p><p className="text-xl font-extrabold text-red-300">{inr(total)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Entries</p><p className="text-xl font-extrabold">{list.length}</p></div>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search vendor / category…"
        className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
      <div className="mt-3 space-y-2">
        {list.map((e) => (
          <div key={e.id} className="glass-card rounded-2xl border-l-4 border-l-red-500/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{e.vendor || e.category || e.expenseType} <span className="font-normal text-zinc-500">· {e.expenseType}</span></p>
                <p className="text-xs text-zinc-400">{e.expenseDate} · {e.items.map((i) => `${i.name}×${i.qty}`).join(", ")} · {e.paidAccount}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-red-300">−{inr(e.grandTotal)}</p>
                <button onClick={() => confirm("Delete?") && deleteExpense(e.id)} className="text-xs text-zinc-500 hover:text-red-300">✕</button>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No expenses.</p>}
      </div>
    </div>
  );
}
