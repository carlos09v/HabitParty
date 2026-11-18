/**
 * Utilitários centralizados de formatação de tempo e data para as telas de Foco.
 */

export { parseLocalDate, parseServerDate, toLocalISOString } from "./date";

import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
  FOCUS_REWARD_RULES,
} from "@/constants/focus";
import type { AppLocale } from "@/i18n/config";
import type { DateFormat, TimeFormat } from "@/types/ui";
import {
  formatShortDate,
  formatTimeDisplay,
  parseLocalDate,
  parseServerDate,
} from "./date";

/**
 * Formata segundos no padrão MM:SS (ex: 25:00 ou 04:05).
 * Se o tempo exceder 60 minutos, formata como HH:MM:SS.
 */
export function formatFocusTime(seconds: number): string {
  if (seconds < 0) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Indica se um ciclo Pomodoro de trabalho atingiu 00:00 e está contando tempo excedente.
 */
export function isFocusOvertime(timerState: {
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  elapsedSeconds: number;
  totalDurationSeconds?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): boolean {
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  return (
    !isBreak &&
    timerState.mode === "POMO" &&
    timerState.target?.type !== "inventory" &&
    timerState.secondsRemaining === 0 &&
    timerState.elapsedSeconds >= (timerState.totalDurationSeconds ?? 1)
  );
}

/**
 * Retorna os segundos excedentes após o término do ciclo Pomodoro de trabalho.
 */
export function getFocusOvertimeSeconds(timerState: {
  elapsedSeconds: number;
  totalDurationSeconds?: number;
}): number {
  return Math.max(
    0,
    timerState.elapsedSeconds - (timerState.totalDurationSeconds ?? 0),
  );
}

/**
 * Retorna os segundos a serem exibidos no mostrador do timer:
 * Contagem regressiva para Pomodoro ou Item da Mochila com saldo,
 * contagem excedente em overtime de Pomodoro,
 * ou contagem progressiva para Cronômetro livre.
 */
export function getFocusDisplaySeconds(timerState: {
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  elapsedSeconds: number;
  totalDurationSeconds?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): number {
  if (isFocusOvertime(timerState)) {
    return getFocusOvertimeSeconds(timerState);
  }
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  const isCountdown =
    timerState.mode === "POMO" ||
    timerState.target?.type === "inventory" ||
    isBreak;
  return isCountdown ? timerState.secondsRemaining : timerState.elapsedSeconds;
}

/**
 * Formata diretamente o tempo de exibição atual do timer para string legível (MM:SS, HH:MM:SS ou +MM:SS em excedente).
 */
export function formatFocusDisplayTime(timerState: {
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  elapsedSeconds: number;
  totalDurationSeconds?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): string {
  const formatted = formatFocusTime(getFocusDisplaySeconds(timerState));
  return isFocusOvertime(timerState) ? `+${formatted}` : formatted;
}

export interface FocusTimerDerivedMeta {
  isRunning: boolean;
  isBreak: boolean;
  isInventory: boolean;
  isOvertime: boolean;
  canComplete: boolean;
  isPartialPomo: boolean;
  isSessionRewardCapped: boolean;
  nextBreakMinutes: number;
}

/**
 * Calcula o percentual de progresso (0..100) do ciclo Pomodoro, pausa, cupom ou cronômetro.
 */
export function getFocusProgressPercent(timerState: {
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  elapsedSeconds: number;
  totalDurationSeconds?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): number {
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  const isInventory = timerState.target?.type === "inventory";
  const isCountdown = timerState.mode === "POMO" || isInventory || isBreak;

  if (isCountdown) {
    const total = timerState.totalDurationSeconds ?? 0;
    if (total <= 0) return 0;
    const raw = ((total - timerState.secondsRemaining) / total) * 100;
    return Math.min(100, Math.max(0, raw));
  }

  const raw = ((timerState.elapsedSeconds % 3600) / 3600) * 100;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Calcula a duração (em minutos) da próxima pausa considerando o ciclo atual (a cada 4 ciclos, pausa longa).
 */
export function getNextFocusBreakMinutes(completedCycles = 0): number {
  return (completedCycles + 1) % 4 === 0
    ? DEFAULT_LONG_BREAK_MINUTES
    : DEFAULT_SHORT_BREAK_MINUTES;
}

/**
 * Deriva estados visuais e de controle do timer de foco em uma única função pura,
 * evitando duplicação entre Display, Widget lateral, PiP e Host.
 */
export function getFocusTimerDerivedState(timerState: {
  isActive: boolean;
  isPaused: boolean;
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  elapsedSeconds: number;
  totalDurationSeconds?: number;
  completedCycles?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): FocusTimerDerivedMeta {
  const isRunning = timerState.isActive && !timerState.isPaused;
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  const isInventory = timerState.target?.type === "inventory";
  const isOvertime = isFocusOvertime(timerState);
  const canComplete = !isBreak && timerState.elapsedSeconds >= 60;
  const isPartialPomo =
    !isBreak &&
    !isInventory &&
    timerState.mode === "POMO" &&
    timerState.secondsRemaining > 0;
  const isSessionRewardCapped =
    !isBreak &&
    !isInventory &&
    timerState.elapsedSeconds >= FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES * 60;
  const nextBreakMinutes = getNextFocusBreakMinutes(timerState.completedCycles);

  return {
    isRunning,
    isBreak,
    isInventory,
    isOvertime,
    canComplete,
    isPartialPomo,
    isSessionRewardCapped,
    nextBreakMinutes,
  };
}

/**
 * Formata minutos em formato amigável (ex: 0m, 35m, 1h, 1h 30m).
 */
export function formatFocusMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

export const formatDurationMinutes = formatFocusMinutes;

/**
 * Formata data de término de registro de foco no formato legível respeitando `dateFormat` (ex: DD/MM às HH:MM ou MM/DD at HH:MM).
 */
export function formatFocusDate(
  dateStr?: string | null,
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeFormat?: TimeFormat,
  timeZone?: string | null,
): string {
  if (!dateStr) return "-";
  try {
    const hasExplicitTz = /([zZ]|[+-]\d{2}(?::?\d{2})?)$/.test(dateStr.trim());
    const d = hasExplicitTz
      ? parseServerDate(dateStr)
      : parseLocalDate(dateStr);
    if (!d) return dateStr;
    const day = formatShortDate(dateStr, {
      includeYear: false,
      isLocal: !hasExplicitTz,
      locale,
      dateFormat,
      timeZone,
    });
    const time = formatTimeDisplay(d, {
      timeFormat,
      locale,
      ...(hasExplicitTz ? { timeZone } : {}),
    });
    return locale === "en" ? `${day} at ${time}` : `${day} às ${time}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata uma duração em segundos no formato compacto "Xm Ys", "Xm" ou "Ys".
 */
export function formatDurationMinSec(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/**
 * Formata o tempo restante de um item da mochila (ex: 29m 55s restantes, 30m restantes, 45s restantes).
 */
export function formatBackpackItemRemainingTime(
  remainingSeconds?: number | null,
  locale: AppLocale = "pt-BR",
): string {
  const isEn = locale === "en";
  if (remainingSeconds !== undefined && remainingSeconds !== null) {
    if (remainingSeconds <= 1) {
      return isEn ? "Time completed!" : "Tempo concluído!";
    }
    const suffix = isEn ? "left" : "restantes";
    return `${formatDurationMinSec(remainingSeconds)} ${suffix}`;
  }
  return isEn ? "Active Coupon" : "Cupom Ativo";
}

/**
 * Formata a duração de um registro de foco a partir de startTime, endTime e durationMinutes.
 * Se o tempo for inferior a 1 minuto, exibe em segundos exatos (ex: 2s, 45s).
 */
export function formatFocusRecordDuration(
  startTime?: string | null,
  endTime?: string | null,
  durationMinutes = 0,
): string {
  if (startTime && endTime) {
    try {
      const startMs = new Date(startTime).getTime();
      const endMs = new Date(endTime).getTime();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        const diffSecs = Math.max(0, Math.round((endMs - startMs) / 1000));
        if (diffSecs > 0 && diffSecs < 60) {
          return `${diffSecs}s`;
        }
        if (diffSecs >= 60) {
          const mins = Math.floor(diffSecs / 60);
          const remSecs = diffSecs % 60;
          if (mins < 10 && remSecs > 0) {
            return `${mins}m ${remSecs}s`;
          }
          return formatFocusMinutes(mins);
        }
      }
    } catch {
      // Ignora erro e recorre ao durationMinutes
    }
  }

  if (durationMinutes > 0) {
    return formatFocusMinutes(durationMinutes);
  }

  return "0m";
}

/**
 * Retorna os minutos restantes arredondados para cima de um item da mochila.
 */
export function getItemRemainingMinutes(
  remainingSeconds?: number | null,
): number {
  if (remainingSeconds !== undefined && remainingSeconds !== null) {
    return Math.ceil(remainingSeconds / 60);
  }
  return 0;
}

/**
 * Retorna se o tempo de um item da mochila em foco foi esgotado (<= 1s).
 */
export function isBackpackItemTimeDepleted(
  remainingSeconds?: number | null,
): boolean {
  return (
    remainingSeconds !== undefined &&
    remainingSeconds !== null &&
    remainingSeconds <= 1
  );
}
