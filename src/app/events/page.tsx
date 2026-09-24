"use client";

import { useMemo, useState } from "react";
import EventBuilder from "@/components/EventBuilder";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";
import { inr } from "@/lib/money";

export default function EventsPage() {
  const events = usePosStore((s) => s.events);
  const deleteEvent = usePosStore((s) => s.deleteEvent);
  const fin = usePosStore((s) => s.fin);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"Upcoming" | "Completed" | "All">("Upcoming");
  const [editId, setEditId] = useState<string | null>(null);

  const list = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((e) => {
      if (status === "Upcoming" && !e.dates.some((d) => d >= today)) return false;
      if (status === "Completed" && e.dates.some((d) => d >= today)) return false;
      if (q && !`${e.client} ${e.eventType} ${e.venue}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [events, q, status]);

  return (
    <div>
      <PageHeader title="Saved Events" sub="Upcoming / Completed / All with edit." />
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search client / type / venue…"
          className="min-w-52 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm">
          <option>Upcoming</option><option>Completed</option><option>All</option>
        </select>
      </div>
      <div className="mt-3 space-y-2">
        {list.map((e) => {
          const f = fin(e);
          return (
            <div key={e.recordId} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{e.client} <span className="text-xs font-normal text-zinc-500">{e.eventType}</span></p>
                  <p className="text-xs text-zinc-400">{e.venue} · {e.dates.join(", ")}</p>
                  <p className="mt-1 text-xs text-zinc-500">{e.selected.map((r) => `${r.equip}×${r.qty}`).join(" · ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold">{inr(f.gst.roundedTotal)}</p>
                  <p className="text-xs text-zinc-400">Due {inr(f.pending)}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setEditId(editId === e.recordId ? null : e.recordId)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/5">Edit</button>
                <button onClick={() => confirm(`Delete ${e.client}?`) && deleteEvent(e.recordId)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10">Delete</button>
              </div>
              {editId === e.recordId && <div className="mt-3"><EventBuilder editId={e.recordId} onDone={() => setEditId(null)} /></div>}
            </div>
          );
        })}
        {list.length === 0 && <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-zinc-500">No events in this view.</p>}
      </div>
    </div>
  );
}
