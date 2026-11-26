/**
 * Utilitários centralizados de formatação de tempo e data para as telas de Foco.
 */

import {
  DEFAULT_CYCLES_UNTIL_LONG_BREAK,
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
  FOCUS_REWARD_RULES,
} from "@/constants/focusRules";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import { hasTimeZoneSuffix, parseLocalDate, parseServerDate } from "./date";

/**
 * Formata segundos no padrão MM:SS (ex: 25:00 ou 04:05).
 * Se o tempo exceder 60 minutos, formata como HH:MM:SS.
 */
export function formatFocusTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
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
  const totalDuration = timerState.totalDurationSeconds ?? 0;
  return (
    !isBreak &&
    timerState.mode === "POMO" &&
    timerState.target?.type !== "inventory" &&
    totalDuration > 0 &&
    timerState.secondsRemaining === 0 &&
    timerState.elapsedSeconds >= totalDuration
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

export interface FocusBreakPreferencesInput {
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  cyclesUntilLongBreak?: number;
}

export interface FocusBreakPlan {
  isLongBreak: boolean;
  minutes: number;
  phase: "SHORT_BREAK" | "LONG_BREAK";
}

/**
 * Indica se a contagem de ciclos concluídos corresponde a uma pausa longa.
 */
export function isLongBreakCycle(
  cycleCount: number,
  cyclesUntilLongBreak = DEFAULT_CYCLES_UNTIL_LONG_BREAK,
): boolean {
  const cyclesPerBlock = Math.max(1, cyclesUntilLongBreak);
  return cycleCount > 0 && cycleCount % cyclesPerBlock === 0;
}

/**
 * Resolve tipo, duração e fase da pausa para uma determinada contagem de ciclos concluídos.
 */
export function resolveFocusBreakPlan(
  cycleCount: number,
  prefs?: FocusBreakPreferencesInput,
): FocusBreakPlan {
  const shortBreak = prefs?.shortBreakMinutes ?? DEFAULT_SHORT_BREAK_MINUTES;
  const longBreak = prefs?.longBreakMinutes ?? DEFAULT_LONG_BREAK_MINUTES;
  const isLongBreak = isLongBreakCycle(cycleCount, prefs?.cyclesUntilLongBreak);
  return {
    isLongBreak,
    minutes: isLongBreak ? longBreak : shortBreak,
    phase: isLongBreak ? "LONG_BREAK" : "SHORT_BREAK",
  };
}

/**
 * Calcula a duração (em minutos) da próxima pausa considerando o ciclo atual
 * e as preferências configuradas (por padrão, pausa longa a cada 4 ciclos).
 */
export function getNextFocusBreakMinutes(
  completedCycles = 0,
  prefs?: FocusBreakPreferencesInput,
): number {
  return resolveFocusBreakPlan(completedCycles + 1, prefs).minutes;
}

/**
 * Resolve o ID e o nome da tarefa vinculada a partir do alvo ativo do timer de foco.
 * Itens de inventário/mochila nunca possuem tarefa vinculada.
 */
export function resolveLinkedTask(
  target?: {
    type?: "activity" | "inventory" | "task";
    id?: string;
    name?: string;
    taskId?: string;
    taskName?: string;
  } | null,
): { taskId?: string; taskName?: string } {
  if (!target || target.type === "inventory") {
    return {};
  }
  const taskId =
    target.taskId || (target.type === "task" ? target.id : undefined);
  const taskName =
    target.taskName || (target.type === "task" ? target.name : undefined);
  return { taskId, taskName };
}

/**
 * Faz parse seguro de um timestamp de registro de foco, respeitando se possui fuso explícito ou wall-clock local.
 */
export function parseFocusTimestamp(dateStr: string): Date | null {
  return hasTimeZoneSuffix(dateStr)
    ? parseServerDate(dateStr)
    : parseLocalDate(dateStr);
}

/**
 * Indica se a sessão atual pode ser salva (mínimo 60s, ou cupom da mochila já esgotado com saldo residual).
 */
export function canCompleteFocusSession(timerState: {
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  elapsedSeconds: number;
  secondsRemaining?: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): boolean {
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  if (isBreak) return false;
  if (timerState.elapsedSeconds >= 60) return true;
  return (
    timerState.target?.type === "inventory" &&
    timerState.elapsedSeconds > 0 &&
    (timerState.secondsRemaining ?? 1) <= 1
  );
}

/**
 * Indica se o timer está em um ciclo Pomodoro de trabalho antes do término previsto.
 */
export function isPartialPomoSession(timerState: {
  mode: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  secondsRemaining: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): boolean {
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  return (
    !isBreak &&
    timerState.target?.type !== "inventory" &&
    timerState.mode === "POMO" &&
    timerState.secondsRemaining > 0
  );
}

/**
 * Indica se a sessão de trabalho já atingiu o teto máximo de minutos premiados.
 */
export function isFocusSessionRewardCapped(timerState: {
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  elapsedSeconds: number;
  target?: { type?: "activity" | "inventory" | "task" } | null;
}): boolean {
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  return (
    !isBreak &&
    timerState.target?.type !== "inventory" &&
    timerState.elapsedSeconds >= FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES * 60
  );
}

/**
 * Deriva estados visuais e de controle do timer de foco em uma única função pura,
 * evitando duplicação entre Display, Widget lateral, PiP e Host.
 */
export function getFocusTimerDerivedState(
  timerState: {
    isActive: boolean;
    isPaused: boolean;
    mode: "POMO" | "STOPWATCH";
    phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
    secondsRemaining: number;
    elapsedSeconds: number;
    totalDurationSeconds?: number;
    completedCycles?: number;
    target?: { type?: "activity" | "inventory" | "task" } | null;
  },
  prefs?: FocusBreakPreferencesInput,
): FocusTimerDerivedMeta {
  const isRunning = timerState.isActive && !timerState.isPaused;
  const isBreak =
    timerState.phase === "SHORT_BREAK" || timerState.phase === "LONG_BREAK";
  const isInventory = timerState.target?.type === "inventory";
  const isOvertime = isFocusOvertime(timerState);
  const canComplete = canCompleteFocusSession(timerState);
  const isPartialPomo = isPartialPomoSession(timerState);
  const isSessionRewardCapped = isFocusSessionRewardCapped(timerState);
  const nextBreakMinutes = getNextFocusBreakMinutes(
    timerState.completedCycles,
    prefs,
  );

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
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const totalMinutes = Math.round(minutes);
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Formata uma duração em segundos no formato compacto "Xh Ym", "Xh", "Xm Ys", "Xm" ou "Ys".
 */
export function formatDurationMinSec(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const safeSeconds = Math.floor(seconds);
  if (safeSeconds >= 3600) {
    const h = Math.floor(safeSeconds / 3600);
    const remMins = Math.floor((safeSeconds % 3600) / 60);
    if (remMins === 0) return `${h}h`;
    return `${h}h ${remMins}m`;
  }
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
  const t = getUtilityTranslator(locale, "focus.remainingTime");
  if (remainingSeconds !== undefined && remainingSeconds !== null) {
    if (remainingSeconds <= 1) {
      return t("completed");
    }
    return t("remainingValue", {
      duration: formatDurationMinSec(remainingSeconds),
    });
  }
  return t("activeCoupon");
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
      const startDate = parseFocusTimestamp(startTime);
      const endDate = parseFocusTimestamp(endTime);
      const startMs = startDate?.getTime() ?? Number.NaN;
      const endMs = endDate?.getTime() ?? Number.NaN;
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
  if (
    remainingSeconds !== undefined &&
    remainingSeconds !== null &&
    Number.isFinite(remainingSeconds) &&
    remainingSeconds > 1
  ) {
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
