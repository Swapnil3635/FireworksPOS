"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/pos-ui";
import { usePosStore } from "@/lib/store";

const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS: Record<string, string> = {
  Wedding: "bg-emerald-500", Concert: "bg-violet-500", Corporate: "bg-sky-500",
  Birthday: "bg-orange-500", Roadshow: "bg-pink-500", Other: "bg-zinc-500",
};

export default function CalendarPage() {
  const events = usePosStore((s) => s.events);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const arr: (string | null)[] = [...Array(offset).fill(null)];
    for (let d = 1; d <= days; d++) arr.push(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    return arr;
  }, [ym]);

  const byDate = useMemo(() => {
    const m = new Map<string, typeof events>();
    for (const e of events) for (const d of e.dates) {
      if (!m.has(d)) m.set(d, []);
      m.get(d)!.push(e);
    }
    return m;
  }, [events]);

  const label = new Date(ym.y, ym.m, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  const selEvents = sel ? byDate.get(sel) ?? [] : [];

  return (
    <div>
      <PageHeader title="Booking Calendar" sub="Month grid + day agenda." />
      <div className="glass-card rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setYm({ y: ym.m === 0 ? ym.y - 1 : ym.y, m: (ym.m + 11) % 12 })} className="rounded-lg border border-white/15 px-3 py-1.5">◀</button>
          <h2 className="font-bold">{label}</h2>
          <button onClick={() => setYm({ y: ym.m === 11 ? ym.y + 1 : ym.y, m: (ym.m + 1) % 12 })} className="rounded-lg border border-white/15 px-3 py-1.5">▶</button>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-white/10">
          {WD.map((w) => <div key={w} className="bg-white/5 px-1 py-2 text-center text-[11px] font-bold text-zinc-400">{w}</div>)}
          {cells.map((d, i) => {
            const evs = d ? byDate.get(d) ?? [] : [];
            return (
              <button key={i} disabled={!d} onClick={() => setSel(d)}
                className={`min-h-16 bg-black/30 p-1 text-left align-top md:min-h-24 ${sel === d ? "outline outline-2 outline-amber-500/70" : ""} ${!d ? "opacity-30" : "hover:bg-white/5"}`}>
                {d && <>
                  <span className="text-[11px] font-bold text-zinc-300">{Number(d.slice(8))}</span>
                  <span className="mt-1 flex flex-col gap-0.5">
                    {evs.slice(0, 3).map((e) => (
                      <span key={e.recordId} className={`truncate rounded px-1 py-px text-[9px] font-semibold text-white ${COLORS[e.eventType] ?? COLORS.Other}`}>{e.client}</span>
                    ))}
                    {evs.length > 3 && <span className="text-[9px] text-zinc-400">+{evs.length - 3} more</span>}
                  </span>
                </>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
          {Object.entries(COLORS).slice(0, 5).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${v}`} />{k}</span>
          ))}
        </div>
      </div>
      {sel && (
        <div className="glass-card mt-3 rounded-2xl p-4">
          <h3 className="font-bold">Events on {sel}</h3>
          {selEvents.map((e) => (
            <div key={e.recordId} className="mt-2 rounded-xl bg-white/5 p-3 text-sm">
              <b>{e.client}</b> <span className="text-zinc-400">· {e.eventType} · {e.venue}</span>
            </div>
          ))}
          {selEvents.length === 0 && <p className="mt-2 text-sm text-zinc-500">No events this day.</p>}
        </div>
      )}
    </div>
  );
}
