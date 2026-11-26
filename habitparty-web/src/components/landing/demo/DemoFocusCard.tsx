import { Pause, Play, Timer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { formatFocusTime } from "@/utils/focusFormatters";

const DEMO_TIMER_INITIAL_SECONDS = 25 * 60;

interface DemoFocusCardProps {
  isRunning: boolean;
  onToggleTimer: () => void;
  onComplete: () => void;
  onElapsedChange?: (hasElapsed: boolean) => void;
}

export function DemoFocusCard({
  isRunning,
  onToggleTimer,
  onComplete,
  onElapsedChange,
}: DemoFocusCardProps) {
  const t = useTranslations("landing.demo.focusCard");
  // Estado isolado na folha para evitar re-render de 1Hz em toda a LandingInteractiveDemo
  const [timerSeconds, setTimerSeconds] = useState(DEMO_TIMER_INITIAL_SECONDS);
  const hasCompletedRef = useRef(false);
  const hasElapsed = timerSeconds < DEMO_TIMER_INITIAL_SECONDS;

  useEffect(() => {
    onElapsedChange?.(hasElapsed);
  }, [hasElapsed, onElapsedChange]);

  useEffect(() => {
    if (!isRunning) return;
    hasCompletedRef.current = false;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (timerSeconds !== 0 || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
    setTimerSeconds(DEMO_TIMER_INITIAL_SECONDS);
  }, [timerSeconds, onComplete]);

  return (
    <div className="p-4 rounded-xl bg-card dark:bg-card/70 border border-neutral-700 dark:border-white/10 shadow-none flex flex-col justify-between md:col-span-2 lg:col-span-1">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="text-tiny font-bold text-info uppercase tracking-wider bg-info/10 px-2 py-0.5 rounded flex items-center gap-1">
            <Timer className="w-3 h-3" aria-hidden="true" />
            {t("badge")}
          </span>
          <span className="text-xs font-semibold text-neutral-400">
            {t("duration")}
          </span>
        </div>
        <h4 className="sr-only">{t("title")}</h4>
        <div className="flex items-center justify-between mt-2">
          <div className="text-2xl font-black text-neutral-50 tracking-wider font-mono tabular-nums">
            {formatFocusTime(timerSeconds)}
          </div>
          {isRunning && (
            <div aria-hidden="true" className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-info rounded-full motion-safe:animate-pulse" />
              <span className="w-1.5 h-6 bg-info rounded-full motion-safe:animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-3 bg-info rounded-full motion-safe:animate-pulse [animation-delay:300ms]" />
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          {isRunning ? t("descriptionRunning") : t("descriptionIdle")}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between flex-wrap gap-2">
        <span className="text-tiny text-neutral-400">
          {isRunning ? t("statusRunning") : t("statusIdle")}
        </span>
        <button
          type="button"
          onClick={onToggleTimer}
          aria-pressed={isRunning}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-[transform,background-color,border-color,color] active:scale-95 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
            isRunning
              ? "bg-amber-500/15 text-gold-ink border border-amber-500/40 dark:bg-warning-500/20 dark:text-warning-500 dark:border-warning-500/40"
              : "bg-primary hover:bg-primary-dark text-white shadow-xs dark:shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]",
          )}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" aria-hidden="true" /> {t("pause")}
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" aria-hidden="true" />{" "}
              {t("start")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
