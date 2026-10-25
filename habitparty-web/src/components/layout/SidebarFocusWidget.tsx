"use client";

import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useState } from "react";
import { getFocusIcon } from "@/constants/focus";
import { AMBIENT_ICONS, AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { cn } from "@/utils";
import { formatFocusDisplayTime } from "@/utils/focusFormatters";
import { soundEffects } from "@/utils/soundEffects";

export function SidebarFocusWidget() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Estados do Timer
  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const mode = useFocusTimerStore((s) => s.mode);
  const secondsRemaining = useFocusTimerStore((s) => s.secondsRemaining);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);
  const target = useFocusTimerStore((s) => s.target);

  const toggleTimer = useFocusTimerStore((s) => s.toggleTimer);
  const resetTimer = useFocusTimerStore((s) => s.resetTimer);
  const completeSession = useFocusTimerStore((s) => s.completeSession);

  // Estados de Som Ambiente
  const ambientSoundType = useSoundPreferencesStore((s) => s.ambientSoundType);
  const isAmbientPlaying = useSoundPreferencesStore((s) => s.isAmbientPlaying);
  const setAmbientSoundType = useSoundPreferencesStore(
    (s) => s.setAmbientSoundType,
  );
  const setIsAmbientPlaying = useSoundPreferencesStore(
    (s) => s.setIsAmbientPlaying,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasActiveTimer = (isActive || elapsedSeconds > 0) && Boolean(target);
  const hasActiveAmbient = isAmbientPlaying && ambientSoundType !== "none";

  // Se não houver timer ativo E nenhum som de ambiente ligado, oculta o widget
  if (!hasActiveTimer && !hasActiveAmbient) {
    return null;
  }

  const handleStopAmbient = (e: MouseEvent) => {
    e.stopPropagation();
    soundEffects.stopAmbientSound();
    setAmbientSoundType("none");
    setIsAmbientPlaying(false);
  };

  const handleCardClick = () => {
    router.push("/focus");
  };

  const AmbientIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;
  const ambientLabel =
    AMBIENT_SOUND_OPTIONS.find((s) => s.id === ambientSoundType)?.label ||
    "Ambiente";

  // CASO 1: Apenas Som Ambiente Ativo (sem timer)
  if (!hasActiveTimer && hasActiveAmbient) {
    return (
      <article
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        title="Som ambiente de foco ativo. Clique para ir à tela de Foco"
        aria-label="Som ambiente ativo"
        className="group relative flex flex-col gap-1.5 p-2 rounded-lg border border-gold/60 bg-gold/10 hover:border-gold hover:bg-gold/15 transition-all cursor-pointer select-none text-left shadow-glow-gold-xs mb-2.5"
      >
        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-gold/50 bg-gold/20 text-gold animate-pulse">
              <AmbientIcon size={12} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-label-g font-bold text-neutral-100 group-hover:text-gold transition-colors truncate">
                {ambientLabel}
              </span>
              <span className="text-label-m text-gold/90 font-medium leading-none">
                Som de Foco Ativo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-label-s px-1 py-0.5 rounded font-semibold uppercase tracking-wider bg-gold/20 text-gold border border-gold/40">
              VIP
            </span>
            <button
              type="button"
              onClick={handleStopAmbient}
              title="Desligar Som Ambiente"
              aria-label="Desligar Som Ambiente"
              className="w-5 h-5 rounded flex items-center justify-center border border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all cursor-pointer shadow-xs ml-0.5"
            >
              <VolumeX size={10} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  // CASO 2: Timer Ativo (com ou sem Som Ambiente)
  const isRunning = isActive && !isPaused;
  const isInventory = target?.type === "inventory";
  const TargetIcon = target?.icon ? getFocusIcon(target.icon) : Timer;

  const displayTime = formatFocusDisplayTime({
    mode,
    secondsRemaining,
    elapsedSeconds,
    target,
  });

  return (
    <article
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      title="Sessão de foco ativa. Clique para abrir a tela de Foco"
      aria-label="Sessão de foco ativa. Clique para ir à tela de Foco"
      className={cn(
        "group relative flex flex-col gap-1.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-left shadow-xs mb-2.5",
        isRunning
          ? "border-gold/70 bg-gold/10 hover:border-gold hover:bg-gold/15 shadow-glow-gold-xs"
          : "border-primary/40 bg-surface/70 hover:border-gold/40 hover:bg-surface/90",
      )}
    >
      {/* Linha Superior: Ícone, Nome e Badge */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all",
              isRunning
                ? "bg-gold/20 border-gold/50 text-gold animate-pulse"
                : "bg-primary-dark/40 border-primary/30 text-neutral-300",
            )}
          >
            <TargetIcon size={11} />
          </div>

          <span className="text-label-g font-bold text-neutral-100 group-hover:text-gold transition-colors truncate">
            {target?.name || "Modo Foco"}
          </span>
        </div>

        <span
          className={cn(
            "text-label-s px-1 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wider",
            isInventory
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : mode === "POMO"
                ? "bg-gold/20 text-gold border border-gold/40"
                : "bg-surface border border-primary/40 text-neutral-300",
          )}
        >
          {isInventory
            ? "Mochila"
            : mode === "POMO"
              ? "Pomodoro"
              : "Cronômetro"}
        </span>
      </div>

      {/* Linha Central: Mostrador do Tempo e Status */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "font-mono font-black text-xs tracking-tight transition-colors",
              isRunning ? "text-gold" : "text-neutral-200",
            )}
          >
            {displayTime}
          </span>
          {isRunning && (
            <span className="w-1 h-1 rounded-full bg-gold animate-ping inline-block" />
          )}
        </div>

        {/* Controles Rápidos do Timer */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTimer();
            }}
            title={isRunning ? "Pausar Foco" : "Continuar Foco"}
            aria-label={isRunning ? "Pausar" : "Continuar"}
            className={cn(
              "w-5 h-5 rounded flex items-center justify-center border transition-all cursor-pointer shadow-xs",
              isRunning
                ? "bg-gold text-neutral-900 border-gold hover:bg-gold-hover"
                : "bg-surface hover:bg-gold/20 text-neutral-200 hover:text-gold border-primary/30",
            )}
          >
            {isRunning ? (
              <Pause size={10} className="fill-current" />
            ) : (
              <Play size={10} className="fill-current ml-0.5" />
            )}
          </button>

          {/* Concluir / Salvar */}
          {elapsedSeconds >= 60 && (
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const success = await completeSession();
                if (success) {
                  router.refresh();
                }
              }}
              title={
                mode === "POMO" && secondsRemaining > 0 && !isInventory
                  ? "Salvar tempo parcial (ciclo incompleto)"
                  : "Concluir sessão e salvar registro"
              }
              aria-label={
                mode === "POMO" && secondsRemaining > 0 && !isInventory
                  ? "Salvar tempo parcial"
                  : "Concluir e Salvar"
              }
              className="w-5 h-5 rounded flex items-center justify-center border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-xs"
            >
              <Check size={10} className="stroke-[2.5]" />
            </button>
          )}

          {/* Reset / Parar */}
          {isActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                resetTimer();
                router.refresh();
              }}
              title="Parar / Reiniciar tempo"
              aria-label="Parar"
              className="w-5 h-5 rounded flex items-center justify-center border border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Linha Inferior Opcional: Som Ambiente Ativo Integrado com Mute Rápido */}
      {hasActiveAmbient && (
        <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-tiny text-neutral-300">
          <div className="flex items-center gap-1 truncate min-w-0">
            <AmbientIcon
              size={11}
              className="text-gold shrink-0 animate-pulse"
            />
            <span className="truncate text-gold/90">{ambientLabel}</span>
          </div>
          <button
            type="button"
            onClick={handleStopAmbient}
            title="Desligar Som Ambiente"
            aria-label="Desligar Som Ambiente"
            className="flex items-center gap-0.5 text-neutral-400 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer shrink-0"
          >
            <VolumeX size={10} />
            <span className="text-label-m">Parar</span>
          </button>
        </div>
      )}
    </article>
  );
}
