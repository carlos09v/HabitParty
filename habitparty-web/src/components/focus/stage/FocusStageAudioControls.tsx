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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUserStore } from "@/store/userStore";
import type { AmbientSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

export interface FocusStageAudioControlsProps {
  isSoundEnabled?: boolean;
  timerSoundType?: "zen" | "arcade";
  onToggleSound?: () => void;
  onChangeSoundType?: (type: "zen" | "arcade") => void;
}

export function FocusStageAudioControls({
  isSoundEnabled = true,
  timerSoundType = "zen",
  onToggleSound,
  onChangeSoundType,
}: FocusStageAudioControlsProps) {
  const isPremium = useUserStore((s) => s.is_Premium);
  const {
    browserNotificationsEnabled,
    setBrowserNotificationsEnabled,
    ambientSoundType,
    ambientVolume,
    isAmbientPlaying,
    setAmbientSoundType,
    setAmbientVolume,
    setIsAmbientPlaying,
  } = useSoundPreferencesStore();

  const [hasPermission, setHasPermission] = useState(false);
  const [isAmbientPopoverOpen, setIsAmbientPopoverOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(popoverRef, () => setIsAmbientPopoverOpen(false), {
    enabled: isAmbientPopoverOpen,
    onEscape: () => setIsAmbientPopoverOpen(false),
  });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  const handleToggleSound = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      useSoundPreferencesStore.getState().toggleTimerSounds();
    }
  };

  const handleSelectSoundType = (type: "zen" | "arcade") => {
    onChangeSoundType?.(type);
    useSoundPreferencesStore.getState().setTimerSoundType(type);
    soundEffects.playTimerStartSound(type, 0.8);
  };

  const handleToggleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador.");
      return;
    }

    if (Notification.permission === "granted") {
      const next = !browserNotificationsEnabled;
      setBrowserNotificationsEnabled(next);
      if (next) {
        toast.success(
          "Notificações do navegador ativadas para o fim do Pomodoro!",
        );
      } else {
        toast.info("Notificações do navegador silenciadas.");
      }
    } else if (Notification.permission === "denied") {
      toast.error(
        "Permissão bloqueada no navegador. Habilite as notificações nas configurações do site.",
      );
    } else {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setHasPermission(true);
        setBrowserNotificationsEnabled(true);
        toast.success(
          "Notificações permitidas! Você será avisado ao fim de cada Pomodoro.",
        );
      } else {
        toast.error("Permissão de notificação negada.");
      }
    }
  };

  const handleSelectAmbientSound = (type: AmbientSoundType) => {
    if (type !== "none" && !isPremium) {
      toast.info(
        "Sons de foco ambiente são exclusivos para assinantes Premium! Faça o upgrade para desbloquear.",
      );
      setIsUpgradeModalOpen(true);
      return;
    }

    if (type === "none") {
      soundEffects.stopAmbientSound();
      setAmbientSoundType("none");
      setIsAmbientPlaying(false);
      toast.info("Som ambiente desligado.");
      return;
    }

    setAmbientSoundType(type);
    setIsAmbientPlaying(true);
    soundEffects.startAmbientSound(type, ambientVolume);

    const soundLabel =
      AMBIENT_SOUND_OPTIONS.find((s) => s.id === type)?.label || type;
    toast.success(`Som ambiente ativado: ${soundLabel}`);
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    soundEffects.setAmbientVolume(newVol);
  };

  const AmbientCurrentIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;

  return (
    <>
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/80 border border-primary/30 text-xs relative">
        {/* Som do Timer On/Off */}
        <button
          type="button"
          onClick={handleToggleSound}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer",
            isSoundEnabled
              ? "text-gold bg-gold/15 border border-gold/30 font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title={
            isSoundEnabled
              ? "Som do Pomodoro ativado (clique para silenciar)"
              : "Som do Pomodoro silenciado (clique para ativar)"
          }
        >
          {isSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          <span className="text-label-g hidden sm:inline">
            {isSoundEnabled ? "Som" : "Mudo"}
          </span>
        </button>

        {/* Notificações do Navegador */}
        <button
          type="button"
          onClick={handleToggleNotifications}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer",
            browserNotificationsEnabled && hasPermission
              ? "text-gold bg-gold/15 border border-gold/30 font-bold"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
          )}
          title={
            browserNotificationsEnabled && hasPermission
              ? "Notificações ativadas para fim de ciclo (clique para silenciar)"
              : "Ativar notificações no navegador ao fim do Pomodoro"
          }
          aria-label="Alternar notificações do navegador"
        >
          {browserNotificationsEnabled && hasPermission ? (
            <Bell size={15} />
          ) : (
            <BellOff size={15} />
          )}
          <span className="text-label-g hidden sm:inline">
            {browserNotificationsEnabled && hasPermission
              ? "Avisos"
              : "Sem avisos"}
          </span>
        </button>

        {/* Tipo de Som do Alarme (Zen ou Arcade) */}
        {isSoundEnabled && (
          <div className="flex items-center rounded-lg bg-primary-dark/30 p-0.5 border border-primary/30">
            <button
              type="button"
              onClick={() => handleSelectSoundType("zen")}
              className={cn(
                "px-2 py-0.5 text-label-g font-semibold rounded-md transition-all cursor-pointer",
                timerSoundType === "zen"
                  ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title="Tocar som Zen (Sino harmônico suave)"
            >
              Zen
            </button>
            <button
              type="button"
              onClick={() => handleSelectSoundType("arcade")}
              className={cn(
                "px-2 py-0.5 text-label-g font-semibold rounded-md transition-all cursor-pointer",
                timerSoundType === "arcade"
                  ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
              title="Tocar som Arcade (Bips retrô gamificados)"
            >
              Arcade
            </button>
          </div>
        )}

        {/* Separador vertical */}
        <div className="w-[1px] h-4 bg-primary/30 mx-0.5" />

        {/* BOTÃO E POPOVER DE SONS AMBIENTE (BENEFÍCIO PREMIUM) */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setIsAmbientPopoverOpen((prev) => !prev)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer",
              isAmbientPlaying && ambientSoundType !== "none"
                ? "text-gold bg-gold/15 border border-gold/40 shadow-glow-gold-xs font-bold"
                : "text-neutral-300 hover:text-gold hover:bg-white/5 border border-transparent",
            )}
            title="Sons ambiente de foco (Chuva, Lofi, Cafeteria)"
            aria-expanded={isAmbientPopoverOpen}
          >
            <AmbientCurrentIcon
              size={15}
              className={
                isAmbientPlaying && ambientSoundType !== "none"
                  ? "animate-pulse text-gold"
                  : "text-neutral-300"
              }
            />
            <span className="text-label-g hidden sm:inline">
              {isAmbientPlaying && ambientSoundType !== "none"
                ? AMBIENT_SOUND_OPTIONS.find((s) => s.id === ambientSoundType)
                    ?.label
                : "Ambiente"}
            </span>

            {!isPremium && (
              <Crown
                size={11}
                className="text-gold fill-gold shrink-0 ml-0.5"
              />
            )}
          </button>

          {/* POPOVER DE CONFIGURAÇÃO DE SONS AMBIENTE */}
          {isAmbientPopoverOpen && (
            <div
              role="dialog"
              aria-label="Sons ambiente de foco"
              className={cn(
                "absolute top-full right-0 mt-2 z-50 p-3.5 rounded-2xl border border-primary/40 bg-surface/98 dark:bg-card/98 backdrop-blur-xl shadow-2xl drop-shadow-2xl",
                "w-72 sm:w-80 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150",
              )}
            >
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-caption font-bold text-neutral-100 uppercase tracking-wider">
                    Sons de Ambiente
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-gold/20 text-gold border border-gold/40">
                    VIP
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAmbientPopoverOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-tiny text-neutral-300 mb-3 leading-snug">
                Bloqueie distrações e aumente sua imersão durante o Pomodoro com
                ruídos contínuos gerados proceduralmente.
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
                      onClick={() => handleSelectAmbientSound(sound.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-gold bg-gold/20 text-gold font-bold shadow-glow-gold-xs"
                          : isLocked
                            ? "border-primary/20 bg-primary-dark/20 text-neutral-300 hover:border-gold/30 hover:bg-white/5"
                            : "border-primary/20 bg-primary-dark/20 text-neutral-200 hover:border-primary/40 hover:bg-white/5",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "p-1.5 rounded-lg shrink-0",
                            isSelected
                              ? "bg-gold text-neutral-950"
                              : "bg-surface text-neutral-300",
                          )}
                        >
                          <Icon size={14} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate font-medium">
                            {sound.label}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate">
                            {sound.description}
                          </span>
                        </div>
                      </div>

                      {isLocked ? (
                        <Lock size={13} className="text-gold shrink-0 ml-2" />
                      ) : isSelected ? (
                        <div className="w-2 h-2 rounded-full bg-gold animate-ping shrink-0 ml-2" />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* CONTROLE DE VOLUME DO RUÍDO */}
              {isPremium && ambientSoundType !== "none" && (
                <div className="pt-2 border-t border-white/10 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-300">
                    <span className="flex items-center gap-1">
                      <Sliders size={12} className="text-gold" />
                      Volume do Ambiente
                    </span>
                    <span className="font-mono font-bold text-gold">
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
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 bg-primary/40 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                </div>
              )}

              {/* CALL-TO-ACTION PARA FREE */}
              {!isPremium && (
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAmbientPopoverOpen(false);
                      setIsUpgradeModalOpen(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gold text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-glow-gold-xs hover:bg-gold-hover transition-all cursor-pointer"
                  >
                    <Crown size={14} />
                    <span>Liberar Sons de Foco</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
