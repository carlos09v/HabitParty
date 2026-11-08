"use client";

import {
  Bell,
  BellOff,
  Crown,
  Lock,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useFocusAudioControls } from "@/hooks/useFocusAudioControls";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

export interface FocusStageAudioControlsProps {
  isSoundEnabled?: boolean;
  timerSoundType?: "zen" | "arcade";
  onToggleSound?: () => void;
  onChangeSoundType?: (type: "zen" | "arcade") => void;
  onOpenUpgradeModal?: () => void;
}

export function FocusStageAudioControls({
  isSoundEnabled: propIsSoundEnabled,
  timerSoundType: propTimerSoundType,
  onToggleSound,
  onChangeSoundType,
  onOpenUpgradeModal,
}: FocusStageAudioControlsProps) {
  const t = useTranslations("focus.audio");
  const tWidget = useTranslations("focusWidget");
  const [isAmbientPopoverOpen, setIsAmbientPopoverOpen] = useState(false);
  const [localUpgradeModalOpen, setLocalUpgradeModalOpen] = useState(false);

  const triggerUpgradeModal = () => {
    setIsAmbientPopoverOpen(false);
    if (onOpenUpgradeModal) {
      onOpenUpgradeModal();
    } else {
      setLocalUpgradeModalOpen(true);
    }
  };

  const {
    isPremium,
    timerSoundsEnabled,
    timerSoundType: storeTimerSoundType,
    timerVolume,
    browserNotificationsEnabled,
    hasNotificationPermission,
    ambientSoundType,
    ambientVolume,
    isAmbientPlaying,
    toggleTimerSounds,
    setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    changeAmbientVolume,
  } = useFocusAudioControls({
    onRequirePremiumUpgrade: triggerUpgradeModal,
    restoreAmbientOnMount: true,
  });

  const isSoundEnabled = propIsSoundEnabled ?? timerSoundsEnabled;
  const timerSoundType = propTimerSoundType ?? storeTimerSoundType;

  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(popoverRef, () => setIsAmbientPopoverOpen(false), {
    enabled: isAmbientPopoverOpen,
    onEscape: () => setIsAmbientPopoverOpen(false),
  });

  const handleToggleSound = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      toggleTimerSounds();
    }
  };

  const handleSelectSoundType = (type: "zen" | "arcade") => {
    onChangeSoundType?.(type);
    setTimerSoundType(type);
    soundEffects.playTimerStartSound(type, timerVolume ?? 0.8);
  };

  const AmbientCurrentIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;

  return (
    <>
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/80 border border-neutral-700 dark:border-primary/30 text-xs relative">
        {/* Som do Timer On/Off */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer border",
            isSoundEnabled
              ? "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-gold dark:bg-gold/15 dark:border-gold/30 font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border-transparent",
          )}
          title={isSoundEnabled ? t("soundEnabledTitle") : t("soundMutedTitle")}
        >
          {isSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span className="text-label-g hidden sm:inline">
            {isSoundEnabled ? t("soundOn") : t("soundOff")}
          </span>
        </button>

        {/* Notificações do Navegador */}
        <button
          type="button"
          onClick={() => toggleBrowserNotifications()}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors cursor-pointer border",
            browserNotificationsEnabled && hasNotificationPermission
              ? "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-gold dark:bg-gold/15 dark:border-gold/30 font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border-transparent",
          )}
          title={
            browserNotificationsEnabled && hasNotificationPermission
              ? t("notificationsEnabledTitle")
              : t("notificationsDisabledTitle")
          }
          aria-label={t("notificationsAria")}
        >
          {browserNotificationsEnabled && hasNotificationPermission ? (
            <Bell size={15} />
          ) : (
            <BellOff size={15} />
          )}
          <span className="text-label-g hidden sm:inline">
            {browserNotificationsEnabled && hasNotificationPermission
              ? t("notificationsOn")
              : t("notificationsOff")}
          </span>
        </button>

        {/* Tipo de Som do Alarme (Zen ou Arcade) */}
        {isSoundEnabled && (
          <div className="flex items-center rounded-lg bg-card dark:bg-primary-dark/30 p-0.5 border border-neutral-700 dark:border-primary/30">
            <button
              type="button"
              onClick={() => handleSelectSoundType("zen")}
              className={cn(
                "px-2 py-0.5 text-label-g font-semibold rounded-md transition-colors cursor-pointer",
                timerSoundType === "zen"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title={t("zenSoundTitle")}
            >
              {t("zenSoundLabel")}
            </button>
            <button
              type="button"
              onClick={() => handleSelectSoundType("arcade")}
              className={cn(
                "px-2 py-0.5 text-label-g font-semibold rounded-md transition-colors cursor-pointer",
                timerSoundType === "arcade"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title={t("arcadeSoundTitle")}
            >
              {t("arcadeSoundLabel")}
            </button>
          </div>
        )}

        {/* Separador vertical */}
        <div className="w-px h-4 bg-primary/30 mx-0.5" />

        {/* BOTÃO E POPOVER DE SONS AMBIENTE (BENEFÍCIO PREMIUM) */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setIsAmbientPopoverOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border",
              isAmbientPlaying && ambientSoundType !== "none"
                ? "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-gold dark:bg-gold/15 dark:border-gold/40 shadow-glow-gold-xs font-bold"
                : "text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:bg-card dark:hover:bg-white/5 border-transparent",
            )}
            title={t("ambientButtonTitle")}
            aria-expanded={isAmbientPopoverOpen}
          >
            <AmbientCurrentIcon
              size={15}
              className={
                isAmbientPlaying && ambientSoundType !== "none"
                  ? "animate-pulse text-amber-700 dark:text-gold"
                  : "text-neutral-300"
              }
            />
            <span className="text-label-g hidden sm:inline">
              {isAmbientPlaying && ambientSoundType !== "none"
                ? tWidget(`ambientSounds.${ambientSoundType}`)
                : tWidget("ambientSounds.default")}
            </span>

            {!isPremium && (
              <Crown
                size={11}
                className="text-amber-600 dark:text-gold fill-amber-500/30 dark:fill-gold shrink-0 ml-0.5"
              />
            )}
          </button>

          {/* POPOVER DE CONFIGURAÇÃO DE SONS AMBIENTE */}
          {isAmbientPopoverOpen && (
            <div
              role="dialog"
              aria-label={t("ambientDialogAria")}
              className={cn(
                "absolute top-full right-0 mt-2 z-50 p-3.5 rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover shadow-2xl",
                "w-72 sm:w-80 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150",
              )}
            >
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-700 dark:border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-caption font-bold text-neutral-100 uppercase tracking-wider">
                    {t("ambientHeaderTitle")}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-tiny font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/35 dark:bg-gold/20 dark:text-gold dark:border-gold/40">
                    {t("vipBadge")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAmbientPopoverOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-surface dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={t("closeAria")}
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-tiny text-neutral-300 mb-3 leading-snug">
                {t("ambientSubtitle")}
              </p>

              {/* LISTA DE OPÇÕES DE SOM */}
              <div className="flex flex-col gap-1.5 mb-3.5">
                {AMBIENT_SOUND_OPTIONS.map((sound) => {
                  const isSelected = ambientSoundType === sound.id;
                  const Icon = AMBIENT_ICONS[sound.id];
                  const isLocked = sound.id !== "none" && !isPremium;

                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => selectAmbientSound(sound.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-colors cursor-pointer",
                        isSelected
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:border-gold dark:bg-gold/20 dark:text-gold font-bold shadow-glow-gold-xs"
                          : isLocked
                            ? "border-neutral-700 bg-background/60 dark:border-primary/20 dark:bg-primary-dark/20 text-neutral-300 hover:border-amber-500/40 dark:hover:border-gold/30 hover:bg-surface dark:hover:bg-white/5"
                            : "border-neutral-700 bg-background/60 dark:border-primary/20 dark:bg-primary-dark/20 text-neutral-200 hover:border-primary/40 hover:bg-surface dark:hover:bg-white/5",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "p-1.5 rounded-lg shrink-0",
                            isSelected
                              ? "bg-gold text-on-gold"
                              : "bg-surface text-neutral-300",
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate font-medium">
                            {tWidget(`ambientSounds.${sound.id}`)}
                          </span>
                          <span className="text-tiny text-neutral-400 truncate">
                            {t(`ambientDescriptions.${sound.id}`)}
                          </span>
                        </div>
                      </div>

                      {isLocked ? (
                        <Lock
                          size={13}
                          className="text-amber-600 dark:text-gold shrink-0 ml-2"
                        />
                      ) : isSelected ? (
                        <div className="w-2 h-2 rounded-full bg-amber-600 dark:bg-gold shrink-0 ml-2" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* CONTROLE DE VOLUME DO RUÍDO */}
              {isPremium && ambientSoundType !== "none" && (
                <div className="pt-2 border-t border-neutral-700 dark:border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-label-g text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Sliders
                        size={12}
                        className="text-amber-600 dark:text-gold"
                      />
                      {t("ambientVolumeLabel")}
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-gold">
                      {Math.round(ambientVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume}
                    onChange={(e) =>
                      changeAmbientVolume(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-primary/40 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>
              )}

              {/* CALL-TO-ACTION PARA FREE */}
              {!isPremium && (
                <div className="pt-2 border-t border-neutral-700 dark:border-white/10">
                  <button
                    type="button"
                    onClick={triggerUpgradeModal}
                    className="w-full py-2 px-3 rounded-xl bg-gold text-on-gold font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-gold-xs hover:bg-gold-hover transition-colors cursor-pointer"
                  >
                    <Crown size={14} />
                    <span>{t("unlockAmbientButton")}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {localUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={localUpgradeModalOpen}
          onClose={() => setLocalUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
