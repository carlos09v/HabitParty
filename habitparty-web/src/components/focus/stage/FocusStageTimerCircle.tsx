"use client";

import { useFocusTimerDisplay } from "@/hooks/useFocusTimer";
import { cn } from "@/utils";
import { formatFocusTime } from "@/utils/focusFormatters";

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

  // Cálculo da porcentagem de progresso para o círculo SVG
  let progressPercent = 0;
  if (
    props.mode !== undefined ||
    props.secondsRemaining !== undefined ||
    props.phase !== undefined
  ) {
    if (mode === "POMO" || isInventoryItem || isBreak) {
      progressPercent =
        totalDurationSeconds > 0
          ? ((totalDurationSeconds - secondsRemaining) / totalDurationSeconds) *
            100
          : 0;
    } else {
      progressPercent = ((elapsedSeconds % 3600) / 3600) * 100;
    }
  } else {
    progressPercent = storeDisplay.progressPercent;
  }

  // Raio e circunferência para o SVG stroke
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  const displayTime =
    props.secondsRemaining !== undefined || props.elapsedSeconds !== undefined
      ? mode === "POMO" || isInventoryItem || isBreak
        ? formatFocusTime(secondsRemaining)
        : formatFocusTime(elapsedSeconds)
      : storeDisplay.formattedTime;

  const sizeClasses = {
    sm: "w-44 h-44 sm:w-48 sm:h-48",
    md: "w-56 h-56 sm:w-64 sm:h-64",
    lg: "w-72 h-72 sm:w-80 sm:h-80",
    zen: "w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px]",
  }[size];

  const fontClasses = {
    sm: "text-3xl sm:text-4xl",
    md: "text-4xl sm:text-5xl",
    lg: "text-5xl sm:text-6xl",
    zen: "text-6xl sm:text-7xl md:text-8xl",
  }[size];

  const content = (
    <>
      <svg
        className="w-full h-full -rotate-90 transform"
        viewBox="0 0 280 280"
        role="img"
        aria-label="Indicador de progresso do timer de foco"
      >
        <title>Indicador de progresso do timer de foco</title>
        {/* Círculo de fundo */}
        <circle
          cx="140"
          cy="140"
          r={radius}
          strokeWidth="10"
          fill="transparent"
          className={cn(
            "transition-colors duration-500",
            isBreak ? "stroke-emerald-950/40" : "stroke-white/10",
          )}
        />
        {/* Círculo de progresso animado */}
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
            "transition-all duration-500 ease-linear",
            isBreak
              ? "stroke-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]"
              : "stroke-gold drop-shadow-[0_0_12px_rgba(234,179,8,0.3)]",
          )}
        />
      </svg>

      {/* Tempo Centralizado */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 transition-transform duration-200">
        <span
          className={cn(
            "font-mono font-black tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-colors duration-500",
            fontClasses,
            isBreak ? "text-emerald-300" : "text-neutral-50",
          )}
        >
          {displayTime}
        </span>

        {/* Badge de Status / Fase */}
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border transition-all duration-300",
            isBreak
              ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              : "bg-white/10 border-white/15 text-neutral-300",
          )}
        >
          {isBreak
            ? isRunning
              ? phase === "LONG_BREAK"
                ? "Pausa Longa"
                : "Pausa Curta"
              : isPaused
                ? "Pausa Pausada"
                : "Pronto para Descansar"
            : isRunning
              ? "Focando"
              : isPaused
                ? "Pausado"
                : "Pronto para Iniciar"}
        </span>

        {/* Ciclos de Pomodoro */}
        {mode === "POMO" && !isInventoryItem && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {[1, 2, 3, 4].map((cycle) => (
              <div
                key={cycle}
                className={cn(
                  "w-2.5 h-2.5 rounded-full border transition-all",
                  cycle <= completedCycles
                    ? isBreak
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-gold border-gold shadow-glow-gold-xs"
                    : isBreak
                      ? "bg-transparent border-emerald-500/30"
                      : "bg-transparent border-white/20",
                )}
                title={`Ciclo ${cycle} ${cycle <= completedCycles ? "concluído" : ""}`}
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
        title={isRunning ? "Clique para pausar" : "Clique para começar"}
        className={cn(
          "group relative flex items-center justify-center select-none transition-all duration-300 cursor-pointer hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:rounded-full bg-transparent border-none p-0",
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
        "group relative flex items-center justify-center select-none transition-all duration-300",
        sizeClasses,
      )}
    >
      {content}
    </div>
  );
}
