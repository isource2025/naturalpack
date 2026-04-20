import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Badge.module.css";

type Tone = "success" | "danger" | "warn" | "neutral" | "brand";

export type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
};

export default function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const cls = [styles.badge, styles[tone], className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className={styles.dot} aria-hidden />}
      {children}
    </span>
  );
}
