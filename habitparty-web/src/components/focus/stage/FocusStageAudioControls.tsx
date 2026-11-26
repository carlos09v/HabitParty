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
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { Switch } from "@/components/ui/Switch";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { useFocusAudioControls } from "@/hooks/useFocusAudioControls";
import type { TimerSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

export interface FocusStageAudioControlsProps {
  initialIsPremium?: boolean;
  onOpenUpgradeModal?: () => void;
}

/**
 * Botão unificado de Áudio & Alertas do palco de foco e Modo Zen.
 * Consolida som do timer, estilo de alarme (Zen/Arcade), notificações do navegador
 * e sons ambiente (VIP) em um único popover acessível com gestão completa de foco.
 */
export function FocusStageAudioControls({
  initialIsPremium = false,
  onOpenUpgradeModal,
}: FocusStageAudioControlsProps) {
  const t = useTranslations("focus.audio");
  const tWidget = useTranslations("focusWidget");
  const baseId = useId();

  const popoverId = `${baseId}-popover`;
  const headingId = `${baseId}-heading`;
  const soundSwitchId = `${baseId}-sound-switch`;
  const notifSwitchId = `${baseId}-notif-switch`;
  const volumeSliderId = `${baseId}-ambient-volume`;

  const audioPopover = useFloatingPopover<
    HTMLDivElement,
    HTMLButtonElement,
    HTMLDivElement
  >({
    align: "right",
    estimatedWidth: 320,
    estimatedHeight: 490,
    maxAllowedHeight: 560,
    margin: 12,
    offset: 8,
    zIndex: 80,
    restoreFocusOnEscape: true,
  });

  const closeAndRestoreFocus = useCallback(() => {
    audioPopover.close();
    window.requestAnimationFrame(() => {
      audioPopover.triggerRef.current?.focus();
    });
  }, [audioPopover.close, audioPopover.triggerRef]);

  const triggerUpgradeModal = useCallback(() => {
    audioPopover.close();
    onOpenUpgradeModal?.();
  }, [audioPopover.close, onOpenUpgradeModal]);

  const {
    mounted,
    isPremium,
    timerSoundsEnabled,
    timerSoundType: storeTimerSoundType,
    timerVolume,
    browserNotificationsEnabled,
    hasNotificationPermission,
    ambientSoundType: rawAmbientSoundType,
    ambientVolume,
    isAmbientPlaying: rawIsAmbientPlaying,
    toggleTimerSounds,
    setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    changeAmbientVolume,
  } = useFocusAudioControls({
    initialIsPremium,
    onRequirePremiumUpgrade: triggerUpgradeModal,
    restoreAmbientOnMount: true,
  });

  useEffect(() => {
    if (!audioPopover.isOpen) return;
    const frameId = window.requestAnimationFrame(() => {
      audioPopover.popoverRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [audioPopover.isOpen, audioPopover.popoverRef]);

  const isSoundEnabled = mounted ? timerSoundsEnabled : true;
  const timerSoundType = mounted ? storeTimerSoundType : "zen";
  const isNotificationsActive =
    mounted && browserNotificationsEnabled && hasNotificationPermission;
  const ambientSoundType = mounted ? rawAmbientSoundType : "none";
  const isAmbientPlaying = mounted && rawIsAmbientPlaying;

  const isAmbientActive = isAmbientPlaying && ambientSoundType !== "none";
  const isAllMuted =
    !isSoundEnabled && !isNotificationsActive && !isAmbientActive;

  const handleSelectSoundType = (type: TimerSoundType) => {
    setTimerSoundType(type);
    soundEffects.playTimerStartSound(type, timerVolume ?? 0.8);
  };

  const AmbientCurrentIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;
  const TriggerIcon = isAmbientActive
    ? AmbientCurrentIcon
    : isSoundEnabled
      ? Volume2
      : VolumeX;

  const triggerVisibleLabel = isAmbientActive
    ? tWidget(`ambientSounds.${ambientSoundType}`)
    : isAllMuted
      ? t("menuButtonMuted")
      : t("menuButtonLabel");

  const volumePercent = Math.round(ambientVolume * 100);

  return (
    <div className="relative" ref={audioPopover.containerRef}>
      <button
        ref={audioPopover.triggerRef}
        type="button"
        onClick={audioPopover.toggle}
        aria-expanded={audioPopover.isOpen}
        aria-haspopup="dialog"
        aria-controls={popoverId}
        aria-label={`${triggerVisibleLabel} — ${t("menuButtonAria")}`}
        title={t("menuButtonTitle")}
        className={cn(
          "relative flex items-center gap-1.5 min-h-8 pointer-coarse:min-h-9 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-2xs dark:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          audioPopover.isOpen || isAmbientActive
            ? "border-amber-500/45 dark:border-gold/50 bg-amber-500/10 dark:bg-gold/15 text-amber-800 dark:text-gold"
            : isAllMuted
              ? "border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500"
              : "border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/45 dark:hover:border-gold/50 text-neutral-200 hover:text-amber-700 dark:hover:text-gold",
        )}
      >
        <TriggerIcon
          size={14}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            isAmbientActive
              ? "motion-safe:animate-pulse text-amber-700 dark:text-gold"
              : isAllMuted
                ? "text-neutral-400"
                : "text-amber-800 dark:text-gold",
          )}
        />
        <span className="hidden sm:inline max-w-[96px] truncate">
          {triggerVisibleLabel}
        </span>
        {(isAmbientActive || isNotificationsActive) && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-gold shrink-0"
          />
        )}
      </button>

      {audioPopover.shouldRenderPortal &&
        audioPopover.portalContainer &&
        audioPopover.isOpen &&
        audioPopover.coords &&
        createPortal(
          <div
            id={popoverId}
            ref={audioPopover.popoverRef}
            style={audioPopover.floatingStyle}
            role="dialog"
            aria-modal="false"
            aria-labelledby={headingId}
            tabIndex={-1}
            className={cn(
              "p-3.5 rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-popover shadow-2xl outline-none",
              "w-80 max-w-[calc(100vw-24px)] overflow-x-hidden overflow-y-auto overscroll-contain custom-scrollbar animate-in fade-in zoom-in-95 duration-150",
            )}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-neutral-700 dark:border-white/10 min-w-0">
              <h2
                id={headingId}
                className="text-xs font-bold text-neutral-100 uppercase tracking-wider flex items-center gap-1.5 min-w-0"
              >
                <Volume2
                  size={13}
                  aria-hidden="true"
                  className="text-amber-800 dark:text-gold shrink-0"
                />
                <span className="truncate">{t("menuHeaderTitle")}</span>
              </h2>
              <button
                type="button"
                onClick={closeAndRestoreFocus}
                className="min-w-8 min-h-8 pointer-coarse:min-w-10 pointer-coarse:min-h-10 shrink-0 text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-surface dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                aria-label={t("closeAria")}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-3 min-w-0">
              {/* Seção 1: Alertas do Timer (Som, Estilo e Notificações) */}
              <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 min-w-0 w-full">
                <legend className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 max-w-full">
                  {t("alertsSectionTitle")}
                </legend>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/20 px-2.5 py-2 min-w-0">
                  <label
                    htmlFor={soundSwitchId}
                    className="flex items-center gap-2 text-xs font-semibold text-neutral-100 cursor-pointer min-w-0 flex-1"
                  >
                    {isSoundEnabled ? (
                      <Volume2
                        size={14}
                        aria-hidden="true"
                        className="text-amber-700 dark:text-gold shrink-0"
                      />
                    ) : (
                      <VolumeX
                        size={14}
                        aria-hidden="true"
                        className="text-neutral-400 shrink-0"
                      />
                    )}
                    <span className="truncate">
                      {isSoundEnabled ? t("soundOn") : t("soundOff")}
                    </span>
                  </label>
                  <Switch
                    id={soundSwitchId}
                    size="sm"
                    checked={isSoundEnabled}
                    onCheckedChange={() => toggleTimerSounds()}
                    aria-label={
                      isSoundEnabled
                        ? t("soundEnabledTitle")
                        : t("soundMutedTitle")
                    }
                  />
                </div>

                {isSoundEnabled && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/20 px-2.5 py-1.5 min-w-0">
                    <span className="text-xs font-medium text-neutral-300 min-w-0 truncate">
                      {t("alarmStyleLabel")}
                    </span>
                    <div
                      role="radiogroup"
                      aria-label={t("alarmStyleAria")}
                      className="flex items-center shrink-0 rounded-lg bg-card dark:bg-primary-dark/40 p-0.5 border border-neutral-700 dark:border-primary/30"
                    >
                      {/* biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern */}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={timerSoundType === "zen"}
                        onClick={() => handleSelectSoundType("zen")}
                        title={t("zenSoundTitle")}
                        className={cn(
                          "min-h-7 pointer-coarse:min-h-9 px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                          timerSoundType === "zen"
                            ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                            : "text-neutral-400 hover:text-neutral-200",
                        )}
                      >
                        {t("zenSoundLabel")}
                      </button>
                      {/* biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern */}
                      <button
                        type="button"
                        role="radio"
                        aria-checked={timerSoundType === "arcade"}
                        onClick={() => handleSelectSoundType("arcade")}
                        title={t("arcadeSoundTitle")}
                        className={cn(
                          "min-h-7 pointer-coarse:min-h-9 px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                          timerSoundType === "arcade"
                            ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                            : "text-neutral-400 hover:text-neutral-200",
                        )}
                      >
                        {t("arcadeSoundLabel")}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/20 bg-background/60 dark:bg-primary-dark/20 px-2.5 py-2 min-w-0">
                  <label
                    htmlFor={notifSwitchId}
                    className="flex items-center gap-2 text-xs font-semibold text-neutral-100 cursor-pointer min-w-0 flex-1"
                  >
                    {isNotificationsActive ? (
                      <Bell
                        size={14}
                        aria-hidden="true"
                        className="text-amber-700 dark:text-gold shrink-0"
                      />
                    ) : (
                      <BellOff
                        size={14}
                        aria-hidden="true"
                        className="text-neutral-400 shrink-0"
                      />
                    )}
                    <span className="truncate">
                      {isNotificationsActive
                        ? t("notificationsOn")
                        : t("notificationsOff")}
                    </span>
                  </label>
                  <Switch
                    id={notifSwitchId}
                    size="sm"
                    checked={isNotificationsActive}
                    onCheckedChange={() => void toggleBrowserNotifications()}
                    aria-label={t("notificationsAria")}
                  />
                </div>
              </fieldset>

              {/* Seção 2: Sons de Ambiente (VIP) */}
              <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 pt-2.5 border-t border-neutral-700/70 dark:border-white/10 min-w-0 w-full">
                <legend className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1 max-w-full">
                  <span>{t("ambientHeaderTitle")}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/35 dark:bg-gold/20 dark:text-gold dark:border-gold/40">
                    {t("vipBadge")}
                  </span>
                </legend>

                <p className="text-[11px] text-neutral-300 leading-snug mb-1">
                  {t("ambientSubtitle")}
                </p>

                <div className="flex flex-col gap-1.5 min-w-0">
                  {AMBIENT_SOUND_OPTIONS.map((sound) => {
                    const isSelected = ambientSoundType === sound.id;
                    const Icon = AMBIENT_ICONS[sound.id];
                    const isLocked = sound.id !== "none" && !isPremium;

                    return (
                      <button
                        key={sound.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => selectAmbientSound(sound.id)}
                        className={cn(
                          "w-full min-w-0 flex items-center justify-between gap-2 p-2 rounded-xl border text-left transition-colors cursor-pointer",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:border-gold dark:bg-gold/20 dark:text-gold font-bold shadow-glow-gold-xs"
                            : isLocked
                              ? "border-neutral-700 bg-background/60 dark:border-primary/20 dark:bg-primary-dark/20 text-neutral-300 hover:border-amber-500/40 dark:hover:border-gold/30 hover:bg-surface dark:hover:bg-white/5"
                              : "border-neutral-700 bg-background/60 dark:border-primary/20 dark:bg-primary-dark/20 text-neutral-200 hover:border-primary/40 hover:bg-surface dark:hover:bg-white/5",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={cn(
                              "p-1.5 rounded-lg shrink-0",
                              isSelected
                                ? "bg-gold text-on-gold"
                                : "bg-surface text-neutral-300",
                            )}
                          >
                            <Icon size={14} aria-hidden="true" />
                          </span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs truncate font-medium">
                              {tWidget(`ambientSounds.${sound.id}`)}
                            </span>
                            <span className="text-[11px] text-neutral-400 truncate">
                              {t(`ambientDescriptions.${sound.id}`)}
                            </span>
                          </div>
                        </div>

                        {isLocked ? (
                          <Lock
                            size={13}
                            aria-hidden="true"
                            className="text-amber-800 dark:text-gold shrink-0"
                          />
                        ) : isSelected ? (
                          <div
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full bg-amber-600 dark:bg-gold shrink-0"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                {/* Controle de volume com <label htmlFor> e aria-valuetext */}
                {isPremium && ambientSoundType !== "none" && (
                  <div className="pt-2 border-t border-neutral-700 dark:border-white/10 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <label
                        htmlFor={volumeSliderId}
                        className="flex items-center gap-1.5 font-medium cursor-pointer"
                      >
                        <Sliders
                          size={12}
                          aria-hidden="true"
                          className="text-amber-800 dark:text-gold"
                        />
                        <span>{t("ambientVolumeLabel")}</span>
                      </label>
                      <span className="font-mono text-xs font-bold tabular-nums text-amber-800 dark:text-gold">
                        {volumePercent}%
                      </span>
                    </div>
                    <input
                      id={volumeSliderId}
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      aria-valuetext={`${volumePercent}%`}
                      onChange={(e) =>
                        changeAmbientVolume(Number.parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-primary/40 rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                  </div>
                )}

                {!isPremium && (
                  <div className="pt-2 border-t border-neutral-700 dark:border-white/10">
                    <button
                      type="button"
                      onClick={triggerUpgradeModal}
                      className="w-full py-2 px-3 rounded-xl bg-gold text-on-gold font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-gold-xs hover:bg-gold-hover transition-colors cursor-pointer"
                    >
                      <Crown size={14} aria-hidden="true" />
                      <span>{t("unlockAmbientButton")}</span>
                    </button>
                  </div>
                )}
              </fieldset>
            </div>
          </div>,
          audioPopover.portalContainer,
        )}
    </div>
  );
}
