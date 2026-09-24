"use client";

// EmberParticles — Aceternity Sparkles pattern (canvas particle field),
// ember-tinted rising sparks for the pyro hero. Respects reduced-motion.

import { useEffect, useRef } from "react";

type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; hue: number };

export default function EmberParticles({ density = 70, className }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, raf = 0;
    const parts: P[] = [];
    const spawn = (): P => ({
      x: Math.random() * w,
      y: h + Math.random() * 40,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.3,
      a: 0.25 + Math.random() * 0.65,
      hue: 28 + Math.random() * 22,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(rect.width));
      h = canvas.height = Math.max(1, Math.floor(rect.height));
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < density; i++) {
      const p = spawn();
      p.y = Math.random() * h;
      parts.push(p);
    }

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin((p.y / 40) + p.r) * 0.2;
        if (p.y < -12) Object.assign(p, spawn());
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${p.a})`;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 55%, 0.9)`;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
