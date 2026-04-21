import {
  QrCode,
  CalendarDays,
  Info,
  MapPin,
  Smartphone,
  Sparkles,
  DoorOpen,
  Camera,
} from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import HeroBanner from "@/components/ui/HeroBanner";
import btnStyles from "@/components/ui/Button.module.css";
import { isMembershipCritical, membershipCriticalCardNote } from "@/lib/membershipUi";
import StreakBanner from "./StreakBanner";
import ScanFab from "./ScanFab";
import BmiCalculator from "./BmiCalculator";
import styles from "./ClientHome.module.css";

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
}: {
  name: string;
  status: Status;
  days: number;
  membership: MembershipLite;
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

  return (
    <>
      <HeroBanner
        videoSrc="/GymBackUser.mp4"
        className={heroCardClass}
        overlay="strong"
      >
        <div className={styles.memHeroStack}>
          <h1 className={styles.bannerTitle}>¡Hola, {first}! 👊</h1>

          <div className={styles.memHeroDivider} aria-hidden />

          <div className={styles.memHeroBlock}>
            <div className={styles.memHeroRow}>
              <span className={styles.memHeroStatLabel}>
                <CalendarDays size={14} /> Días restantes
              </span>
              <Badge tone={active ? (critical ? "danger" : "success") : "danger"} dot>
                {active ? (critical ? "¡Por vencer!" : "Activa") : "Vencida"}
              </Badge>
            </div>
            <div className={styles.memHeroBig}>
              <span
                className={`${styles.memHeroBigVal} ${
                  active && !critical ? styles.memHeroBigOk : styles.memHeroBigBad
                }`}
              >
                {days}
              </span>
              <span className={styles.memHeroBigUnit}>
                día{days === 1 ? "" : "s"}
              </span>
            </div>
            <p
              className={`${styles.memHeroFoot} ${
                critical ? styles.memHeroFootWarn : ""
              }`}
            >
              {active
                ? critical
                  ? membershipCriticalCardNote(days)
                  : "¡Estás activo! Aprovechá cada dia 💪"
                : "Tu plan está vencido. Renová para volver a entrenar."}
            </p>
            {membership && (
              <div className={styles.memHeroRange}>
                <span>
                  Desde {new Date(membership.startDate).toLocaleDateString()}
                </span>
                <span>
                  Hasta {new Date(membership.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </HeroBanner>

      <div className={styles.dashboardStack}>
        <div className={`${styles.actionCard} ${styles.qrCtaCard}`}>
          <div className={styles.qrCtaIcon} aria-hidden>
            <QrCode size={22} />
          </div>
          <h2 className={styles.qrCtaTitle}>Ingreso con QR</h2>
          <p className={styles.hint}>
            En recepción está el totem con el código. Abrí el escáner y tu
            entrada queda registrada al instante.
          </p>
          <Link
            href="/scan"
            className={`${btnStyles.btn} ${btnStyles.primary} ${btnStyles["size-xl"]} ${btnStyles.full}`}
          >
            <Camera size={20} strokeWidth={2.25} aria-hidden />
            Escanear QR de ingreso
          </Link>
        </div>

        <StreakBanner firstName={first} />

        <BmiCalculator />
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
            <span>Llegás al gym.</span>
          </li>
          <li className={styles.hiwItem}>
            <span className={styles.hiwIcon}>
              <Smartphone size={16} />
            </span>
            <span>
              Tocás <strong>Escanear QR de ingreso</strong> y apuntás al código
              del totem con la cámara.
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
            <span>Pasás a la sala y a entrenar.</span>
          </li>
        </ol>
      </div>

      <ScanFab />
    </>
  );
}
