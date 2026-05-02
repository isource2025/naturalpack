"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import BmiCalculator from "./BmiCalculator";
import RoutineCarousel from "./RoutineCarousel";
import type { TrainingPlan } from "@/lib/trainingPlans";
import styles from "./TrainingPanels.module.css";
import { ROUTINE_SECTION_ID } from "@/lib/routineSection";

export default function TrainingPanels({
  plan,
  level,
  goalLabel,
}: {
  plan: TrainingPlan;
  level: string;
  goalLabel: string;
}) {
  const [openRoutine, setOpenRoutine] = useState(true);
  const [openBmi, setOpenBmi] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== `#${ROUTINE_SECTION_ID}`) return;
    const el = document.getElementById(ROUTINE_SECTION_ID);
    if (!el) return;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={styles.stack}>
      <section
        id={ROUTINE_SECTION_ID}
        className={`${styles.panelCard} ${styles.routineAnchor}`}
      >
        <RoutineCarousel days={plan.days} planKey={plan.key} /> 
      </section>

      <section className={styles.panelCard}>
        <div className={styles.header}>
          <h3 className={styles.title}>IMC</h3>
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setOpenBmi((v) => !v)}
            aria-expanded={openBmi}
          >
            {openBmi ? "Ocultar" : "Calcular"}
            <ChevronDown className={openBmi ? styles.chevOpen : ""} size={18} />
          </button>
        </div>
        {openBmi ? <BmiCalculator /> : null}
      </section>
    </div>
  );
}
