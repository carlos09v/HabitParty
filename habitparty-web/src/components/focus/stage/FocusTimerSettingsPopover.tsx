import {
  HardDrive,
  Minus,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Switch } from "@/components/ui/Switch";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { useIsClient } from "@/hooks/useIsClient";
import { reconcileAmbientWithTimerPreference } from "@/store/focus/focusAmbientSync";
import {
  DEFAULT_FOCUS_TIMER_PREFERENCES,
  FOCUS_PREFERENCE_LIMITS,
  hasCustomFocusPreferences,
  useFocusPreferencesStore,
} from "@/store/focusPreferencesStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";

const SHORT_BREAK_PRESETS = [3, 5, 10] as const;
const LONG_BREAK_PRESETS = [15, 20, 30] as const;
const CYCLE_PREVIEW_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

interface DurationStepperRowProps {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  presets?: readonly number[];
  presetUnit?: string;
  decreaseAria: string;
  increaseAria: string;
  onChange: (nextValue: number) => void;
  extraPreview?: React.ReactNode;
}

function DurationStepperRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  presets,
  presetUnit = "m",
  decreaseAria,
  increaseAria,
  onChange,
  extraPreview,
}: DurationStepperRowProps) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/20 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-neutral-100 truncate">
            {label}
          </span>
          {extraPreview}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={!canDecrease}
            onClick={() => onChange(value - step)}
            aria-label={decreaseAria}
            className="min-w-7 min-h-7 pointer-coarse:min-w-10 pointer-coarse:min-h-10 rounded-lg border border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 text-neutral-200 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/45 dark:hover:border-gold/50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Minus size={13} aria-hidden="true" />
          </button>

          <span className="min-w-16 text-center font-mono text-xs font-bold text-amber-800 dark:text-gold tabular-nums px-1 whitespace-nowrap">
            {valueLabel}
          </span>

          <button
            type="button"
            disabled={!canIncrease}
            onClick={() => onChange(value + step)}
            aria-label={increaseAria}
            className="min-w-7 min-h-7 pointer-coarse:min-w-10 pointer-coarse:min-h-10 rounded-lg border border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 text-neutral-200 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/45 dark:hover:border-gold/50 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Plus size={13} aria-hidden="true" />
          </button>
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {presets.map((preset) => {
            const isSelected = value === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(preset)}
                className={cn(
                  "min-h-6 pointer-coarse:min-h-8 px-2 py-0.5 rounded-md text-tiny font-bold transition-colors cursor-pointer border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  isSelected
                    ? "bg-amber-500/15 border-amber-500/45 text-amber-800 dark:bg-gold/20 dark:border-gold/50 dark:text-gold"
                    : "bg-surface/80 border-neutral-700/70 dark:border-primary/20 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600",
                )}
              >
                {preset}
                {presetUnit}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ToggleRowProps {
  id: string;
  descId: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function ToggleRow({
  id,
  descId,
  label,
  description,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/20 px-2.5 py-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-neutral-100 leading-snug cursor-pointer"
        >
          {label}
        </label>
        <p id={descId} className="text-tiny text-neutral-400 leading-snug">
          {description}
        </p>
      </div>

      <Switch
        id={id}
        size="sm"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={descId}
        className="mt-0.5"
      />
    </div>
  );
}

/**
 * Popover de preferências do Pomodoro (duração de pausas, ciclos até pausa longa,
 * automação de transições e sincronização de som ambiente com o timer).
 */
export function FocusTimerSettingsPopover() {
  const t = useTranslations("focus.timerSettings");
  const isClient = useIsClient();
  const baseId = useId();

  const popoverId = `${baseId}-popover`;
  const headingId = `${baseId}-heading`;
  const autoBreakId = `${baseId}-auto-break`;
  const autoBreakDescId = `${baseId}-auto-break-desc`;
  const autoCycleId = `${baseId}-auto-cycle`;
  const autoCycleDescId = `${baseId}-auto-cycle-desc`;
  const pauseAmbientId = `${baseId}-pause-ambient`;
  const pauseAmbientDescId = `${baseId}-pause-ambient-desc`;

  const shortBreakMinutes = useFocusPreferencesStore(
    (s) => s.shortBreakMinutes,
  );
  const longBreakMinutes = useFocusPreferencesStore((s) => s.longBreakMinutes);
  const cyclesUntilLongBreak = useFocusPreferencesStore(
    (s) => s.cyclesUntilLongBreak,
  );
  const autoStartBreak = useFocusPreferencesStore((s) => s.autoStartBreak);
  const autoStartNextCycle = useFocusPreferencesStore(
    (s) => s.autoStartNextCycle,
  );
  const pauseAmbientWithTimer = useFocusPreferencesStore(
    (s) => s.pauseAmbientWithTimer,
  );

  const setShortBreakMinutes = useFocusPreferencesStore(
    (s) => s.setShortBreakMinutes,
  );
  const setLongBreakMinutes = useFocusPreferencesStore(
    (s) => s.setLongBreakMinutes,
  );
  const setCyclesUntilLongBreak = useFocusPreferencesStore(
    (s) => s.setCyclesUntilLongBreak,
  );
  const setAutoStartBreak = useFocusPreferencesStore(
    (s) => s.setAutoStartBreak,
  );
  const setAutoStartNextCycle = useFocusPreferencesStore(
    (s) => s.setAutoStartNextCycle,
  );
  const setPauseAmbientWithTimer = useFocusPreferencesStore(
    (s) => s.setPauseAmbientWithTimer,
  );
  const resetDefaults = useFocusPreferencesStore((s) => s.resetDefaults);

  const isCustomized =
    isClient &&
    hasCustomFocusPreferences({
      shortBreakMinutes,
      longBreakMinutes,
      cyclesUntilLongBreak,
      autoStartBreak,
      autoStartNextCycle,
      pauseAmbientWithTimer,
    });

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    portalContainer,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "right",
    estimatedWidth: 344,
    estimatedHeight: 540,
    maxAllowedHeight: 560,
    margin: 12,
    offset: 8,
    zIndex: 80,
    restoreFocusOnEscape: true,
  });

  const closeAndRestoreFocus = useCallback(() => {
    close();
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, [close, triggerRef]);

  const handleTogglePauseAmbient = useCallback(
    (enabled: boolean) => {
      setPauseAmbientWithTimer(enabled);
      reconcileAmbientWithTimerPreference(
        enabled,
        useFocusTimerStore.getState(),
      );
    },
    [setPauseAmbientWithTimer],
  );

  const handleResetDefaults = useCallback(() => {
    resetDefaults();
    reconcileAmbientWithTimerPreference(
      DEFAULT_FOCUS_TIMER_PREFERENCES.pauseAmbientWithTimer,
      useFocusTimerStore.getState(),
    );
    popoverRef.current?.focus({ preventScroll: true });
  }, [resetDefaults, popoverRef]);

  useEffect(() => {
    if (!isOpen) return;
    const frameId = window.requestAnimationFrame(() => {
      popoverRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, popoverRef]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        aria-label={t("buttonAria")}
        title={t("buttonTitle")}
        className={cn(
          "relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-2xs dark:shadow-sm group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          isOpen || isCustomized
            ? "border-amber-500/45 dark:border-gold/50 bg-amber-500/10 dark:bg-gold/15 text-amber-800 dark:text-gold"
            : "border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/45 dark:hover:border-gold/50 text-neutral-200 hover:text-amber-700 dark:hover:text-gold",
        )}
      >
        <SlidersHorizontal
          size={14}
          aria-hidden="true"
          className="text-amber-800 dark:text-gold shrink-0"
        />
        <span className="hidden xl:inline">{t("buttonLabel")}</span>
        {isCustomized && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-gold shrink-0"
          />
        )}
      </button>

      {shouldRenderPortal &&
        portalContainer &&
        isOpen &&
        coords &&
        createPortal(
          <div
            id={popoverId}
            ref={popoverRef}
            style={floatingStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
            tabIndex={-1}
            className={cn(
              "p-3.5 rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover shadow-2xl outline-none",
              "w-80 sm:w-[344px] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain custom-scrollbar animate-in fade-in zoom-in-95 duration-150",
            )}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-neutral-700 dark:border-white/10">
              <h2
                id={headingId}
                className="text-label-m font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-1.5"
              >
                <SlidersHorizontal
                  size={13}
                  aria-hidden="true"
                  className="text-amber-800 dark:text-gold shrink-0"
                />
                <span>{t("headerTitle")}</span>
              </h2>

              <div className="flex items-center gap-1">
                {isCustomized && (
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    title={t("resetDefaultsTitle")}
                    className="inline-flex items-center gap-1 px-2 py-1 min-h-7 pointer-coarse:min-h-9 rounded-lg text-tiny font-semibold text-neutral-300 hover:text-amber-800 dark:hover:text-gold hover:bg-surface dark:hover:bg-white/5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <RotateCcw size={11} aria-hidden="true" />
                    <span>{t("resetDefaults")}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={closeAndRestoreFocus}
                  className="min-w-8 min-h-8 pointer-coarse:min-w-10 pointer-coarse:min-h-10 text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-surface dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  aria-label={t("closeAria")}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Seção 1: Pausas e Ciclos */}
              <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
                <legend className="text-tiny font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  {t("breaksSectionTitle")}
                </legend>

                <DurationStepperRow
                  label={t("shortBreakLabel")}
                  valueLabel={t("minutesValue", { minutes: shortBreakMinutes })}
                  value={shortBreakMinutes}
                  min={FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.min}
                  max={FOCUS_PREFERENCE_LIMITS.shortBreakMinutes.max}
                  presets={SHORT_BREAK_PRESETS}
                  decreaseAria={t("decreaseShortBreakAria")}
                  increaseAria={t("increaseShortBreakAria")}
                  onChange={setShortBreakMinutes}
                />

                <DurationStepperRow
                  label={t("longBreakLabel")}
                  valueLabel={t("minutesValue", { minutes: longBreakMinutes })}
                  value={longBreakMinutes}
                  min={FOCUS_PREFERENCE_LIMITS.longBreakMinutes.min}
                  max={FOCUS_PREFERENCE_LIMITS.longBreakMinutes.max}
                  presets={LONG_BREAK_PRESETS}
                  decreaseAria={t("decreaseLongBreakAria")}
                  increaseAria={t("increaseLongBreakAria")}
                  onChange={setLongBreakMinutes}
                />

                <DurationStepperRow
                  label={t("cyclesLabel")}
                  valueLabel={t("cyclesValue", { count: cyclesUntilLongBreak })}
                  value={cyclesUntilLongBreak}
                  min={FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.min}
                  max={FOCUS_PREFERENCE_LIMITS.cyclesUntilLongBreak.max}
                  decreaseAria={t("decreaseCyclesAria")}
                  increaseAria={t("increaseCyclesAria")}
                  onChange={setCyclesUntilLongBreak}
                  extraPreview={
                    <div
                      aria-hidden="true"
                      className="flex items-center gap-1 mt-1"
                    >
                      {CYCLE_PREVIEW_SLOTS.slice(0, cyclesUntilLongBreak).map(
                        (slot) => (
                          <span
                            key={slot}
                            className="w-1.5 h-1.5 rounded-full bg-amber-600/80 dark:bg-gold/80"
                          />
                        ),
                      )}
                    </div>
                  }
                />
              </fieldset>

              {/* Seção 2: Automação e Áudio */}
              <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 pt-2 border-t border-neutral-700/70 dark:border-white/10">
                <legend className="text-tiny font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  {t("automationSectionTitle")}
                </legend>

                <ToggleRow
                  id={autoBreakId}
                  descId={autoBreakDescId}
                  label={t("autoStartBreakLabel")}
                  description={t("autoStartBreakDesc")}
                  checked={autoStartBreak}
                  onCheckedChange={setAutoStartBreak}
                />

                <ToggleRow
                  id={autoCycleId}
                  descId={autoCycleDescId}
                  label={t("autoStartNextCycleLabel")}
                  description={t("autoStartNextCycleDesc")}
                  checked={autoStartNextCycle}
                  onCheckedChange={setAutoStartNextCycle}
                />

                <ToggleRow
                  id={pauseAmbientId}
                  descId={pauseAmbientDescId}
                  label={t("pauseAmbientLabel")}
                  description={t("pauseAmbientDesc")}
                  checked={pauseAmbientWithTimer}
                  onCheckedChange={handleTogglePauseAmbient}
                />
              </fieldset>

              {/* Rodapé informativo */}
              <p className="flex items-center gap-1.5 pt-2 border-t border-neutral-700/70 dark:border-white/10 text-tiny text-neutral-400 leading-snug">
                <HardDrive size={12} aria-hidden="true" className="shrink-0" />
                <span>{t("localStorageNote")}</span>
              </p>
            </div>
          </div>,
          portalContainer,
        )}
    </div>
  );
}
