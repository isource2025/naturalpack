"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  History,
  Save,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Input from "@/components/ui/Input";
import styles from "./BmiCalculator.module.css";

type CategoryKey = "low" | "normal" | "over" | "obese";
type BmiHistoryEntry = {
  id: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: CategoryKey;
  measuredAt: string;
};

function parseNum(raw: string): number | null {
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function computeBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function categoryFor(bmi: number): {
  key: CategoryKey;
  label: string;
  cheer: string;
} {
  if (bmi < 18.5) {
    return {
      key: "low",
      label: "Bajo peso (referencia IMC)",
      cheer:
        "Cada cuerpo es distinto. Si quieres subir de peso, mejor con alguien que te oriente (nutricionista o médico) que a fuerza de improvisar.",
    };
  }
  if (bmi < 25) {
    return {
      key: "normal",
      label: "Rango que suele llamarse “saludable”",
      cheer:
        "Buen punto para darle con todo en el gym: el IMC es solo una referencia, no la verdad absoluta.",
    };
  }
  if (bmi < 30) {
    return {
      key: "over",
      label: "Sobrepeso (referencia IMC)",
      cheer:
        "Si ya estás entrenando, vas bien; cambios chicos de hábito también suman, sin complicarte.",
    };
  }
  return {
    key: "obese",
    label: "Obesidad (referencia IMC)",
    cheer:
      "Paso a paso: lo importante es que sea algo que puedas mantener, no el número de un solo día.",
  };
}

function nextStepLine(
  heightCm: number,
  weightKg: number,
  key: CategoryKey
): string | null {
  const m = heightCm / 100;
  const w = weightKg;
  if (m <= 0) return null;

  if (key === "low") {
    const wNormal = 18.5 * m * m;
    const gain = wNormal - w;
    if (gain < 0.3) return null;
    return `Referencia rápida: para acercarte al piso del rango “normal” (IMC ~18,5), en la cuenta entrarían unos ~${gain.toFixed(1)} kg más — idealmente con nutricionista o médico si puedes.`;
  }
  if (key === "normal") {
    const wOver = 25 * m * m;
    const room = wOver - w;
    if (room > 0.4) {
      return `Dato extra: tienes unos ~${room.toFixed(1)} kg de “colchón” antes de cruzar a sobrepeso en esta referencia de IMC.`;
    }
    if (room < -0.4) return null;
    return "Estás cerca del techo del rango “normal” en esta referencia — sin estrés: cómo te ves y cómo te sientes también cuentan.";
  }
  if (key === "over") {
    const wNormal = 25 * m * m;
    const lose = w - wNormal;
    if (lose < 0.3) return null;
    return `Si hablamos del resultado: para acercarte al techo del rango “normal” (IMC ~25), la referencia sería unos ~${lose.toFixed(1)} kg menos — a tu ritmo, sin castigarte.`;
  }
  const w30 = 30 * m * m;
  const lose = w - w30;
  if (lose < 0.3) return null;
  return `Un paso a la vez: para pasar del tramo “obesidad” al de “sobrepeso” en esta referencia (IMC ~30), la cuenta marca unos ~${lose.toFixed(1)} kg menos — que sea sostenible es lo importante.`;
}

const TIPS: Record<CategoryKey, string[]> = {
  low: [
    "Trata de incluir proteína en cada comida y no te saltes el descanso.",
    "Fuerza + un poco de cardio suave ayudan a avanzar sin marearte.",
    "Si hace rato que no comes bien, un nutricionista te ahorra tiempo y vueltas.",
  ],
  normal: [
    "El IMC no te dice si tienes poco músculo o mucha grasa — para eso está el entrenamiento.",
    "Subir cargas y dormir bien pesan más que obsesionarte con la báscula.",
    "Si quieres bajar grasa o subir músculo, la constancia gana al número de un solo día.",
  ],
  over: [
    "Caminar + fuerza es un combo clásico que funciona.",
    "Cambios chicos en bebidas y snacks se notan sin una “dieta castigo”.",
    "Tomar agua y dormir bien te ayudan a no picar solo por cansancio.",
  ],
  obese: [
    "Empieza con algo que puedas mantener 3 meses, no 3 días.",
    "El gym suma, pero cocina y descanso son la otra gran parte.",
    "Un profesional de salud te puede ordenar metas sin llevarte a extremos.",
  ],
};

export default function BmiCalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [history, setHistory] = useState<BmiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const result = useMemo(() => {
    const h = parseNum(height);
    const w = parseNum(weight);
    if (h == null || w == null || h < 80 || h > 260 || w < 25 || w > 350) {
      return null;
    }
    const bmi = computeBmi(h, w);
    if (!Number.isFinite(bmi) || bmi < 10 || bmi > 80) return null;
    const cat = categoryFor(bmi);
    const nextStep = nextStepLine(h, w, cat.key);
    return { bmi, ...cat, nextStep };
  }, [height, weight]);

  useEffect(() => {
    setTipsOpen(false);
  }, [result?.bmi]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/bmi", { cache: "no-store" });
        const body = await res.json();
        if (!cancelled && body?.ok) {
          setHistory(body.data ?? []);
        }
      } catch {
        // El historial es progresivo; la calculadora sigue funcionando offline.
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = history[0] ?? null;
  const previous = history[1] ?? null;
  const weightDelta = latest && previous ? latest.weightKg - previous.weightKg : null;
  const bmiDelta = latest && previous ? latest.bmi - previous.bmi : null;

  async function saveCurrent() {
    const h = parseNum(height);
    const w = parseNum(weight);
    if (!result || h == null || w == null) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/me/bmi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heightCm: h, weightKg: w }),
      });
      const body = await res.json();
      if (body?.ok) {
        setHistory((entries) => [body.data, ...entries].slice(0, 12));
        setSaveMessage("Medición guardada en tu historial.");
      } else {
        setSaveMessage("No pudimos guardar la medición.");
      }
    } catch {
      setSaveMessage("No pudimos guardar la medición.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="bmi-heading">
      <div className={styles.pitch}>
        <span className={styles.pitchIcon} aria-hidden>
          <Scale size={20} />
        </span>
        <div>
          <h2 id="bmi-heading" className={styles.heading}>
            IMC y progreso corporal
          </h2>
          <p className={styles.pitchText}>
            Calcula tu IMC, guarda mediciones y mira cómo viene tu progreso.
            Es una referencia: <strong>no reemplaza</strong> al médico ni al coach.
          </p>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <div className={styles.formPanel}>
          <div className={styles.grid}>
            <Input
              label="Altura"
              name="bmi-height"
              type="number"
              inputMode="decimal"
              min={80}
              max={260}
              step={0.1}
              placeholder="ej. 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              hint="Centímetros"
            />
            <Input
              label="Peso"
              name="bmi-weight"
              type="number"
              inputMode="decimal"
              min={25}
              max={350}
              step={0.1}
              placeholder="ej. 72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              hint="Kilogramos"
            />
          </div>

          {result ? (
            <div className={`${styles.result} ${styles[`result-${result.key}`]}`}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Tu IMC</span>
                <span className={styles.resultValue}>{result.bmi.toFixed(1)}</span>
              </div>
              <p className={styles.resultCategory}>{result.label}</p>
              <p className={styles.cheer}>{result.cheer}</p>
              {result.nextStep ? (
                <p className={styles.nextStep}>{result.nextStep}</p>
              ) : null}

              <div className={styles.resultActions}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={saveCurrent}
                  disabled={saving}
                >
                  <Save size={16} aria-hidden />
                  {saving ? "Guardando..." : "Guardar medición"}
                </button>
                <button
                  type="button"
                  className={styles.tipsToggle}
                  onClick={() => setTipsOpen((v) => !v)}
                  aria-expanded={tipsOpen}
                >
                  <Activity size={16} aria-hidden />
                  {tipsOpen ? "Ocultar consejos" : "Consejos"}
                  <ChevronDown
                    size={18}
                    className={`${styles.tipsChevron} ${
                      tipsOpen ? styles.tipsChevronOpen : ""
                    }`}
                    aria-hidden
                  />
                </button>
              </div>
              {saveMessage ? <p className={styles.saveMessage}>{saveMessage}</p> : null}
              {tipsOpen ? (
                <ul className={styles.tipsList}>
                  {TIPS[result.key].map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className={styles.placeholder}>
              {height || weight
                ? "Completa altura y peso con números realistas para ver tu IMC."
                : "Escribe altura y peso: tu IMC aparece aquí al instante."}
            </p>
          )}
        </div>

        <aside className={styles.historyPanel} aria-label="Historial de IMC">
          <div className={styles.historyHeader}>
            <div>
              <p className={styles.historyKicker}>
                <History size={14} /> Historial
              </p>
              <h3 className={styles.historyTitle}>Tu progreso</h3>
            </div>
            {latest ? (
              <span className={styles.latestBadge}>{latest.bmi.toFixed(1)} IMC</span>
            ) : null}
          </div>

          {latest ? (
            <div className={styles.progressSummary}>
              <div>
                <span className={styles.summaryLabel}>Último peso</span>
                <strong>{latest.weightKg.toFixed(1)} kg</strong>
              </div>
              <div>
                <span className={styles.summaryLabel}>Cambio</span>
                <strong>
                  {weightDelta == null ? (
                    "Nuevo"
                  ) : (
                    <>
                      {weightDelta <= 0 ? (
                        <TrendingDown size={16} />
                      ) : (
                        <TrendingUp size={16} />
                      )}
                      {weightDelta > 0 ? "+" : ""}
                      {weightDelta.toFixed(1)} kg
                    </>
                  )}
                </strong>
              </div>
              <div>
                <span className={styles.summaryLabel}>IMC</span>
                <strong>
                  {bmiDelta == null
                    ? latest.bmi.toFixed(1)
                    : `${bmiDelta > 0 ? "+" : ""}${bmiDelta.toFixed(1)}`}
                </strong>
              </div>
            </div>
          ) : null}

          {historyLoading ? (
            <p className={styles.historyEmpty}>Cargando historial...</p>
          ) : history.length > 0 ? (
            <ul className={styles.historyList}>
              {history.slice(0, 6).map((entry) => (
                <li key={entry.id}>
                  <span className={styles.historyDate}>
                    <CalendarDays size={13} />
                    {new Date(entry.measuredAt).toLocaleDateString()}
                  </span>
                  <span>{entry.weightKg.toFixed(1)} kg</span>
                  <strong>{entry.bmi.toFixed(1)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.historyEmpty}>
              Guarda tu primera medición para empezar a ver progreso.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
