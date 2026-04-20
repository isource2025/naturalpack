"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, CalendarDays, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import KioskConfetti from "../kiosk/KioskConfetti";
import { isMembershipCritical } from "@/lib/membershipUi";
import styles from "./NotifyStaffSuccess.module.css";

type Kind =
  | { kind: "granted"; name: string; days: number }
  | { kind: "denied"; message: string };

type Props = Kind & {
  onClose: () => void;
  /** Si pasa tiempo sin cerrar manual, se auto-cierra. 0 = desactivado. */
  autoCloseMs?: number;
};

/**
 * Pantalla fullscreen que confirma el ingreso al gym. Se muestra sobre TODO
 * el dashboard cuando el socio toca "Avisar al personal" (tiene el mismo
 * sentido que la de /scan: darte un momento "visible" al ingresar).
 *
 * Evita emojis en el cuerpo para que las smart TV / screens que no cargan
 * la fuente emoji completa no rendericen cajas vacías.
 */
export default function NotifyStaffSuccess(props: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!props.autoCloseMs || props.autoCloseMs <= 0) return;
    const id = setTimeout(props.onClose, props.autoCloseMs);
    return () => clearTimeout(id);
  }, [props]);

  const granted = props.kind === "granted";
  const low =
    granted && isMembershipCritical((props as { days: number }).days);

  return (
    <div
      className={`${styles.overlay} ${granted ? "" : styles.overlayDenied}`}
      role="dialog"
      aria-modal="true"
      aria-label={granted ? "Ingreso registrado" : "Acceso denegado"}
    >
      {granted && !low && <KioskConfetti />}

      <div className={styles.inner}>
        <div
          className={`${styles.iconCircle} ${
            granted ? "" : styles.iconCircleDenied
          }`}
        >
          {granted ? <CheckCircle2 size={56} /> : <XCircle size={56} />}
        </div>

        <span className={styles.badge}>
          {granted ? (
            low ? (
              <>
                <AlertTriangle size={16} /> Membresía por vencer
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> El personal ya te vio
              </>
            )
          ) : (
            <>
              <XCircle size={16} /> Acceso denegado
            </>
          )}
        </span>

        <h1 className={styles.title}>
          {granted ? `¡A entrenar, ${props.name}!` : "No pudimos registrarte"}
        </h1>

        {granted ? (
          <>
            <div className={styles.days}>
              <span
                className={`${styles.daysNum} ${low ? styles.daysNumLow : ""}`}
              >
                {props.days}
              </span>
              <span className={styles.daysUnit}>
                día{props.days === 1 ? "" : "s"} de gym por delante
              </span>
            </div>

            {low && (
              <p className={styles.warnLine}>
                <AlertTriangle size={16} />
                Te quedan pocos días. Renová en recepción cuanto antes.
              </p>
            )}

            <p className={styles.subtitle}>
              Pasá a la sala. Te esperamos dentro.
            </p>
          </>
        ) : (
          <p className={styles.subtitle}>
            {props.message}. Hablá con el personal en recepción.
          </p>
        )}

        <div className={styles.actions}>
          <Button
            size="lg"
            variant={granted ? "primary" : "secondary"}
            leftIcon={<CalendarDays size={18} />}
            onClick={props.onClose}
          >
            Volver al panel
          </Button>
        </div>
      </div>
    </div>
  );
}
