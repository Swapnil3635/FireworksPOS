"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePosStore } from "@/lib/store";
import { pyroBurst } from "@/components/magic/confetti";
import Button from "@/components/magic/button";
import { eventTotal, uid, type SelectedItem, type SubEvent } from "@/lib/types";
import { inr } from "@/lib/money";

const EVENT_TYPES = ["Wedding", "Concert", "Corporate", "Birthday", "Roadshow", "Other"];
const SUB_NAMES = ["Haldi", "Mehendi", "Sangeet Night", "Engagement", "Varmala", "Reception", "Wedding Ceremony", "After Party", "Other"];

export default function EventBuilder({ editId, onDone }: { editId?: string; onDone?: () => void }) {
  const events = usePosStore((s) => s.events);
  const inventory = usePosStore((s) => s.inventory);
  const stock = usePosStore((s) => s.stock);
  const rates = usePosStore((s) => s.rates);
  const saveEvent = usePosStore((s) => s.saveEvent);

  const editing = editId ? events.find((e) => e.recordId === editId) : undefined;

  const [client, setClient] = useState(editing?.client ?? "");
  const [eventType, setEventType] = useState(editing?.eventType ?? "Wedding");
  const [venue, setVenue] = useState(editing?.venue ?? "");
  const [dates, setDates] = useState<string[]>(editing?.dates ?? []);
  const [dateInput, setDateInput] = useState("");
  const [subEvents, setSubEvents] = useState<SubEvent[]>(editing?.subEvents ?? []);
  const [subDate, setSubDate] = useState("");
  const [subTime, setSubTime] = useState<SubEvent["time"]>("Evening");
  const [subName, setSubName] = useState(SUB_NAMES[2]);
  const [rows, setRows] = useState<SelectedItem[]>(
    editing?.selected ?? [{ equip: "", qty: 1, rate: 0 }]
  );
  const [saved, setSaved] = useState(false);

  const equipNames = useMemo(() => {
    const fromInv = inventory.map((r) => r.equip);
    const fromStock = Object.keys(stock);
    return [...new Set([...fromInv, ...fromStock])].sort();
  }, [inventory, stock]);

  const total = eventTotal(rows.filter((r) => r.equip));

  const addDate = () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput) && !dates.includes(dateInput)) {
      setDates([...dates, dateInput].sort());
      setDateInput("");
    }
  };

  const setRow = (i: number, patch: Partial<SelectedItem>) => {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      if (patch.equip && !prev[i].rate) next[i].rate = rates[patch.equip] ?? 0;
      return next;
    });
  };

  const valid = client.trim() && venue.trim() && dates.length > 0 && rows.some((r) => r.equip && r.qty > 0);

  const save = async () => {
    if (!valid) return;
    await saveEvent({
      recordId: editId, client, eventType, venue, dates, subEvents,
      selected: rows.filter((r) => r.equip && r.qty > 0),
    });
    pyroBurst();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onDone?.();
  };

  return (
    <div className="glass-card rounded-3xl p-5 md:p-6">
      <h2 className="text-lg font-bold text-zinc-100">{editId ? "Edit Event" : "🎆 New Event"}</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client Name"
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
        <select value={eventType} onChange={(e) => setEventType(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60">
          {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue"
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:border-amber-500/60" />
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Event dates</p>
        <div className="mt-1 flex gap-2">
          <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60" />
          <Button variant="ghost" size="md" onClick={addDate}>+ Add</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {dates.map((d) => (
            <span key={d} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {d} <button onClick={() => setDates(dates.filter((x) => x !== d))} className="ml-1 text-zinc-400 hover:text-red-300">✕</button>
            </span>
          ))}
          {dates.length === 0 && <span className="text-xs text-zinc-500">No dates yet — pick at least one.</span>}
        </div>
      </div>

      {(eventType === "Wedding" || subEvents.length > 0) && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sub-events (day-wise)</p>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <select value={subDate} onChange={(e) => setSubDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
              <option value="">Date…</option>
              {dates.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={subTime} onChange={(e) => setSubTime(e.target.value as SubEvent["time"])}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
              {["Morning", "Afternoon", "Evening", "Night"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={subName} onChange={(e) => setSubName(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
              {SUB_NAMES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button
              onClick={() => subDate && setSubEvents([...subEvents, { id: uid("sub"), date: subDate, time: subTime, name: subName }])}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/15">+ Add</button>
          </div>
          {subEvents.map((s) => (
            <div key={s.id} className="mt-2 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
              <span>{s.date} · {s.time} · <b>{s.name}</b></span>
              <button onClick={() => setSubEvents(subEvents.filter((x) => x.id !== s.id))} className="text-zinc-400 hover:text-red-300">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Pyro / inventory lines</p>
        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <motion.div key={i} layout className="grid grid-cols-[1fr_70px_90px_32px] items-center gap-2">
              <select value={r.equip} onChange={(e) => setRow(i, { equip: e.target.value })}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm">
                <option value="">Select equipment…</option>
                {equipNames.map((n) => <option key={n} value={n}>{n} (stock {stock[n] ?? 0})</option>)}
              </select>
              <input type="number" min={1} value={r.qty} onChange={(e) => setRow(i, { qty: Number(e.target.value) })}
                className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-sm" placeholder="Qty" />
              <input type="number" min={0} value={r.rate} onChange={(e) => setRow(i, { rate: Number(e.target.value) })}
                className="rounded-xl border border-white/10 bg-black/40 px-2 py-2 text-sm" placeholder="Rate ₹" />
              <button onClick={() => setRows(rows.filter((_, j) => j !== i))}
                className="rounded-lg px-1 py-2 text-zinc-400 hover:text-red-300">✕</button>
            </motion.div>
          ))}
        </div>
        <button onClick={() => setRows([...rows, { equip: "", qty: 1, rate: 0 }])}
          className="mt-2 rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm text-zinc-300 hover:border-amber-500/50 hover:text-amber-200">
          + Add line
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-300">Estimate: <b className="ember-text text-xl">{inr(total)}</b> <span className="text-xs text-zinc-500">+ GST on bill</span></p>
        <Button variant="primary" onClick={save} disabled={!valid}>
          {saved ? "✓ Saved" : editId ? "Save Changes" : "💾 Save Event"}
        </Button>
      </div>
    </div>
  );
}
