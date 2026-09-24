"use client";

import { useMemo, useState } from "react";
import { usePosStore, eventBillKey, eventBillNo } from "@/lib/store";
import type { SfxEvent } from "@/lib/types";
import { inr } from "@/lib/money";
import { printBill } from "@/components/BillPrint";
import Button, { Tab as TabPill } from "@/components/magic/button";
import { pyroBurst } from "@/components/magic/confetti";
import { downloadInvoicePdf } from "@/lib/invoice-pdf";

type Tab = "All" | "Unpaid" | "Pending" | "Paid";

const statusStyle = (s: string) =>
  s === "Paid" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
  : s === "Pending" ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
  : "bg-red-500/15 text-red-300 border-red-500/30";

export default function BillingBoard() {
  const events = usePosStore((s) => s.events);
  const settings = usePosStore((s) => s.settings);
  const fin = usePosStore((s) => s.fin);
  const addPayment = usePosStore((s) => s.addPayment);
  const deletePayment = usePosStore((s) => s.deletePayment);
  const addAdjustment = usePosStore((s) => s.addAdjustment);
  const deleteAdjustment = usePosStore((s) => s.deleteAdjustment);
  const payments = usePosStore((s) => s.payments);
  const adjustments = usePosStore((s) => s.adjustments);
  const wallets = usePosStore((s) => s.wallets);

  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [payAcct, setPayAcct] = useState("Cash");
  const [adjType, setAdjType] = useState<"Discount" | "Extra Charge" | "Transport" | "Other">("Discount");
  const [adjAmt, setAdjAmt] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const exportPdf = async (ev: SfxEvent, billNo: string) => {
    setPdfBusy(ev.recordId);
    try {
      const key = eventBillKey(ev);
      await downloadInvoicePdf({
        ev, billNo,
        settings,
        payments: payments[key] ?? [],
        adjustments: adjustments[key] ?? [],
        fin: fin(ev),
      });
    } finally {
      setPdfBusy(null);
    }
  };
  const rows = useMemo(() => {
    return events
      .map((ev, idx) => ({ ev, idx, f: fin(ev) }))
      .filter(({ ev, f }) => {
        if (tab !== "All" && f.status !== tab) return false;
        if (q && !`${ev.client} ${ev.venue} ${ev.eventType}`.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      });
  }, [events, tab, q, fin]);

  const totals = useMemo(() => {
    let billed = 0, paid = 0, pending = 0;
    for (const { f } of rows) { billed += f.gst.roundedTotal; paid += f.paid; pending += f.pending; }
    return { billed, paid, pending };
  }, [rows]);

  const submitPay = async (ev: SfxEvent) => {
    const amt = Number(payAmt);
    if (!(amt > 0)) return;
    await addPayment(ev, {
      amount: amt, date: new Date().toISOString().slice(0, 10),
      mode: payMode, receivedAccount: payAcct, clientName: ev.client,
    });
    pyroBurst();
    setPayAmt("");
  };

  const submitAdj = async (ev: SfxEvent) => {
    const amt = Number(adjAmt);
    if (!(amt > 0)) return;
    const signed = adjType === "Discount" ? -Math.abs(amt) : Math.abs(amt);
    await addAdjustment(ev, {
      type: adjType, amount: signed, reason: adjReason || adjType,
      date: new Date().toISOString().slice(0, 10),
    });
    setAdjAmt(""); setAdjReason("");
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Billed (GST incl.)</p><p className="ember-text text-xl font-extrabold">{inr(totals.billed)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Collected</p><p className="text-xl font-extrabold text-emerald-300">{inr(totals.paid)}</p></div>
        <div className="glass-card rounded-2xl p-4"><p className="text-xs text-zinc-400">Pending</p><p className="text-xl font-extrabold text-red-300">{inr(totals.pending)}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["All", "Unpaid", "Pending", "Paid"] as Tab[]).map((t) => (
          <TabPill key={t} active={tab === t} onClick={() => setTab(t)}>{t}</TabPill>
        ))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Client / venue…"
          className="min-w-40 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
      </div>

      <div className="mt-3 space-y-3">
        {rows.map(({ ev, idx, f }) => {
          const key = eventBillKey(ev);
          const billNo = eventBillNo(ev, settings, idx);
          const open = openId === ev.recordId;
          return (
            <div key={ev.recordId} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-100">{ev.client} <span className="ml-2 text-xs font-normal text-zinc-500">{billNo}</span></p>
                  <p className="text-xs text-zinc-400">{ev.eventType} · {ev.venue} · {ev.dates.join(", ")}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Base {inr(ev.grandTotal)}{f.adjTotal !== 0 && <> · Adj {inr(f.adjTotal)}</>} · GST {f.gst.gstRate}% {inr(f.gst.cgst + f.gst.sgst + f.gst.igst)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold">{inr(f.gst.roundedTotal)}</p>
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyle(f.status)}`}>{f.status}</span>
                  <p className="mt-1 text-xs text-zinc-400">Paid {inr(f.paid)} · Due {inr(f.pending)}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setOpenId(open ? null : ev.recordId)}>
                  {open ? "Hide" : "Payments / Adjust"}
                </Button>
                <Button size="sm" onClick={() => printBill(ev, f, billNo, settings, payments[key] ?? [], adjustments[key] ?? [], "a4")}>🖨 GST Invoice</Button>
                <Button size="sm" onClick={() => printBill(ev, f, billNo, settings, payments[key] ?? [], adjustments[key] ?? [], "thermal")}>🧾 80mm Slip</Button>
                <Button size="sm" variant="primary" onClick={() => exportPdf(ev, billNo)} disabled={pdfBusy === ev.recordId}>
                  {pdfBusy === ev.recordId ? "⏳ PDF…" : "⬇ PDF"}
                </Button>
              </div>

              {open && (
                <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Payments</p>
                    {(payments[key] ?? []).map((p) => (
                      <div key={p.id} className="mt-1.5 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                        <span>{p.date} · {p.mode} → {p.receivedAccount} · <b>{inr(p.amount)}</b></span>
                        <button onClick={() => deletePayment(ev, p.id)} className="text-xs text-zinc-400 hover:text-red-300">✕</button>
                      </div>
                    ))}
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <input value={payAmt} onChange={(e) => setPayAmt(e.target.value)} type="number" placeholder="₹ amount"
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm" />
                      <select value={payMode} onChange={(e) => setPayMode(e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
                        {["UPI", "Cash", "Bank", "Card"].map((m) => <option key={m}>{m}</option>)}
                      </select>
                      <select value={payAcct} onChange={(e) => setPayAcct(e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
                        {wallets.map((w) => <option key={w}>{w}</option>)}
                      </select>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => submitPay(ev)} className="mt-2 w-full">+ Record Payment</Button>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Adjustments</p>
                    {(adjustments[key] ?? []).map((a) => (
                      <div key={a.id} className="mt-1.5 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                        <span>{a.type} · {a.reason} · <b>{inr(a.amount)}</b></span>
                        <button onClick={() => deleteAdjustment(ev, a.id)} className="text-xs text-zinc-400 hover:text-red-300">✕</button>
                      </div>
                    ))}
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      <select value={adjType} onChange={(e) => setAdjType(e.target.value as typeof adjType)}
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm">
                        {["Discount", "Extra Charge", "Transport", "Other"].map((m) => <option key={m}>{m}</option>)}
                      </select>
                      <input value={adjAmt} onChange={(e) => setAdjAmt(e.target.value)} type="number" placeholder="₹ amount"
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm" />
                      <input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Reason"
                        className="rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm" />
                    </div>
                    <Button size="sm" onClick={() => submitAdj(ev)} className="mt-2 w-full">+ Add Adjustment</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No bills in this view.</p>}
      </div>
    </div>
  );
}
