"use client";

// Bento primitives — Magic UI Bento Grid pattern (MIT) + Aceternity spotlight hover.
import { useCallback } from "react";

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-3 md:grid-cols-3 ${className ?? ""}`}>{children}</div>;
}

export function BentoCard({
  children, className, span,
}: {
  children: React.ReactNode; className?: string; span?: string;
}) {
  const track = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }, []);
  return (
    <div onMouseMove={track} className={`spotlight-card glass-card rounded-2xl p-4 ${span ?? ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
