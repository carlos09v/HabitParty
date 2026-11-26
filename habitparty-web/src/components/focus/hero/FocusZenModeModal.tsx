"use client";

import {
  CheckCircle2,
  ChevronUp,
  ListTodo,
  Loader2,
  Minimize2,
  Moon,
  PictureInPicture2,
  Sparkles,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusKeyboardShortcuts } from "@/hooks/useFocusKeyboardShortcuts";
import { useFocusPipAction } from "@/hooks/useFocusPipAction";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useIsClient } from "@/hooks/useIsClient";
import { useNativeModalDialog } from "@/hooks/useNativeModalDialog";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { resolveLinkedTask } from "@/utils/focusFormatters";
import { resolveFocusTargetIcon } from "@/utils/focusIcons";
import { FocusDailyYieldBadge } from "../stage/FocusDailyYieldBadge";
import { FocusSessionCapBadge } from "../stage/FocusSessionCapBadge";
import { FocusSessionNotesField } from "../stage/FocusSessionNotesField";
import { FocusStageAudioControls } from "../stage/FocusStageAudioControls";
import { FocusStageTimerCircle } from "../stage/FocusStageTimerCircle";
import { FocusTimerActionButtons } from "../stage/FocusTimerActionButtons";

interface FocusZenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayRewardableMinutes?: number;
  isTargetLocked?: boolean;
  initialIsPremium?: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onStartBreak: () => void;
  onComplete: () => void;
  onOpenUpgradeModal?: () => void;
  onDimmedChange?: (dimmed: boolean) => void;
}

/**
 * Modo Zen em tela cheia para foco imersivo sem distrações.
 * Lê controles diretamente do timer store (eliminando 20+ props), usa `<dialog>` nativo
 * com `open:flex`, suporta recolher anotações e mantém contraste seguro em telas touch.
 */
export function FocusZenModeModal({
  isOpen,
  onClose,
  todayRewardableMinutes,
  isTargetLocked = false,
  initialIsPremium = false,
  onToggleTimer,
  onResetTimer,
  onStartBreak,
  onComplete,
  onOpenUpgradeModal,
  onDimmedChange,
}: FocusZenModeModalProps) {
  const t = useTranslations("focus.zenMode");
  const { isGamified } = useExperienceMode();
  const { isLight } = useThemeMode();
  const mounted = useIsClient();
  const { isPipOpen, isPipSupported, togglePip } = useFocusPipAction();
  const controls = useFocusTimerControls();
  const hasSessionNotes = useFocusTimerStore(
    (s) => s.sessionNotes.trim().length > 0,
  );

  const [isLightsOff, setIsLightsOff] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const {
    isActive,
    isPaused,
    isRunning,
    mode,
    phase = "WORK",
    target,
    canComplete,
    isPartialPomo,
    isOvertime,
    isSavingSession = false,
    isCompletingLinkedTask = false,
    isSessionRewardCapped = false,
    nextBreakMinutes,
    skipBreak,
    completeLinkedTask,
  } = controls;

  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isInventoryTarget = target?.type === "inventory";
  const TargetIcon = resolveFocusTargetIcon(target);
  const { taskId: linkedTaskId, taskName: linkedTaskTitle } =
    resolveLinkedTask(target);

  const isDimmed = isLight && isLightsOff;

  useEffect(() => {
    onDimmedChange?.(isOpen && isDimmed);
    return () => {
      onDimmedChange?.(false);
    };
  }, [isOpen, isDimmed, onDimmedChange]);

  const { dialogRef, dialogEventHandlers } = useNativeModalDialog({
    isOpen: isOpen && mounted,
    onClose,
  });

  useFocusKeyboardShortcuts({
    enabled: isOpen && mounted,
    ownDialogRef: dialogRef,
    onToggleTimer,
    onToggleZenMode: onClose,
  });

  if (!isOpen || !mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={t("dialogAria")}
      onCancel={dialogEventHandlers.onCancel}
      onKeyDown={dialogEventHandlers.onKeyDown}
      className={cn(
        "hp-dialog-modal fixed inset-0 w-screen h-dvh open:flex flex-col justify-between p-4 sm:p-10 md:p-12 overflow-y-auto overscroll-contain custom-scrollbar select-none animate-in fade-in duration-200 transition-colors",
        isDimmed
          ? "zen-dimmed-dark bg-background"
          : "bg-surface dark:bg-background",
      )}
    >
      {/* Fundo Cósmico / Santuário Difuso */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-1000",
          isBreak
            ? "bg-[radial-gradient(ellipse_at_center,_rgba(20,122,56,0.10)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,_rgba(245,184,21,0.12)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.10)_0%,_transparent_70%)]",
        )}
      />

      {/* Top Bar Zen (opacidade 100% em touch/tablet, sutil somente em ponteiro fino) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 w-full max-w-4xl mx-auto opacity-100 pointer-fine:opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0",
              isBreak
                ? "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/45 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/15 dark:bg-gold/20 border-amber-500/45 dark:border-gold/50 text-gold-ink dark:text-gold",
            )}
          >
            <TargetIcon size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-neutral-100 text-body-m truncate">
              {target?.name || t("defaultTitle")}
            </h1>
            <span className="text-tiny text-neutral-400 truncate">
              {isBreak
                ? t("restorativeBreak")
                : isInventoryTarget
                  ? isGamified
                    ? t("backpackCouponGamified")
                    : t("backpackCouponProductivity")
                  : mode === "POMO"
                    ? t("pomodoroCycle")
                    : t("stopwatch")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <span className="text-tiny text-neutral-400 hidden md:inline">
            {t.rich("pressEscHint", {
              kbd: (chunks) => (
                <kbd className="px-1.5 py-0.5 rounded bg-card/80 dark:bg-surface border border-neutral-700 text-neutral-300">
                  {chunks}
                </kbd>
              ),
            })}
          </span>

          {isLight && (
            <button
              type="button"
              onClick={() => setIsLightsOff((prev) => !prev)}
              aria-pressed={isLightsOff}
              aria-label={
                isLightsOff ? t("lightsOnButton") : t("lightsOffButton")
              }
              title={isLightsOff ? t("lightsOnTitle") : t("lightsOffTitle")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
                isLightsOff
                  ? "border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                  : "border-neutral-700 bg-card/80 text-neutral-300 hover:text-neutral-50 hover:border-neutral-500 shadow-2xs",
              )}
            >
              {isLightsOff ? (
                <Sun size={15} aria-hidden="true" />
              ) : (
                <Moon size={15} aria-hidden="true" />
              )}
              <span className="hidden min-[380px]:inline">
                {isLightsOff ? t("lightsOnButton") : t("lightsOffButton")}
              </span>
            </button>
          )}

          {isPipSupported && (
            <button
              type="button"
              onClick={() => void togglePip()}
              aria-pressed={isPipOpen}
              aria-label={t("pipButton")}
              title={isPipOpen ? t("pipCloseTitle") : t("pipOpenTitle")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
                isPipOpen
                  ? "border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                  : "border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-neutral-50 dark:hover:text-white hover:border-neutral-500",
              )}
            >
              <PictureInPicture2 size={15} aria-hidden="true" />
              <span className="hidden min-[380px]:inline">
                {t("pipButton")}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-neutral-50 dark:hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
            title={t("exitTitle")}
            aria-label={t("exitTitle")}
          >
            <Minimize2 size={16} aria-hidden="true" />
            <span className="text-xs font-semibold">{t("exitButton")}</span>
          </button>
        </div>
      </div>

      {/* Centro Zen: Timer Gigante + Tarefa Vinculada + Controles */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4 w-full">
        <FocusStageTimerCircle size="zen" onToggle={onToggleTimer} />

        {/* Pill da tarefa vinculada (Macro + Micro) no Modo Zen */}
        {linkedTaskId && linkedTaskTitle && (
          <div className="mt-4 flex items-center gap-2 max-w-md px-3 py-1.5 rounded-xl bg-card/80 dark:bg-surface/80 border border-neutral-700 dark:border-primary/30 shadow-xs">
            <ListTodo
              size={13}
              aria-hidden="true"
              className="text-amber-700 dark:text-gold shrink-0"
            />
            <span className="text-xs font-semibold text-neutral-100 truncate">
              {linkedTaskTitle}
            </span>
            <button
              type="button"
              disabled={isCompletingLinkedTask}
              aria-busy={isCompletingLinkedTask}
              onClick={() =>
                void completeLinkedTask(linkedTaskId, linkedTaskTitle)
              }
              className="inline-flex items-center gap-1 min-h-7 px-1.5 rounded-md text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 hover:underline shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isCompletingLinkedTask ? (
                <Loader2
                  size={12}
                  aria-hidden="true"
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2 size={12} aria-hidden="true" />
              )}
              <span>{t("completeLinkedTaskButton")}</span>
            </button>
          </div>
        )}

        <FocusSessionCapBadge
          visible={isSessionRewardCapped}
          size="md"
          className="mt-4"
        />

        {typeof todayRewardableMinutes === "number" && !isInventoryTarget && (
          <FocusDailyYieldBadge
            todayRewardableMinutes={todayRewardableMinutes}
            size="md"
            className="mt-2"
          />
        )}

        <FocusTimerActionButtons
          variant="zen"
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
          onToggleTimer={onToggleTimer}
          onStartBreak={onStartBreak}
          onComplete={onComplete}
          onSkipBreak={skipBreak}
          onResetTimer={onResetTimer}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      </div>

      {/* Rodapé Zen: Notas Retráteis (expandir + recolher + indicador) + Áudio Unificado */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto pt-4 opacity-100 pointer-fine:opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        {showNotes ? (
          <div className="w-full flex items-center gap-1.5">
            <FocusSessionNotesField variant="zen" className="flex-1 min-w-0" />
            <button
              type="button"
              onClick={() => setShowNotes(false)}
              title={t("hideNotesButton")}
              aria-label={t("hideNotesButton")}
              className="min-w-9 min-h-9 rounded-xl border border-neutral-700 dark:border-primary/35 bg-card/85 dark:bg-surface/80 text-neutral-400 hover:text-neutral-100 hover:border-gold/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <ChevronUp size={15} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            aria-expanded={false}
            className="inline-flex items-center gap-1.5 min-h-8 pointer-coarse:min-h-9 px-3 py-1 rounded-full border border-neutral-700 dark:border-primary/30 bg-card/70 dark:bg-surface/60 text-xs font-semibold text-neutral-300 hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/45 dark:hover:border-gold/40 transition-colors cursor-pointer"
          >
            <Sparkles
              size={12}
              className="text-amber-700 dark:text-gold"
              aria-hidden="true"
            />
            <span>{t("toggleNotesButton")}</span>
            {hasSessionNotes && (
              <>
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-amber-600 dark:bg-gold shrink-0"
                  title={t("hasNotesIndicatorAria")}
                />
                <span className="sr-only"> ({t("hasNotesIndicatorAria")})</span>
              </>
            )}
          </button>
        )}

        <FocusStageAudioControls
          initialIsPremium={initialIsPremium}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      </div>
    </dialog>,
    document.body,
  );
}
