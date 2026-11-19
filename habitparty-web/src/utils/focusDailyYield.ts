import { FOCUS_REWARD_RULES } from "@/constants/focus";
import type { FocusRecord } from "@/types/focus";
import { toLocalDateKey } from "./focusMetrics";

/**
 * Soma os minutos produtivos (excluindo itens da mochila/lazer) registrados na data informada.
 */
export function calculateProductiveMinutesForDate(
  records: FocusRecord[],
  dateKey: string,
  timeZone?: string | null,
  dateField: "endTime" | "startTime" = "endTime",
): number {
  if (!dateKey || records.length === 0) return 0;
  return records.reduce((sum, rec) => {
    if (rec.inventoryItemId) return sum;
    const rawDate =
      dateField === "startTime" ? rec.startTime : rec.endTime || rec.startTime;
    if (toLocalDateKey(rawDate, timeZone) !== dateKey) return sum;
    return sum + (rec.durationMinutes || 0);
  }, 0);
}

export type DailyFocusYieldStatus = "full" | "half" | "quarter" | "capped";

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
