"use client";

import {
  CheckCircle2,
  FastForward,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useEffect } from "react";
import type {
  FocusActiveTarget,
  FocusPhase,
  FocusRecordType,
} from "@/types/focus";
import { cn } from "@/utils";
import { FocusStageAudioControls } from "../stage/FocusStageAudioControls";
import { FocusStageTimerCircle } from "../stage/FocusStageTimerCircle";

interface FocusZenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBreak: boolean;
  isRunning: boolean;
  isActive: boolean;
  mode: FocusRecordType;
  phase: FocusPhase;
  target: FocusActiveTarget | null;
  canComplete: boolean;
  isSoundEnabled: boolean;
  timerSoundType: "zen" | "arcade";
  TargetIcon: React.ComponentType<{ size?: number; className?: string }>;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipBreak: () => void;
  onComplete: () => void;
  onToggleSound: () => void;
  onChangeSoundType: (type: "zen" | "arcade") => void;
}

/**
 * Modo Zen em tela cheia para foco imersivo sem distrações.
 * Extraído do FocusHeroStage para melhorar manutenibilidade e modularização.
 */
export function FocusZenModeModal({
  isOpen,
  onClose,
  isBreak,
  isRunning,
  isActive,
  mode,
  target,
  canComplete,
  isSoundEnabled,
  timerSoundType,
  TargetIcon,
  onToggleTimer,
  onResetTimer,
  onSkipBreak,
  onComplete,
  onToggleSound,
  onChangeSoundType,
}: FocusZenModeModalProps) {
  // Fecha o Modo Zen com a tecla Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo Zen de Foco"
      className="fixed inset-0 z-50 bg-neutral-950/98 backdrop-blur-3xl flex flex-col justify-between p-6 sm:p-12 select-none animate-in fade-in duration-200"
    >
      {/* Fundo Cósmico com Gradiente Radial */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-1000",
          isBreak
            ? "bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.10)_0%,_transparent_70%)]",
        )}
      />

      {/* Top Bar Zen: Info do Alvo + Botão Fechar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border",
              isBreak
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                : "bg-gold/20 border-gold/50 text-gold",
            )}
          >
            <TargetIcon size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-100 text-body-m">
              {target?.name || "Modo Zen"}
            </span>
            <span className="text-tiny text-neutral-400">
              {isBreak
                ? "Pausa Restauradora"
                : mode === "POMO"
                  ? "Ciclo Pomodoro"
                  : "Cronômetro"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-tiny text-neutral-500 hidden sm:inline">
            Pressione{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-neutral-700 text-neutral-300">
              Esc
            </kbd>{" "}
            para sair
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-surface/80 text-neutral-300 hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
            title="Sair do Modo Zen (Esc)"
          >
            <Minimize2 size={16} />
            <span className="text-xs font-semibold">Sair Zen</span>
          </button>
        </div>
      </div>

      {/* Centro Zen: Timer Gigante */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <FocusStageTimerCircle size="zen" onToggle={onToggleTimer} />

        {/* Controles de Ação no Modo Zen */}
        <div className="flex items-center justify-center gap-4 mt-8">
          {isActive && (
            <button
              type="button"
              onClick={onResetTimer}
              title="Reiniciar tempo"
              className="w-14 h-14 rounded-2xl border border-neutral-700 bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <RotateCcw size={22} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTimer}
            className={cn(
              "px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl",
              isBreak
                ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-[0_0_24px_rgba(16,185,129,0.5)]"
                : isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-neutral-950"
                  : "bg-gold hover:bg-gold-hover text-neutral-900 shadow-glow-gold-md hover:scale-105",
            )}
          >
            {isRunning ? (
              <>
                <Pause size={22} className="fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play size={22} className="fill-current ml-0.5" />
                <span>{isActive ? "Continuar" : "Começar"}</span>
              </>
            )}
          </button>

          {isBreak && (
            <button
              type="button"
              onClick={onSkipBreak}
              title="Pular pausa"
              className="px-5 py-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg hover:bg-emerald-900/60"
            >
              <FastForward size={18} />
              <span>Pular</span>
            </button>
          )}

          {canComplete && !isBreak && (
            <button
              type="button"
              onClick={onComplete}
              title="Concluir sessão"
              className="w-14 h-14 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <CheckCircle2 size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Rodapé Zen: Controles de Áudio */}
      <div className="relative z-10 flex items-center justify-center w-full max-w-md mx-auto">
        <FocusStageAudioControls
          isSoundEnabled={isSoundEnabled}
          timerSoundType={timerSoundType}
          onToggleSound={onToggleSound}
          onChangeSoundType={onChangeSoundType}
        />
      </div>
    </div>
  );
}
