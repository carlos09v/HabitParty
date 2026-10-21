"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  FastForward,
  Lock,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useState } from "react";
import { getFocusIcon, MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import {
  useFocusSessionNotes,
  useFocusTimerControls,
} from "@/hooks/useFocusTimer";
import { useUserStore } from "@/store/userStore";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { FocusDurationPresets } from "./stage/FocusDurationPresets";
import { FocusStageAudioControls } from "./stage/FocusStageAudioControls";
import { FocusStageTimerCircle } from "./stage/FocusStageTimerCircle";

const FocusZenModeModal = dynamic(
  () => import("./hero/FocusZenModeModal").then((mod) => mod.FocusZenModeModal),
  { ssr: false },
);

const FocusStageTargetSelectorModal = dynamic(
  () =>
    import("./stage/FocusStageTargetSelectorModal").then(
      (mod) => mod.FocusStageTargetSelectorModal,
    ),
  { ssr: false },
);

/**
 * Componente-folha isolado para anotações da sessão.
 * Garante que digitar no input não provoque re-render no FocusHeroStage.
 */
const FocusSessionNotesInput = memo(function FocusSessionNotesInput() {
  const { sessionNotes, setSessionNotes } = useFocusSessionNotes();

  return (
    <div className="rounded-lg border border-primary/25 bg-surface/40 px-2.5 py-1.5 flex items-center gap-2 focus-within:border-gold/50 transition-colors mt-0.5">
      <Sparkles size={13} className="text-gold shrink-0" />
      <input
        type="text"
        value={sessionNotes}
        onChange={(e) => setSessionNotes(e.target.value)}
        placeholder="Anotações da sessão (opcional)..."
        aria-label="Anotações da sessão de foco"
        className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-400 outline-none"
      />
    </div>
  );
});

interface FocusHeroStageProps {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  onSelectActivity?: (activityId: string | null) => void;
  onStartFocusActivity?: (act: FocusActivity) => void;
  onStartFocusItem?: (item: InventoryItemResponseDTO) => void;
  onChangeMode?: (mode: FocusRecordType) => void;
  onOpenUpgradeModal?: () => void;
  isCompact?: boolean;
}

export function FocusHeroStage({
  activities,
  backpackItems,
  onSelectActivity,
  onStartFocusActivity,
  onStartFocusItem,
  onChangeMode: propOnChangeMode,
  onOpenUpgradeModal,
  isCompact = false,
}: FocusHeroStageProps) {
  const controls = useFocusTimerControls();
  const isPremium = useUserStore((s) => s.is_Premium);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);

  const {
    isActive,
    isPaused,
    isRunning,
    mode,
    phase = "WORK",
    target,
    totalDurationSeconds,
    canComplete,
    isPartialPomo,
    isSoundEnabled,
    timerSoundType,
    toggleTimer,
    resetTimer,
    skipBreak,
    completeSession,
    changeDuration,
    toggleSound,
    setTimerSoundType,
  } = controls;

  const handleChangeMode = propOnChangeMode ?? controls.changeMode;
  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isInventoryItem = target?.type === "inventory";
  const TargetIcon = target?.icon ? getFocusIcon(target.icon) : Timer;

  const targetActivityIndex =
    target?.type === "activity"
      ? activities.findIndex((a) => a.id === target.id)
      : -1;
  const isTargetLocked =
    !isPremium && targetActivityIndex >= MAX_FOCUS_ACTIVITIES_FREE;

  const handleSelectActivity = useCallback(
    (act: FocusActivity) => {
      if (onStartFocusActivity) {
        onStartFocusActivity(act);
      } else {
        onSelectActivity?.(act.id);
        controls.startFocusActivity(act);
      }
    },
    [onSelectActivity, onStartFocusActivity, controls.startFocusActivity],
  );

  const handleSelectBackpackItem = useCallback(
    (item: InventoryItemResponseDTO) => {
      if (onStartFocusItem) {
        onStartFocusItem(item);
      } else {
        onSelectActivity?.(null);
        controls.startFocusItem(item);
      }
    },
    [onSelectActivity, onStartFocusItem, controls.startFocusItem],
  );

  const handleToggleTimer = useCallback(() => {
    if (isTargetLocked) {
      onOpenUpgradeModal?.();
      return;
    }
    if (!target && !isActive) {
      if (activities.length > 0) {
        handleSelectActivity(activities[0]);
        return;
      }
      setIsTargetModalOpen(true);
      return;
    }
    toggleTimer();
  }, [
    isTargetLocked,
    onOpenUpgradeModal,
    target,
    isActive,
    activities,
    handleSelectActivity,
    toggleTimer,
  ]);

  const handleComplete = useCallback(async () => {
    if (!target) {
      setIsTargetModalOpen(true);
      return;
    }
    await completeSession();
  }, [target, completeSession]);

  // Atalhos de teclado globais para produtividade (Space = Play/Pause, Z = Modo Zen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          activeEl.tagName === "BUTTON" ||
          activeEl.isContentEditable ||
          activeEl.closest("[role='dialog']"))
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handleToggleTimer();
      } else if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        setIsZenModeOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleTimer]);

  return (
    <>
      {/* =========================================================================
          PALCO DE FOCO HERÓICO (Hero Focus Stage)
          ========================================================================= */}
      <section
        aria-label="Palco de Foco"
        className={cn(
          "group/hero relative w-full shrink-0 min-h-fit rounded-2xl border transition-all duration-300 select-none z-20",
          isCompact ? "p-3 sm:p-3.5" : "p-3.5 sm:p-4",
          isBreak
            ? "border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-card/80 to-card/50 shadow-[0_4px_24px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 hover:shadow-[0_8px_32px_rgba(16,185,129,0.2)]"
            : isRunning
              ? "border-gold/60 bg-gradient-to-b from-gold/10 via-card/80 to-card/50 shadow-glow-gold-xs hover:border-gold/80 hover:shadow-glow-gold-md"
              : "border-primary/30 bg-card/70 backdrop-blur-md hover:border-gold/50 hover:shadow-[0_8px_32px_rgba(234,179,8,0.12)]",
        )}
      >
        {/* Glow de Fundo Sutil Cósmico que expande suavemente no hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        >
          <div
            className={cn(
              "absolute -top-20 left-1/2 -translate-x-1/2 w-96 sm:w-[480px] h-52 rounded-full blur-3xl opacity-25 group-hover/hero:opacity-45 group-hover/hero:scale-110 transition-all duration-700 ease-out",
              isBreak
                ? "bg-emerald-500"
                : isRunning
                  ? "bg-gold"
                  : "bg-primary group-hover/hero:bg-gold/40",
            )}
          />
        </div>

        {/* 1. Header do Palco: Alvo Ativo + Switchers + Modo Zen */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 mb-2 sm:mb-3">
          {/* Esquerda: Alvo Ativo / Seleção */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                "rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10",
                isBreak
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  : isRunning
                    ? "bg-gold/20 border-gold/70 text-gold shadow-glow-gold-xs animate-pulse"
                    : "bg-surface/90 border-primary/40 text-neutral-200",
              )}
            >
              <TargetIcon size={18} />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-neutral-100 text-subtitle-s sm:text-subtitle-m truncate max-w-[180px] xs:max-w-xs sm:max-w-md">
                  {target?.name || "Nenhuma Atividade Selecionada"}
                </h3>

                {/* Badge da Fase Atual */}
                {isBreak ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-label-g font-bold animate-pulse shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {phase === "LONG_BREAK"
                      ? "🌴 Pausa Longa (15m)"
                      : "☕ Pausa Curta (5m)"}
                  </span>
                ) : isRunning ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold text-label-g font-bold animate-pulse shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />⚡ Foco
                    Ativo
                  </span>
                ) : null}

                {/* Badge do Tipo de Alvo */}
                {isTargetLocked ? (
                  <span className="text-tiny px-2 py-0.5 rounded-full font-bold bg-gold/20 border border-gold/40 text-gold shrink-0 whitespace-nowrap flex items-center gap-1">
                    <Lock size={10} />
                    Pausada 👑
                  </span>
                ) : (
                  <span className="text-tiny px-2 py-0.5 rounded-full font-semibold bg-surface border border-primary/30 text-neutral-300 shrink-0 whitespace-nowrap">
                    {isInventoryItem
                      ? "Cupom da Mochila"
                      : mode === "POMO"
                        ? "Pomodoro"
                        : "Cronômetro Livre"}
                  </span>
                )}

                {/* Botão para Trocar/Vincular Alvo */}
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(true)}
                  className="inline-flex items-center gap-1 text-label-g font-semibold text-gold hover:text-gold-hover hover:underline cursor-pointer ml-1 shrink-0 whitespace-nowrap"
                >
                  <ArrowRightLeft size={11} />
                  <span>{target ? "Trocar" : "Vincular"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Direita: Switcher Modo + Áudio + Botão Modo Zen */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap ml-auto shrink-0">
            {/* Switcher Pomodoro / Cronômetro */}
            {!isInventoryItem && !isActive && (
              <div className="flex items-center rounded-xl bg-surface/90 p-1 border border-primary/35 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleChangeMode("POMO")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    mode === "POMO"
                      ? "bg-gold text-neutral-900 shadow-glow-gold-xs"
                      : "text-neutral-400 hover:text-neutral-200",
                  )}
                >
                  Pomodoro
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMode("STOPWATCH")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    mode === "STOPWATCH"
                      ? "bg-gold text-neutral-900 shadow-glow-gold-xs"
                      : "text-neutral-400 hover:text-neutral-200",
                  )}
                >
                  Cronômetro
                </button>
              </div>
            )}

            {/* Controles de Som */}
            <FocusStageAudioControls
              isSoundEnabled={isSoundEnabled}
              timerSoundType={timerSoundType}
              onToggleSound={toggleSound}
              onChangeSoundType={setTimerSoundType}
              onOpenUpgradeModal={onOpenUpgradeModal}
            />

            {/* Botão Modo Zen / Tela Cheia */}
            <button
              type="button"
              onClick={() => setIsZenModeOpen(true)}
              title="Entrar em Modo Zen (Atalho: Z)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-surface/90 hover:bg-gold/15 hover:border-gold/50 text-neutral-200 hover:text-gold text-xs font-bold transition-all cursor-pointer shadow-sm group"
            >
              <Maximize2
                size={14}
                className="group-hover:scale-110 transition-transform text-gold"
              />
              <span className="hidden sm:inline">Modo Zen</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. CORPO DO PALCO: LAYOUT HERÓICO LADO A LADO (COMPACTO)
            ========================================================================= */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 my-1 sm:my-2">
          {/* Esquerda: Círculo do Timer (Tamanho SM compacto, limpo e direto) */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            <FocusStageTimerCircle size="sm" onToggle={handleToggleTimer} />
          </div>

          {/* Direita: Coluna Completa de Ações (Flex Column) */}
          <div className="flex flex-col items-stretch justify-center gap-2.5 w-full max-w-xs sm:max-w-sm">
            {/* 1. Botão Principal: Começar / Continuar / Pausar */}
            {isTargetLocked && !isRunning ? (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                title="Atividade pausada. Reative o plano Premium para cronometrar nesta atividade!"
                className="w-full py-3 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md bg-gold hover:bg-gold-hover text-neutral-900 shadow-glow-gold-md hover:scale-[1.01]"
              >
                <Lock size={18} />
                <span>Atividade Pausada • Seja VIP 👑</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleTimer}
                title="Atalho rápido: Barra de Espaço"
                className={cn(
                  "w-full py-3 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md",
                  isBreak
                    ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : isRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-amber-500/20"
                      : "bg-gold hover:bg-gold-hover text-neutral-900 shadow-glow-gold-md hover:scale-[1.01]",
                )}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} className="fill-current" />
                    <span>Pausar Foco</span>
                  </>
                ) : (
                  <>
                    <Play size={18} className="fill-current ml-0.5" />
                    <span>{isPaused ? "Continuar Foco" : "Começar Foco"}</span>
                  </>
                )}
              </button>
            )}

            {/* 2. Botão Concluir Sessão (quando canComplete e não em pausa) */}
            {canComplete && !isBreak && (
              <button
                type="button"
                onClick={handleComplete}
                title={
                  isPartialPomo
                    ? "Encerrar e salvar tempo decorrido (ciclo incompleto)"
                    : "Concluir sessão e registrar histórico"
                }
                className="w-full py-2.5 px-5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.01]"
              >
                <CheckCircle2 size={17} />
                <span>
                  {isPartialPomo ? "Salvar Tempo Parcial" : "Concluir Sessão"}
                </span>
              </button>
            )}

            {/* 3. Controles Auxiliares: Presets ou Botões de Reiniciar / Pular Pausa */}
            {mode === "POMO" && !isInventoryItem && !isActive ? (
              <div className="w-full flex justify-center py-0.5">
                <FocusDurationPresets
                  totalDurationSeconds={totalDurationSeconds}
                  onChangeDuration={changeDuration}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                {/* Botão Reiniciar */}
                {isActive ? (
                  <button
                    type="button"
                    onClick={resetTimer}
                    title="Reiniciar tempo"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Reiniciar</span>
                  </button>
                ) : (
                  <div />
                )}

                {/* Botão Pular Pausa */}
                {isBreak && (
                  <button
                    type="button"
                    onClick={skipBreak}
                    title="Pular pausa e voltar ao foco agora"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <FastForward size={14} />
                    <span>Pular Pausa</span>
                  </button>
                )}
              </div>
            )}

            {/* 4. Campo de Anotações Compacto Isolado */}
            <FocusSessionNotesInput />
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODO ZEN (Carregado sob demanda)
          ========================================================================= */}
      {isZenModeOpen && (
        <FocusZenModeModal
          isOpen={isZenModeOpen}
          onClose={() => setIsZenModeOpen(false)}
          isBreak={isBreak}
          isRunning={isRunning}
          isActive={isActive}
          mode={mode}
          phase={phase}
          target={target}
          canComplete={canComplete}
          isSoundEnabled={isSoundEnabled}
          timerSoundType={timerSoundType}
          TargetIcon={TargetIcon}
          onToggleTimer={handleToggleTimer}
          onResetTimer={resetTimer}
          onSkipBreak={skipBreak}
          onComplete={handleComplete}
          onToggleSound={toggleSound}
          onChangeSoundType={setTimerSoundType}
        />
      )}

      {/* Modal para Trocar ou Selecionar Alvo (Carregado sob demanda) */}
      {isTargetModalOpen && (
        <FocusStageTargetSelectorModal
          isOpen={isTargetModalOpen}
          onClose={() => setIsTargetModalOpen(false)}
          activities={activities}
          backpackItems={backpackItems}
          currentTargetId={target?.id}
          onSelectActivity={handleSelectActivity}
          onSelectBackpackItem={handleSelectBackpackItem}
        />
      )}
    </>
  );
}
