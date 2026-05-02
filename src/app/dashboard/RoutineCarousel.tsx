"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ListChecks,
  Repeat2,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { resolveExercises, type TrainingDay } from "@/lib/trainingPlans";
import styles from "./RoutineCarousel.module.css";

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function isoDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Slot = "left" | "center" | "right";

function uniqueMuscles(exercises: ReturnType<typeof resolveExercises>) {
  return Array.from(new Set(exercises.map((exercise) => exercise.primaryMuscle))).slice(0, 3);
}

export default function RoutineCarousel({
  days,
  planKey,
}: {
  days: TrainingDay[];
  planKey: string;
}) {
  const todayWeekIndex = mod(new Date().getDay() - 1, 7);
  const todayRoutineIndex = mod(todayWeekIndex, days.length);
  const [activeIndex, setActiveIndex] = useState(todayRoutineIndex);
  const [doneToday, setDoneToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const n = days.length;

  const storageKey = useMemo(
    () => `np_routine_done_${planKey}_${isoDateKey(new Date())}`,
    [planKey]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/training-session", { cache: "no-store" });
        const body = await res.json();
        if (cancelled) return;
        if (body?.ok) {
          setDoneToday(Boolean(body.data?.completed));
          if (body.data?.completed) {
            window.localStorage.setItem(storageKey, "1");
          }
          return;
        }
      } catch {
        // fallback local
      }
      if (!cancelled) {
        const saved = window.localStorage.getItem(storageKey);
        setDoneToday(saved === "1");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 819px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (n === 0 || !days[activeIndex]) return null;

  const prevI = mod(activeIndex - 1, n);
  const nextI = mod(activeIndex + 1, n);

  const slots: { dayIndex: number; slot: Slot }[] =
    n === 1
      ? [{ dayIndex: activeIndex, slot: "center" }]
      : [
          { dayIndex: prevI, slot: "left" },
          { dayIndex: activeIndex, slot: "center" },
          { dayIndex: nextI, slot: "right" },
        ];

  async function markDone() {
    setSaving(true);
    try {
      const active = days[todayRoutineIndex];
      await fetch("/api/me/training-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          dayName: active?.name,
        }),
      });
      window.localStorage.setItem(storageKey, "1");
      setDoneToday(true);
    } finally {
      setSaving(false);
    }
  }

  function goPrev() {
    setActiveIndex((i) => mod(i - 1, n));
  }

  function goNext() {
    setActiveIndex((i) => mod(i + 1, n));
  }

  function goToday() {
    setActiveIndex(todayRoutineIndex);
  }

  function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (Math.abs(offset) < 54 && Math.abs(velocity) < 420) return;
    if (offset < 0 || velocity < -420) goNext();
    else goPrev();
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.carouselHeader}>
        <div>
          <p className={styles.eyebrow}>
            <Sparkles size={14} />
            Tu rutina activa
          </p>
          <h2 className={styles.heading}>Entrenamiento de hoy</h2>
        </div>
        <div className={styles.headerMeta}>
          <span>
            <Dumbbell size={14} />
            {n} dias
          </span>
          <span>
            <TimerReset size={14} />
            {days[activeIndex]?.name}
          </span>
        </div>
      </div>

      <div
        className={styles.carouselRow}
      >
        <button
          type="button"
          className={styles.sideBtn}
          onClick={goPrev}
          aria-label="Día anterior"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>

        <div className={styles.perspectiveHost}>
          <motion.div
            className={styles.tripleStage}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={isMobile ? 0.03 : 0.08}
            dragMomentum={false}
            onDragEnd={onDragEnd}
          >
            <AnimatePresence initial={false} mode="popLayout">
              {slots.map(({ dayIndex, slot }) => {
                const day = days[dayIndex];
                if (!day) return null;
                const dayExercises = resolveExercises(day.exerciseIds);
                const muscleTags = uniqueMuscles(dayExercises);
                const isToday = dayIndex === todayRoutineIndex;
                const isMain = slot === "center";
                return (
                  <motion.div
                    key={n === 2 ? `${dayIndex}-${slot}` : dayIndex}
                    className={`${styles.ringSlot} ${styles[`slot_${slot}`]}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isMain ? 1 : isMobile ? 0 : 0.72 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.article
                      className={`${styles.routineCard} ${
                        isMain ? styles.routineCardMain : styles.routineCardSide
                      }`}
                      whileHover={!isMobile && isMain ? { y: -6 } : undefined}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <div className={styles.cardTop}>
                        <span className={styles.dayIcon} aria-hidden="true">
                          {isToday ? <Sparkles size={18} /> : <Dumbbell size={18} />}
                        </span>
                        <div className={styles.titleBlock}>
                          <p className={styles.cardKicker}>
                            <CalendarDays size={13} />
                            Plan de entrenamiento
                          </p>
                          <h3 className={styles.cardTitle}>{day.name}</h3>
                        </div>
                        {isToday ? <span className={styles.todayBadge}>Hoy</span> : null}
                      </div>

                      <div className={styles.focusBox}>
                        <Target size={16} />
                        <span>{day.focus}</span>
                      </div>

                      <div className={styles.statsGrid}>
                        <div className={styles.statPill}>
                          <ListChecks size={15} />
                          <span>{dayExercises.length} ejercicios</span>
                        </div>
                        <div className={styles.statPill}>
                          <Repeat2 size={15} />
                          <span>{day.repsGuide}</span>
                        </div>
                      </div>

                      <div className={styles.tagRow}>
                        {muscleTags.map((muscle) => (
                          <span key={muscle} className={styles.muscleTag}>
                            {muscle}
                          </span>
                        ))}
                      </div>

                      <ul className={styles.list}>
                        {dayExercises.map((exercise, exerciseIndex) => (
                          <li key={exercise.id}>
                            <span className={styles.exerciseNumber}>
                              {String(exerciseIndex + 1).padStart(2, "0")}
                            </span>
                            <span className={styles.exerciseText}>
                              <strong>{exercise.name}</strong>
                              <small>{exercise.primaryMuscle}</small>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isToday ? (
                        <div className={styles.cardAction}>
                          <Button
                            className={styles.completeBtn}
                            onClick={markDone}
                            loading={saving}
                            disabled={doneToday || saving}
                            type="button"
                          >
                            {doneToday ? (
                              <>
                                <CheckCircle2 size={17} />
                                Sesion completada
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={17} />
                                Marcar sesion completa
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </motion.article>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </div>

        <button
          type="button"
          className={styles.sideBtn}
          onClick={goNext}
          aria-label="Día siguiente"
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      </div>

      <p className={styles.todayLink}>
        <button type="button" className={styles.linkBtn} onClick={goToday}>
          Ir al día de hoy
        </button>
      </p>

      <p className={styles.swipeHint}>En el teléfono podés deslizar para cambiar de día</p>

      <div className={styles.dots} aria-label="Progreso de rutina">
        {days.map((day, index) => (
          <button
            key={day.name}
            type="button"
            className={`${styles.dot} ${index === activeIndex ? styles.dotActive : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Ir a ${day.name}`}
          />
        ))}
      </div>
    </div>
  );
}
