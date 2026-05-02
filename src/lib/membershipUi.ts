/**
 * Umbral inclusive: membresía activa con 1–3 días restantes → alerta roja en UI.
 */
export const MEMBERSHIP_CRITICAL_MAX_DAYS = 3;

export function isMembershipCritical(daysRemaining: number): boolean {
  return (
    Number.isFinite(daysRemaining) &&
    daysRemaining > 0 &&
    daysRemaining <= MEMBERSHIP_CRITICAL_MAX_DAYS
  );
}

export function membershipCriticalBannerLine(firstName: string, days: number) {
  if (days === 1) {
    return `¡${firstName}, solo te queda 1 día de membresía! Pasa por recepción 🚨`;
  }
  return `¡${firstName}, te quedan ${days} días de membresía! Renueva antes de que venza 🚨`;
}

export function membershipCriticalCardNote(days: number) {
  if (days === 1) return "⏳ Último día — pasa por recepción sin falta.";
  return `⏳ Quedan ${days} días — renueva en recepción 🔴`;
}

export function membershipCriticalKioskTitle() {
  return "⚠️ Membresía por vencer";
}

export function membershipCriticalKioskHint(days: number) {
  if (days === 1) return "Solo te queda 1 día — pasa por caja o recepción 🔴";
  return `Te quedan ${days} días — renueva en recepción 🔴`;
}

/** Texto después del contador de días en la pantalla de escaneo del socio. */
export function membershipCriticalScannerRenewHint() {
  return "⚠️ Renueva en recepción cuanto antes 🔴";
}
