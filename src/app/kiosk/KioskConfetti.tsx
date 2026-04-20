"use client";

import { useEffect } from "react";

/**
 * Dispara una animación de confeti al montarse.
 * Ideal para usar con una `key` que cambia en cada evento (p.ej. timestamp),
 * para que React vuelva a montar el componente y se dispare otra vez.
 */
export default function KioskConfetti() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { default: confetti } = await import("canvas-confetti");
      if (cancelled) return;

      // Respetar accesibilidad.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const colors: string[] = ["#22c55e", "#16a34a", "#e8edf5", "#ffd166", "#4ade80", "#ffffff"];

      // Única ráfaga: animación inicial sin continuación posterior.
      confetti({
        particleCount: 180,
        spread: 110,
        startVelocity: 45,
        origin: { y: 0.55 },
        colors,
        zIndex: 9999,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
