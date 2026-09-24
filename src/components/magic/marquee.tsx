"use client";

// Marquee — Magic UI pattern (MIT): infinite scroll strip, pauses on hover.
export default function Marquee({
  children, duration = 30, className, repeat = 2,
}: {
  children: React.ReactNode; duration?: number; className?: string; repeat?: number;
}) {
  const copies = Array.from({ length: repeat * 2 }, (_, i) => i);
  return (
    <div className={`magic-marquee-wrap overflow-hidden ${className ?? ""}`}>
      <div className="magic-marquee gap-6 pr-6" style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}>
        {copies.map((i) => (
          <div key={i} className="flex shrink-0 items-center gap-6" aria-hidden={i > 0}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
