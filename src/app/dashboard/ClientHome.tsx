import {
  QrCode,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Smartphone,
  Sparkles,
  DoorOpen,
  Camera,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import HeroBanner from "@/components/ui/HeroBanner";
import { isMembershipCritical, membershipCriticalCardNote } from "@/lib/membershipUi";
import StreakBanner from "./StreakBanner";
import styles from "./ClientHome.module.css";
import { TRAINING_PLANS } from "@/lib/trainingPlans";
import TrainingPanels from "./TrainingPanels";

type MembershipLite = {
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  daysRemaining: number;
} | null;

type Status = "active" | "expired";

export default function ClientHome({
  name,
  status,
  days,
  membership,
  trainingProfile,
}: {
  name: string;
  status: Status;
  days: number;
  membership: MembershipLite;
  trainingProfile: {
    level: "novato" | "intermedio" | "avanzado";
    goal: "intensidad" | "fuerza" | "ganancia_musculo";
    planKey: string;
    onboardingCompletedAt: string;
  } | null;
}) {
  const first = name.split(" ")[0] ?? name;
  const active = status === "active";
  const critical = active && isMembershipCritical(days);
  const heroCardClass = [
    styles.heroMembership,
    active
      ? critical
        ? styles.heroMembershipCritical
        : styles.heroMembershipActive
      : styles.heroMembershipExpired,
  ].join(" ");
  const assignedPlan = trainingProfile
    ? TRAINING_PLANS.find((p) => p.key === trainingProfile.planKey) ?? null
    : null;
  const goalLabel =
    trainingProfile?.goal === "ganancia_musculo"
      ? "ganancia de músculo"
      : trainingProfile?.goal ?? "";

  return (
    <>
      <HeroBanner
        videoSrc="/GymBackUser.mp4"
        className={heroCardClass}
        overlay="strong"
      >
        <div className={styles.memHeroStack}>
          <div className={styles.gymPassCard}>
            <div className={styles.gymPassGlow} aria-hidden />
            <div className={styles.gymPassTop}>
              <div className={styles.gymPassMember}>
                <span className={styles.gymPassIcon} aria-hidden>
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <p className={styles.gymPassKicker}>Gym Pass</p>
                  <h1 className={styles.gymPassName}>{first}</h1>
                </div>
              </div>
              <Badge tone={active ? (critical ? "danger" : "success") : "danger"} dot>
                {active ? (critical ? "Por vencer" : "Activa") : "Vencida"}
              </Badge>
            </div>

            <div className={styles.gymPassMain}>
              <div className={styles.gymPassDays}>
                <span
                  className={`${styles.gymPassDaysValue} ${
                    active && !critical ? styles.gymPassDaysOk : styles.gymPassDaysBad
                  }`}
                >
                  {days}
                </span>
                <span className={styles.gymPassDaysLabel}>
                  dia{days === 1 ? "" : "s"} restantes
                </span>
              </div>
              <div className={styles.gymPassStatus}>
                <span>
                  {active ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                  {active ? "Acceso habilitado" : "Acceso pausado"}
                </span>
                <span>
                  <CalendarDays size={15} />
                  Membresia
                </span>
              </div>
            </div>

            <p className={`${styles.gymPassNote} ${critical ? styles.gymPassNoteWarn : ""}`}>
              {active
                ? critical
                  ? membershipCriticalCardNote(days)
                  : "Tu pase esta activo. Entra, escanea y entrena."
                : "Tu plan esta vencido. Renueva para volver a entrenar."}
            </p>

            {membership && (
              <div className={styles.gymPassDates}>
                <span>
                  <small>Desde</small>
                  {new Date(membership.startDate).toLocaleDateString()}
                </span>
                <span>
                  <small>Hasta</small>
                  {new Date(membership.endDate).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className={styles.gymPassStrip}>
              <span>NaturalPack</span>
              <span>
                <Sparkles size={13} /> Member access
              </span>
            </div>
          </div>
        </div>
      </HeroBanner>

      <div className={styles.dashboardStack}>
        <div className={`${styles.actionCard} ${styles.qrCtaCard}`}>
          <div className={styles.qrCtaTop}>
            <div className={styles.qrCtaIcon} aria-hidden>
              <QrCode size={22} />
            </div>
            <div className={styles.qrCtaText}>
              <h2 className={styles.qrCtaTitle}>Ingreso con QR</h2>
              <p className={styles.hint}>
                En recepción está el tótem con el código. Abre el escáner y tu
                entrada queda registrada al instante.
              </p>
            </div>
          </div>
        </div>

        <StreakBanner firstName={first} />

        {assignedPlan && (
          <TrainingPanels
            plan={assignedPlan}
            level={trainingProfile?.level ?? ""}
            goalLabel={goalLabel}
          />
        )}
      </div>

      <h2 className={styles.sectionTitle}>Cómo funciona</h2>
      <div className={styles.actionCard}>
        <h3 className={styles.actionTitle}>
          <Info size={18} /> Tu ingreso al gym
        </h3>
        <ol className={styles.hiwList}>
          <li className={styles.hiwItem}>
            <span className={styles.hiwIcon}>
              <MapPin size={16} />
            </span>
            <span>Llegas al gym.</span>
          </li>
          <li className={styles.hiwItem}>
            <span className={styles.hiwIcon}>
              <Smartphone size={16} />
            </span>
            <span>
              Tocas <strong>Escanear QR de ingreso</strong> y apuntas al código
              del tótem con la cámara.
            </span>
          </li>
          <li className={styles.hiwItem}>
            <span className={styles.hiwIcon}>
              <Sparkles size={16} />
            </span>
            <span>La pantalla te saluda por tu nombre.</span>
          </li>
          <li className={styles.hiwItem}>
            <span className={styles.hiwIcon}>
              <DoorOpen size={16} />
            </span>
            <span>Pasas a la sala y a entrenar.</span>
          </li>
        </ol>
      </div>

      <div className={styles.scanFloatWrap}>
        <Link
          href="/scan"
          className={styles.scanFloatBtn}
          aria-label="Escanear QR de ingreso al gym"
        >
          <Camera size={22} strokeWidth={2.25} aria-hidden />
          Escanear QR de ingreso
        </Link>
      </div>
    </>
  );
}
