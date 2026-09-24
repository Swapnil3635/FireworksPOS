import Link from "next/link";
import { POS_NAV } from "@/lib/nav";

export function PageHeader({ title, sub, kicker }: { title: string; sub: string; kicker?: string }) {
  return (
    <div className="mb-5">
      <p className="eyebrow">{kicker ?? "Shreyas SFX · POS"}</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight md:text-4xl">
        <span className="ember-text">{title}</span>
      </h1>
      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-400">{sub}</p>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-amber-500/40 via-orange-600/15 to-transparent" />
    </div>
  );
}

export function PlaceholderGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {POS_NAV.map((r) => (
        <Link key={r.href} href={r.href} className="glass-card rounded-2xl p-4 transition hover:border-amber-500/40">
          <p className="text-xl">{r.icon}</p>
          <p className="mt-2 font-semibold text-zinc-100">{r.label}</p>
          <p className="text-sm text-zinc-400">{r.blurb}</p>
        </Link>
      ))}
    </div>
  );
}
