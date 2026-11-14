"use client";

import { Bell, Check, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { Switch } from "@/components/ui/Switch";
import { ALARM_TONE_IDS, type TimerSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

interface PomodoroAlarmSectionProps {
  timerSoundsEnabled: boolean;
  timerVolume: number;
  timerSoundType: TimerSoundType;
  onToggleTimerSounds: (enabled: boolean) => void;
  onChangeTimerVolume: (volume: number) => void;
  onChangeTimerSoundType: (tone: TimerSoundType) => void;
}

export function PomodoroAlarmSection({
  timerSoundsEnabled,
  timerVolume,
  timerSoundType,
  onToggleTimerSounds,
  onChangeTimerVolume,
  onChangeTimerSoundType,
}: PomodoroAlarmSectionProps) {
  const t = useTranslations("settings.soundNotifications");
  const timerVolumePercent = Math.round(timerVolume * 100);

  return (
    <div className="flex flex-col gap-5">
      <SettingToggleRow
        icon={<Bell size={18} />}
        iconWrapperClassName="bg-primary/10 text-primary dark:bg-primary-dark/40 dark:text-primary-light border-primary/25 dark:border-primary/30"
        title={t("pomodoroTitle")}
        description={t("pomodoroDesc")}
        statusBadge={{
          label: timerSoundsEnabled ? t("statusActive") : t("statusSilent"),
          className: timerSoundsEnabled
            ? "bg-gold/15 text-gold border-gold/30"
            : "bg-surface text-neutral-400 border-neutral-700 dark:bg-white/5 dark:border-white/10",
        }}
        rightControl={
          <Switch
            checked={timerSoundsEnabled}
            onCheckedChange={onToggleTimerSounds}
            aria-label={t("pomodoroAria")}
          />
        }
      />

      {/* CONTROLE DE VOLUME & TESTE DO POMODORO */}
      <div
        className={cn(
          "rounded-xl border p-4 flex flex-col gap-4 transition-colors",
          timerSoundsEnabled
            ? "bg-surface/45 border-neutral-700 dark:bg-white/5 dark:border-white/10"
            : "opacity-55 pointer-events-none bg-surface/25 border-neutral-700 dark:bg-white/[0.02] dark:border-white/5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {timerVolume === 0 ? (
              <VolumeX size={18} className="text-neutral-400" />
            ) : (
              <Volume2 size={18} className="text-gold" />
            )}
            <span className="text-body-s font-bold text-neutral-200">
              {t("alarmVolume")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gold px-2 py-0.5 bg-gold/15 rounded border border-gold/30">
              {timerVolumePercent}%
            </span>
            <button
              type="button"
              onClick={() =>
                soundEffects.playTimerStartSound(timerSoundType, timerVolume)
              }
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gold text-on-gold hover:bg-gold-hover transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Sparkles size={13} />
              {t("testBtn")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 font-semibold">0%</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={timerVolumePercent}
            onChange={(e) => onChangeTimerVolume(Number(e.target.value) / 100)}
            aria-label={t("volumeAria")}
            className="w-full h-2 rounded-lg bg-neutral-700 dark:bg-surface/80 appearance-none cursor-pointer accent-gold"
          />
          <span className="text-xs text-neutral-400 font-semibold">100%</span>
        </div>

        {/* ESTILO DO SOM (TODOS OS 4 TONS: ZEN, ARCADE, DIGITAL, HARP) */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700 dark:border-white/5">
          <span className="text-xs font-semibold text-neutral-300">
            {t("toneLabel")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ALARM_TONE_IDS.map((toneId) => {
              const isSelected = timerSoundType === toneId;

              return (
                <button
                  key={toneId}
                  type="button"
                  onClick={() => {
                    onChangeTimerSoundType(toneId);
                    soundEffects.playTimerStartSound(toneId, timerVolume);
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer",
                    isSelected
                      ? "bg-gold/10 border-gold/50 shadow-glow-gold-xs text-neutral-50"
                      : "bg-card border-neutral-700 hover:border-neutral-600 dark:bg-surface/50 dark:border-white/10 dark:hover:border-white/20 text-neutral-300",
                  )}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-100">
                      {t(`tones.${toneId}.label`)}
                    </span>
                    <span className="text-label-g text-neutral-400">
                      {t(`tones.${toneId}.description`)}
                    </span>
                  </div>
                  {isSelected && (
                    <Check size={16} className="text-gold shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
