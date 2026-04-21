import {
  BellRing,
  QrCode,
  CalendarDays,
  Flame,
  Info,
  MapPin,
  Smartphone,
  Sparkles,
  DoorOpen,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import HeroBanner from "@/components/ui/HeroBanner";
import {
  isMembershipCritical,
  membershipCriticalBannerLine,
  membershipCriticalCardNote,
} from "@/lib/membershipUi";
import NotifyStaffButton from "./NotifyStaffButton";
import StreakBanner from "./StreakBanner";
import ScanFab from "./ScanFab";
import styles from "./ClientHome.module.css";

type MembershipLite = {
  status: string;
  startDate: Date | string;
  endDate: Date | string;
  daysRemaining: number;
} | null;

type Status = "active" | "expired";

function motivationalText(status: Status, days: number, name: string) {
  const first = name.split(" ")[0] ?? name;
  if (status !== "active") {
    return "Tu membresía venció, hablá en recepción para renovarla ⚡";
  }
  if (isMembershipCritical(days)) {
    return membershipCriticalBannerLine(first, days);
  }
  if (days > 7) {
    return `¡Vamos ${first}! Tenés gym de sobra, hoy se entrena 💪`;
  }
  return `Te quedan ${days} días — ¡a romperla!`;
}

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

      <div style={{ marginTop: "1rem" }}>
        <StreakBanner firstName={first} />
      </div>

      <h2 className={styles.sectionTitle}>Entrar al gym</h2>
      <div className={styles.entryGrid}>
        <div className={`${styles.actionCard} ${styles.entryCard}`}>
          <div className={styles.entryIcon} aria-hidden>
            <BellRing size={22} />
          </div>
          <h3 className={styles.actionTitle}>Avisar al personal</h3>
          <p className={styles.hint}>
            El personal verá tu nombre en la pantalla del gym al instante.
          </p>
          <NotifyStaffButton />
        </div>

        <div className={`${styles.actionCard} ${styles.entryCard}`}>
          <div className={styles.entryIcon} aria-hidden>
            <QrCode size={22} />
          </div>
          <h3 className={styles.actionTitle}>Escaneá el QR del totem</h3>
          <p className={styles.hint}>
            Abrí la cámara nativa de tu teléfono y apuntá al QR que se muestra
            en la pantalla de entrada. Al abrir el enlace, tu ingreso queda
            registrado automáticamente — igual que el botón.
          </p>
        </div>
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
              Tocás <strong>Avisar al personal</strong> o escaneás el QR del
              totem con tu cámara.
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
