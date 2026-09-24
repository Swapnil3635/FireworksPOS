"use client";

// Pyro celebration bursts — canvas-confetti in ember palette.
import confetti from "canvas-confetti";

const EMBER = ["#fcd34d", "#fbbf24", "#f59e0b", "#ea580c", "#fff7ed"];

function reduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function pyroBurst(opts?: { big?: boolean }) {
  if (reduced()) return;
  confetti({
    particleCount: opts?.big ? 160 : 80,
    spread: opts?.big ? 100 : 70,
    origin: { y: 0.7 },
    colors: EMBER,
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 30,
    angle: 60,
    spread: 60,
    origin: { x: 0, y: 0.8 },
    colors: EMBER,
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 30,
    angle: 120,
    spread: 60,
    origin: { x: 1, y: 0.8 },
    colors: EMBER,
    disableForReducedMotion: true,
  });
}

export function pyroFountain() {
  if (reduced()) return;
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 3, angle: 90, spread: 45, startVelocity: 32, origin: { x: 0.5, y: 0.9 }, colors: EMBER, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
