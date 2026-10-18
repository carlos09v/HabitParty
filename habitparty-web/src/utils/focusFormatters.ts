/**
 * Utilitários centralizados de formatação de tempo e data para as telas de Foco.
 */

export { toLocalISOString, parseServerDate } from "./date";
import { parseServerDate } from "./date";

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
 * Retorna os segundos a serem exibidos no mostrador do timer:
 * Contagem regressiva para Pomodoro ou Item da Mochila com saldo,
 * ou contagem progressiva para Cronômetro livre.
 */
export function getFocusDisplaySeconds(timerState: {
  mode: "POMO" | "STOPWATCH";
  secondsRemaining: number;
  elapsedSeconds: number;
  target?: { type?: "activity" | "inventory" } | null;
}): number {
  const isCountdown =
    timerState.mode === "POMO" || timerState.target?.type === "inventory";
  return isCountdown ? timerState.secondsRemaining : timerState.elapsedSeconds;
}

/**
 * Formata diretamente o tempo de exibição atual do timer para string legível (MM:SS ou HH:MM:SS).
 */
export function formatFocusDisplayTime(timerState: {
  mode: "POMO" | "STOPWATCH";
  secondsRemaining: number;
  elapsedSeconds: number;
  target?: { type?: "activity" | "inventory" } | null;
}): string {
  return formatFocusTime(getFocusDisplaySeconds(timerState));
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

/**
 * Formata data de término de registro de foco no formato legível (DD/MM às HH:MM).
 */
export function formatFocusDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const d = parseServerDate(dateStr);
    if (!d) return dateStr;
    const day = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    const time = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${day} às ${time}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata o tempo restante de um item da mochila (ex: 29m 55s restantes, 30m restantes, 45s restantes).
 */
export function formatBackpackItemRemainingTime(
  remainingSeconds?: number | null,
): string {
  if (remainingSeconds !== undefined && remainingSeconds !== null) {
    if (remainingSeconds <= 1) return "Tempo concluído!";
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    if (m > 0 && s > 0) return `${m}m ${s}s restantes`;
    if (m > 0) return `${m}m restantes`;
    return `${s}s restantes`;
  }
  return "Cupom Ativo";
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
