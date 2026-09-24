"use client";

// POS charts — Recharts (Apache-2.0), dark ember theme.
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

const css = (v: string) => v;
const TICK = { fill: "#a1a1aa", fontSize: 11 };
const GRID = "rgba(255,255,255,0.07)";

function ChartCard({ title, children, span }: { title: string; children: React.ReactNode; span?: string }) {
  return (
    <div className={`glass-card rounded-2xl p-4 ${span ?? ""}`}>
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#181822",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fafafa",
} as const;

const shortInr = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`;

export function ClientBars({ data }: { data: { name: string; billed: number; collected: number }[] }) {
  return (
    <ChartCard title="Clients — billed vs collected">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="name" tick={TICK} interval={0} angle={-18} textAnchor="end" height={52} />
          <YAxis tick={TICK} tickFormatter={shortInr} width={56} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [css(`₹${Number(v).toLocaleString("en-IN")}`), ""]} />
          <Bar dataKey="billed" name="Billed" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#34d399" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CashPie({ inn, out }: { inn: number; out: number }) {
  const data = [
    { name: "In", value: inn },
    { name: "Out", value: out },
  ];
  return (
    <ChartCard title="Cash flow">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={3} strokeWidth={0}>
            <Cell fill="#34d399" />
            <Cell fill="#f87171" />
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-1 flex justify-center gap-4 text-xs text-zinc-400">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />In</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-red-400" />Out</span>
      </div>
    </ChartCard>
  );
}

export function CollectionArea({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ChartCard title="Collections over time" span="md:col-span-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="emberFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tick={TICK} minTickGap={28} />
          <YAxis tick={TICK} tickFormatter={shortInr} width={56} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Collected"]} />
          <Area type="monotone" dataKey="total" stroke="#fbbf24" strokeWidth={2.5} fill="url(#emberFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
