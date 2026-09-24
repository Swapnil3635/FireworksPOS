"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EventBuilder from "@/components/EventBuilder";
import { usePosStore } from "@/lib/store";
import EmberParticles from "@/components/magic/ember-particles";
import SparklesText from "@/components/magic/sparkles-text";
import { inr } from "@/lib/money";
import Marquee from "@/components/magic/marquee";
import { BentoGrid, BentoCard } from "@/components/magic/bento";
import { POS_NAV } from "@/lib/nav";

export default function Home() {
  const events = usePosStore((s) => s.events);
  const stock = usePosStore((s) => s.stock);
  const fin = usePosStore((s) => s.fin);
  const [showBuilder, setShowBuilder] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter((e) => e.dates.some((d) => d >= today)).length;
    const alerts = Object.values(stock).filter((v) => v <= 5).length;
    let pending = 0;
    for (const e of events) pending += fin(e).pending;
    return { upcoming, alerts, pending, clients: new Set(events.map((e) => e.client)).size };
  }, [events, stock, fin]);

  const tickerItems = useMemo(
    () => Object.entries(stock).sort((a, b) => a[1] - b[1]).slice(0, 12),
    [stock]
  );

  const recent = events.slice(0, 5);

  return (
    <div>
      <div className="glass-card relative overflow-hidden rounded-3xl p-6">
        <EmberParticles className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Create · Coordinate · Deliver</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Good evening, <SparklesText className="ember-text" sparklesCount={12}>Shreyas</SparklesText>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            <b className="text-zinc-200">{stats.upcoming}</b> upcoming ·{" "}
            {stats.clients} clients · <b className="text-amber-200">{inr(stats.pending)}</b> to collect
          </p>
          <button onClick={() => setShowBuilder((v) => !v)} className="ember-btn shimmer-btn mt-4 rounded-xl px-5 py-2.5 text-sm font-bold">
            <span className="relative z-[2]">{showBuilder ? "Close Builder" : "＋ New Event"}</span>
          </button>
        </div>
      </div>

      {tickerItems.length > 0 && (
        <Marquee duration={36} className="mt-3">
          {tickerItems.map(([n, q]) => (
            <span key={n} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${q <= 0 ? "border-red-500/40 text-red-300" : q <= 5 ? "border-orange-500/40 text-orange-200" : "border-white/10 text-zinc-300"}`}>
              {n} · <b>{q}</b>
            </span>
          ))}
        </Marquee>
      )}

      {showBuilder && <div className="mt-4"><EventBuilder onDone={() => setShowBuilder(false)} /></div>}

      <BentoGrid className="mt-4 sm:grid-cols-2 lg:grid-cols-4">
        <BentoCard>
          <Link href="/events" className="block">
            <p className="text-2xl font-extrabold">{stats.upcoming}</p>
            <p className="text-xs text-zinc-400">Upcoming Events ›</p>
          </Link>
        </BentoCard>
        <BentoCard>
          <Link href="/inventory" className="block">
            <p className="text-2xl font-extrabold text-orange-300">{stats.alerts}</p>
            <p className="text-xs text-zinc-400">Inventory Alerts ›</p>
          </Link>
        </BentoCard>
        <BentoCard>
          <Link href="/billing" className="block">
            <p className="ember-text text-xl font-extrabold">{inr(stats.pending)}</p>
            <p className="text-xs text-zinc-400">Pending Collection ›</p>
          </Link>
        </BentoCard>
        <BentoCard>
          <Link href="/calendar" className="block">
            <p className="text-2xl font-extrabold">{events.length}</p>
            <p className="text-xs text-zinc-400">Total Events ›</p>
          </Link>
        </BentoCard>
      </BentoGrid>

      <div className="glass-card mt-4 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold">Recent Events</h3>
          <Link href="/events" className="text-xs text-amber-300">View All ›</Link>
        </div>
        {recent.map((e) => (
          <div key={e.recordId} className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0">
            <div><b>{e.client}</b> <span className="text-zinc-500">· {e.eventType} · {e.venue}</span><p className="text-xs text-zinc-500">{e.dates.join(", ")}</p></div>
            <span className="font-bold">{inr(e.grandTotal)}</span>
          </div>
        ))}
        {recent.length === 0 && <p className="text-sm text-zinc-500">No events yet — create your first above.</p>}
      </div>

      <h2 className="mb-3 mt-6 text-lg font-bold text-zinc-100">All POS modules</h2>
      <BentoGrid className="sm:grid-cols-2 lg:grid-cols-3">
        {POS_NAV.map((r) => (
          <BentoCard key={r.href}>
            <Link href={r.href} className="block">
              <p className="text-xl">{r.icon}</p>
              <p className="mt-2 font-semibold text-zinc-100">{r.label}</p>
              <p className="text-sm text-zinc-400">{r.blurb}</p>
            </Link>
          </BentoCard>
        ))}
      </BentoGrid>
    </div>
  );
}
