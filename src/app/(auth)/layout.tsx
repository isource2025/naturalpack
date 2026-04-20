import Link from "next/link";
import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import styles from "./auth.module.css";

/**
 * Layout compartido de /login y /register.
 * Split visual: panel izquierdo con la marca + el form (children) y un lado
 * derecho con el mensaje motivacional sobre la foto del gym.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bgLayer} aria-hidden />
      <div className={styles.scrim} aria-hidden />
      <div className={styles.panel}>
        <section className={styles.left}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden>
              <Dumbbell size={18} strokeWidth={2.5} />
            </span>
            NaturalPack
          </Link>
          <div className={styles.formWrap}>{children}</div>
        </section>
        <aside className={styles.right}>
          <p className={styles.quote}>
            <span className={styles.quoteAccent}>Never</span> give up.
            <br />
            Hoy <span className={styles.quoteAccent}>se entrena</span>.
          </p>
          <span className={styles.quoteCaption}>NaturalPack · fitness people</span>
        </aside>
      </div>
    </div>
  );
}
