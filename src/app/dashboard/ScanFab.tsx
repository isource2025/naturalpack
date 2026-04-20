import Link from "next/link";
import { ScanQrCode } from "lucide-react";
import styles from "./ScanFab.module.css";

/**
 * FAB flotante (bottom-right) que lleva al scanner.
 * Abre la cámara para escanear el QR del totem sin tener que salir de la app.
 */
export default function ScanFab() {
  return (
    <Link
      href="/scan"
      className={styles.fab}
      aria-label="Escanear QR del totem"
      title="Escanear QR"
    >
      <span className={styles.iconBox} aria-hidden>
        <ScanQrCode size={30} strokeWidth={2.25} />
      </span>
      <span className={styles.label}>Escanear QR</span>
    </Link>
  );
}
