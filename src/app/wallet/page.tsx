"use client";

import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";

export default function WalletPage() {
  const balances = usePosStore((s) => s.balances);
  const wallets = usePosStore((s) => s.wallets);
  const bal = balances();
  const total = Object.values(bal).reduce((s, v) => s + v, 0);
  return (
    <div>
      <PageHeader title="Wallet" sub="Cash / bank balances derived from ledger." />
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs text-zinc-400">Total balance</p>
        <p className="ember-text text-3xl font-extrabold">{inr(total)}</p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {wallets.map((w) => (
          <div key={w} className="glass-card rounded-2xl p-4">
            <p className="font-semibold">{w}</p>
            <p className={`text-xl font-extrabold ${(bal[w] ?? 0) < 0 ? "text-red-300" : "text-emerald-300"}`}>{inr(bal[w] ?? 0)}</p>
          </div>
        ))}
      </div>
      {bal["Receivable"] !== undefined && (
        <p className="mt-3 text-xs text-zinc-500">Receivable (billed extras not yet in an account): {inr(bal["Receivable"])}</p>
      )}
    </div>
  );
}
