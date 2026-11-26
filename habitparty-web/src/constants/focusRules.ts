/** Limite de atividades permitidas no plano Gratuito */
export const MAX_FOCUS_ACTIVITIES_FREE = 4;

/** Limite de atividades permitidas no plano Premium */
export const MAX_FOCUS_ACTIVITIES_PREMIUM = 6;

/** Duração padrão de um ciclo de Pomodoro em minutos */
export const DEFAULT_POMO_MINUTES = 35;

/** Duração padrão do intervalo curto em minutos */
export const DEFAULT_SHORT_BREAK_MINUTES = 5;

/** Duração padrão do intervalo longo em minutos */
export const DEFAULT_LONG_BREAK_MINUTES = 15;

/** Quantidade padrão de ciclos Pomodoro até a pausa longa */
export const DEFAULT_CYCLES_UNTIL_LONG_BREAK = 4;

/** Presets rápidos de duração para sessões de Pomodoro (em minutos) */
export const FOCUS_POMO_PRESETS = [15, 25, 35, 45, 50] as const;

/** Presets de duração para inserção manual de foco (em minutos) */
export const FOCUS_MANUAL_PRESETS = [15, 25, 35, 45, 60] as const;

/** Limite máximo de duração (em minutos) para registro manual de atividade */
export const MAX_MANUAL_FOCUS_MINUTES = 600;

/** Regras de cálculo e tetos de bonificação de foco */
export const FOCUS_REWARD_RULES = {
  MIN_QUALIFYING_MINUTES: 10,
  MIN_DAILY_STREAK_FOCUS_MINUTES: 30,
  MAX_EFFECTIVE_MINUTES: 90,
  ANTI_EXPLOIT_THRESHOLD_MINUTES: 15,
  STANDARD_POMO_MIN_MINUTES: 25,
  STANDARD_POMO_MAX_MINUTES: 49,
  DEEP_WORK_MIN_MINUTES: 50,
  STANDARD_COINS_PER_CYCLE: 0.5,
  SHORT_POMO_COINS_PER_CYCLE: 0.25,
  DEEP_WORK_COINS_PER_CYCLE: 1.0,
  STANDARD_XP_PER_CYCLE: 8,
  SHORT_POMO_XP_PER_CYCLE: 4,
  DEEP_WORK_XP_PER_CYCLE: 15,
  UNCOMPLETED_POMO_XP_PER_30_MIN: 6,
  UNCOMPLETED_POMO_COINS_PER_30_MIN: 0.3,
  STOPWATCH_XP_PER_30_MIN: 7,
  STOPWATCH_COINS_PER_30_MIN: 0.45,
  DAILY_SOFT_CAP_MINUTES: 240,
  DAILY_TIER2_CAP_MINUTES: 360,
  DAILY_HARD_CAP_MINUTES: 480,
} as const;
