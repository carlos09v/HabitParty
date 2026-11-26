import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResolvedIsPremium } from "@/components/ui/CatalogItemShared";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focusRules";
import { useFocusKeyboardShortcuts } from "@/hooks/useFocusKeyboardShortcuts";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn, removeBrowserQueryParam } from "@/utils";
import { formatDurationMinSec } from "@/utils/focusFormatters";
import { resolveFocusTargetIcon } from "@/utils/focusIcons";
import { FocusDailyYieldBadge } from "./stage/FocusDailyYieldBadge";
import { FocusDurationPresets } from "./stage/FocusDurationPresets";
import { FocusSessionCapBadge } from "./stage/FocusSessionCapBadge";
import { FocusSessionNotesField } from "./stage/FocusSessionNotesField";
import { FocusStageHeaderBar } from "./stage/FocusStageHeaderBar";
import { FocusStageTaskSlot } from "./stage/FocusStageTaskSlot";
import { FocusStageTimerCircle } from "./stage/FocusStageTimerCircle";
import { FocusTimerActionButtons } from "./stage/FocusTimerActionButtons";

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

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

function preloadFocusHeroModalChunks() {
  void import("./hero/FocusZenModeModal");
  void import("./stage/FocusStageTargetSelectorModal");
  void import("@/utils/focusPip");
}

interface FocusHeroStageProps {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  todayRewardableMinutes?: number;
  initialIsPremium?: boolean;
  onSelectActivity?: (activityId: string | null) => void;
  onStartFocusActivity?: (act: FocusActivity) => void;
  onStartFocusItem?: (item: InventoryItemResponseDTO) => void;
  onStartFocusTask?: (task: { id: string; title: string }) => void;
  onConsumeBackpackItem?: (item: InventoryItemResponseDTO) => void;
  onChangeMode?: (mode: FocusRecordType) => void;
  onOpenUpgradeModal?: () => void;
  onCreateActivity?: () => void;
  initialLinkActivity?: boolean;
}

export function FocusHeroStage({
  activities,
  backpackItems,
  focusableTasks = [],
  todayRewardableMinutes,
  initialIsPremium = false,
  onSelectActivity,
  onStartFocusActivity,
  onStartFocusItem,
  onStartFocusTask,
  onConsumeBackpackItem,
  onChangeMode: propOnChangeMode,
  onOpenUpgradeModal,
  onCreateActivity,
  initialLinkActivity = false,
}: FocusHeroStageProps) {
  const t = useTranslations("focus.hero");
  const controls = useFocusTimerControls();
  const isPremium = useResolvedIsPremium(initialIsPremium);
  const hasHandledInitialLinkRef = useRef(false);
  useIdlePreload(preloadFocusHeroModalChunks);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetModalInitialTab, setTargetModalInitialTab] = useState<
    "ACTIVITIES" | "TASKS" | "BACKPACK"
  >("ACTIVITIES");
  const [isLinkActivityOnlyModal, setIsLinkActivityOnlyModal] = useState(false);
  const [isLinkTaskOnlyModal, setIsLinkTaskOnlyModal] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isZenDimmed, setIsZenDimmed] = useState(false);
  const [resetConfirmSeconds, setResetConfirmSeconds] = useState<number | null>(
    null,
  );

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
    isOvertime,
    isSavingSession = false,
    isCompletingLinkedTask = false,
    isSessionRewardCapped = false,
    nextBreakMinutes,
    toggleTimer,
    resetTimer,
    skipBreak,
    startBreak,
    completeSession,
    changeDuration,
  } = controls;

  const handleChangeMode = propOnChangeMode ?? controls.changeMode;
  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isInventoryItem = target?.type === "inventory";
  const TargetIcon = resolveFocusTargetIcon(target);

  const targetActivityIndex =
    target?.type === "activity"
      ? activities.findIndex((a) => a.id === target.id)
      : -1;
  const isTargetLocked =
    !isPremium && targetActivityIndex >= MAX_FOCUS_ACTIVITIES_FREE;

  const handleRequestResetTimer = useCallback(() => {
    const elapsed = useFocusTimerStore.getState().elapsedSeconds;
    if (!isBreak && elapsed >= 60) {
      setResetConfirmSeconds(elapsed);
      return;
    }
    resetTimer();
  }, [isBreak, resetTimer]);

  const handleConfirmResetTimer = useCallback(() => {
    setResetConfirmSeconds(null);
    resetTimer();
  }, [resetTimer]);

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

  const handleCloseZenMode = useCallback(() => {
    setIsZenModeOpen(false);
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
    if (!initialLinkActivity || hasHandledInitialLinkRef.current) return;
    hasHandledInitialLinkRef.current = true;
    const currentTargetType =
      useFocusTimerStore.getState().target?.type ?? target?.type;
    if (currentTargetType === "task") {
      handleOpenLinkActivityModal();
    }
    removeBrowserQueryParam("linkActivity");
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
    if (isTargetLocked && !isRunning) {
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
    isRunning,
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

  const handleStartBreak = useCallback(async () => {
    if (!target) {
      setIsTargetModalOpen(true);
      return;
    }
    await startBreak();
  }, [target, startBreak]);

  // Atalhos globais do palco (desligados enquanto Modo Zen gerencia os seus próprios)
  useFocusKeyboardShortcuts({
    enabled: !isZenModeOpen,
    onToggleTimer: handleToggleTimer,
    onToggleZenMode: handleOpenZenMode,
  });

  return (
    <>
      <section
        aria-label={t("sectionAria")}
        className={cn(
          "group/hero relative w-full shrink-0 min-h-fit rounded-2xl border transition-colors duration-200 select-none z-20 p-4 sm:p-5",
          isBreak
            ? "border-emerald-500/40 bg-linear-to-b from-emerald-500/10 dark:from-emerald-950/30 via-card/90 dark:via-card/85 to-card/80 dark:to-card/65 shadow-sm dark:shadow-[0_4px_24px_rgba(16,185,129,0.12)] hover:border-emerald-500/60 dark:hover:shadow-[0_8px_32px_rgba(16,185,129,0.2)]"
            : isRunning
              ? "border-gold/60 bg-linear-to-b from-gold/10 via-card/85 to-card/65 shadow-glow-gold-xs hover:border-gold/80 hover:shadow-glow-gold-md"
              : "border-neutral-700 dark:border-primary/30 bg-linear-to-br from-primary/[0.06] via-card to-amber-500/[0.03] dark:bg-none dark:bg-card/85 shadow-xs dark:shadow-none hover:border-gold/50 hover:shadow-[0_8px_32px_rgba(234,179,8,0.12)]",
        )}
      >
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
                  : "bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-primary)_32%,transparent)_0%,transparent_70%)]",
            )}
          />
        </div>

        {/* 1. Header do Palco: Alvo Ativo + Switcher + Áudio Unificado + Configs + PiP + Zen */}
        <FocusStageHeaderBar
          target={target}
          TargetIcon={TargetIcon}
          phase={phase}
          mode={mode}
          totalDurationSeconds={totalDurationSeconds}
          isBreak={isBreak}
          isOvertime={isOvertime}
          isRunning={isRunning}
          isActive={isActive}
          isInventoryItem={isInventoryItem}
          isTargetLocked={isTargetLocked}
          initialIsPremium={isPremium}
          hideAudioControls={isZenModeOpen}
          onOpenTargetModal={handleOpenTargetModal}
          onChangeMode={handleChangeMode}
          onOpenZenMode={handleOpenZenMode}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />

        {/* 2. Corpo do Palco: Círculo Protagonista + Controles */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 my-1 sm:my-2">
          <div className="shrink-0 flex flex-col items-center justify-center gap-1.5">
            {/* Evita manter um 2º anel SVG 1Hz renderizando por baixo do Modo Zen em tela cheia */}
            {isZenModeOpen ? (
              <div
                aria-hidden="true"
                className="w-48 h-48 sm:w-52 sm:h-52 shrink-0"
              />
            ) : (
              <FocusStageTimerCircle size="md" onToggle={handleToggleTimer} />
            )}
            <FocusSessionCapBadge visible={isSessionRewardCapped} size="sm" />
            {typeof todayRewardableMinutes === "number" && !isInventoryItem && (
              <FocusDailyYieldBadge
                todayRewardableMinutes={todayRewardableMinutes}
              />
            )}
          </div>

          <div className="flex flex-col items-stretch justify-center gap-2.5 flex-1 min-w-0 w-full max-w-md lg:max-w-xl">
            <FocusTimerActionButtons
              variant="stage"
              isActive={isActive}
              isPaused={isPaused}
              isRunning={isRunning}
              isBreak={isBreak}
              isOvertime={isOvertime}
              canComplete={canComplete}
              isPartialPomo={isPartialPomo}
              isSavingSession={isSavingSession}
              isTargetLocked={isTargetLocked}
              nextBreakMinutes={nextBreakMinutes}
              onToggleTimer={handleToggleTimer}
              onStartBreak={handleStartBreak}
              onComplete={handleComplete}
              onSkipBreak={skipBreak}
              onResetTimer={handleRequestResetTimer}
              onOpenUpgradeModal={onOpenUpgradeModal}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 items-center w-full">
              {Boolean(target) && !isInventoryItem && (
                <FocusStageTaskSlot
                  target={target}
                  isSessionIdle={!isActive && !controls.hasElapsedSeconds}
                  isCompletingLinkedTask={isCompletingLinkedTask}
                  onOpenLinkTask={handleOpenLinkTaskModal}
                  onOpenLinkActivity={handleOpenLinkActivityModal}
                  onCompleteLinkedTask={controls.completeLinkedTask}
                  onUnlinkTask={controls.unlinkTaskFromTarget}
                />
              )}

              <div
                className={
                  !target || isInventoryItem ? "lg:col-span-2" : undefined
                }
              >
                <FocusSessionNotesField variant="stage" />
              </div>
            </div>

            {mode === "POMO" && !isInventoryItem && !isActive && (
              <div className="w-full flex items-center justify-center sm:justify-start pt-0.5">
                <FocusDurationPresets
                  totalDurationSeconds={totalDurationSeconds}
                  onChangeDuration={changeDuration}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modo Zen (Carregado sob demanda) */}
      {isZenModeOpen && (
        <FocusZenModeModal
          isOpen={isZenModeOpen}
          onClose={handleCloseZenMode}
          todayRewardableMinutes={todayRewardableMinutes}
          isTargetLocked={isTargetLocked}
          initialIsPremium={isPremium}
          onToggleTimer={handleToggleTimer}
          onResetTimer={handleRequestResetTimer}
          onStartBreak={handleStartBreak}
          onComplete={handleComplete}
          onOpenUpgradeModal={onOpenUpgradeModal}
          onDimmedChange={setIsZenDimmed}
        />
      )}

      {/* Modal para Trocar ou Selecionar Alvo */}
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
          initialIsPremium={isPremium}
          onlyActivities={isLinkActivityOnlyModal}
          onlyTasks={isLinkTaskOnlyModal}
          onSelectActivity={handleSelectActivity}
          onLinkActivityToTask={handleLinkActivityToTask}
          onSelectBackpackItem={handleSelectBackpackItem}
          onConsumeBackpackItem={onConsumeBackpackItem}
          onSelectTask={handleSelectTask}
          onUnlinkTask={controls.unlinkTaskFromTarget}
          onOpenUpgradeModal={onOpenUpgradeModal}
          onCreateActivity={onCreateActivity}
        />
      )}

      {/* Confirmação de Reset (herda `.zen-dimmed-dark` se aberto sobre Modo Zen escurecido) */}
      {resetConfirmSeconds !== null && (
        <ConfirmationModal
          isOpen={resetConfirmSeconds !== null}
          onClose={() => setResetConfirmSeconds(null)}
          onConfirm={handleConfirmResetTimer}
          variant="warning"
          containerClassName={
            isZenModeOpen && isZenDimmed ? "zen-dimmed-dark" : undefined
          }
          title={t("resetConfirm.title")}
          description={t("resetConfirm.description", {
            elapsed: formatDurationMinSec(resetConfirmSeconds),
          })}
          confirmText={t("resetConfirm.confirm")}
          cancelText={t("resetConfirm.cancel")}
        />
      )}
    </>
  );
}
