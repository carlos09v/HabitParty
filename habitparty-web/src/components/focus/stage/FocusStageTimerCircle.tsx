import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_CYCLES_UNTIL_LONG_BREAK } from "@/constants/focusRules";
import { useFocusTimerDisplay } from "@/hooks/useFocusTimer";
import { useIsClient } from "@/hooks/useIsClient";
import { useFocusPreferencesStore } from "@/store/focusPreferencesStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { isFocusOvertime } from "@/utils/focusFormatters";

export interface FocusStageTimerCircleProps {
  size?: "sm" | "md" | "lg" | "zen";
  onToggle?: () => void;
}

const RADIUS = 120;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Anel SVG de progresso (1Hz isolado).
 * Oculta o traço em 0% para evitar o ponto residual criado por `strokeLinecap="round"`.
 */
function FocusTimerSvgRing() {
  const { progressPercent, isBreak, isOvertime } = useFocusTimerDisplay();

  const clampedProgress = Math.max(0, Math.min(100, progressPercent));
  const strokeDashoffset =
    CIRCUMFERENCE - (clampedProgress / 100) * CIRCUMFERENCE;
  const hasVisibleProgress = clampedProgress > 0;

  return (
    <svg
      className="w-full h-full -rotate-90 transform"
      viewBox="0 0 280 280"
      aria-hidden="true"
    >
      <circle
        cx="140"
        cy="140"
        r={RADIUS}
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
      {hasVisibleProgress && (
        <>
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            strokeWidth="16"
            strokeDasharray={CIRCUMFERENCE}
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
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            strokeWidth="10"
            strokeDasharray={CIRCUMFERENCE}
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
        </>
      )}
    </svg>
  );
}

/**
 * Dígitos centrais do relógio (1Hz isolado).
 * Usa `role="timer" aria-live="off"` para não spamar leitores de tela a cada tick
 * e reduz automaticamente a escala tipográfica quando exibe horas (`HH:MM:SS` / `+HH:MM:SS`).
 */
function FocusTimerClockDigits({ size }: { size: "sm" | "md" | "lg" | "zen" }) {
  const { formattedTime, isBreak, isOvertime } = useFocusTimerDisplay();
  const isLongTimeFormat = formattedTime.length >= 8;

  const fontClasses = isLongTimeFormat
    ? {
        sm: "text-2xl sm:text-[1.75rem]",
        md: "text-2xl sm:text-[2rem]",
        lg: "text-3xl min-[380px]:text-4xl sm:text-5xl",
        zen: "text-4xl min-[400px]:text-5xl sm:text-6xl md:text-7xl",
      }[size]
    : {
        sm: "text-3xl sm:text-4xl",
        md: "text-3xl sm:text-[2.6rem]",
        lg: "text-4xl min-[380px]:text-5xl sm:text-6xl",
        zen: "text-5xl min-[400px]:text-6xl sm:text-7xl md:text-8xl",
      }[size];

  return (
    <span
      role="timer"
      aria-live="off"
      className={cn(
        "font-mono font-black tracking-tight tabular-nums timer-display-shadow transition-colors duration-500",
        fontClasses,
        isBreak
          ? "text-emerald-700 dark:text-emerald-300"
          : isOvertime
            ? "text-cyan-700 dark:text-cyan-200"
            : "text-neutral-50",
      )}
    >
      {formattedTime}
    </span>
  );
}

/**
 * Badge de status, anunciador `aria-live="polite"` para transições de fase
 * e bolinhas de ciclo Pomodoro — assinam apenas fatias de baixa frequência (0 re-renders a 1Hz).
 */
function FocusTimerStatusAndCycles({
  size,
}: {
  size: "sm" | "md" | "lg" | "zen";
}) {
  const t = useTranslations("focus.timer");
  const isClient = useIsClient();

  const rawMode = useFocusTimerStore((s) => s.mode);
  const rawPhase = useFocusTimerStore((s) => s.phase);
  const rawIsActive = useFocusTimerStore((s) => s.isActive);
  const rawIsPaused = useFocusTimerStore((s) => s.isPaused);
  const rawIsInventory = useFocusTimerStore(
    (s) => s.target?.type === "inventory",
  );
  const rawIsOvertime = useFocusTimerStore((s) => isFocusOvertime(s));
  const rawCompletedCycles = useFocusTimerStore((s) => s.completedCycles);
  const rawCyclesUntilLongBreak = useFocusPreferencesStore(
    (s) => s.cyclesUntilLongBreak,
  );

  const mode = isClient ? rawMode : "POMO";
  const phase = isClient ? rawPhase : "WORK";
  const isActive = isClient ? rawIsActive : false;
  const isPaused = isClient ? rawIsPaused : false;
  const isRunning = isActive && !isPaused;
  const isInventoryItem = isClient ? rawIsInventory : false;
  const isOvertime = isClient ? rawIsOvertime : false;
  const completedCycles = isClient ? rawCompletedCycles : 0;
  const cyclesPerBlock = isClient
    ? Math.max(2, rawCyclesUntilLongBreak)
    : DEFAULT_CYCLES_UNTIL_LONG_BREAK;

  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";

  const statusLabel = isBreak
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
          : t("status.readyToStart");

  const prevStatusRef = useRef<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  useEffect(() => {
    if (!isClient) return;
    if (prevStatusRef.current === null) {
      prevStatusRef.current = statusLabel;
      return;
    }
    if (prevStatusRef.current !== statusLabel) {
      prevStatusRef.current = statusLabel;
      setLiveAnnouncement(statusLabel);
    }
  }, [isClient, statusLabel]);

  const dotsFilledInBlock =
    isBreak && completedCycles > 0 && completedCycles % cyclesPerBlock === 0
      ? cyclesPerBlock
      : completedCycles % cyclesPerBlock;

  return (
    <>
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </output>

      <span
        className={cn(
          "font-bold uppercase rounded-full border transition-colors duration-300",
          size === "sm"
            ? "text-[11px] px-2.5 py-0.5 tracking-wider"
            : "text-xs px-3 py-0.5 tracking-wider",
          isBreak
            ? "bg-emerald-500/15 dark:bg-emerald-950/70 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-2xs dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
            : isOvertime
              ? "bg-cyan-500/15 dark:bg-cyan-500/20 border-cyan-600/45 dark:border-cyan-400/45 text-cyan-800 dark:text-cyan-200 shadow-2xs dark:shadow-[0_0_12px_rgba(34,211,238,0.25)]"
              : "bg-surface border-neutral-700 dark:bg-white/10 dark:border-white/15 text-neutral-300",
        )}
      >
        {statusLabel}
      </span>

      {mode === "POMO" && !isInventoryItem && (
        <div
          className={cn(
            "flex items-center",
            cyclesPerBlock > 6 && size === "sm" ? "gap-1" : "gap-1.5",
            size === "sm" ? "mt-1" : "mt-1.5",
          )}
        >
          {Array.from({ length: cyclesPerBlock }, (_, index) => {
            const cycle = index + 1;
            return (
              <div
                key={cycle}
                className={cn(
                  "rounded-full border transition-colors",
                  cyclesPerBlock > 6 && size === "sm"
                    ? "w-2 h-2"
                    : "w-2.5 h-2.5",
                  cycle <= dotsFilledInBlock
                    ? isBreak
                      ? "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : "bg-gold border-gold shadow-glow-gold-xs"
                    : isBreak
                      ? "bg-transparent border-emerald-500/30"
                      : "bg-transparent border-neutral-600 dark:border-white/20",
                )}
                title={
                  cycle <= dotsFilledInBlock
                    ? t("cycleCompleted", { cycle })
                    : t("cycleNumber", { cycle })
                }
              />
            );
          })}
          {completedCycles >= cyclesPerBlock && (
            <span
              className="text-[11px] font-bold text-amber-800 dark:text-gold tabular-nums ml-0.5"
              title={t("completedCyclesTotal", { count: completedCycles })}
            >
              ×{completedCycles}
            </span>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Círculo visual protagonista do Timer de Foco.
 * Isola o SVG + dígitos (1Hz) da badge de status, anunciador `aria-live` e bolinhas de ciclo.
 */
export function FocusStageTimerCircle({
  size = "lg",
  onToggle,
}: FocusStageTimerCircleProps = {}) {
  const t = useTranslations("focus.timer");
  const isClient = useIsClient();
  const rawIsRunning = useFocusTimerStore((s) => s.isActive && !s.isPaused);
  const isRunning = isClient ? rawIsRunning : false;

  const sizeClasses = {
    sm: "w-44 h-44 sm:w-48 sm:h-48",
    md: "w-48 h-48 sm:w-52 sm:h-52",
    lg: "w-64 min-[380px]:w-72 sm:w-80 max-w-full aspect-square",
    zen: "w-[min(19rem,calc(100dvw-2rem),46dvh)] sm:w-[min(24rem,52dvh)] md:w-[min(420px,55dvh)] aspect-square",
  }[size];

  const content = (
    <>
      <FocusTimerSvgRing />
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-transform duration-200",
          size === "sm" ? "gap-1" : "gap-1.5",
        )}
      >
        <FocusTimerClockDigits size={size} />
        <FocusTimerStatusAndCycles size={size} />
      </div>
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title={isRunning ? t("clickToPause") : t("clickToStart")}
        aria-label={isRunning ? t("clickToPause") : t("clickToStart")}
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
