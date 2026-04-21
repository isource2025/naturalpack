"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, Sparkles } from "lucide-react";
import Input from "@/components/ui/Input";
import styles from "./BmiCalculator.module.css";

type CategoryKey = "low" | "normal" | "over" | "obese";

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
      cheer: "Cuerpos distintos, metas distintas — si querés subir, mejor con guía que a las piñas.",
    };
  }
  if (bmi < 25) {
    return {
      key: "normal",
      label: "Rango que suele llamarse “saludable”",
      cheer: "Buen punto de partida para romperla en el gym: acá el IMC es solo una pista.",
    };
  }
  if (bmi < 30) {
    return {
      key: "over",
      label: "Sobrepeso (referencia IMC)",
      cheer: "Entrenar acá ya es un montón; pequeños cambios de hábito suman sin drama.",
    };
  }
  return {
    key: "obese",
    label: "Obesidad (referencia IMC)",
    cheer: "Vamos de a poco: constancia vale más que el número de un día.",
  };
}

/** Texto informal: cuánto peso “falta” o “sobra” para el borde del siguiente tramo IMC (referencia). */
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
    return `Referencia rápida: para acercarte al piso del rango “normal” (IMC ~18,5), en la cuenta entrarían ~${gain.toFixed(1)} kg más — siempre con nutri o médico si podés.`;
  }
  if (key === "normal") {
    const wOver = 25 * m * m;
    const room = wOver - w;
    if (room > 0.4) {
      return `Ojo con el dato: tenés unos ~${room.toFixed(1)} kg de “colchón” antes de cruzar a sobrepeso en esta referencia IMC.`;
    }
    if (room < -0.4) return null;
    return "Estás cerca del techo del rango “normal” en esta referencia — nada de stress: el espejo y el rendimiento cuentan otra historia.";
  }
  if (key === "over") {
    const wNormal = 25 * m * m;
    const lose = w - wNormal;
    if (lose < 0.3) return null;
    return `Si hablamos solo de la cuenta: para acercarte al techo del rango “normal” (IMC ~25), la referencia serían ~${lose.toFixed(1)} kg menos — a tu ritmo, sin castigarte.`;
  }
  const w30 = 30 * m * m;
  const lose = w - w30;
  if (lose < 0.3) return null;
  return `Un paso a la vez: para pasar del tramo “obesidad” al de “sobrepeso” en esta referencia (IMC ~30), la cuenta marca ~${lose.toFixed(1)} kg menos — lo importante es que sea sostenible.`;
}

const TIPS: Record<CategoryKey, string[]> = {
  low: [
    "Priorizá prote en cada comida y no te saltees el descanso.",
    "Fuerza + algo de cardio suave te ayudan a sumar sin marearte.",
    "Si no venís comiendo bien hace rato, un nutri te ahorra vueltas.",
  ],
  normal: [
    "Acá el IMC no te dice si tenés poco músculo o mucha grasa — el gym es para eso.",
    "Progresión en cargas y dormir bien suelen marcar más que obsesionarse con la balanza.",
    "Si querés bajar grasa o subir músculo, la constancia manda más que un número puntual.",
  ],
  over: [
    "Caminata + entreno de fuerza es combo clásico que funciona.",
    "Pequeños cambios en bebidas y snacks se notan sin “dieta de tortura”.",
    "Hidratación y dormir te hacen más fácil no picar por cansancio.",
  ],
  obese: [
    "Empezá con lo que puedas sostener 3 meses, no 3 días.",
    "El gimnasio suma, pero cocina y descanso son el otro 80%.",
    "Un profesional de salud te puede ordenar metas sin extremos.",
  ],
};

export default function BmiCalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);

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

  return (
    <section className={styles.section} aria-labelledby="bmi-heading">
      <div className={styles.pitch}>
        <Sparkles size={20} className={styles.pitchIcon} aria-hidden />
        <div>
          <h2 id="bmi-heading" className={styles.heading}>
            Tu IMC en 10 segundos
          </h2>
          <p className={styles.pitchText}>
            Es el peso vs. tu altura. Sirve para ubicarte en un rangito orientativo
            — <strong>no reemplaza</strong> al médico ni al coach. Acá en el gym lo
            usamos como charla sencilla, nada de paper científico.
          </p>
        </div>
      </div>

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

          <button
            type="button"
            className={styles.tipsToggle}
            onClick={() => setTipsOpen((v) => !v)}
            aria-expanded={tipsOpen}
          >
            <Activity size={16} aria-hidden />
            {tipsOpen ? "Listo, cerramos tips" : "Tirame unos tips"}
            <ChevronDown
              size={18}
              className={`${styles.tipsChevron} ${
                tipsOpen ? styles.tipsChevronOpen : ""
              }`}
              aria-hidden
            />
          </button>
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
            ? "Completá altura y peso con números realistas y te contamos."
            : "Cargá altura y peso y te mostramos el resultado acá."}
        </p>
      )}
    </section>
  );
}
