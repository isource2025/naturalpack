import Link from "next/link";
import {
  UserPlus,
  Users,
  Monitor,
  ListChecks,
  ArrowUpRight,
  DollarSign,
  Ticket,
  ShieldCheck,
  Wallet,
  ShieldHalf,
  Clock,
  CirclePause,
} from "lucide-react";
import HeroBanner from "@/components/ui/HeroBanner";
import GymCodeCard from "./GymCodeCard";
import styles from "./AdminHome.module.css";

export default function AdminHome({
  name,
  gymName,
  gymSlug,
  gymStatus,
  trialEndsAt,
}: {
  name: string;
  gymName: string;
  gymSlug: string;
  gymStatus?: "active" | "trial" | "suspended";
  trialEndsAt?: string | null;
}) {
  const first = name.split(" ")[0] ?? name;
  const status = gymStatus ?? "active";
  return (
    <>
      <div className={styles.headerWrap}>
        <HeroBanner videoSrc="/GymBackAdmin.mp4">
          <span className={styles.eyebrow}>
            <ShieldHalf size={14} /> Panel de {gymName}
          </span>
          <h1 className={styles.title}>¡Hola, {first}!</h1>
          <p className={styles.subtitle}>
            Este es el panel de administrador de tu gimnasio. ¿Qué hacemos hoy?
          </p>
        </HeroBanner>
      </div>

      {status !== "active" && (
        <GymStatusBanner status={status} trialEndsAt={trialEndsAt} />
      )}

      <GymCodeCard gymName={gymName} gymSlug={gymSlug} />

      <section className={styles.grid}>
        <Link href="/admin/users/new" className={styles.card}>
          <span className={styles.icon}>
            <UserPlus size={22} />
          </span>
          <h3 className={styles.cardTitle}>Registrar socio</h3>
          <p className={styles.cardDesc}>
            Crea un nuevo usuario en tu gimnasio, asigna rol y configura los
            días iniciales de membresía.
          </p>
          <span className={styles.cardCta}>
            Nuevo socio <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/admin/users" className={styles.card}>
          <span className={`${styles.icon} ${styles.neutral}`}>
            <Users size={22} />
          </span>
          <h3 className={styles.cardTitle}>Lista de socios</h3>
          <p className={styles.cardDesc}>
            Todos los socios de tu gym con el estado actual de su membresía y
            buscador rápido.
          </p>
          <span className={styles.cardCta}>
            Ver socios <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/kiosk" className={styles.card}>
          <span className={`${styles.icon} ${styles.accent}`}>
            <Monitor size={22} />
          </span>
          <h3 className={styles.cardTitle}>Modo tótem</h3>
          <p className={styles.cardDesc}>
            Pantalla fullscreen para la entrada. Muestra el QR rotativo y
            saluda al socio en tiempo real.
          </p>
          <span className={styles.cardCta}>
            Abrir tótem <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/accesses" className={styles.card}>
          <span className={`${styles.icon} ${styles.neutral}`}>
            <ListChecks size={22} />
          </span>
          <h3 className={styles.cardTitle}>Accesos</h3>
          <p className={styles.cardDesc}>
            Lista en vivo de quién entró al gym con su horario, y ficha completa
            del socio seleccionado.
          </p>
          <span className={styles.cardCta}>
            Ver accesos <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/admin/payments" className={styles.card}>
          <span className={styles.icon}>
            <DollarSign size={22} />
          </span>
          <h3 className={styles.cardTitle}>Pagos</h3>
          <p className={styles.cardDesc}>
            Acepta pagos en efectivo o transferencia y extiende automáticamente
            los días de membresía del socio.
          </p>
          <span className={styles.cardCta}>
            Registrar pago <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/admin/cash" className={styles.card}>
          <span className={styles.icon}>
            <Wallet size={22} />
          </span>
          <h3 className={styles.cardTitle}>Caja</h3>
          <p className={styles.cardDesc}>
            Efectivo del día, cierre de caja e historial de pagos agrupados por
            día con detalle.
          </p>
          <span className={styles.cardCta}>
            Ir a caja <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/admin/discounts" className={styles.card}>
          <span className={`${styles.icon} ${styles.accent}`}>
            <Ticket size={22} />
          </span>
          <h3 className={styles.cardTitle}>Descuentos</h3>
          <p className={styles.cardDesc}>
            Crea promos automáticas o por código único, activa/desactiva con un
            toque y revisa los usos.
          </p>
          <span className={styles.cardCta}>
            Gestionar <ArrowUpRight size={14} />
          </span>
        </Link>

        <Link href="/admin/audit" className={styles.card}>
          <span className={`${styles.icon} ${styles.neutral}`}>
            <ShieldCheck size={22} />
          </span>
          <h3 className={styles.cardTitle}>Auditoría</h3>
          <p className={styles.cardDesc}>
            Historial interno: quién registró pagos, creó descuentos o socios, y
            cuándo lo hizo.
          </p>
          <span className={styles.cardCta}>
            Ver log <ArrowUpRight size={14} />
          </span>
        </Link>
      </section>
    </>
  );
}

function GymStatusBanner({
  status,
  trialEndsAt,
}: {
  status: "trial" | "suspended";
  trialEndsAt?: string | null;
}) {
  if (status === "suspended") {
    return (
      <div className={`${styles.statusBanner} ${styles.statusSuspended}`}>
        <CirclePause size={18} />
        <div>
          <strong>Gimnasio suspendido</strong>
          <p>
            Las altas de socios y el registro de pagos están bloqueados.
            Contactanos para reactivar la cuenta.
          </p>
        </div>
      </div>
    );
  }
  const daysLeft = trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;
  return (
    <div className={`${styles.statusBanner} ${styles.statusTrial}`}>
      <Clock size={18} />
      <div>
        <strong>Período de prueba</strong>
        <p>
          {daysLeft !== null
            ? `Te quedan ${daysLeft} día${daysLeft === 1 ? "" : "s"} de prueba.`
            : "Estás en período de prueba."}{" "}
          Mantén tu cuenta activa registrando tu pago en NaturalPack.
        </p>
      </div>
    </div>
  );
}
