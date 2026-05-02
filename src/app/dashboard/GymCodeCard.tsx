"use client";

import { useState } from "react";
import { Copy, Check, Share2, Hash } from "lucide-react";
import styles from "./GymCodeCard.module.css";

/**
 * Tarjeta informativa con el código público del gimnasio. El dueño se lo
 * comparte a sus socios para que se registren en /register y queden
 * asociados a su gym. Copiable con un toque.
 */
export default function GymCodeCard({
  gymName,
  gymSlug,
}: {
  gymName: string;
  gymSlug: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(gymSlug);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  async function share() {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/register?as=client`;
    const text = `Únete a ${gymName} en NaturalPack. Código del gym: ${gymSlug}\nRegístrate aquí: ${shareUrl}`;
    const nav = window.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    try {
      if (typeof nav.share === "function") {
        await nav.share({ title: `Únete a ${gymName}`, text, url: shareUrl });
      } else {
        await nav.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* noop */
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.icon} aria-hidden>
        <Hash size={18} />
      </div>
      <div className={styles.body}>
        <span className={styles.kicker}>Código de tu gimnasio</span>
        <div className={styles.codeRow}>
          <code className={styles.code}>{gymSlug}</code>
          <button
            type="button"
            onClick={copy}
            className={styles.copyBtn}
            aria-label="Copiar código"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className={styles.hint}>
          Pasale este código a tus socios cuando se registren en{" "}
          <strong>&quot;Voy a un gimnasio&quot;</strong>. Así quedan asociados
          a <strong>{gymName}</strong>.
        </p>
      </div>
      <button type="button" onClick={share} className={styles.shareBtn}>
        <Share2 size={14} /> Compartir
      </button>
    </div>
  );
}
