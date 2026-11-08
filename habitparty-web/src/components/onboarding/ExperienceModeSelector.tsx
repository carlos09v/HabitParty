import {
  CheckCircle2,
  Circle,
  MonitorSmartphone,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { EXPERIENCE_MODES } from "@/constants/onboarding";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils";

interface ExperienceModeSelectorProps {
  experienceMode: ExperienceMode;
  onSelectExperienceMode: (mode: ExperienceMode) => void;
  isCompact: boolean;
  onToggleCompact: (compact: boolean) => void;
  uiSoundsEnabled: boolean;
  onToggleSounds: (enabled: boolean) => void;
  disabled?: boolean;
}

export function ExperienceModeSelector({
  experienceMode,
  onSelectExperienceMode,
  isCompact,
  onToggleCompact,
  uiSoundsEnabled,
  onToggleSounds,
  disabled = false,
}: ExperienceModeSelectorProps) {
  const t = useTranslations("onboarding.experienceMode");

  return (
    <div className="flex flex-col gap-2.5 p-3 sm:p-3.5 rounded-xl border border-neutral-700 bg-card shadow-xs dark:border-primary/25 dark:bg-surface/40">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="text-body-s font-bold text-neutral-50 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-gold/20 dark:text-gold text-[11px] font-bold">
            3
          </span>
          {t("title")}
        </h3>
        <span className="text-[11px] text-neutral-400">
          {t("settingsHint")}
        </span>
      </div>

      {/* Cards de Seleção: Gamificado vs Produtividade (Compactos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {EXPERIENCE_MODES.map((option) => {
          const isSelected = experienceMode === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => onSelectExperienceMode(option.id)}
              className={cn(
                "flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-colors cursor-pointer relative",
                "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm text-neutral-50 ring-1 ring-primary/30 dark:border-gold dark:bg-primary-dark/60 dark:shadow-[0_0_14px_rgba(237,229,57,0.18)] dark:ring-1 dark:ring-gold/40 dark:text-neutral-50"
                  : "border-neutral-700 bg-card hover:bg-surface-hover hover:border-neutral-500 text-neutral-300 dark:border-primary/25 dark:bg-surface/40 dark:hover:bg-surface/70 dark:hover:border-primary/50 dark:text-neutral-300",
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      isSelected
                        ? "bg-primary/20 text-primary-dark dark:bg-gold/20 dark:text-gold"
                        : "bg-surface text-neutral-300 dark:bg-primary/20 dark:text-neutral-300",
                    )}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className={cn(
                      "text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                      isSelected
                        ? "bg-primary/15 text-primary-dark border-primary/30 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                        : "bg-surface text-neutral-400 border-neutral-700 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10",
                    )}
                  >
                    {t(`modes.${option.id}.badge`)}
                  </span>
                </div>
                {isSelected ? (
                  <CheckCircle2
                    size={14}
                    className="text-primary-dark dark:text-gold shrink-0"
                  />
                ) : (
                  <Circle
                    size={14}
                    className="text-neutral-400 dark:text-neutral-500 shrink-0"
                  />
                )}
              </div>

              <span className="text-xs sm:text-body-s font-bold text-neutral-50">
                {t(`modes.${option.id}.title`)}
              </span>
              <span className="text-tiny text-neutral-400 dark:text-neutral-300/80 mt-0.5 leading-snug line-clamp-2">
                {t(`modes.${option.id}.description`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Calibragem Rápida complementar: Densidade Visual + Efeitos Sonoros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-neutral-700 dark:border-white/10">
        {/* Densidade Visual */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            <MonitorSmartphone
              size={13}
              className="text-amber-600 dark:text-gold shrink-0"
            />
            <span className="text-[11px] font-medium text-neutral-200 truncate">
              {t("densityLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleCompact(false)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border",
                !isCompact
                  ? "bg-primary/15 text-primary-dark border-primary/30 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("densityStandard")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleCompact(true)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border",
                isCompact
                  ? "bg-primary/15 text-primary-dark border-primary/30 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("densityCompact")}
            </button>
          </div>
        </div>

        {/* Efeitos Sonoros */}
        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-surface border border-neutral-700 dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            {uiSoundsEnabled ? (
              <Volume2
                size={13}
                className="text-amber-600 dark:text-gold shrink-0"
              />
            ) : (
              <VolumeX size={13} className="text-neutral-400 shrink-0" />
            )}
            <span className="text-[11px] font-medium text-neutral-200 truncate">
              {t("soundsLabel")}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleSounds(true)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border",
                uiSoundsEnabled
                  ? "bg-primary/15 text-primary-dark border-primary/30 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("soundsActive")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToggleSounds(false)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer border",
                !uiSoundsEnabled
                  ? "bg-primary/15 text-primary-dark border-primary/30 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                  : "border-transparent text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("soundsMuted")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
