import { Crown, Lock, Pause, Play, Sliders } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { VolumeRangeSlider } from "@/components/settings/sound/VolumeRangeSlider";
import { AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import type { AmbientSoundType } from "@/types/settings";
import { cn } from "@/utils/cn";

interface AmbientSoundSectionProps {
  isPremium: boolean;
  ambientSoundType: AmbientSoundType;
  ambientVolume: number;
  isAmbientPlaying: boolean;
  onSelectAmbientSound: (sound: AmbientSoundType) => void;
  onToggleAmbientPlayback: () => void;
  onChangeAmbientVolume: (volume: number) => void;
  onOpenUpgradeModal: () => void;
}

export function AmbientSoundSection({
  isPremium,
  ambientSoundType,
  ambientVolume,
  isAmbientPlaying,
  onSelectAmbientSound,
  onToggleAmbientPlayback,
  onChangeAmbientVolume,
  onOpenUpgradeModal,
}: AmbientSoundSectionProps) {
  const t = useTranslations("settings.soundNotifications");
  const ambientVolumePercent = Math.round(ambientVolume * 100);

  return (
    <div className="flex flex-col gap-5">
      <SettingToggleRow
        icon={<Crown size={18} aria-hidden="true" />}
        iconWrapperClassName="bg-gold/15 text-gold border-gold/30"
        title={
          <>
            <span>{t("ambientTitle")}</span>
            <span className="text-tiny font-black uppercase px-2 py-0.5 rounded bg-gold/20 text-amber-800 dark:text-gold border border-gold/40">
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
          ) : ambientSoundType !== "none" ? (
            <button
              type="button"
              onClick={onToggleAmbientPlayback}
              aria-pressed={isAmbientPlaying}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0",
                isAmbientPlaying
                  ? "bg-amber-500/15 border-amber-500/45 text-amber-800 dark:text-gold hover:bg-amber-500/25"
                  : "bg-surface/80 border-neutral-700 text-neutral-200 hover:border-gold/45",
              )}
            >
              {isAmbientPlaying ? (
                <>
                  <Pause size={13} aria-hidden="true" />
                  <span>{t("ambientStopPreview")}</span>
                </>
              ) : (
                <>
                  <Play size={13} aria-hidden="true" />
                  <span>{t("ambientPlayPreview")}</span>
                </>
              )}
            </button>
          ) : null
        }
      />

      {/* SELEÇÃO E CONTROLE DE VOLUME DO AMBIENTE */}
      <div className="@container rounded-xl border border-neutral-700 bg-surface/45 dark:border-white/10 dark:bg-white/5 p-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 gap-2.5">
          {AMBIENT_SOUND_OPTIONS.map((sound) => {
            const isSelected = ambientSoundType === sound.id;
            const isPlaying = isAmbientPlaying && isSelected;
            const Icon = sound.icon;
            const isLocked = sound.id !== "none" && !isPremium;

            return (
              <button
                key={sound.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectAmbientSound(sound.id)}
                className={cn(
                  "p-3 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer",
                  isSelected
                    ? "bg-gold/15 border-gold shadow-glow-gold-xs text-amber-700 dark:text-gold font-bold"
                    : isLocked
                      ? "bg-card border-neutral-700 opacity-80 hover:opacity-100 dark:bg-surface/30 dark:border-white/5 text-neutral-400"
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
                    <Icon size={14} aria-hidden="true" />
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

                {isLocked ? (
                  <Lock
                    size={13}
                    className="text-amber-700 dark:text-gold shrink-0"
                    aria-hidden="true"
                  />
                ) : isPlaying ? (
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
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 font-semibold">
                <Sliders size={13} className="text-gold" aria-hidden="true" />
                {t("ambientVolumeTitle")}
              </span>
              <span className="font-mono font-bold text-gold tabular-nums">
                {ambientVolumePercent}%
              </span>
            </div>
            <VolumeRangeSlider
              value={ambientVolume}
              onChange={onChangeAmbientVolume}
              ariaLabel={t("ambientVolumeAria")}
              trackClassName="bg-neutral-700 dark:bg-primary/40"
            />
          </div>
        )}
      </div>
    </div>
  );
}
