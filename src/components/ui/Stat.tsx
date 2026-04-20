import type { ReactNode } from "react";
import styles from "./Stat.module.css";

type Tone = "default" | "success" | "danger" | "accent";

export type StatProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: Tone;
  className?: string;
};

export default function Stat({
  label,
  value,
  unit,
  tone = "default",
  className,
}: StatProps) {
  const toneCls = tone !== "default" ? styles[`tone-${tone}`] : null;
  const cls = [styles.wrap, toneCls, className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <span className={styles.label}>{label}</span>
      <span>
        <span className={styles.value}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </div>
  );
}
