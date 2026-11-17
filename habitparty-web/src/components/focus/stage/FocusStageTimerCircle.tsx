"use client";

import { useTranslations } from "next-intl";
import { useFocusTimerDisplay } from "@/hooks/useFocusTimer";
import { cn } from "@/utils";
import {
  formatFocusDisplayTime,
  getFocusProgressPercent,
  isFocusOvertime,
} from "@/utils/focusFormatters";

export interface FocusStageTimerCircleProps {
  mode?: "POMO" | "STOPWATCH";
  phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
  isInventoryItem?: boolean;
  totalDurationSeconds?: number;
  secondsRemaining?: number;
  elapsedSeconds?: number;
  isRunning?: boolean;
  isPaused?: boolean;
  completedCycles?: number;
  size?: "sm" | "md" | "lg" | "zen";
  onToggle?: () => void;
}

export function FocusStageTimerCircle(props: FocusStageTimerCircleProps = {}) {
  const t = useTranslations("focus.timer");
  const storeDisplay = useFocusTimerDisplay();

  const mode = props.mode ?? storeDisplay.mode;
  const phase = props.phase ?? storeDisplay.phase ?? "WORK";
  const isInventoryItem = props.isInventoryItem ?? storeDisplay.isInventoryItem;
  const totalDurationSeconds =
    props.totalDurationSeconds ?? storeDisplay.totalDurationSeconds;
  const secondsRemaining =
    props.secondsRemaining ?? storeDisplay.secondsRemaining;
  const elapsedSeconds = props.elapsedSeconds ?? storeDisplay.elapsedSeconds;
  const isRunning = props.isRunning ?? storeDisplay.isRunning;
  const isPaused = props.isPaused ?? storeDisplay.isPaused;
  const completedCycles = props.completedCycles ?? storeDisplay.completedCycles;
  const size = props.size ?? "lg";

  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isOvertime = isFocusOvertime({
    mode,
    phase,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    target: isInventoryItem ? { type: "inventory" } : undefined,
  });

  // Cálculo da porcentagem de progresso para o círculo SVG
  const progressPercent =
    props.mode !== undefined ||
    props.secondsRemaining !== undefined ||
    props.phase !== undefined
      ? getFocusProgressPercent({
          mode,
          phase,
          secondsRemaining,
          elapsedSeconds,
          totalDurationSeconds,
          target: isInventoryItem ? { type: "inventory" } : undefined,
        })
      : storeDisplay.progressPercent;

  // Raio e circunferência para o SVG stroke
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  const displayTime =
    props.secondsRemaining !== undefined || props.elapsedSeconds !== undefined
      ? formatFocusDisplayTime({
          mode,
          phase,
          secondsRemaining,
          elapsedSeconds,
          totalDurationSeconds,
          target: isInventoryItem ? { type: "inventory" } : undefined,
        })
      : storeDisplay.formattedTime;

  const sizeClasses = {
    sm: "w-44 h-44 sm:w-48 sm:h-48",
    md: "w-56 h-56 sm:w-64 sm:h-64",
    lg: "w-64 min-[380px]:w-72 sm:w-80 max-w-full aspect-square",
    zen: "w-[min(19rem,calc(100dvw-2rem),46dvh)] sm:w-[min(24rem,52dvh)] md:w-[min(420px,55dvh)] aspect-square",
  }[size];

  const fontClasses = {
    sm: "text-3xl sm:text-4xl",
    md: "text-4xl sm:text-5xl",
    lg: "text-4xl min-[380px]:text-5xl sm:text-6xl",
    zen: "text-5xl min-[400px]:text-6xl sm:text-7xl md:text-8xl",
  }[size];

  const content = (
    <>
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox="0 0 280 280"
        role="img"
        aria-label={t("progressAria")}
      >
        <title>{t("progressAria")}</title>
        {/* Círculo de fundo */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          strokeWidth="10"
          fill="transparent"
          className={cn(
            "transition-colors duration-500",
            isBreak
              ? "stroke-emerald-500/20 dark:stroke-emerald-950/40"
              : isOvertime
                ? "stroke-cyan-500/25 dark:stroke-cyan-950/45"
                : "stroke-neutral-700 dark:stroke-white/10",
          )}
        />
        {/* Halo sutil estático sem filtro SVG drop-shadow a 1Hz */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={cn(
            "transition-colors duration-300",
            isBreak
              ? "stroke-emerald-600/25 dark:stroke-emerald-400/20"
              : isOvertime
                ? "stroke-cyan-600/25 dark:stroke-cyan-400/25"
                : "stroke-gold/25 dark:stroke-gold/18",
          )}
        />
        {/* Círculo de progresso animado (1Hz sem rasterizar drop-shadow nem transition-all) */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className={cn(
            "transition-colors duration-300",
            isBreak
              ? "stroke-emerald-600 dark:stroke-emerald-400"
              : isOvertime
                ? "stroke-cyan-600 dark:stroke-cyan-400"
                : "stroke-gold",
          )}
        />
      </svg>

      {/* Tempo Centralizado */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-200",
          size === "sm" ? "gap-1" : "gap-1.5",
        )}
      >
        <span
          className={cn(
            "font-mono font-black tracking-tight timer-display-shadow transition-colors duration-500",
            fontClasses,
            isBreak
              ? "text-emerald-400 dark:text-emerald-300"
              : isOvertime
                ? "text-cyan-300 dark:text-cyan-200"
                : "text-neutral-50",
          )}
        >
          {displayTime}
        </span>

        {/* Badge de Status / Fase */}
        <span
          className={cn(
            "font-bold uppercase rounded-full border transition-colors duration-300",
            size === "sm"
              ? "text-[10px] px-2.5 py-0.5 tracking-wider"
              : "text-xs px-3 py-0.5 tracking-wider",
            isBreak
              ? "bg-emerald-500/15 dark:bg-emerald-950/70 border-emerald-500/40 text-emerald-400 dark:text-emerald-300 shadow-2xs dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              : isOvertime
                ? "bg-cyan-500/15 dark:bg-cyan-500/20 border-cyan-600/45 dark:border-cyan-400/45 text-cyan-800 dark:text-cyan-200 shadow-2xs dark:shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                : "bg-white/10 border-white/15 text-neutral-300",
          )}
        >
          {isBreak
            ? isRunning
              ? phase === "LONG_BREAK"
                ? t("status.longBreak")
                : t("status.shortBreak")
              : isPaused
                ? t("status.breakPaused")
                : t("status.readyToRest")
            : isOvertime
              ? isRunning
                ? t("status.overtime")
                : t("status.overtimePaused")
              : isRunning
                ? t("status.focusing")
                : isPaused
                  ? t("status.paused")
                  : t("status.readyToStart")}
        </span>

        {/* Ciclos de Pomodoro */}
        {mode === "POMO" && !isInventoryItem && (
          <div
            className={cn(
              "flex items-center gap-1.5",
              size === "sm" ? "mt-1" : "mt-1.5",
            )}
          >
            {[1, 2, 3, 4].map((cycle) => (
              <div
                key={cycle}
                className={cn(
                  "w-2.5 h-2.5 rounded-full border transition-colors",
                  cycle <= completedCycles
                    ? isBreak
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-gold border-gold shadow-glow-gold-xs"
                    : isBreak
                      ? "bg-transparent border-emerald-500/30"
                      : "bg-transparent border-neutral-600 dark:border-white/20",
                )}
                title={
                  cycle <= completedCycles
                    ? t("cycleCompleted", { cycle })
                    : t("cycleNumber", { cycle })
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (props.onToggle) {
    return (
      <button
        type="button"
        onClick={props.onToggle}
        title={isRunning ? t("clickToPause") : t("clickToStart")}
        className={cn(
          "group relative flex items-center justify-center select-none transition-transform duration-200 cursor-pointer hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:rounded-full bg-transparent border-none p-0",
          sizeClasses,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center justify-center select-none",
        sizeClasses,
      )}
    >
      {content}
    </div>
  );
}
