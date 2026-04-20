import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Input.module.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string | null;
  leftIcon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, id, className, ...rest },
  ref
) {
  const inputId =
    id ??
    (rest.name ? `f-${rest.name}` : `f-${Math.random().toString(36).slice(2, 8)}`);
  const cls = [
    styles.input,
    leftIcon ? styles.withLeftIcon : null,
    error ? styles.invalid : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrap}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={styles.fieldShell}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={inputId}
          ref={ref}
          className={cls}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </div>
      {error ? (
        <span className={styles.errorText}>{error}</span>
      ) : hint ? (
        <span className={styles.hint}>{hint}</span>
      ) : null}
    </div>
  );
});

export default Input;
