import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Card.module.css";

type Padding = "none" | "sm" | "md" | "lg";

type BaseProps = {
  padding?: Padding;
  glow?: boolean;
  className?: string;
  children: ReactNode;
};

function padClass(p: Padding | undefined) {
  switch (p) {
    case "none":
      return null;
    case "sm":
      return styles.padSm;
    case "lg":
      return styles.padLg;
    case "md":
    default:
      return styles.pad;
  }
}

/** Card básica (div). */
export function Card({
  padding = "md",
  glow,
  className,
  children,
  ...rest
}: BaseProps & ComponentPropsWithoutRef<"div">) {
  const cls = [styles.card, padClass(padding), glow ? styles.glow : null, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

/** Card clickeable que navega (usa next/link). */
export function LinkCard({
  href,
  padding = "md",
  glow,
  className,
  children,
  ...rest
}: BaseProps & { href: string } & Omit<
    ComponentPropsWithoutRef<typeof Link>,
    "href" | "className" | "children"
  >) {
  const cls = [
    styles.card,
    styles.interactive,
    padClass(padding),
    glow ? styles.glow : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export default Card;
