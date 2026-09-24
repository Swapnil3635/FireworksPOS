"use client";

// SparklesText — Magic UI pattern (MIT): headline with twinkling star sparkles.
import { useMemo } from "react";

const COLORS = ["#fcd34d", "#f59e0b", "#ea580c", "#fff7ed"];

// Deterministic pseudo-random per index — stable across renders, no hydration jitter.
function seeded(n: number) {
  let x = (n + 1) * 2654435761;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  return ((x >>> 0) % 1000) / 1000;
}

function Star({ left, top, size, delay, duration, color }: {
  left: string; top: string; size: number; delay: string; duration: string; color: string;
}) {
  return (
    <svg
      className="sparkle-star"
      style={{
        left, top, width: size, height: size, color,
        "--sparkle-delay": delay,
        "--sparkle-duration": duration,
      } as React.CSSProperties}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 0c.7 6.5 5.5 11.3 12 12-6.5.7-11.3 5.5-12 12-.7-6.5-5.5-11.3-12-12C6.5 11.3 11.3 6.5 12 0z" />
    </svg>
  );
}

export default function SparklesText({
  children, className, sparklesCount = 10,
}: {
  children: React.ReactNode; className?: string; sparklesCount?: number;
}) {
  const stars = useMemo(
    () =>
      Array.from({ length: sparklesCount }, (_, i) => ({
        id: i,
        left: `${8 + seeded(i * 5 + 1) * 84}%`,
        top: `${-10 + seeded(i * 5 + 2) * 110}%`,
        size: 8 + seeded(i * 5 + 3) * 10,
        delay: `${(seeded(i * 5 + 4) * 2.4).toFixed(2)}s`,
        duration: `${(1.8 + seeded(i * 5 + 5) * 1.8).toFixed(2)}s`,
        color: COLORS[i % COLORS.length],
      })),
    [sparklesCount]
  );
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      {stars.map((s) => <Star key={s.id} {...s} />)}
      <span className="relative">{children}</span>
    </span>
  );
}
