/**
 * Pricing central del gym.
 * Se usa desde el alta de socios (NewUserForm) para sugerir el monto en
 * base a los días de membresía. Si más adelante quieres pricing por gym
 * (multi-tenant), convierte `PRICE_TIERS` en un registro en BD y hazlo
 * cargar por gymId; la API pública (`suggestPrice`) se mantiene igual.
 */

export type PriceTier = {
  days: number;
  amount: number; // ARS en entero (sin decimales)
  label: string;
};

export const PRICE_TIERS: PriceTier[] = [
  { days: 7, amount: 8000, label: "Semana" },
  { days: 15, amount: 14000, label: "Quincena" },
  { days: 30, amount: 25000, label: "Mensual" },
  { days: 60, amount: 48000, label: "Bimestral" },
  { days: 90, amount: 70000, label: "Trimestral" },
  { days: 180, amount: 130000, label: "Semestral" },
  { days: 365, amount: 250000, label: "Anual" },
];

export type PriceSuggestion = {
  amount: number;
  rate: number; // ARS por día efectivo aplicado
  exact: boolean;
  tierLabel: string | null;
  baseTier: PriceTier | null; // el tier usado como referencia
};

/**
 * Dado un número de días, devuelve el monto sugerido.
 * - Si coincide exacto con un tier, usa el precio del tier.
 * - Si no, toma el tier más cercano hacia abajo (≥7 días) y aplica su
 *   tarifa diaria al total. Para < 7 días usa el tier semanal como piso.
 * - Redondea a múltiplo de $100 para números "limpios".
 */
export function suggestPrice(days: number): PriceSuggestion {
  if (!Number.isFinite(days) || days <= 0) {
    return { amount: 0, rate: 0, exact: false, tierLabel: null, baseTier: null };
  }
  const sorted = [...PRICE_TIERS].sort((a, b) => a.days - b.days);
  const exact = sorted.find((t) => t.days === days);
  if (exact) {
    return {
      amount: exact.amount,
      rate: exact.amount / exact.days,
      exact: true,
      tierLabel: exact.label,
      baseTier: exact,
    };
  }
  // tier más cercano hacia abajo; si days < primer tier, usamos el primero
  let base = sorted[0]!;
  for (const t of sorted) if (t.days <= days) base = t;
  const rate = base.amount / base.days;
  const raw = rate * days;
  const amount = Math.max(base.amount, Math.round(raw / 100) * 100);
  return {
    amount,
    rate,
    exact: false,
    tierLabel: `${base.label} pro-rata`,
    baseTier: base,
  };
}

export function formatARS(n: number) {
  return `$${n.toLocaleString("es-AR")}`;
}
