"use client";

import {
  Bell,
  Check,
  Crown,
  MousePointerClick,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { Switch } from "@/components/ui/Switch";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useFocusAudioControls } from "@/hooks/useFocusAudioControls";
import type { TimerSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

interface SoundNotificationSettingsProps {
  isCompact?: boolean;
}

const ALARM_TONE_IDS: readonly TimerSoundType[] = ["zen", "arcade"] as const;

export function SoundNotificationSettings({
  isCompact = false,
}: SoundNotificationSettingsProps) {
  const t = useTranslations("settings.soundNotifications");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const {
    mounted,
    isPremium,
    uiSoundsEnabled,
    timerSoundsEnabled,
    timerVolume,
    timerSoundType,
    browserNotificationsEnabled,
    notificationPermission,
    ambientSoundType,
    ambientVolume,
    isAmbientPlaying,
    toggleUiSounds,
    toggleTimerSounds,
    setTimerVolume,
    setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    changeAmbientVolume,
  } = useFocusAudioControls({
    onRequirePremiumUpgrade: () => setIsUpgradeModalOpen(true),
  });

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/30 animate-pulse",
          isCompact ? "p-4 sm:p-5" : "p-6",
        )}
      >
        <div className="h-6 w-48 bg-surface dark:bg-white/10 rounded mb-4" />
        <div className="h-20 bg-surface/60 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  const timerVolumePercent = Math.round(timerVolume * 100);
  const ambientVolumePercent = Math.round(ambientVolume * 100);
  const isNotificationActive =
    browserNotificationsEnabled && notificationPermission === "granted";

  return (
    <>
      <SettingsCard
        title={t("cardTitle")}
        description={t("cardDesc")}
        icon={<Volume2 className="text-gold" size={20} />}
        isCompact={isCompact}
      >
        <div className="flex flex-col gap-6">
          {/* BLOCO 1: NOTIFICAÇÕES DO NAVEGADOR */}
          <SettingToggleRow
            icon={<Bell size={18} />}
            iconWrapperClassName="bg-magenta/15 text-magenta border-magenta/30"
            title={t("browserTitle")}
            description={t("browserDesc")}
            statusBadge={{
              label:
                notificationPermission === "denied"
                  ? t("browserDenied")
                  : isNotificationActive
                    ? t("statusActive")
                    : t("statusInactive"),
              className: isNotificationActive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : notificationPermission === "denied"
                  ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30"
                  : "bg-surface text-neutral-400 border-neutral-700 dark:bg-white/5 dark:border-white/10",
            }}
            rightControl={
              <Switch
                checked={isNotificationActive}
                onCheckedChange={toggleBrowserNotifications}
                aria-label={t("browserAria")}
              />
            }
            footer={
              notificationPermission === "denied" ? (
                <p className="text-xs text-red-600 dark:text-red-400/90 pl-12">
                  {t("browserDeniedHelp")}
                </p>
              ) : undefined
            }
          />

          <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

          {/* BLOCO 2: SONS DE CLIQUE E GAMIFICAÇÃO */}
          <SettingToggleRow
            icon={<MousePointerClick size={18} />}
            iconWrapperClassName="bg-gold/15 text-gold border-gold/30"
            title={t("uiSoundsTitle")}
            description={t("uiSoundsDesc")}
            statusBadge={{
              label: uiSoundsEnabled ? t("statusActive") : t("statusMuted"),
              className: uiSoundsEnabled
                ? "bg-gold/15 text-gold border-gold/30"
                : "bg-surface text-neutral-400 border-neutral-700 dark:bg-white/5 dark:border-white/10",
            }}
            rightControl={
              <Switch
                checked={uiSoundsEnabled}
                onCheckedChange={toggleUiSounds}
                aria-label={t("uiSoundsAria")}
              />
            }
          />

          <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

          {/* BLOCO 3: ALARMES E VOLUME DO POMODORO */}
          <div className="flex flex-col gap-5">
            <SettingToggleRow
              icon={<Bell size={18} />}
              iconWrapperClassName="bg-primary/10 text-primary dark:bg-primary-dark/40 dark:text-primary-light border-primary/25 dark:border-primary/30"
              title={t("pomodoroTitle")}
              description={t("pomodoroDesc")}
              statusBadge={{
                label: timerSoundsEnabled
                  ? t("statusActive")
                  : t("statusSilent"),
                className: timerSoundsEnabled
                  ? "bg-gold/15 text-gold border-gold/30"
                  : "bg-surface text-neutral-400 border-neutral-700 dark:bg-white/5 dark:border-white/10",
              }}
              rightControl={
                <Switch
                  checked={timerSoundsEnabled}
                  onCheckedChange={toggleTimerSounds}
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
                      soundEffects.playTimerStartSound(
                        timerSoundType,
                        timerVolume,
                      )
                    }
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gold text-on-gold hover:bg-gold-hover transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Sparkles size={13} />
                    {t("testBtn")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 font-semibold">
                  0%
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={timerVolumePercent}
                  onChange={(e) => setTimerVolume(Number(e.target.value) / 100)}
                  aria-label={t("volumeAria")}
                  className="w-full h-2 rounded-lg bg-neutral-700 dark:bg-surface/80 appearance-none cursor-pointer accent-gold"
                />
                <span className="text-xs text-neutral-400 font-semibold">
                  100%
                </span>
              </div>

              {/* ESTILO DO SOM */}
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
                          setTimerSoundType(toneId);
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

          <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

          {/* BLOCO 4: SONS DE AMBIENTE PROCEDURAIS (RECURSO VIP) */}
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
                    onClick={() => setIsUpgradeModalOpen(true)}
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
                      onClick={() => selectAmbientSound(sound.id)}
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
                    <span className="text-xs text-neutral-400 font-semibold">
                      0%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) =>
                        changeAmbientVolume(parseFloat(e.target.value))
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
        </div>
      </SettingsCard>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
