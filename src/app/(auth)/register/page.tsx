"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Building2,
  UserRound,
  Dumbbell,
  Hash,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import styles from "../auth.module.css";
import regStyles from "./register.module.css";

type Mode = "owner" | "client";
type Step = "select" | "form";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterWizard />
    </Suspense>
  );
}

function RegisterWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const initialAs = params.get("as");
  const initialMode: Mode | null =
    initialAs === "owner" || initialAs === "client" ? initialAs : null;

  const [step, setStep] = useState<Step>(initialMode ? "form" : "select");
  const [mode, setMode] = useState<Mode>(initialMode ?? "client");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gymName, setGymName] = useState("");
  const [gymSlug, setGymSlug] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function pick(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setStep("form");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body =
        mode === "owner"
          ? { mode, name, email, password, gymName: gymName.trim() }
          : {
              mode,
              name,
              email,
              password,
              gymSlug: gymSlug.trim().toLowerCase(),
            };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error?.message || "Error al registrarse");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  if (step === "select") {
    return <ModeSelector onPick={pick} />;
  }

  const isOwner = mode === "owner";

  return (
    <>
      <button
        type="button"
        onClick={() => setStep("select")}
        className={regStyles.backBtn}
      >
        <ArrowLeft size={14} /> Cambiar tipo de cuenta
      </button>

      <span className={styles.eyebrow}>
        {isOwner ? "Abrí tu gimnasio" : "Sumate a un gimnasio"}
      </span>
      <h1 className={styles.title}>
        {isOwner ? "Creá tu cuenta de dueño" : "Creá tu cuenta de socio"}
      </h1>
      <p className={styles.subtitle}>
        {isOwner
          ? "Te damos de alta como admin del gym y generamos tu código para que tus socios se registren."
          : "Ingresá el código del gym (te lo pasa el personal) y quedás listo para entrar con tu QR."}
      </p>

      <form onSubmit={onSubmit} className={styles.form}>
        <Input
          type="text"
          name="name"
          label="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          placeholder={isOwner ? "Juan Pérez" : "María García"}
          leftIcon={<User size={18} />}
        />
        <Input
          type="email"
          name="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder={isOwner ? "juan@migym.com" : "maria@mail.com"}
          leftIcon={<Mail size={18} />}
        />
        <Input
          type="password"
          name="password"
          label="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          leftIcon={<Lock size={18} />}
          hint="Elegí algo que recuerdes, podés cambiarla después."
        />

        {isOwner ? (
          <Input
            type="text"
            name="gymName"
            label="Nombre del gimnasio"
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            required
            minLength={2}
            placeholder="Crossfit Zona Norte"
            leftIcon={<Dumbbell size={18} />}
            hint="Usamos este nombre para todo: totem, panel y código del gym."
          />
        ) : (
          <Input
            type="text"
            name="gymSlug"
            label="Código del gimnasio"
            value={gymSlug}
            onChange={(e) => setGymSlug(e.target.value)}
            required
            minLength={1}
            placeholder="crossfit-zona-norte"
            leftIcon={<Hash size={18} />}
            hint="Se lo pedís al personal del gym al que asistís."
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        )}

        {error && <div className="error">{error}</div>}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={<ArrowRight size={18} />}
        >
          {loading
            ? "Creando cuenta…"
            : isOwner
              ? "Abrir mi gimnasio"
              : "Sumarme al gym"}
        </Button>

        <p className={styles.footer}>
          ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
        </p>
      </form>
    </>
  );
}

function ModeSelector({ onPick }: { onPick: (m: Mode) => void }) {
  return (
    <>
      <span className={styles.eyebrow}>Creá tu cuenta</span>
      <h1 className={styles.title}>¿Cómo vas a usar la plataforma?</h1>
      <p className={styles.subtitle}>
        Elegí la opción que mejor te describe. Podés cambiarla antes de crear
        la cuenta.
      </p>

      <div className={regStyles.choiceGrid}>
        <button
          type="button"
          className={regStyles.choice}
          onClick={() => onPick("owner")}
        >
          <span className={regStyles.choiceIcon} aria-hidden>
            <Building2 size={22} />
          </span>
          <span className={regStyles.choiceBadge}>Para dueños</span>
          <span className={regStyles.choiceTitle}>Tengo un gimnasio</span>
          <span className={regStyles.choiceDesc}>
            Abrí tu gym en la plataforma, obtené tu código para compartir con
            socios y gestioná todo desde el panel de admin.
          </span>
          <span className={regStyles.choiceCta}>
            Soy dueño <ArrowRight size={14} />
          </span>
        </button>

        <button
          type="button"
          className={regStyles.choice}
          onClick={() => onPick("client")}
        >
          <span
            className={`${regStyles.choiceIcon} ${regStyles.choiceIconAlt}`}
            aria-hidden
          >
            <UserRound size={22} />
          </span>
          <span className={regStyles.choiceBadge}>Para socios</span>
          <span className={regStyles.choiceTitle}>Voy a un gimnasio</span>
          <span className={regStyles.choiceDesc}>
            Creá tu cuenta, ingresá el código del gym al que asistís y empezá
            a registrar tus ingresos con el QR.
          </span>
          <span className={regStyles.choiceCta}>
            Soy socio <ArrowRight size={14} />
          </span>
        </button>
      </div>

      <p className={styles.footer}>
        ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
      </p>
    </>
  );
}
