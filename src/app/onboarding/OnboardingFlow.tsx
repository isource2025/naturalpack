"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Dumbbell, Flame, Sparkles, Target } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  TRAINING_PLANS,
  resolveExercises,
  type TrainingGoal,
  type TrainingLevel,
  type TrainingPlan,
} from "@/lib/trainingPlans";
import styles from "./onboarding.module.css";

type AssignedProfile = {
  level: TrainingLevel;
  goal: TrainingGoal;
  planKey: string;
  onboardingCompletedAt: string;
} | null;

type Option<T extends string | number> = {
  label: string;
  value: T;
  points?: number;
};

type Answers = {
  experienceScore?: number;
  techniqueScore?: number;
  frequencyScore?: number;
  preferredGoal?: TrainingGoal;
};

const STEPS: {
  id: keyof Answers;
  title: string;
  subtitle: string;
  options: Option<number | TrainingGoal>[];
}[] = [
  {
    id: "experienceScore",
    title: "1) Experiencia entrenando",
    subtitle: "¿Hace cuánto entrenas de forma regular?",
    options: [
      { label: "Recién empiezo", value: 0, points: 0 },
      { label: "Menos de 6 meses", value: 1, points: 1 },
      { label: "Entre 6 y 12 meses", value: 2, points: 2 },
      { label: "Entre 1 y 2 años", value: 3, points: 3 },
      { label: "Más de 2 años", value: 4, points: 4 },
    ],
  },
  {
    id: "techniqueScore",
    title: "2) Técnica en ejercicios",
    subtitle: "¿Cómo te sientes con ejercicios como sentadilla, press o peso muerto?",
    options: [
      { label: "Necesito guía completa", value: 0, points: 0 },
      { label: "Conozco algunos ejercicios", value: 1, points: 1 },
      { label: "Los hago con buena técnica", value: 3, points: 3 },
      { label: "Tengo técnica sólida en casi todos", value: 4, points: 4 },
    ],
  },
  {
    id: "frequencyScore",
    title: "3) Días por semana",
    subtitle: "¿Cuántos días puedes entrenar por semana?",
    options: [
      { label: "2 días", value: 1, points: 1 },
      { label: "3 días", value: 2, points: 2 },
      { label: "4 días", value: 3, points: 3 },
      { label: "5 o más días", value: 4, points: 4 },
    ],
  },
  {
    id: "preferredGoal",
    title: "4) Objetivo principal",
    subtitle: "¿Qué quieres priorizar en tu rutina?",
    options: [
      { label: "Fuerza", value: "fuerza" },
      { label: "Ganancia de músculo", value: "ganancia_musculo" },
      { label: "Intensidad y condición", value: "intensidad" },
    ],
  },
];

export default function OnboardingFlow({
  name,
  initialProfile,
}: {
  name: string;
  initialProfile: AssignedProfile;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    level: TrainingLevel;
    goal: TrainingGoal;
    plan: TrainingPlan;
  } | null>(null);

  const activeProfile = useMemo(() => {
    if (result) return { ...result, planKey: result.plan.key };
    if (!initialProfile) return null;
    const plan = TRAINING_PLANS.find((p) => p.key === initialProfile.planKey) ?? null;
    return plan
      ? {
          level: initialProfile.level,
          goal: initialProfile.goal,
          plan,
          planKey: initialProfile.planKey,
        }
      : null;
  }, [initialProfile, result]);

  const alreadyAssigned = !!activeProfile;
  const step = STEPS[stepIdx];
  if (!step) {
    throw new Error("Paso de onboarding inválido");
  }
  const stepId = step.id;
  const progress = Math.round(((stepIdx + 1) / STEPS.length) * 100);

  function selectAnswer(value: number | TrainingGoal, points?: number) {
    const id = stepId;
    if (id === "preferredGoal") {
      setAnswers((prev) => ({ ...prev, preferredGoal: value as TrainingGoal }));
      return;
    }
    setAnswers((prev) => ({ ...prev, [id]: points ?? Number(value) }));
  }

  function nextStep() {
    if (stepIdx < STEPS.length - 1) setStepIdx((s) => s + 1);
  }

  function prevStep() {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  }

  async function finish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "No pudimos asignar tu rutina");
      setResult(json.data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const answered = answers[step.id] !== undefined;
  const activeGoalLabel =
    activeProfile?.goal === "ganancia_musculo"
      ? "ganancia de músculo"
      : activeProfile?.goal ?? "";

  return (
    <main className={styles.wrap}>
      <section className={styles.card}>
        <div className={styles.hero}>
          <span className={styles.heroIcon} aria-hidden>
            <Dumbbell size={24} />
          </span>
          <div>
            <p className={styles.kicker}>
              <Sparkles size={14} /> Rutina automática
            </p>
            <h1 className={styles.title}>Bienvenido, {name.split(" ")[0]}</h1>
            <p className={styles.subtitle}>
              Respondé 4 preguntas y te asignamos una rutina Push / Pull / Legs
              según tu nivel, objetivo e intensidad.
            </p>
          </div>
        </div>

        {!alreadyAssigned ? (
          <>
            <div className={styles.progressShell}>
              <div className={styles.progressRow}>
                <span>
                  Paso {stepIdx + 1} de {STEPS.length}
                </span>
                <span>{progress}% listo</span>
              </div>
              <div className={styles.progressBar}>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepIcon} aria-hidden>
                {step.id === "preferredGoal" ? <Target size={20} /> : <Flame size={20} />}
              </span>
              <div>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepSubtitle}>{step.subtitle}</p>
              </div>
            </div>

            <div className={styles.options}>
              {step.options.map((opt, optionIndex) => {
                const selected =
                  answers[step.id] === (step.id === "preferredGoal" ? opt.value : opt.points);
                return (
                  <button
                    key={opt.label}
                    type="button"
                    className={`${styles.optionBtn} ${selected ? styles.optionActive : ""}`}
                    onClick={() => selectAnswer(opt.value, opt.points)}
                  >
                    <span className={styles.optionNumber}>
                      {selected ? <CheckCircle2 size={17} /> : String(optionIndex + 1)}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <Button variant="ghost" onClick={prevStep} disabled={stepIdx === 0}>
                Anterior
              </Button>
              {stepIdx < STEPS.length - 1 ? (
                <Button onClick={nextStep} disabled={!answered}>
                  Siguiente
                </Button>
              ) : (
                <Button onClick={finish} loading={loading} disabled={!answered}>
                  Finalizar y asignar rutina
                </Button>
              )}
            </div>

            <div className={styles.pplPreview}>
              <span>Push</span>
              <span>Pull</span>
              <span>Legs</span>
            </div>
          </>
        ) : (
          <div className={styles.doneBox}>
            <p className={styles.doneTag}>Nivel asignado: {activeProfile.level.toUpperCase()}</p>
            <h2>{activeProfile.plan.name}</h2>
            <p>{activeProfile.plan.summary}</p>
            <p>
              <strong>Objetivo:</strong> {activeGoalLabel} - <strong>Trabajo:</strong>{" "}
              {activeProfile.plan.intensity}
            </p>
            <ul className={styles.planList}>
              {activeProfile.plan.weeklyStructure.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {activeProfile.plan.days.map((day) => {
              const dayExercises = resolveExercises(day.exerciseIds);
              return (
                <div key={day.name} className={styles.dayBlock}>
                  <p className={styles.dayTitle}>
                    <strong>{day.name}:</strong> {day.focus}
                  </p>
                  <p className={styles.dayReps}>{day.repsGuide}</p>
                  <p className={styles.dayExercises}>
                    Ejemplos: {dayExercises.map((exercise) => exercise.name).join(", ")}
                  </p>
                </div>
              );
            })}
            <Button
              onClick={() => {
                router.replace("/dashboard");
                router.refresh();
              }}
            >
              Entrar al dashboard
            </Button>
          </div>
        )}
      </section>

      <section className={styles.levelsCard}>
        <h3>Niveles (solo informativo)</h3>
        <p>Puedes ver los niveles, pero por ahora no se puede cambiar manualmente.</p>
        <div className={styles.levelGrid}>
          {TRAINING_PLANS.map((p) => {
            const assigned = activeProfile?.planKey === p.key;
            return (
              <article key={p.key} className={`${styles.levelItem} ${assigned ? styles.levelAssigned : ""}`}>
                <small>
                  {p.level} - {p.goal === "ganancia_musculo" ? "ganancia de músculo" : p.goal}
                </small>
                <h4>{p.name}</h4>
                <p>{p.summary}</p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
