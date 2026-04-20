"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "../auth.module.css";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

/** Solo permitimos paths internos (evita open-redirect). */
function sanitizeNext(raw: string | null): string {
  if (!raw) return "/dashboard";
  // Path relativo, no protocol-relative (//otro.com) ni URL absoluta.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = sanitizeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Error al iniciar sesión");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <span className={styles.eyebrow}>¡Bienvenido de nuevo!</span>
      <h1 className={styles.title}>Entrá y a entrenar 💪</h1>
      <p className={styles.subtitle}>
        Ingresá con tu cuenta para acceder a tu panel.
      </p>

      <form onSubmit={onSubmit} className={styles.form}>
        <Input
          type="email"
          name="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="juan@gym.com"
          leftIcon={<Mail size={18} />}
        />
        <Input
          type="password"
          name="password"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock size={18} />}
        />

        {error && <div className="error">{error}</div>}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={<ArrowRight size={18} />}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </Button>

        <p className={styles.footer}>
          ¿Todavía no tenés cuenta? <Link href="/register">Creala en 30s</Link>
        </p>
      </form>
    </>
  );
}
