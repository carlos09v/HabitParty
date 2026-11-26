"use client";

import {
  Check,
  Coffee,
  FastForward,
  Link2,
  Loader2,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  type MouseEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { listFocusActivities } from "@/actions/focusActions";
import type { ActionState } from "@/actions/types";
import { AMBIENT_ICONS } from "@/constants/settings";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusPipAction } from "@/hooks/useFocusPipAction";
import { useFocusTimerActions } from "@/hooks/useFocusTimer";
import {
  clearAmbientPausedByTimer,
  stopAmbientAudio,
  syncAmbientOnMount,
  useFocusAmbientSyncStore,
} from "@/store/focus/focusAmbientSync";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import type { FocusActivity } from "@/types/focus";
import { cn } from "@/utils";
import {
  canCompleteFocusSession,
  formatDurationMinSec,
  formatFocusDisplayTime,
  isFocusOvertime,
  isPartialPomoSession,
} from "@/utils/focusFormatters";
import { resolveFocusTargetIcon } from "@/utils/focusIcons";

const SidebarFocusTimerClock = memo(function SidebarFocusTimerClock({
  isBreak,
  isOvertime,
  isRunning,
}: {
  isBreak: boolean;
  isOvertime: boolean;
  isRunning: boolean;
}) {
  const mode = useFocusTimerStore((s) => s.mode);
  const phase = useFocusTimerStore((s) => s.phase);
  const secondsRemaining = useFocusTimerStore((s) => s.secondsRemaining);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);
  const totalDurationSeconds = useFocusTimerStore(
    (s) => s.totalDurationSeconds,
  );
  const target = useFocusTimerStore((s) => s.target);

  const displayTime = formatFocusDisplayTime({
    mode,
    phase,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    target,
  });

  return (
    <span
      role="timer"
      aria-live="off"
      className={cn(
        "font-mono font-black text-xs tracking-tight tabular-nums transition-colors",
        isBreak
          ? "text-emerald-700 dark:text-emerald-300"
          : isOvertime
            ? "text-cyan-600 dark:text-cyan-300"
            : isRunning
              ? "text-amber-700 dark:text-gold"
              : "text-neutral-200",
      )}
    >
      {displayTime}
    </span>
  );
});

const FocusStageTargetSelectorModal = dynamic(
  () =>
    import("@/components/focus/stage/FocusStageTargetSelectorModal").then(
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

const ACTION_BTN_SIZE =
  "min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-md flex items-center justify-center border transition-colors cursor-pointer shadow-xs";

export interface SidebarFocusWidgetBodyProps {
  onNavigate?: () => void;
}

export function SidebarFocusWidgetBody({
  onNavigate,
}: SidebarFocusWidgetBodyProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("focusWidget");
  const { isGamified } = useExperienceMode();
  const { isPipOpen, isPipSupported, togglePip } = useFocusPipAction();

  // Ações estáticas no nível do módulo (0 seletores de função reavaliados a 1Hz)
  const {
    toggleTimer,
    stopFromWidget,
    skipBreak,
    startBreak,
    completeSession,
    linkActivityToTask,
  } = useFocusTimerActions();

  // Estados do Timer (apenas fatias de baixa frequência)
  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const mode = useFocusTimerStore((s) => s.mode);
  const phase = useFocusTimerStore((s) => s.phase);
  const hasElapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds > 0);
  const canCompleteSession = useFocusTimerStore((s) =>
    canCompleteFocusSession(s),
  );
  const isPartialPomo = useFocusTimerStore((s) => isPartialPomoSession(s));
  const isOvertime = useFocusTimerStore((s) => isFocusOvertime(s));
  const target = useFocusTimerStore((s) => s.target);
  const isSavingSession = useFocusTimerStore((s) => s.isSavingSession);

  // Estados de Som Ambiente
  const ambientSoundType = useSoundPreferencesStore((s) => s.ambientSoundType);
  const isAmbientPlaying = useSoundPreferencesStore((s) => s.isAmbientPlaying);
  const isAmbientPausedByTimer = useFocusAmbientSyncStore(
    (s) => s.isPausedByTimer,
  );
  const isAmbientAudioActive = useFocusAmbientSyncStore((s) => s.isAudioActive);

  // Modal sob demanda de vinculação de atividade (sem fetch nem download antecipado)
  const [activities, setActivities] = useState<FocusActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLinkActivityModalOpen, setIsLinkActivityModalOpen] = useState(false);
  const [resetConfirmSeconds, setResetConfirmSeconds] = useState<number | null>(
    null,
  );
  const fetchActivitiesPromiseRef = useRef<Promise<
    ActionState<FocusActivity[]>
  > | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedActivitiesRef = useRef(false);

  const hasActiveTimer = (isActive || hasElapsedSeconds) && Boolean(target);
  const hasActiveAmbient =
    isAmbientPlaying &&
    !isAmbientPausedByTimer &&
    isAmbientAudioActive &&
    ambientSoundType !== "none";

  useEffect(() => {
    isMountedRef.current = true;
    syncAmbientOnMount({
      isPremium: false,
      restoreAmbient: false,
      timerState: useFocusTimerStore.getState(),
    });
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFocusActivities = useCallback(
    async ({ showErrorToast = false }: { showErrorToast?: boolean } = {}) => {
      if (!hasLoadedActivitiesRef.current && isMountedRef.current) {
        setIsLoadingActivities(true);
      }

      if (!fetchActivitiesPromiseRef.current) {
        fetchActivitiesPromiseRef.current = listFocusActivities().finally(
          () => {
            fetchActivitiesPromiseRef.current = null;
          },
        );
      }

      try {
        const res = await fetchActivitiesPromiseRef.current;
        if (!isMountedRef.current) return;

        if (res.success) {
          hasLoadedActivitiesRef.current = true;
          setActivities(res.data ?? []);
        } else if (showErrorToast) {
          toast.error(res.error || t("loadActivitiesError"));
        }
      } catch {
        if (isMountedRef.current && showErrorToast) {
          toast.error(t("loadActivitiesError"));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoadingActivities(false);
        }
      }
    },
    [t],
  );

  const handleOpenLinkActivityModal = () => {
    setIsLinkActivityModalOpen(true);
    void loadFocusActivities({ showErrorToast: true });
  };

  const modals = (
    <>
      {isLinkActivityModalOpen && (
        <FocusStageTargetSelectorModal
          isOpen={isLinkActivityModalOpen}
          onClose={() => setIsLinkActivityModalOpen(false)}
          activities={activities}
          backpackItems={[]}
          currentTargetId={target?.id}
          currentTarget={target}
          onlyActivities={true}
          isLoadingActivities={isLoadingActivities && activities.length === 0}
          onLinkActivityToTask={(activity) => {
            linkActivityToTask(activity);
            setIsLinkActivityModalOpen(false);
          }}
          onOpenUpgradeModal={() => {
            setIsLinkActivityModalOpen(false);
            useUIStore.getState().openUpgradeModal();
          }}
          onCreateActivity={() => {
            setIsLinkActivityModalOpen(false);
            onNavigate?.();
            router.push("/focus?createActivity=true");
          }}
        />
      )}
      {resetConfirmSeconds !== null && (
        <ConfirmationModal
          isOpen={resetConfirmSeconds !== null}
          onClose={() => setResetConfirmSeconds(null)}
          onConfirm={() => {
            setResetConfirmSeconds(null);
            stopFromWidget();
          }}
          variant="warning"
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

  const handleStopAmbient = (e: MouseEvent) => {
    e.stopPropagation();
    stopAmbientAudio();
    clearAmbientPausedByTimer();
    const soundStore = useSoundPreferencesStore.getState();
    soundStore.setAmbientSoundType("none");
    soundStore.setIsAmbientPlaying(false);
  };

  const handleRequestStopFromWidget = (e: MouseEvent) => {
    e.stopPropagation();
    const state = useFocusTimerStore.getState();
    const isCurrentBreak =
      state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
    if (!isCurrentBreak && state.elapsedSeconds >= 60) {
      setResetConfirmSeconds(state.elapsedSeconds);
      return;
    }
    stopFromWidget();
  };

  const handleCardClick = () => {
    const source =
      pathname === "/dashboard" ||
      pathname === "/tasks" ||
      pathname === "/inventory"
        ? pathname.slice(1)
        : null;
    onNavigate?.();
    router.push(source ? `/focus?from=${source}` : "/focus");
  };

  const AmbientIcon = AMBIENT_ICONS[ambientSoundType] || Volume2;
  const ambientLabel =
    ambientSoundType === "rain" ||
    ambientSoundType === "cafe" ||
    ambientSoundType === "fire" ||
    ambientSoundType === "lofi" ||
    ambientSoundType === "none"
      ? t(`ambientSounds.${ambientSoundType}`)
      : t("ambientSounds.default");

  // CASO 1: Apenas Som Ambiente Ativo (sem timer)
  if (!hasActiveTimer && hasActiveAmbient) {
    return (
      <>
        <article className="group relative flex flex-col gap-1.5 p-2 rounded-lg border border-gold/60 bg-gold/10 hover:border-gold hover:bg-gold/15 transition-colors cursor-pointer select-none text-left shadow-glow-gold-xs mb-2.5">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <button
              type="button"
              onClick={handleCardClick}
              title={t("activeAmbientTitle")}
              aria-label={t("activeAmbientAria")}
              className="flex items-center gap-1.5 min-w-0 flex-1 text-left rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 before:content-[''] before:absolute before:inset-0 before:rounded-lg"
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border border-gold/50 bg-gold/20 text-amber-800 dark:text-gold motion-safe:animate-pulse">
                <AmbientIcon size={12} aria-hidden="true" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-gold transition-colors truncate">
                  {ambientLabel}
                </span>
                <span className="text-[11px] text-amber-800 dark:text-gold/90 font-medium leading-tight">
                  {t("activeFocusSound")}
                </span>
              </div>
            </button>

            <div className="relative z-10 flex items-center gap-1 shrink-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider bg-amber-500/15 dark:bg-gold/20 text-amber-800 dark:text-gold border border-amber-500/35 dark:border-gold/40">
                VIP
              </span>
              <button
                type="button"
                onClick={handleStopAmbient}
                title={t("turnOffAmbient")}
                aria-label={t("turnOffAmbient")}
                className={cn(
                  ACTION_BTN_SIZE,
                  "border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10",
                )}
              >
                <VolumeX size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
        {modals}
      </>
    );
  }

  if (!hasActiveTimer) {
    return isLinkActivityModalOpen || resetConfirmSeconds !== null
      ? modals
      : null;
  }

  // CASO 2: Timer Ativo (suporta Trabalho, Excedente e Pausa)
  const isRunning = isActive && !isPaused;
  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isInventory = target?.type === "inventory";
  const TargetIcon = resolveFocusTargetIcon(target);

  return (
    <>
      <article
        className={cn(
          "group relative flex flex-col gap-1.5 p-2 rounded-lg border transition-colors cursor-pointer select-none text-left shadow-xs mb-2.5",
          isBreak
            ? "border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500/70 hover:bg-emerald-500/15"
            : isRunning
              ? "border-amber-500/60 bg-amber-500/10 hover:border-amber-500 hover:bg-amber-500/15 dark:border-gold/70 dark:bg-gold/10 dark:hover:border-gold dark:hover:bg-gold/15 shadow-glow-gold-xs"
              : "border-primary/25 bg-surface/70 hover:border-primary/45 hover:bg-surface/90 dark:border-primary/40 dark:hover:border-gold/40",
        )}
      >
        {/* Linha Superior: Ícone, Nome e Badge */}
        <button
          type="button"
          onClick={handleCardClick}
          title={t("activeSessionTitle")}
          aria-label={t("activeSessionAria")}
          className="flex items-center justify-between gap-1.5 min-w-0 w-full text-left rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 before:content-[''] before:absolute before:inset-0 before:rounded-lg"
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors",
                isBreak
                  ? "bg-emerald-500/15 border-emerald-500/45 text-emerald-700 dark:text-emerald-300"
                  : isRunning
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:bg-gold/20 dark:border-gold/50 dark:text-gold motion-safe:animate-pulse"
                    : "bg-primary-dark/40 border-primary/30 text-neutral-300",
              )}
            >
              <TargetIcon size={12} aria-hidden="true" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-neutral-100 group-hover:text-primary dark:group-hover:text-gold transition-colors truncate">
                {target?.name || t("defaultModeName")}
              </span>
              {target?.type === "activity" && target.taskName && (
                <span className="text-[11px] text-neutral-400 truncate leading-tight">
                  {target.taskName}
                </span>
              )}
            </div>
          </div>

          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 uppercase tracking-wider border",
              isBreak
                ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/35 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40"
                : isInventory
                  ? "bg-amber-500/15 text-amber-800 border-amber-500/35 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                  : mode === "POMO"
                    ? "bg-amber-500/15 text-amber-800 border-amber-500/35 dark:bg-gold/20 dark:text-gold dark:border-gold/40"
                    : "bg-surface border-neutral-600 dark:border-primary/40 text-neutral-300",
            )}
          >
            {isBreak
              ? t("pip.phaseBreak")
              : isInventory
                ? isGamified
                  ? t("modeBackpack")
                  : t("modeInventory")
                : mode === "POMO"
                  ? t("modePomodoro")
                  : t("modeStopwatch")}
          </span>
        </button>

        {/* Badge clicável para vincular atividade quando o foco foi iniciado direto pela tarefa */}
        {target?.type === "task" && !isBreak && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenLinkActivityModal();
            }}
            title={t("linkActivityTitle")}
            className="relative z-10 inline-flex items-center gap-1 self-start max-w-full min-h-6 px-2 py-0.5 rounded-md border border-primary/35 bg-primary/15 hover:bg-primary/25 text-primary dark:border-gold/40 dark:bg-gold/12 dark:hover:bg-gold/22 dark:text-gold text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Link2 size={11} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{t("linkActivityBadge")}</span>
          </button>
        )}

        {/* Linha Central: Mostrador do Tempo e Controles Rápidos (alvos ≥ 28px / 36px touch) */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5">
            <SidebarFocusTimerClock
              isBreak={isBreak}
              isOvertime={isOvertime}
              isRunning={isRunning}
            />
            {isRunning && (
              <span
                aria-hidden="true"
                className={cn(
                  "w-1.5 h-1.5 rounded-full inline-block shrink-0",
                  isBreak
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-amber-600 dark:bg-gold",
                )}
              />
            )}
          </div>

          <div className="relative z-10 flex items-center gap-1 shrink-0">
            {/* Play / Pause */}
            <button
              type="button"
              disabled={isSavingSession}
              onClick={(e) => {
                e.stopPropagation();
                toggleTimer();
              }}
              title={isRunning ? t("pauseTitle") : t("resumeTitle")}
              aria-label={isRunning ? t("pauseAria") : t("resumeAria")}
              className={cn(
                ACTION_BTN_SIZE,
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isBreak
                  ? "bg-emerald-500 text-neutral-950 border-emerald-500 hover:bg-emerald-400"
                  : isRunning
                    ? "bg-gold text-on-gold border-gold hover:bg-gold-hover"
                    : "bg-surface hover:bg-primary/15 text-neutral-200 hover:text-primary border-neutral-600 dark:hover:bg-gold/20 dark:hover:text-gold dark:border-primary/30",
              )}
            >
              {isRunning ? (
                <Pause size={12} aria-hidden="true" className="fill-current" />
              ) : (
                <Play
                  size={12}
                  aria-hidden="true"
                  className="fill-current ml-0.5"
                />
              )}
            </button>

            {/* Pular Pausa (quando em fase de pausa) */}
            {isBreak && (
              <button
                type="button"
                disabled={isSavingSession}
                onClick={(e) => {
                  e.stopPropagation();
                  skipBreak();
                }}
                title={t("pip.skipBreak")}
                aria-label={t("pip.skipBreak")}
                className={cn(
                  ACTION_BTN_SIZE,
                  "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <FastForward size={12} aria-hidden="true" />
              </button>
            )}

            {/* Iniciar Pausa (quando em tempo excedente) */}
            {isOvertime && !isBreak && (
              <button
                type="button"
                disabled={isSavingSession}
                aria-busy={isSavingSession}
                onClick={async (e) => {
                  e.stopPropagation();
                  await startBreak();
                }}
                title={
                  isSavingSession
                    ? t("savingSessionTitle")
                    : t("startBreakTitle")
                }
                aria-label={
                  isSavingSession
                    ? t("savingSessionTitle")
                    : t("startBreakAria")
                }
                className={cn(
                  ACTION_BTN_SIZE,
                  "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 hover:bg-cyan-500/25 hover:border-cyan-600 dark:border-cyan-400/45 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed",
                )}
              >
                {isSavingSession ? (
                  <Loader2
                    size={12}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Coffee size={12} aria-hidden="true" />
                )}
              </button>
            )}

            {/* Concluir / Salvar */}
            {canCompleteSession && !isBreak && (
              <button
                type="button"
                disabled={isSavingSession}
                aria-busy={isSavingSession}
                onClick={async (e) => {
                  e.stopPropagation();
                  await completeSession();
                }}
                title={
                  isSavingSession
                    ? t("savingSessionTitle")
                    : isPartialPomo
                      ? t("savePartialTitle")
                      : t("completeSaveTitle")
                }
                aria-label={
                  isSavingSession
                    ? t("savingSessionTitle")
                    : isPartialPomo
                      ? t("savePartialAria")
                      : t("completeSaveAria")
                }
                className={cn(
                  ACTION_BTN_SIZE,
                  "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 hover:border-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 dark:hover:border-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed",
                )}
              >
                {isSavingSession ? (
                  <Loader2
                    size={12}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Check
                    size={12}
                    aria-hidden="true"
                    className="stroke-[2.5]"
                  />
                )}
              </button>
            )}

            {/* Picture-in-Picture */}
            {isPipSupported && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void togglePip();
                }}
                aria-pressed={isPipOpen}
                title={isPipOpen ? t("pipCloseTitle") : t("pipOpenTitle")}
                aria-label={isPipOpen ? t("pipCloseTitle") : t("pipOpenTitle")}
                className={cn(
                  ACTION_BTN_SIZE,
                  isPipOpen
                    ? "bg-gold/20 text-amber-800 dark:text-gold border-gold/60"
                    : "bg-surface/80 text-neutral-300 border-primary/30 hover:text-amber-700 dark:hover:text-gold hover:border-gold/50",
                )}
              >
                <PictureInPicture2 size={12} aria-hidden="true" />
              </button>
            )}

            {/* Reset / Parar */}
            <button
              type="button"
              disabled={isSavingSession}
              onClick={handleRequestStopFromWidget}
              title={t("stopResetTitle")}
              aria-label={t("stopAria")}
              className={cn(
                ACTION_BTN_SIZE,
                "border-primary/30 bg-surface/80 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <RotateCcw size={11} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Linha Inferior Opcional: Som Ambiente Ativo Integrado com Mute Rápido */}
        {hasActiveAmbient && (
          <div className="flex items-center justify-between pt-1 border-t border-primary/20 text-tiny text-neutral-300">
            <div className="flex items-center gap-1 truncate min-w-0">
              <AmbientIcon
                size={11}
                aria-hidden="true"
                className="text-amber-700 dark:text-gold shrink-0 motion-safe:animate-pulse"
              />
              <span className="truncate text-amber-800 dark:text-gold/90">
                {ambientLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={handleStopAmbient}
              title={t("turnOffAmbient")}
              aria-label={t("turnOffAmbient")}
              className="relative z-10 inline-flex items-center gap-1 min-h-6 px-1.5 rounded text-[11px] font-medium text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
            >
              <VolumeX size={11} aria-hidden="true" />
              <span>{t("stopLabel")}</span>
            </button>
          </div>
        )}
      </article>
      {modals}
    </>
  );
}
