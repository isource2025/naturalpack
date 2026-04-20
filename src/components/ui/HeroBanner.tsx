"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./HeroBanner.module.css";

type Props = {
  /** Ruta pública del video (ej. "/GymBackUser.mp4"). */
  videoSrc: string;
  /** Ruta opcional a un poster (imagen de respaldo mientras carga). */
  poster?: string;
  children: ReactNode;
  className?: string;
  /**
   * Overlay más oscuro sobre el video (mejor contraste si el fondo tiene
   * líneas claras o mucho detalle).
   */
  overlay?: "default" | "strong";
};

/**
 * HeroBanner — banner con video de fondo, overlay y contenido encima.
 * - autoplay + muted + loop + playsInline para que funcione en iOS/Android.
 * - Forzamos .play() tras montar porque algunos navegadores ignoran autoplay
 *   cuando el video fue precargado con visibilidad oculta.
 * - Respeta prefers-reduced-motion (el CSS oculta el video).
 */
export default function HeroBanner({
  videoSrc,
  poster,
  children,
  className,
  overlay = "default",
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        /* ignoramos: algunos navegadores bloquean autoplay aun muted */
      });
    }
  }, []);

  return (
    <section
      className={`${styles.banner}${className ? ` ${className}` : ""}`}
      data-overlay={overlay}
      aria-label="Banner"
    >
      <video
        ref={ref}
        className={styles.video}
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className={styles.content}>{children}</div>
    </section>
  );
}
