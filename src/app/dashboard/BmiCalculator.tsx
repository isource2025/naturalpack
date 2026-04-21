"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import Input from "@/components/ui/Input";
import styles from "./BmiCalculator.module.css";

function parseNum(raw: string): number | null {
  const n = parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function computeBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function bmiCategory(bmi: number): {
  key: "low" | "normal" | "over" | "obese";
  label: string;
  hint: string;
} {
  if (bmi < 18.5) {
    return {
      key: "low",
      label: "Bajo peso",
      hint: "Consultá con un profesional si querés ganar masa de forma saludable.",
    };
  }
  if (bmi < 25) {
    return {
      key: "normal",
      label: "Peso normal",
      hint: "Rango asociado a menor riesgo según la OMS (referencia general).",
    };
  }
  if (bmi < 30) {
    return {
      key: "over",
      label: "Sobrepeso",
      hint: "La actividad y la alimentación ayudan; un médico puede orientarte mejor.",
    };
  }
  return {
    key: "obese",
    label: "Obesidad",
    hint: "Te recomendamos charlar con tu médico o nutricionista para un plan a tu medida.",
  };
}

export default function BmiCalculator() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const result = useMemo(() => {
    const h = parseNum(height);
    const w = parseNum(weight);
    if (h == null || w == null || h < 80 || h > 260 || w < 25 || w > 350) {
      return null;
    }
    const bmi = computeBmi(h, w);
    if (!Number.isFinite(bmi) || bmi < 10 || bmi > 80) return null;
    return { bmi, ...bmiCategory(bmi) };
  }, [height, weight]);

  return (
    <section className={styles.section} aria-labelledby="bmi-heading">
      <h2 id="bmi-heading" className={styles.heading}>
        <Activity size={18} aria-hidden />
        Calculadora de IMC
      </h2>
      <p className={styles.lead}>
        Indicador orientativo (no es diagnóstico). Ingresá tu altura y peso.
      </p>
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
          hint="En centímetros"
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
          hint="En kilogramos"
        />
      </div>
      {result ? (
        <div className={`${styles.result} ${styles[`result-${result.key}`]}`}>
          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>Tu IMC</span>
            <span className={styles.resultValue}>{result.bmi.toFixed(1)}</span>
          </div>
          <p className={styles.resultCategory}>{result.label}</p>
          <p className={styles.resultHint}>{result.hint}</p>
        </div>
      ) : (
        <p className={styles.placeholder}>
          {height || weight
            ? "Completá altura (cm) y peso (kg) con valores realistas."
            : "Los valores aparecen cuando cargás altura y peso."}
        </p>
      )}
    </section>
  );
}
