import Link from "next/link";
import {
  Dumbbell,
  QrCode,
  Zap,
  Sparkles,
  ArrowRight,
  Building2,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/Button";
import styles from "./home.module.css";

export default function HomePage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "NaturalPack";
  return (
    <main className={styles.hero}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.bgScrim} aria-hidden />

      <header className={styles.topbar}>
        <span className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <span className={styles.brandText}>{appName}</span>
        </span>
        <div className={styles.topbarRight}>
          <Link href="/login" className={styles.loginLink}>
            <Button variant="ghost" size="sm">
              <span className={styles.loginLabelLong}>Iniciar sesión</span>
              <span className={styles.loginLabelShort}>Entrar</span>
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" rightIcon={<ArrowRight size={16} />}>
              <span className={styles.ctaLabelLong}>Crear cuenta</span>
              <span className={styles.ctaLabelShort}>Crear</span>
            </Button>
          </Link>
        </div>
      </header>

      <section className={styles.content}>
        <h1 className={styles.title}>
          Vamos al gym <span className={styles.titleHighlight}>, sin
          vueltas.</span>
        </h1>
        <p className={styles.subtitle}>
          {appName} es la plataforma para que cualquier gimnasio maneje sus
          socios, accesos y pagos desde un panel — y para que los socios entren
          con un QR en segundos. Abre tu gimnasio o únete a uno existente.
        </p>

        <div className={styles.pathRow}>
          <Link href="/register?as=owner" className={styles.pathCard}>
            <span className={styles.pathIcon} aria-hidden>
              <Building2 size={22} />
            </span>
            <span className={styles.pathBadge}>Para dueños</span>
            <span className={styles.pathTitle}>Tengo un gimnasio</span>
            <span className={styles.pathDesc}>
              Abre tu gimnasio en la plataforma, activa el tótem con QR y
              empieza a registrar socios y pagos hoy mismo.
            </span>
            <span className={styles.pathCta}>
              Abrir mi gimnasio <ArrowRight size={16} />
            </span>
          </Link>

          <Link href="/register?as=client" className={styles.pathCard}>
            <span
              className={`${styles.pathIcon} ${styles.pathIconAlt}`}
              aria-hidden
            >
              <UserRound size={22} />
            </span>
            <span className={styles.pathBadge}>Para socios</span>
            <span className={styles.pathTitle}>Voy a un gimnasio</span>
            <span className={styles.pathDesc}>
              Crea tu cuenta, únete al gimnasio al que vas con el código
              que te pasa el personal y empieza a entrar con tu QR.
            </span>
            <span className={styles.pathCta}>
              Unirme a un gym <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden>
            <QrCode size={22} />
          </span>
          <h3 className={styles.featureTitle}>QR en pantalla</h3>
          <p className={styles.featureDesc}>
            Cada gimnasio tiene su propio tótem con un QR rotativo. El socio lo
            escanea con la cámara del teléfono y listo.
          </p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden>
            <Zap size={22} />
          </span>
          <h3 className={styles.featureTitle}>Feedback instantáneo</h3>
          <p className={styles.featureDesc}>
            La pantalla saluda al socio en tiempo real con su nombre y los días
            restantes de membresía. Todo aislado por gimnasio.
          </p>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon} aria-hidden>
            <Dumbbell size={22} />
          </span>
          <h3 className={styles.featureTitle}>Un panel por gym</h3>
          <p className={styles.featureDesc}>
            Registra socios, acepta pagos, revisa accesos y cierra caja. Cada
            admin solo ve lo suyo.
          </p>
        </div>
      </section>
    </main>
  );
}
