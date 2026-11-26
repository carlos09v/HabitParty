import { Check, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FOCUS_POMO_PRESETS } from "@/constants/focusRules";
import { cn } from "@/utils";

const MIN_CUSTOM_MINUTES = 5;
const MAX_CUSTOM_MINUTES = 180;

export interface FocusDurationPresetsProps {
  totalDurationSeconds: number;
  onChangeDuration: (minutes: number) => void;
}

export function FocusDurationPresets({
  totalDurationSeconds,
  onChangeDuration,
}: FocusDurationPresetsProps) {
  const t = useTranslations("focus.stage");
  const currentMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));
  const isCustomActive = !FOCUS_POMO_PRESETS.includes(
    currentMinutes as (typeof FOCUS_POMO_PRESETS)[number],
  );

  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customDraft, setCustomDraft] = useState(String(currentMinutes));
  const customInputRef = useRef<HTMLInputElement>(null);
  const customButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (isEditingCustom) {
      customInputRef.current?.focus();
    } else if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      customButtonRef.current?.focus();
    }
  }, [isEditingCustom]);

  const openCustomEditor = () => {
    setCustomDraft(String(currentMinutes));
    setIsEditingCustom(true);
  };

  const closeCustomEditor = (restoreFocus: boolean) => {
    shouldRestoreFocusRef.current = restoreFocus;
    setIsEditingCustom(false);
  };

  const applyCustomDuration = () => {
    const parsed = Number.parseInt(customDraft, 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.min(
        MAX_CUSTOM_MINUTES,
        Math.max(MIN_CUSTOM_MINUTES, parsed),
      );
      onChangeDuration(clamped);
    }
    closeCustomEditor(true);
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("durationGroupAria")}
      className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5"
    >
      <span className="text-xs text-neutral-400 mr-1">
        {t("durationLabel")}
      </span>
      {FOCUS_POMO_PRESETS.map((m) => {
        const isSelected = totalDurationSeconds === m * 60;
        return (
          // biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              closeCustomEditor(false);
              onChangeDuration(m);
            }}
            className={cn(
              "min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer",
              isSelected
                ? "bg-gold text-on-gold border-gold font-bold shadow-glow-gold-xs"
                : "bg-card dark:bg-surface/80 border-neutral-700 dark:border-primary/30 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/45 dark:hover:border-gold/40",
            )}
          >
            {m}m
          </button>
        );
      })}

      {isEditingCustom ? (
        <div className="inline-flex items-center gap-1 rounded-lg border border-gold/60 bg-surface px-1.5 py-0.5">
          <input
            ref={customInputRef}
            type="number"
            min={MIN_CUSTOM_MINUTES}
            max={MAX_CUSTOM_MINUTES}
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.nativeEvent.isComposing || e.keyCode === 229) {
                  return;
                }
                applyCustomDuration();
              } else if (e.key === "Escape") {
                e.preventDefault();
                closeCustomEditor(true);
              }
            }}
            aria-label={t("customDurationInputAria")}
            className="w-12 bg-transparent text-xs font-bold text-neutral-100 text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-[11px] text-neutral-400">m</span>
          <button
            type="button"
            onClick={applyCustomDuration}
            aria-label={t("customDurationApplyAria")}
            className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-md bg-gold text-on-gold hover:bg-gold-hover flex items-center justify-center cursor-pointer transition-colors"
          >
            <Check size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => closeCustomEditor(true)}
            aria-label={t("customDurationCancelAria")}
            className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : (
        // biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern
        <button
          ref={customButtonRef}
          type="button"
          role="radio"
          aria-checked={isCustomActive}
          onClick={openCustomEditor}
          title={t("customDurationTitle")}
          className={cn(
            "inline-flex items-center gap-1 min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer",
            isCustomActive
              ? "bg-gold text-on-gold border-gold font-bold shadow-glow-gold-xs"
              : "bg-card dark:bg-surface/80 border-dashed border-neutral-600 dark:border-primary/35 text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/45 dark:hover:border-gold/40",
          )}
        >
          <SlidersHorizontal size={11} aria-hidden="true" />
          <span>
            {isCustomActive ? `${currentMinutes}m` : t("customDurationButton")}
          </span>
        </button>
      )}
    </div>
  );
}
