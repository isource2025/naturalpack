import Link from "next/link";
import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import styles from "./Nav.module.css";

export type NavProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  brandHref?: string;
};

/** Barra superior con marca a la izquierda y slot de acciones a la derecha. */
export default function Nav({
  title,
  subtitle,
  actions,
  brandHref = "/dashboard",
}: NavProps) {
  return (
    <nav className={styles.nav}>
      <Link href={brandHref} className={styles.brand}>
        <span className={styles.brandMark} aria-hidden>
          <Dumbbell size={16} strokeWidth={2.5} />
        </span>
        <span className={styles.title}>
          {title ?? "NaturalPack"}
          {subtitle && (
            <span className={styles.subtitle}> · {subtitle}</span>
          )}
        </span>
      </Link>
      {actions && <div className={styles.actions}>{actions}</div>}
    </nav>
  );
}
