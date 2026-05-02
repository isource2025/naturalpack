export const TrainingLevels = ["novato", "intermedio", "avanzado"] as const;
export type TrainingLevel = (typeof TrainingLevels)[number];

export const TrainingGoals = ["intensidad", "fuerza", "ganancia_musculo"] as const;
export type TrainingGoal = (typeof TrainingGoals)[number];

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
};

export type TrainingDay = {
  name: string;
  focus: string;
  repsGuide: string;
  exerciseIds: string[];
};

export type TrainingPlan = {
  key: string;
  level: TrainingLevel;
  goal: TrainingGoal;
  name: string;
  summary: string;
  weeklyStructure: string[];
  days: TrainingDay[];
  intensity: string;
};

export const EXERCISE_CATALOG: Exercise[] = [
  // Pecho
  { id: "bench-press", name: "Press banca plano", primaryMuscle: "pecho", secondaryMuscles: ["triceps", "hombros"] },
  { id: "incline-db-press", name: "Press inclinado con mancuernas", primaryMuscle: "pecho superior", secondaryMuscles: ["hombros", "triceps"] },
  { id: "chest-fly", name: "Aperturas con mancuernas", primaryMuscle: "pecho", secondaryMuscles: ["hombros"] },
  { id: "push-up", name: "Flexiones", primaryMuscle: "pecho", secondaryMuscles: ["triceps", "core"] },
  { id: "cable-crossover", name: "Cruce en polea", primaryMuscle: "pecho", secondaryMuscles: ["hombros"] },
  // Espalda
  { id: "barbell-row", name: "Remo con barra", primaryMuscle: "espalda", secondaryMuscles: ["biceps", "lumbares"] },
  { id: "lat-pulldown", name: "Jalon al pecho", primaryMuscle: "dorsales", secondaryMuscles: ["biceps"] },
  { id: "pull-up", name: "Dominadas", primaryMuscle: "dorsales", secondaryMuscles: ["biceps", "core"] },
  { id: "seated-row", name: "Remo sentado en polea", primaryMuscle: "espalda media", secondaryMuscles: ["biceps"] },
  { id: "face-pull", name: "Face pull", primaryMuscle: "hombro posterior", secondaryMuscles: ["trapecio"] },
  // Hombros
  { id: "ohp", name: "Press militar", primaryMuscle: "hombros", secondaryMuscles: ["triceps", "core"] },
  { id: "lateral-raise", name: "Elevaciones laterales", primaryMuscle: "hombro lateral" },
  { id: "front-raise", name: "Elevaciones frontales", primaryMuscle: "hombro frontal" },
  { id: "rear-delt-fly", name: "Pajaro con mancuernas", primaryMuscle: "hombro posterior" },
  { id: "arnold-press", name: "Press Arnold", primaryMuscle: "hombros", secondaryMuscles: ["triceps"] },
  // Biceps
  { id: "bb-curl", name: "Curl de biceps con barra", primaryMuscle: "biceps" },
  { id: "db-curl", name: "Curl de biceps con mancuernas", primaryMuscle: "biceps" },
  { id: "hammer-curl", name: "Curl martillo", primaryMuscle: "braquial", secondaryMuscles: ["biceps"] },
  { id: "preacher-curl", name: "Curl predicador", primaryMuscle: "biceps" },
  // Triceps
  { id: "triceps-pushdown", name: "Extension de triceps en polea", primaryMuscle: "triceps" },
  { id: "overhead-triceps", name: "Extension por encima de la cabeza", primaryMuscle: "triceps" },
  { id: "dips", name: "Fondos", primaryMuscle: "triceps", secondaryMuscles: ["pecho", "hombros"] },
  { id: "skull-crusher", name: "Rompecraneos", primaryMuscle: "triceps" },
  // Piernas - cuadriceps
  { id: "back-squat", name: "Sentadilla trasera", primaryMuscle: "cuadriceps", secondaryMuscles: ["gluteos", "core"] },
  { id: "front-squat", name: "Sentadilla frontal", primaryMuscle: "cuadriceps", secondaryMuscles: ["core"] },
  { id: "leg-press", name: "Prensa", primaryMuscle: "cuadriceps", secondaryMuscles: ["gluteos"] },
  { id: "walking-lunge", name: "Zancadas caminando", primaryMuscle: "cuadriceps", secondaryMuscles: ["gluteos", "isquios"] },
  { id: "bulgarian-split-squat", name: "Sentadilla bulgara", primaryMuscle: "cuadriceps", secondaryMuscles: ["gluteos"] },
  { id: "leg-extension", name: "Extension de cuadriceps", primaryMuscle: "cuadriceps" },
  // Piernas - isquios/gluteos
  { id: "rdl", name: "Peso muerto rumano", primaryMuscle: "isquios", secondaryMuscles: ["gluteos", "lumbares"] },
  { id: "deadlift", name: "Peso muerto convencional", primaryMuscle: "cadena posterior", secondaryMuscles: ["espalda", "gluteos"] },
  { id: "hip-thrust", name: "Hip thrust", primaryMuscle: "gluteos", secondaryMuscles: ["isquios"] },
  { id: "leg-curl", name: "Curl femoral", primaryMuscle: "isquios" },
  { id: "good-morning", name: "Good morning", primaryMuscle: "isquios", secondaryMuscles: ["lumbares", "gluteos"] },
  // Pantorrillas
  { id: "standing-calf-raise", name: "Elevacion de talones de pie", primaryMuscle: "pantorrillas" },
  { id: "seated-calf-raise", name: "Elevacion de talones sentado", primaryMuscle: "pantorrillas" },
  // Core
  { id: "plank", name: "Plancha", primaryMuscle: "core" },
  { id: "dead-bug", name: "Dead bug", primaryMuscle: "core" },
  { id: "hanging-leg-raise", name: "Elevacion de piernas colgado", primaryMuscle: "abdominales" },
  { id: "cable-crunch", name: "Crunch en polea", primaryMuscle: "abdominales" },
  { id: "russian-twist", name: "Giro ruso", primaryMuscle: "oblicuos" },
  // Cardio / acondicionamiento
  { id: "air-bike", name: "Bicicleta de aire", primaryMuscle: "acondicionamiento general" },
  { id: "rower", name: "Remo ergometro", primaryMuscle: "acondicionamiento general", secondaryMuscles: ["espalda", "piernas"] },
  { id: "assault-run", name: "Carrera en cinta", primaryMuscle: "acondicionamiento general", secondaryMuscles: ["piernas"] },
  { id: "jump-rope", name: "Soga", primaryMuscle: "acondicionamiento general", secondaryMuscles: ["pantorrillas"] },
  // Accesorios muy usados
  { id: "shrug", name: "Encogimientos de trapecio", primaryMuscle: "trapecio" },
  { id: "farmer-carry", name: "Farmer walk", primaryMuscle: "antebrazos", secondaryMuscles: ["trapecio", "core"] },
  { id: "wrist-curl", name: "Curl de muneca", primaryMuscle: "antebrazos" },
  { id: "reverse-wrist-curl", name: "Curl inverso de muneca", primaryMuscle: "antebrazos" },
  { id: "hip-abduction", name: "Abduccion de cadera", primaryMuscle: "gluteo medio" },
  { id: "hip-adduction", name: "Aduccion de cadera", primaryMuscle: "aductores" },
];

export const TRAINING_PLANS: TrainingPlan[] = [
  {
    key: "novato-fuerza-ppl",
    level: "novato",
    goal: "fuerza",
    name: "PPL base de fuerza",
    summary: "Push, Pull, Legs simple para aprender los fundamentales sin sobrecargarte.",
    weeklyStructure: [
      "Día 1: Push - press banca, press militar y triceps",
      "Día 2: Pull - remo, jalon y biceps",
      "Día 3: Legs - sentadilla, bisagra de cadera y core",
    ],
    days: [
      {
        name: "Push",
        focus: "Pecho + hombros + triceps",
        repsGuide: "3 series de 6-10 repeticiones en básicos; 10-15 en accesorios",
        exerciseIds: ["bench-press", "incline-db-press", "ohp", "lateral-raise", "triceps-pushdown", "push-up"],
      },
      {
        name: "Pull",
        focus: "Espalda + biceps",
        repsGuide: "3 series de 8-12 repeticiones, dejando 2-3 reps en reserva",
        exerciseIds: ["barbell-row", "lat-pulldown", "seated-row", "face-pull", "db-curl", "hammer-curl"],
      },
      {
        name: "Legs",
        focus: "Piernas completas + core",
        repsGuide: "3 series de 8-12 repeticiones; técnica antes que peso",
        exerciseIds: ["back-squat", "leg-press", "rdl", "leg-curl", "standing-calf-raise", "plank"],
      },
    ],
    intensity: "Carga baja a moderada, foco en rango de movimiento, técnica y progresión lenta.",
  },
  {
    key: "novato-ganancia-musculo-ppl",
    level: "novato",
    goal: "ganancia_musculo",
    name: "PPL inicial de ganancia muscular",
    summary: "Volumen controlado con ejercicios seguros y fundamentales para construir base.",
    weeklyStructure: [
      "Día 1: Push - pecho y hombro con accesorios simples",
      "Día 2: Pull - espalda completa y biceps",
      "Día 3: Legs - cuadriceps, femorales, gluteos y pantorrillas",
    ],
    days: [
      {
        name: "Push",
        focus: "Pecho + hombros + triceps",
        repsGuide: "3-4 series de 10-15 repeticiones",
        exerciseIds: ["bench-press", "incline-db-press", "chest-fly", "lateral-raise", "triceps-pushdown", "overhead-triceps"],
      },
      {
        name: "Pull",
        focus: "Espalda + biceps + hombro posterior",
        repsGuide: "3-4 series de 10-15 repeticiones",
        exerciseIds: ["lat-pulldown", "seated-row", "barbell-row", "face-pull", "db-curl", "hammer-curl"],
      },
      {
        name: "Legs",
        focus: "Piernas completas",
        repsGuide: "3-4 series de 10-15 repeticiones",
        exerciseIds: ["back-squat", "leg-press", "rdl", "leg-extension", "leg-curl", "standing-calf-raise"],
      },
    ],
    intensity: "Volumen moderado, descanso suficiente y cerca del fallo solo en accesorios.",
  },
  {
    key: "novato-intensidad-ppl",
    level: "novato",
    goal: "intensidad",
    name: "PPL activo inicial",
    summary: "Rutina PPL con cierre cardiovascular suave para mejorar condición sin perder técnica.",
    weeklyStructure: [
      "Día 1: Push + cardio suave",
      "Día 2: Pull + circuito corto",
      "Día 3: Legs + acondicionamiento",
    ],
    days: [
      {
        name: "Push",
        focus: "Empuje + acondicionamiento leve",
        repsGuide: "3 series de 10-12 repeticiones + 6-8 min de cardio",
        exerciseIds: ["bench-press", "ohp", "lateral-raise", "triceps-pushdown", "push-up", "jump-rope"],
      },
      {
        name: "Pull",
        focus: "Tiron + postura + core",
        repsGuide: "3 series de 10-12 repeticiones con descansos cortos",
        exerciseIds: ["lat-pulldown", "seated-row", "face-pull", "hammer-curl", "dead-bug", "rower"],
      },
      {
        name: "Legs",
        focus: "Piernas + cardio controlado",
        repsGuide: "3 series de 10-15 repeticiones + intervalos suaves",
        exerciseIds: ["back-squat", "leg-press", "rdl", "standing-calf-raise", "plank", "air-bike"],
      },
    ],
    intensity: "Descansos moderados, ritmo constante y cardio breve al final.",
  },
  {
    key: "intermedio-fuerza-ppl",
    level: "intermedio",
    goal: "fuerza",
    name: "PPL fuerza intermedia",
    summary: "Fundamentales pesados con accesorios mínimos para sostener técnica y progreso.",
    weeklyStructure: [
      "Día 1: Push pesado - banca y militar",
      "Día 2: Pull pesado - peso muerto y remos",
      "Día 3: Legs pesado - sentadilla y cadena posterior",
      "Día 4: PPL técnico - repaso liviano de básicos",
    ],
    days: [
      {
        name: "Push",
        focus: "Press banca + press militar",
        repsGuide: "4-5 series de 4-8 repeticiones; accesorios 8-12",
        exerciseIds: ["bench-press", "ohp", "incline-db-press", "lateral-raise", "dips", "triceps-pushdown"],
      },
      {
        name: "Pull",
        focus: "Peso muerto + espalda",
        repsGuide: "3-5 series de 3-8 repeticiones; remos 6-10",
        exerciseIds: ["deadlift", "barbell-row", "pull-up", "seated-row", "face-pull", "bb-curl"],
      },
      {
        name: "Legs",
        focus: "Sentadilla + femorales",
        repsGuide: "4-5 series de 4-8 repeticiones; accesorios 8-12",
        exerciseIds: ["back-squat", "front-squat", "rdl", "leg-press", "leg-curl", "standing-calf-raise"],
      },
      {
        name: "PPL técnico",
        focus: "Básicos livianos + core",
        repsGuide: "2-3 series de 8-12 repeticiones sin llegar al fallo",
        exerciseIds: ["bench-press", "lat-pulldown", "front-squat", "lateral-raise", "plank", "farmer-carry"],
      },
    ],
    intensity: "Carga moderada/alta, 1-2 reps en reserva en básicos y descansos largos.",
  },
  {
    key: "intermedio-ganancia-musculo-ppl",
    level: "intermedio",
    goal: "ganancia_musculo",
    name: "PPL hipertrofia intermedia",
    summary: "Más volumen por grupo muscular manteniendo press, remos, sentadilla y bisagra.",
    weeklyStructure: [
      "Día 1: Push - pecho, hombro lateral y triceps",
      "Día 2: Pull - dorsales, espalda media y biceps",
      "Día 3: Legs - cuadriceps, gluteos y femorales",
      "Día 4: Push/Pull accesorios",
    ],
    days: [
      {
        name: "Push",
        focus: "Pecho + hombros + triceps",
        repsGuide: "4 series de 8-12 repeticiones; accesorios 12-15",
        exerciseIds: ["bench-press", "incline-db-press", "ohp", "lateral-raise", "dips", "overhead-triceps"],
      },
      {
        name: "Pull",
        focus: "Espalda completa + biceps",
        repsGuide: "4 series de 8-12 repeticiones; bombeo 12-15",
        exerciseIds: ["pull-up", "barbell-row", "lat-pulldown", "seated-row", "face-pull", "preacher-curl"],
      },
      {
        name: "Legs",
        focus: "Piernas completas",
        repsGuide: "4 series de 8-12 repeticiones; pantorrillas 12-20",
        exerciseIds: ["back-squat", "leg-press", "bulgarian-split-squat", "rdl", "leg-extension", "seated-calf-raise"],
      },
      {
        name: "PPL accesorios",
        focus: "Bombeo de torso + core",
        repsGuide: "3-4 series de 12-15 repeticiones, cerca del fallo",
        exerciseIds: ["cable-crossover", "rear-delt-fly", "hammer-curl", "triceps-pushdown", "cable-crunch", "russian-twist"],
      },
    ],
    intensity: "Volumen medio/alto, accesorios cerca del fallo y básicos con técnica sólida.",
  },
  {
    key: "intermedio-intensidad-ppl",
    level: "intermedio",
    goal: "intensidad",
    name: "PPL rendimiento intermedio",
    summary: "Push/Pull/Legs con bloques de fuerza y finales metabólicos medidos.",
    weeklyStructure: [
      "Día 1: Push + intervalos",
      "Día 2: Pull + ergómetro",
      "Día 3: Legs + acondicionamiento",
      "Día 4: Circuito PPL",
    ],
    days: [
      {
        name: "Push",
        focus: "Empuje + intervalos cortos",
        repsGuide: "3-4 series de 6-10 repeticiones + 8 min de intervalos",
        exerciseIds: ["bench-press", "ohp", "dips", "lateral-raise", "triceps-pushdown", "air-bike"],
      },
      {
        name: "Pull",
        focus: "Espalda + potencia",
        repsGuide: "3-4 series de 6-12 repeticiones + remo por tiempo",
        exerciseIds: ["deadlift", "pull-up", "barbell-row", "face-pull", "farmer-carry", "rower"],
      },
      {
        name: "Legs",
        focus: "Piernas + capacidad",
        repsGuide: "3-5 series de 6-12 repeticiones + cardio corto",
        exerciseIds: ["back-squat", "walking-lunge", "rdl", "standing-calf-raise", "plank", "assault-run"],
      },
      {
        name: "PPL circuito",
        focus: "Cuerpo completo con base PPL",
        repsGuide: "3-4 rondas de 10-15 repeticiones, descansos cortos",
        exerciseIds: ["incline-db-press", "seated-row", "front-squat", "lateral-raise", "hammer-curl", "jump-rope"],
      },
    ],
    intensity: "Ritmo alto, descansos controlados y finales exigentes sin sacrificar técnica.",
  },
  {
    key: "avanzado-fuerza-ppl",
    level: "avanzado",
    goal: "fuerza",
    name: "PPL fuerza avanzada",
    summary: "Doble exposición semanal a básicos con días pesados y técnicos.",
    weeklyStructure: [
      "Día 1: Push pesado",
      "Día 2: Pull pesado",
      "Día 3: Legs pesado",
      "Día 4: Push volumen técnico",
      "Día 5: Pull volumen técnico",
      "Día 6: Legs volumen técnico",
    ],
    days: [
      {
        name: "Push pesado",
        focus: "Banca + militar pesado",
        repsGuide: "5 series de 3-6 repeticiones; accesorios 8-10",
        exerciseIds: ["bench-press", "ohp", "incline-db-press", "lateral-raise", "dips", "skull-crusher"],
      },
      {
        name: "Pull pesado",
        focus: "Peso muerto + tirones fuertes",
        repsGuide: "4-5 series de 3-6 repeticiones; remos 6-8",
        exerciseIds: ["deadlift", "pull-up", "barbell-row", "seated-row", "face-pull", "bb-curl"],
      },
      {
        name: "Legs pesado",
        focus: "Sentadilla + cadena posterior",
        repsGuide: "5 series de 3-6 repeticiones; accesorios 8-10",
        exerciseIds: ["back-squat", "front-squat", "rdl", "leg-press", "leg-curl", "standing-calf-raise"],
      },
      {
        name: "Push técnico",
        focus: "Velocidad + estabilidad de empuje",
        repsGuide: "4 series de 6-10 repeticiones con control perfecto",
        exerciseIds: ["bench-press", "arnold-press", "cable-crossover", "lateral-raise", "overhead-triceps", "push-up"],
      },
      {
        name: "Pull técnico",
        focus: "Volumen de espalda + agarre",
        repsGuide: "4 series de 6-10 repeticiones; accesorios 10-12",
        exerciseIds: ["barbell-row", "lat-pulldown", "farmer-carry", "rear-delt-fly", "hammer-curl", "shrug"],
      },
      {
        name: "Legs técnico",
        focus: "Volumen de piernas + core",
        repsGuide: "4 series de 6-10 repeticiones; core por tiempo",
        exerciseIds: ["front-squat", "bulgarian-split-squat", "hip-thrust", "good-morning", "seated-calf-raise", "hanging-leg-raise"],
      },
    ],
    intensity: "Alta intensidad, descansos largos, básicos pesados y volumen técnico planificado.",
  },
  {
    key: "avanzado-ganancia-musculo-ppl",
    level: "avanzado",
    goal: "ganancia_musculo",
    name: "PPL ganancia muscular avanzada",
    summary: "Volumen alto y doble frecuencia semanal, priorizando básicos y accesorios clave.",
    weeklyStructure: [
      "Día 1: Push pesado",
      "Día 2: Pull pesado",
      "Día 3: Legs pesado",
      "Día 4: Push bombeo",
      "Día 5: Pull bombeo",
      "Día 6: Legs bombeo",
    ],
    days: [
      {
        name: "Push pesado",
        focus: "Pecho + hombro frontal/lateral",
        repsGuide: "4-5 series de 6-10 repeticiones",
        exerciseIds: ["bench-press", "incline-db-press", "ohp", "lateral-raise", "dips", "triceps-pushdown"],
      },
      {
        name: "Pull pesado",
        focus: "Dorsales + espalda media",
        repsGuide: "4-5 series de 6-10 repeticiones",
        exerciseIds: ["pull-up", "barbell-row", "lat-pulldown", "rdl", "face-pull", "bb-curl"],
      },
      {
        name: "Legs pesado",
        focus: "Cuadriceps + gluteos + femorales",
        repsGuide: "4-5 series de 8-12 repeticiones",
        exerciseIds: ["back-squat", "leg-press", "bulgarian-split-squat", "hip-thrust", "leg-extension", "seated-calf-raise"],
      },
      {
        name: "Push bombeo",
        focus: "Pecho alto + hombro lateral + triceps",
        repsGuide: "3-4 series de 10-15 repeticiones, cerca del fallo",
        exerciseIds: ["incline-db-press", "cable-crossover", "arnold-press", "lateral-raise", "overhead-triceps", "skull-crusher"],
      },
      {
        name: "Pull bombeo",
        focus: "Espalda completa + biceps",
        repsGuide: "3-4 series de 10-15 repeticiones, descanso corto",
        exerciseIds: ["seated-row", "lat-pulldown", "rear-delt-fly", "shrug", "preacher-curl", "hammer-curl"],
      },
      {
        name: "Legs bombeo",
        focus: "Piernas + core + accesorios",
        repsGuide: "3-4 series de 10-15 repeticiones; pantorrillas 15-20",
        exerciseIds: ["front-squat", "walking-lunge", "good-morning", "hip-abduction", "cable-crunch", "russian-twist"],
      },
    ],
    intensity: "Volumen alto, accesorios cerca del fallo y básicos con progresión semanal.",
  },
  {
    key: "avanzado-intensidad-ppl",
    level: "avanzado",
    goal: "intensidad",
    name: "PPL rendimiento avanzado",
    summary: "Base PPL pesada con finales de acondicionamiento y trabajo por bloques.",
    weeklyStructure: [
      "Día 1: Push potencia + intervalos",
      "Día 2: Pull potencia + carries",
      "Día 3: Legs potencia + cardio",
      "Día 4: Push/Pull circuito",
      "Día 5: Legs + core metabólico",
    ],
    days: [
      {
        name: "Push potencia",
        focus: "Empuje fuerte + intervalos",
        repsGuide: "4 series de 5-8 repeticiones + 8-10 min intenso",
        exerciseIds: ["bench-press", "ohp", "dips", "lateral-raise", "triceps-pushdown", "air-bike"],
      },
      {
        name: "Pull potencia",
        focus: "Peso muerto + agarre + espalda",
        repsGuide: "4 series de 4-8 repeticiones + carries",
        exerciseIds: ["deadlift", "pull-up", "barbell-row", "farmer-carry", "face-pull", "rower"],
      },
      {
        name: "Legs potencia",
        focus: "Sentadilla + capacidad de piernas",
        repsGuide: "4-5 series de 5-10 repeticiones + cardio corto",
        exerciseIds: ["back-squat", "front-squat", "walking-lunge", "rdl", "standing-calf-raise", "assault-run"],
      },
      {
        name: "PPL circuito",
        focus: "Torso intenso + accesorios",
        repsGuide: "4 rondas de 8-12 repeticiones, descansos cortos",
        exerciseIds: ["incline-db-press", "seated-row", "arnold-press", "rear-delt-fly", "hammer-curl", "jump-rope"],
      },
      {
        name: "Legs metabolico",
        focus: "Piernas + core + acondicionamiento",
        repsGuide: "3-5 rondas de 10-15 repeticiones",
        exerciseIds: ["leg-press", "bulgarian-split-squat", "hip-thrust", "leg-curl", "hanging-leg-raise", "rower"],
      },
    ],
    intensity: "Muy exigente: básicos pesados, descansos medidos y finales metabólicos.",
  },
];

export type OnboardingAnswers = {
  experienceScore: number;
  techniqueScore: number;
  frequencyScore: number;
  preferredGoal: TrainingGoal;
};

export function decideTrainingLevel(a: OnboardingAnswers): TrainingLevel {
  const weighted = a.experienceScore + a.techniqueScore + a.frequencyScore;
  if (weighted <= 5) return "novato";
  if (weighted <= 8) return "intermedio";
  return "avanzado";
}

export function pickPlan(level: TrainingLevel, preferredGoal: TrainingGoal): TrainingPlan {
  const exact = TRAINING_PLANS.find((p) => p.level === level && p.goal === preferredGoal);
  if (exact) return exact;
  const fallbackByLevel = TRAINING_PLANS.find((p) => p.level === level);
  if (fallbackByLevel) return fallbackByLevel;
  throw new Error("No hay rutinas configuradas");
}

export function resolveExercises(ids: string[]): Exercise[] {
  return ids
    .map((id) => EXERCISE_CATALOG.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => !!exercise);
}
