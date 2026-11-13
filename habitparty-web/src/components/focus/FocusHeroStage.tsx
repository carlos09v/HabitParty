"use client";

import {
  CheckCircle2,
  FastForward,
  ListTodo,
  Lock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
import { getFocusIcon, MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import {
  useFocusSessionNotes,
  useFocusTimerControls,
} from "@/hooks/useFocusTimer";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { getRewardIcon } from "@/utils/rewardMapper";
import { FocusDurationPresets } from "./stage/FocusDurationPresets";
import { FocusStageHeaderBar } from "./stage/FocusStageHeaderBar";
import { FocusStageTaskSlot } from "./stage/FocusStageTaskSlot";
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

function preloadFocusHeroModalChunks() {
  void import("./hero/FocusZenModeModal");
  void import("./stage/FocusStageTargetSelectorModal");
}

/**
 * Componente-folha isolado para anotações da sessão.
 * Garante que digitar no input não provoque re-render no FocusHeroStage.
 */
const FocusSessionNotesInput = memo(function FocusSessionNotesInput() {
  const t = useTranslations("focus.hero");
  const { sessionNotes, setSessionNotes } = useFocusSessionNotes();

  return (
    <div className="rounded-lg border border-primary/25 bg-surface/40 px-2.5 py-1.5 flex items-center gap-2 focus-within:border-gold/50 transition-colors mt-0.5">
      <Sparkles size={13} className="text-gold shrink-0" />
      <input
        type="text"
        value={sessionNotes}
        onChange={(e) => setSessionNotes(e.target.value)}
        placeholder={t("notesPlaceholder")}
        aria-label={t("notesAria")}
        className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-400 outline-none"
      />
    </div>
  );
});

interface FocusHeroStageProps {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  onSelectActivity?: (activityId: string | null) => void;
  onStartFocusActivity?: (act: FocusActivity) => void;
  onStartFocusItem?: (item: InventoryItemResponseDTO) => void;
  onStartFocusTask?: (task: { id: string; title: string }) => void;
  onChangeMode?: (mode: FocusRecordType) => void;
  onOpenUpgradeModal?: () => void;
  initialLinkActivity?: boolean;
  isCompact?: boolean;
}

export function FocusHeroStage({
  activities,
  backpackItems,
  focusableTasks = [],
  onSelectActivity,
  onStartFocusActivity,
  onStartFocusItem,
  onStartFocusTask,
  onChangeMode: propOnChangeMode,
  onOpenUpgradeModal,
  initialLinkActivity = false,
  isCompact = false,
}: FocusHeroStageProps) {
  const t = useTranslations("focus.hero");
  const controls = useFocusTimerControls();
  const isPremium = useUserStore((s) => s.is_Premium);
  useIdlePreload(preloadFocusHeroModalChunks);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalInitialTab, setTargetModalInitialTab] = useState<
    "ACTIVITIES" | "TASKS" | "BACKPACK"
  >("ACTIVITIES");
  const [isLinkActivityOnlyModal, setIsLinkActivityOnlyModal] = useState(false);
  const [isLinkTaskOnlyModal, setIsLinkTaskOnlyModal] = useState(false);
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
  const TargetIcon = isInventoryItem
    ? getRewardIcon(target?.icon, "TimeBased")
    : target?.type === "task"
      ? ListTodo
      : target?.icon
        ? getFocusIcon(target.icon)
        : Timer;

  const targetActivityIndex =
    target?.type === "activity"
      ? activities.findIndex((a) => a.id === target.id)
      : -1;
  const isTargetLocked =
    !isPremium && targetActivityIndex >= MAX_FOCUS_ACTIVITIES_FREE;

  const handleOpenTargetModal = useCallback(() => {
    setIsLinkActivityOnlyModal(false);
    setIsLinkTaskOnlyModal(false);
    setTargetModalInitialTab(
      target?.type === "task"
        ? "TASKS"
        : target?.type === "inventory"
          ? "BACKPACK"
          : "ACTIVITIES",
    );
    setIsTargetModalOpen(true);
  }, [target?.type]);

  const handleOpenZenMode = useCallback(() => {
    setIsZenModeOpen(true);
  }, []);

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

  // Sessão de foco direto na tarefa: escolher uma atividade no seletor vincula (Macro + Micro) sem perder o tempo
  const handleLinkActivityToTask = useCallback(
    (act: FocusActivity) => {
      controls.linkActivityToTask(act);
      onSelectActivity?.(act.id);
    },
    [controls.linkActivityToTask, onSelectActivity],
  );

  const handleOpenLinkActivityModal = useCallback(() => {
    setIsLinkActivityOnlyModal(true);
    setIsLinkTaskOnlyModal(false);
    setTargetModalInitialTab("ACTIVITIES");
    setIsTargetModalOpen(true);
  }, []);

  const handleOpenLinkTaskModal = useCallback(() => {
    setIsLinkActivityOnlyModal(false);
    setIsLinkTaskOnlyModal(true);
    setTargetModalInitialTab("TASKS");
    setIsTargetModalOpen(true);
  }, []);

  useEffect(() => {
    if (!initialLinkActivity) return;
    if (target?.type === "task") {
      handleOpenLinkActivityModal();
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("linkActivity")) {
        url.searchParams.delete("linkActivity");
        window.history.replaceState(
          null,
          "",
          url.pathname + (url.search ? url.search : ""),
        );
      }
    }
  }, [initialLinkActivity, target?.type, handleOpenLinkActivityModal]);

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

  const handleSelectTask = useCallback(
    (task: { id: string; title: string }) => {
      if (onStartFocusTask) {
        onStartFocusTask(task);
      } else {
        controls.selectTaskTarget(task);
      }
    },
    [onStartFocusTask, controls.selectTaskTarget],
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
        aria-label={t("sectionAria")}
        className={cn(
          "group/hero relative w-full shrink-0 min-h-fit rounded-2xl border transition-colors duration-200 select-none z-20",
          isCompact ? "p-3 sm:p-3.5" : "p-3.5 sm:p-4",
          isBreak
            ? "border-emerald-500/40 bg-linear-to-b from-emerald-500/10 dark:from-emerald-950/30 via-card/90 dark:via-card/85 to-card/80 dark:to-card/65 shadow-sm dark:shadow-[0_4px_24px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 dark:hover:shadow-[0_8px_32px_rgba(16,185,129,0.2)]"
            : isRunning
              ? "border-gold/60 bg-linear-to-b from-gold/10 via-card/85 to-card/65 shadow-glow-gold-xs hover:border-gold/80 hover:shadow-glow-gold-md"
              : "border-neutral-700 dark:border-primary/30 bg-linear-to-br from-purple-500/[0.06] via-card to-amber-500/[0.03] dark:bg-none dark:bg-card/85 shadow-xs dark:shadow-none hover:border-gold/50 hover:shadow-[0_8px_32px_rgba(234,179,8,0.12)]",
        )}
      >
        {/* Glow de Fundo Sutil Cósmico pré-composto que expande suavemente no hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        >
          <div
            className={cn(
              "absolute -top-24 left-1/2 -translate-x-1/2 w-[480px] sm:w-[580px] h-64 rounded-full opacity-25 dark:opacity-50 group-hover/hero:opacity-45 dark:group-hover/hero:opacity-75 group-hover/hero:scale-110 transition-[transform,opacity] duration-500 ease-out",
              isBreak
                ? "bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.28)_0%,transparent_70%)]"
                : isRunning
                  ? "bg-[radial-gradient(ellipse_at_center,rgba(237,229,57,0.26)_0%,transparent_70%)]"
                  : "bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.32)_0%,transparent_70%)]",
            )}
          />
        </div>

        {/* 1. Header do Palco: Alvo Ativo + Switchers + Modo Zen */}
        <FocusStageHeaderBar
          target={target}
          TargetIcon={TargetIcon}
          phase={phase}
          mode={mode}
          isBreak={isBreak}
          isRunning={isRunning}
          isActive={isActive}
          isInventoryItem={isInventoryItem}
          isTargetLocked={isTargetLocked}
          isSoundEnabled={isSoundEnabled}
          timerSoundType={timerSoundType}
          onOpenTargetModal={handleOpenTargetModal}
          onChangeMode={handleChangeMode}
          onToggleSound={toggleSound}
          onChangeSoundType={setTimerSoundType}
          onOpenZenMode={handleOpenZenMode}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />

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
                title={t("lockedActivityTitle")}
                className="w-full py-3 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-md bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md hover:scale-[1.01]"
              >
                <Lock size={18} />
                <span>{t("lockedActivityButton")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleTimer}
                title={t("spaceShortcutTitle")}
                className={cn(
                  "w-full py-3 px-5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-md",
                  isBreak
                    ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm dark:shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                    : isRunning
                      ? "bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-amber-500/20"
                      : "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md hover:scale-[1.01]",
                )}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} className="fill-current" />
                    <span>{t("pauseFocus")}</span>
                  </>
                ) : (
                  <>
                    <Play size={18} className="fill-current ml-0.5" />
                    <span>{isPaused ? t("resumeFocus") : t("startFocus")}</span>
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
                    ? t("savePartialTitle")
                    : t("completeSessionTitle")
                }
                className="w-full py-2.5 px-5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-[transform,background-color,border-color,color] duration-150 cursor-pointer shadow-sm hover:scale-[1.01]"
              >
                <CheckCircle2 size={17} />
                <span>
                  {isPartialPomo
                    ? t("savePartialButton")
                    : t("completeSessionButton")}
                </span>
              </button>
            )}

            {/* 2.5. Painel de Tarefa Vinculada (logo abaixo de Começar / Salvar Tempo Parcial) */}
            <FocusStageTaskSlot
              target={target}
              isInventoryItem={isInventoryItem}
              onOpenLinkTask={handleOpenLinkTaskModal}
              onOpenLinkActivity={handleOpenLinkActivityModal}
              onCompleteLinkedTask={controls.completeLinkedTask}
              onUnlinkTask={controls.unlinkTaskFromTarget}
            />

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
                    title={t("resetTitle")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>{t("resetButton")}</span>
                  </button>
                ) : (
                  <div />
                )}

                {/* Botão Pular Pausa */}
                {isBreak && (
                  <button
                    type="button"
                    onClick={skipBreak}
                    title={t("skipBreakTitle")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FastForward size={14} />
                    <span>{t("skipBreakButton")}</span>
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
          onClose={() => {
            setIsTargetModalOpen(false);
            setIsLinkActivityOnlyModal(false);
            setIsLinkTaskOnlyModal(false);
          }}
          activities={activities}
          backpackItems={backpackItems}
          focusableTasks={focusableTasks}
          currentTargetId={target?.id}
          currentTarget={target}
          initialTab={targetModalInitialTab}
          onlyActivities={isLinkActivityOnlyModal}
          onlyTasks={isLinkTaskOnlyModal}
          onSelectActivity={handleSelectActivity}
          onLinkActivityToTask={handleLinkActivityToTask}
          onSelectBackpackItem={handleSelectBackpackItem}
          onSelectTask={handleSelectTask}
          onUnlinkTask={controls.unlinkTaskFromTarget}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      )}
    </>
  );
}
