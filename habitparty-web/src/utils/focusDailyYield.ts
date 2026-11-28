import { FOCUS_REWARD_RULES } from "@/constants/focusRules";
import type { DashboardFocusRecordSummary } from "@/types/dashboard";
import { toLocalDateKey } from "./focusMetrics";

/**
 * Minutos efetivamente elegíveis a recompensa em uma única sessão produtiva:
 * desconsidera sessões abaixo do mínimo (10m) e aplica o teto único (120m),
 * evitando que tempo excedente não recompensado consuma a cota diária.
 */
export function getRewardableFocusMinutes(durationMinutes: number): number {
  const safeMinutes = Math.max(0, Math.round(durationMinutes || 0));
  if (safeMinutes < FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES) {
    return 0;
  }
  return Math.min(safeMinutes, FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES);
}

function sumDateFocusMinutes(
  records: DashboardFocusRecordSummary[],
  dateKey: string,
  timeZone: string | null | undefined,
  dateField: "endTime" | "startTime",
  mapDuration: (durationMinutes: number) => number,
): number {
  if (!dateKey || records.length === 0) return 0;
  return records.reduce((sum, rec) => {
    if (rec.inventoryItemId) return sum;
    const rawDate =
      dateField === "startTime" ? rec.startTime : rec.endTime || rec.startTime;
    if (toLocalDateKey(rawDate, timeZone) !== dateKey) return sum;
    return sum + mapDuration(rec.durationMinutes || 0);
  }, 0);
}

/**
 * Soma os minutos produtivos reais (excluindo itens da mochila/lazer) registrados na data informada.
 */
export function calculateProductiveMinutesForDate(
  records: DashboardFocusRecordSummary[],
  dateKey: string,
  timeZone?: string | null,
  dateField: "endTime" | "startTime" = "endTime",
): number {
  return sumDateFocusMinutes(records, dateKey, timeZone, dateField, (mins) =>
    Math.max(0, mins),
  );
}

/**
 * Soma estritamente os minutos elegíveis à recompensa (>= 10 min, teto de 120 min por sessão)
 * agrupados por endTime no fuso do usuário, espelhando a query do backend para o cap diário.
 */
export function calculateRewardableMinutesForDate(
  records: DashboardFocusRecordSummary[],
  dateKey: string,
  timeZone?: string | null,
  dateField: "endTime" | "startTime" = "endTime",
): number {
  return sumDateFocusMinutes(
    records,
    dateKey,
    timeZone,
    dateField,
    getRewardableFocusMinutes,
  );
}

export type DailyFocusYieldStatus = "full" | "half" | "quarter" | "capped";

export type DailyFocusYieldTierPercent = 0 | 25 | 50 | 100;

/**
 * Estilos centralizados para badges de rendimento diário (evita duplicação entre
 * FocusDailyYieldBadge e FocusMetricsGrid).
 */
export const DAILY_YIELD_TIER_STYLES: Record<
  DailyFocusYieldTierPercent,
  string
> = {
  100: "bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300",
  50: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
  25: "bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300",
  0: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300",
};

export interface DailyFocusYieldInfo {
  loggedMinutesToday: number;
  tierPercent: 100 | 50 | 25 | 0;
  status: DailyFocusYieldStatus;
  tier1CapMinutes: number;
  tier2CapMinutes: number;
  hardCapMinutes: number;
  currentTierMinutesRemaining: number;
  minutesUntilZero: number;
  progressPercentOfCap: number;
}

/**
 * Resume o estágio atual da tabela diária de rendimento decrescente (Modo Aventura):
 * - 0h a 4h (0–240 min): 100% de ganho
 * - 4h a 6h (240–360 min): 50% de ganho
 * - 6h a 8h (360–480 min): 25% de ganho
 * - Acima de 8h (>= 480 min): 0% (teto diário)
 */
export function getDailyFocusYieldInfo(
  loggedMinutesToday: number,
): DailyFocusYieldInfo {
  const safeMinutes = Math.max(0, Math.round(loggedMinutesToday));
  const tier1 = FOCUS_REWARD_RULES.DAILY_SOFT_CAP_MINUTES;
  const tier2 = FOCUS_REWARD_RULES.DAILY_TIER2_CAP_MINUTES;
  const hardCap = FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES;

  const progressPercentOfCap = Math.min(
    100,
    Math.round((safeMinutes / hardCap) * 100),
  );
  const minutesUntilZero = Math.max(0, hardCap - safeMinutes);

  if (safeMinutes >= hardCap) {
    return {
      loggedMinutesToday: safeMinutes,
      tierPercent: 0,
      status: "capped",
      tier1CapMinutes: tier1,
      tier2CapMinutes: tier2,
      hardCapMinutes: hardCap,
      currentTierMinutesRemaining: 0,
      minutesUntilZero: 0,
      progressPercentOfCap: 100,
    };
  }

  if (safeMinutes >= tier2) {
    return {
      loggedMinutesToday: safeMinutes,
      tierPercent: 25,
      status: "quarter",
      tier1CapMinutes: tier1,
      tier2CapMinutes: tier2,
      hardCapMinutes: hardCap,
      currentTierMinutesRemaining: hardCap - safeMinutes,
      minutesUntilZero,
      progressPercentOfCap,
    };
  }

  if (safeMinutes >= tier1) {
    return {
      loggedMinutesToday: safeMinutes,
      tierPercent: 50,
      status: "half",
      tier1CapMinutes: tier1,
      tier2CapMinutes: tier2,
      hardCapMinutes: hardCap,
      currentTierMinutesRemaining: tier2 - safeMinutes,
      minutesUntilZero,
      progressPercentOfCap,
    };
  }

  return {
    loggedMinutesToday: safeMinutes,
    tierPercent: 100,
    status: "full",
    tier1CapMinutes: tier1,
    tier2CapMinutes: tier2,
    hardCapMinutes: hardCap,
    currentTierMinutesRemaining: tier1 - safeMinutes,
    minutesUntilZero,
    progressPercentOfCap,
  };
}
