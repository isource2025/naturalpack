"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import styles from "./SwipeCloseSlider.module.css";

const THUMB = 48;
const PAD = 6;
/** Fracción del recorrido para disparar el cierre (deslizar casi hasta el final). */
const THRESHOLD = 0.88;

type Props = {
  disabled?: boolean;
  busy?: boolean;
  /** Incrementar tras un cierre exitoso para animar el thumb al inicio. */
  resetKey?: number;
  onComplete: () => void | Promise<void>;
};

/**
 * Control tipo "deslizá para confirmar": el thumb va hacia la derecha;
 * al soltar pasado el umbral se ejecuta `onComplete`.
 */
export default function SwipeCloseSlider({
  disabled,
  busy,
  resetKey = 0,
  onComplete,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [smooth, setSmooth] = useState(true);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOff = useRef(0);
  const maxOffset = useRef(120);
  const offsetLive = useRef(0);
  const [maxO, setMaxO] = useState(0);

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const v = Math.max(0, el.clientWidth - THUMB - PAD * 2);
    maxOffset.current = v;
    setMaxO(v);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    const el = trackRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    setSmooth(true);
    setOffset(0);
    offsetLive.current = 0;
  }, [resetKey]);

  useEffect(() => {
    offsetLive.current = offset;
  }, [offset]);

  function clamp(n: number) {
    return Math.min(maxOffset.current, Math.max(0, n));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (disabled || busy) return;
    e.preventDefault();
    measure();
    dragging.current = true;
    setSmooth(false);
    startX.current = e.clientX;
    startOff.current = offsetLive.current;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const next = clamp(startOff.current + dx);
    offsetLive.current = next;
    setOffset(next);
  }

  async function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ya liberado */
    }
    const max = maxOffset.current || 1;
    const o = offsetLive.current;
    const ratio = o / max;
    setSmooth(true);
    if (ratio >= THRESHOLD) {
      try {
        await onComplete();
      } finally {
        offsetLive.current = 0;
        setOffset(0);
      }
    } else {
      offsetLive.current = 0;
      setOffset(0);
    }
  }

  function onPointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    setSmooth(true);
    offsetLive.current = 0;
    setOffset(0);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* */
    }
  }

  const pct = maxO > 0 ? Math.round((offset / maxO) * 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`${styles.track} ${disabled || busy ? styles.trackDisabled : ""}`}
    >
      <span className={styles.trackLabel}>
        {busy ? "Cerrando caja…" : "Deslizá para cerrar caja"}
      </span>
      <div
        className={`${styles.thumb} ${smooth ? styles.thumbSmooth : ""}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        role="slider"
        tabIndex={disabled || busy ? -1 : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Deslizar para confirmar cierre de caja"
      >
        {busy ? (
          <Loader2 className={styles.spin} size={22} aria-hidden />
        ) : (
          <Lock size={20} aria-hidden />
        )}
      </div>
    </div>
  );
}
