"use client";

import { Bell, MousePointerClick, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingToggleRow } from "@/components/settings/SettingToggleRow";
import { AmbientSoundSection } from "@/components/settings/sound/AmbientSoundSection";
import { PomodoroAlarmSection } from "@/components/settings/sound/PomodoroAlarmSection";
import { Switch } from "@/components/ui/Switch";
import { useFocusAudioControls } from "@/hooks/useFocusAudioControls";
import { useUIStore } from "@/store/uiStore";
import { soundEffects } from "@/utils/soundEffects";

interface SoundNotificationSettingsProps {
  initialIsPremium?: boolean;
}

export function SoundNotificationSettings({
  initialIsPremium = false,
}: SoundNotificationSettingsProps = {}) {
  const t = useTranslations("settings.soundNotifications");
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);

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
    toggleAmbientPlayback,
    changeAmbientVolume,
  } = useFocusAudioControls({
    initialIsPremium,
    onRequirePremiumUpgrade: openUpgradeModal,
  });

  if (!mounted) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-16 bg-surface/60 dark:bg-white/5 rounded-xl" />
        <div className="h-24 bg-surface/60 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  const isNotificationActive =
    browserNotificationsEnabled && notificationPermission === "granted";

  return (
    <div className="flex flex-col gap-6">
      {/* BLOCO 1: NOTIFICAÇÕES DO NAVEGADOR */}
      <SettingToggleRow
        icon={<Bell size={18} />}
        iconWrapperClassName="bg-magenta/15 text-magenta dark:text-fuchsia-300 border-magenta/30"
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
            <p className="text-xs text-red-600 dark:text-red-400/90 pl-0 sm:pl-12">
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
        footer={
          <div className="pl-0 sm:pl-12 pt-1">
            <button
              type="button"
              disabled={!uiSoundsEnabled}
              onClick={() =>
                soundEffects.playAchievementUnlockSound("LEGENDARY")
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-700 bg-surface/70 hover:bg-surface text-neutral-200 hover:border-gold/45 hover:text-amber-700 dark:border-primary/25 dark:hover:text-gold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Volume2
                size={13}
                className="text-amber-700 dark:text-gold"
                aria-hidden="true"
              />
              <span>{t("testAchievementSound")}</span>
            </button>
          </div>
        }
      />

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

      {/* BLOCO 3: ALARMES E VOLUME DO POMODORO */}
      <PomodoroAlarmSection
        timerSoundsEnabled={timerSoundsEnabled}
        timerVolume={timerVolume}
        timerSoundType={timerSoundType}
        onToggleTimerSounds={toggleTimerSounds}
        onChangeTimerVolume={setTimerVolume}
        onChangeTimerSoundType={setTimerSoundType}
      />

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10" />

      {/* BLOCO 4: SONS DE AMBIENTE PROCEDURAIS (RECURSO VIP) */}
      <AmbientSoundSection
        isPremium={isPremium}
        ambientSoundType={ambientSoundType}
        ambientVolume={ambientVolume}
        isAmbientPlaying={isAmbientPlaying}
        onSelectAmbientSound={selectAmbientSound}
        onToggleAmbientPlayback={toggleAmbientPlayback}
        onChangeAmbientVolume={changeAmbientVolume}
        onOpenUpgradeModal={openUpgradeModal}
      />
    </div>
  );
}
