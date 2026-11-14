"use client";

import { Crown, Sliders } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import type { AmbientSoundType } from "@/types/settings";
import { cn } from "@/utils";

interface AmbientSoundSectionProps {
  isPremium: boolean;
  ambientSoundType: AmbientSoundType;
  ambientVolume: number;
  isAmbientPlaying: boolean;
  onSelectAmbientSound: (sound: AmbientSoundType) => void;
  onChangeAmbientVolume: (volume: number) => void;
  onOpenUpgradeModal: () => void;
}

export function AmbientSoundSection({
  isPremium,
  ambientSoundType,
  ambientVolume,
  isAmbientPlaying,
  onSelectAmbientSound,
  onChangeAmbientVolume,
  onOpenUpgradeModal,
}: AmbientSoundSectionProps) {
  const t = useTranslations("settings.soundNotifications");
  const ambientVolumePercent = Math.round(ambientVolume * 100);

  return (
    <div className="flex flex-col gap-5">
      <SettingToggleRow
        icon={<Crown size={18} />}
        iconWrapperClassName="bg-gold/15 text-gold border-gold/30"
        title={
          <>
            <span>{t("ambientTitle")}</span>
            <span className="text-tiny font-black uppercase px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/40">
              {t("vipBadge")}
            </span>
          </>
        }
        description={t("ambientDesc")}
        rightControl={
          !isPremium ? (
            <button
              type="button"
              onClick={onOpenUpgradeModal}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover cursor-pointer shrink-0 shadow-xs"
            >
              {t("unlockVip")}
            </button>
          ) : null
        }
      />

      {/* SELEÇÃO E CONTROLE DE VOLUME DO AMBIENTE */}
      <div className="rounded-xl border border-neutral-700 bg-surface/45 dark:border-white/10 dark:bg-white/5 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {AMBIENT_SOUND_OPTIONS.map((sound) => {
            const isSelected = ambientSoundType === sound.id;
            const isPlaying = isAmbientPlaying && isSelected;
            const Icon = AMBIENT_ICONS[sound.id];
            const isLocked = sound.id !== "none" && !isPremium;

            return (
              <button
                key={sound.id}
                type="button"
                onClick={() => onSelectAmbientSound(sound.id)}
                className={cn(
                  "p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-gold/15 border-gold shadow-glow-gold-xs text-amber-700 dark:text-gold font-bold"
                    : isLocked
                      ? "bg-card border-neutral-700 opacity-75 hover:opacity-100 dark:bg-surface/30 dark:border-white/5 text-neutral-400"
                      : "bg-card border-neutral-700 hover:border-neutral-600 dark:bg-surface/50 dark:border-white/10 dark:hover:border-white/20 text-neutral-200",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={cn(
                      "p-1.5 rounded-lg shrink-0",
                      isSelected
                        ? "bg-gold text-on-gold dark:text-neutral-950"
                        : "bg-surface text-neutral-300",
                    )}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs truncate">
                      {t(`ambientSounds.${sound.id}.label`)}
                    </span>
                    <span className="text-tiny text-neutral-400 truncate">
                      {t(`ambientSounds.${sound.id}.description`)}
                    </span>
                  </div>
                </div>

                {isPlaying ? (
                  <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-gold ring-4 ring-amber-500/20 dark:ring-gold/25 shrink-0" />
                ) : isSelected ? (
                  <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-gold shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {isPremium && (
          <div className="pt-3 border-t border-neutral-700 dark:border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sliders size={13} className="text-gold" />
                {t("ambientVolumeTitle")}
              </span>
              <span className="font-mono font-bold text-gold">
                {ambientVolumePercent}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-semibold">0%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) =>
                  onChangeAmbientVolume(parseFloat(e.target.value))
                }
                aria-label={t("ambientVolumeAria")}
                className="w-full h-1.5 bg-neutral-700 dark:bg-primary/40 rounded-lg appearance-none cursor-pointer accent-gold"
              />
              <span className="text-xs text-neutral-400 font-semibold">
                100%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
