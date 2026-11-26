"use client";

import { BarChart2, Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ExperienceModeFallbackProvider,
  useExperienceMode,
} from "@/hooks/useExperienceMode";
import { useFocusRecordsState } from "@/hooks/useFocusRecordsState";
import { useFocusTargetController } from "@/hooks/useFocusTargetController";
import { useFocusTaskSync } from "@/hooks/useFocusTaskSync";
import { useFocusContainerTimerSlice } from "@/hooks/useFocusTimer";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import type { FocusInitialHistoryBundle } from "@/services/focusService";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils/cn";
import { FocusMain } from "./FocusMain";
import { FocusSidebarRight } from "./sidebar-right/FocusSidebarRight";
import { FocusSidebarRightSkeleton } from "./sidebar-right/FocusSidebarRightSkeleton";

const FocusManualRecordModal = dynamic(
  () =>
    import("./modals/FocusManualRecordModal").then(
      (mod) => mod.FocusManualRecordModal,
    ),
  { ssr: false },
);

const SwitchFocusTargetModal = dynamic(
  () =>
    import("./modals/SwitchFocusTargetModal").then(
      (mod) => mod.SwitchFocusTargetModal,
    ),
  { ssr: false },
);

function preloadFocusContainerModalChunks() {
  void import("./modals/FocusManualRecordModal");
  void import("./modals/SwitchFocusTargetModal");
}

interface SyncedTodayStats {
  todaySummary: { minutes: number; sessionsCount: number };
  todayRewardableMinutes: number;
  todayDurationByActivityId: Record<string, number>;
  allRecords: FocusRecord[];
}

interface RecordsMutationBridge {
  onRecordUpdated: (updated: FocusRecord) => void;
  onActivityDeleted: (activityId: string, deleteHistory: boolean) => void;
}

interface FocusSidebarStreamProps {
  historyBundlePromise: Promise<FocusInitialHistoryBundle>;
  initialActivities: FocusActivity[];
  initialAllInventoryItems: InventoryItemResponseDTO[];
  initialDailyFocusGoalMinutes: number | null;
  initialTimeZone: string | null;
  filterActivityId: string | null;
  className: string;
  onAddRecord: () => void;
  onOptionsClick: () => void;
  onEditRecord: (record: FocusRecord) => void;
  onClearSelectedActivity: () => void;
  onSyncTodayStats: (stats: SyncedTodayStats) => void;
  mutationBridgeRef: React.RefObject<RecordsMutationBridge>;
}

/**
 * Resolve `historyBundlePromise` dentro da fronteira `<Suspense>`, permitindo que o Palco de Foco
 * seja entregue imediatamente no primeiro chunk HTML enquanto a sidebar de histórico faz streaming.
 */
function FocusSidebarStreamSection({
  historyBundlePromise,
  initialActivities,
  initialAllInventoryItems,
  initialDailyFocusGoalMinutes,
  initialTimeZone,
  filterActivityId,
  className,
  onAddRecord,
  onOptionsClick,
  onEditRecord,
  onClearSelectedActivity,
  onSyncTodayStats,
  mutationBridgeRef,
}: FocusSidebarStreamProps) {
  const bundle = use(historyBundlePromise);

  const recordsState = useFocusRecordsState({
    initialActivities,
    initialAllInventoryItems,
    initialRecords: bundle.initialRecords,
    initialSummary: bundle.initialSummary,
    initialSummaryActivityId: bundle.initialSummaryActivityId,
    initialTotalRecordsCount: bundle.totalRecordsCount,
    initialHasMoreRecords: bundle.hasMoreRecords,
    initialLoadedRecordsPage: bundle.initialLoadedRecordsPage,
    initialRecordsPageSize: bundle.initialRecordsPageSize,
    initialTimeZone,
    selectedActivityId: filterActivityId,
  });

  const {
    weekOffset,
    handlePrevWeek,
    handleNextWeek,
    handleResetWeek,
    selectedActivity,
    recentRecords,
    metrics,
    weeklyDays,
    totalWeekMinutes,
    weekLabel,
    weekDateRange,
  } = recordsState.analytics;

  useEffect(() => {
    mutationBridgeRef.current = {
      onRecordUpdated: recordsState.handleRecordUpdated,
      onActivityDeleted: recordsState.handleActivityDeleted,
    };
  }, [
    mutationBridgeRef,
    recordsState.handleRecordUpdated,
    recordsState.handleActivityDeleted,
  ]);

  useEffect(() => {
    onSyncTodayStats({
      todaySummary: {
        minutes: metrics.todayFocusMinutes,
        sessionsCount: metrics.todayRecordsCount,
      },
      todayRewardableMinutes: recordsState.todayRewardableMinutes,
      todayDurationByActivityId: recordsState.todayDurationByActivityId,
      allRecords: recordsState.allRecords,
    });
  }, [
    onSyncTodayStats,
    metrics.todayFocusMinutes,
    metrics.todayRecordsCount,
    recordsState.todayRewardableMinutes,
    recordsState.todayDurationByActivityId,
    recordsState.allRecords,
  ]);

  return (
    <FocusSidebarRight
      metrics={metrics}
      todayProductiveMinutes={recordsState.todayProductiveMinutes}
      todayRewardableMinutes={recordsState.todayRewardableMinutes}
      dailyFocusGoalMinutes={initialDailyFocusGoalMinutes}
      weeklyDays={weeklyDays}
      totalWeekMinutes={totalWeekMinutes}
      recentRecords={recentRecords}
      totalRecordsCount={recordsState.displayedTotalRecordsCount}
      isPartialTotalWindow={recordsState.isPartialTotalWindow}
      hasMoreRecords={recordsState.hasMoreRecordsToShow}
      isLoadingMoreRecords={recordsState.isLoadingMoreRecords}
      onShowMoreRecords={recordsState.handleShowMoreRecords}
      weekOffset={weekOffset}
      weekLabel={weekLabel}
      weekDateRange={weekDateRange}
      onPrevWeek={handlePrevWeek}
      onNextWeek={handleNextWeek}
      onResetWeek={handleResetWeek}
      onAddRecord={onAddRecord}
      onOptionsClick={onOptionsClick}
      onEditRecord={onEditRecord}
      onDeleteRecord={recordsState.handleDeleteRecord}
      onRecordUpdated={recordsState.handleRecordUpdated}
      selectedActivityName={selectedActivity?.name}
      onClearSelectedActivity={onClearSelectedActivity}
      className={className}
    />
  );
}

interface FocusContainerProps {
  initialActivities: FocusActivity[];
  initialBackpackItems: InventoryItemResponseDTO[];
  initialAllInventoryItems?: InventoryItemResponseDTO[];
  historyBundlePromise: Promise<FocusInitialHistoryBundle>;
  initialFocusableTasks?: FocusableTaskItem[];
  initialSelectedActivityId?: string | null;
  initialSelectedItemId?: string | null;
  initialCreateActivity?: boolean;
  initialLinkActivity?: boolean;
  initialFromSource?: string | null;
  initialDailyFocusGoalMinutes?: number | null;
  initialTimeZone?: string | null;
  initialIsPremium?: boolean;
  initialExperienceMode?: ExperienceMode;
}

export function FocusContainer(props: FocusContainerProps) {
  return (
    <ExperienceModeFallbackProvider
      mode={props.initialExperienceMode ?? "PRODUCTIVITY"}
    >
      <FocusContainerContent {...props} />
    </ExperienceModeFallbackProvider>
  );
}

const EMPTY_DURATION_MAP: Record<string, number> = {};
const EMPTY_RECORDS: FocusRecord[] = [];

function FocusContainerContent({
  initialActivities,
  initialBackpackItems,
  initialAllInventoryItems = [],
  historyBundlePromise,
  initialFocusableTasks = [],
  initialSelectedActivityId = null,
  initialSelectedItemId = null,
  initialCreateActivity = false,
  initialLinkActivity = false,
  initialFromSource = null,
  initialDailyFocusGoalMinutes = null,
  initialTimeZone = null,
  initialIsPremium = false,
}: FocusContainerProps) {
  const t = useTranslations("focus.container");
  const { isGamified } = useExperienceMode();
  const router = useRouter();
  const isPremium = useUserStore((s) =>
    s.user ? s.is_Premium : initialIsPremium,
  );
  useIdlePreload(preloadFocusContainerModalChunks);

  const [focusableTasks, setFocusableTasks] = useState<FocusableTaskItem[]>(
    initialFocusableTasks,
  );

  useEffect(() => {
    setFocusableTasks(initialFocusableTasks);
  }, [initialFocusableTasks]);

  const handleTaskCompletedFromFocus = useCallback((taskId: string) => {
    setFocusableTasks((prev) => prev.filter((task) => task.id !== taskId));
  }, []);

  const handleTaskFocusRecordedFromFocus = useCallback(
    (taskId: string, durationMinutes: number, cycles: number) => {
      if (durationMinutes === 0 && cycles === 0) return;
      setFocusableTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                totalFocusMinutes: Math.max(
                  0,
                  (task.totalFocusMinutes ?? 0) + durationMinutes,
                ),
                focusCyclesCount: Math.max(
                  0,
                  (task.focusCyclesCount ?? 0) + cycles,
                ),
              }
            : task,
        ),
      );
    },
    [],
  );

  useFocusTaskSync({
    onTaskCompleted: handleTaskCompletedFromFocus,
    onFocusRecorded: handleTaskFocusRecordedFromFocus,
  });

  // Filtro explícito de métricas da sidebar direita (desacoplado da seleção de alvo no palco)
  const [filterActivityId, setFilterActivityId] = useState<string | null>(
    () => {
      if (!initialSelectedActivityId) return null;
      const actIndex = initialActivities.findIndex(
        (a) => a.id === initialSelectedActivityId,
      );
      if (actIndex === -1) return null;
      return initialSelectedActivityId;
    },
  );

  // Aba mobile ativa (< xl): "timer" para Timer & Sessão, "metrics" para Métricas & Histórico
  const [mobileTab, setMobileTab] = useState<"timer" | "metrics">("timer");
  const mobileTabRefs = useRef<
    Partial<Record<"timer" | "metrics", HTMLButtonElement | null>>
  >({});

  const handleMobileTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const order = ["timer", "metrics"] as const;
    const currentIdx = order.indexOf(mobileTab);
    let nextIdx = -1;
    if (e.key === "ArrowRight") {
      nextIdx = (currentIdx + 1) % order.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (currentIdx - 1 + order.length) % order.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = order.length - 1;
    }
    if (nextIdx === -1) return;
    e.preventDefault();
    const nextTab = order[nextIdx];
    setMobileTab(nextTab);
    mobileTabRefs.current[nextTab]?.focus();
  };

  // Estatísticas do dia espelhadas da seção streamed da sidebar para o Palco e Cards
  const [syncedStats, setSyncedStats] = useState<SyncedTodayStats>({
    todaySummary: { minutes: 0, sessionsCount: 0 },
    todayRewardableMinutes: 0,
    todayDurationByActivityId: EMPTY_DURATION_MAP,
    allRecords: EMPTY_RECORDS,
  });
  const mutationBridgeRef = useRef<RecordsMutationBridge>({
    onRecordUpdated: () => {},
    onActivityDeleted: () => {},
  });

  const handleSyncTodayStats = useCallback((stats: SyncedTodayStats) => {
    setSyncedStats(stats);
  }, []);

  const handleRecordUpdated = useCallback((updated: FocusRecord) => {
    mutationBridgeRef.current.onRecordUpdated(updated);
  }, []);

  const handleActivityDeleted = useCallback(
    (activityId: string, deleteHistory: boolean) => {
      mutationBridgeRef.current.onActivityDeleted(activityId, deleteHistory);
    },
    [],
  );

  // Modal centralizado de registro manual e edição
  const [manualRecordModalOpen, setManualRecordModalOpen] = useState(false);
  const [editingFocusRecord, setEditingFocusRecord] =
    useState<FocusRecord | null>(null);
  const [manualInitialActivityId, setManualInitialActivityId] = useState<
    string | undefined
  >();
  const [manualInitialItemId, setManualInitialItemId] = useState<
    string | undefined
  >();

  const clearSelectedBackpackItemRef = useRef<() => void>(() => {});

  const handleSessionSaved = useCallback(() => {
    setFilterActivityId(null);
    clearSelectedBackpackItemRef.current();
  }, []);

  // Fatia enxuta do timer (protegida contra mismatch de hidratação SSR)
  const timer = useFocusContainerTimerSlice({
    onSessionSaved: handleSessionSaved,
  });

  const targetController = useFocusTargetController({
    initialActivities,
    initialBackpackItems,
    focusableTasks,
    initialSelectedActivityId,
    initialSelectedItemId,
    isPremium,
    isGamified,
    timer,
    filterActivityId,
    setFilterActivityId,
  });

  useEffect(() => {
    clearSelectedBackpackItemRef.current = () => {
      targetController.setSelectedBackpackItemId(null);
    };
  }, [targetController.setSelectedBackpackItemId]);

  const handleOpenManualRecordModal = useCallback(
    (params?: { activityId?: string; itemId?: string }) => {
      setEditingFocusRecord(null);
      setManualInitialActivityId(
        params?.activityId ?? filterActivityId ?? undefined,
      );
      setManualInitialItemId(params?.itemId);
      setManualRecordModalOpen(true);
    },
    [filterActivityId],
  );

  const handleOpenEditRecordModal = useCallback((record: FocusRecord) => {
    setManualInitialActivityId(undefined);
    setManualInitialItemId(undefined);
    setEditingFocusRecord(record);
    setManualRecordModalOpen(true);
  }, []);

  const handleAddRecordSidebar = useCallback(() => {
    handleOpenManualRecordModal();
  }, [handleOpenManualRecordModal]);

  const handleOpenHistoryOptions = useCallback(() => {
    router.push("/history?tab=FOCUS");
  }, [router]);

  const { handleToggleActivityFilter } = targetController;

  const handleClearSelectedActivity = useCallback(() => {
    handleToggleActivityFilter(null);
  }, [handleToggleActivityFilter]);

  const sidebarVisibilityClass = useMemo(
    () => (mobileTab === "metrics" ? "flex flex-1 w-full" : "hidden xl:flex"),
    [mobileTab],
  );

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-hidden bg-background">
      {/* Abas Mobile (< xl) */}
      <div className="xl:hidden flex items-center justify-center p-2.5 bg-surface/60 border-b border-primary/20 shrink-0 z-20">
        <div
          role="tablist"
          aria-label={t("tabs.ariaLabel")}
          onKeyDown={handleMobileTabKeyDown}
          className="flex items-center p-1 rounded-xl bg-primary-dark/40 border border-white/10 w-full max-w-sm"
        >
          <button
            ref={(el) => {
              mobileTabRefs.current.timer = el;
            }}
            type="button"
            role="tab"
            aria-selected={mobileTab === "timer"}
            tabIndex={mobileTab === "timer" ? 0 : -1}
            onClick={() => setMobileTab("timer")}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 min-h-9 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              mobileTab === "timer"
                ? "bg-primary text-white shadow-sm after:content-[''] after:absolute after:inset-x-3 after:bottom-0.5 after:border-b-2 after:border-gold"
                : "text-neutral-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Timer size={14} aria-hidden="true" />
            <span>{t("tabs.timer")}</span>
            {timer.isActive && (
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-emerald-400 motion-safe:animate-pulse ml-0.5"
              />
            )}
          </button>
          <button
            ref={(el) => {
              mobileTabRefs.current.metrics = el;
            }}
            type="button"
            role="tab"
            aria-selected={mobileTab === "metrics"}
            tabIndex={mobileTab === "metrics" ? 0 : -1}
            onClick={() => setMobileTab("metrics")}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 min-h-9 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              mobileTab === "metrics"
                ? "bg-primary text-white shadow-sm after:content-[''] after:absolute after:inset-x-3 after:bottom-0.5 after:border-b-2 after:border-gold"
                : "text-neutral-400 hover:text-white hover:bg-white/5",
            )}
          >
            <BarChart2 size={14} aria-hidden="true" />
            <span>{t("tabs.metrics")}</span>
          </button>
        </div>
      </div>

      {/* Área Central Principal (renderizada imediatamente sem aguardar histórico/resumo) */}
      <div
        className={cn(
          "flex-1 min-h-0 min-w-0 h-full",
          mobileTab === "timer"
            ? "flex flex-col"
            : "hidden xl:flex xl:flex-col",
        )}
      >
        <FocusMain
          activities={initialActivities}
          backpackItems={initialBackpackItems}
          focusableTasks={focusableTasks}
          todaySummary={syncedStats.todaySummary}
          todayRewardableMinutes={syncedStats.todayRewardableMinutes}
          todayDurationByActivityId={syncedStats.todayDurationByActivityId}
          isPremium={isPremium}
          selectedActivityId={filterActivityId}
          selectedBackpackItemId={targetController.selectedBackpackItemId}
          onSelectActivity={targetController.handleSelectActivityStage}
          onToggleActivityFilter={targetController.handleToggleActivityFilter}
          onSelectBackpackItem={targetController.handleSelectBackpackItem}
          onStartFocusActivity={targetController.handleStartFocusActivity}
          onStartFocusItem={targetController.handleStartFocusItem}
          onStartFocusTask={targetController.handleStartFocusTask}
          onChangeMode={targetController.handleChangeMode}
          onOpenManualRecord={handleOpenManualRecordModal}
          onActivityDeleted={handleActivityDeleted}
          initialCreateActivity={initialCreateActivity}
          initialLinkActivity={initialLinkActivity}
          initialFromSource={initialFromSource}
        />
      </div>

      {/* Sidebar Direita com Streaming via Suspense */}
      <Suspense
        fallback={
          <FocusSidebarRightSkeleton className={sidebarVisibilityClass} />
        }
      >
        <FocusSidebarStreamSection
          historyBundlePromise={historyBundlePromise}
          initialActivities={initialActivities}
          initialAllInventoryItems={initialAllInventoryItems}
          initialDailyFocusGoalMinutes={initialDailyFocusGoalMinutes}
          initialTimeZone={initialTimeZone}
          filterActivityId={filterActivityId}
          className={sidebarVisibilityClass}
          onAddRecord={handleAddRecordSidebar}
          onOptionsClick={handleOpenHistoryOptions}
          onEditRecord={handleOpenEditRecordModal}
          onClearSelectedActivity={handleClearSelectedActivity}
          onSyncTodayStats={handleSyncTodayStats}
          mutationBridgeRef={mutationBridgeRef}
        />
      </Suspense>

      {/* Modal Centralizado de Inserção / Edição de Registro Manual */}
      {manualRecordModalOpen && (
        <FocusManualRecordModal
          isOpen={manualRecordModalOpen}
          onClose={() => {
            setManualRecordModalOpen(false);
            setEditingFocusRecord(null);
            setManualInitialActivityId(undefined);
            setManualInitialItemId(undefined);
          }}
          activities={initialActivities}
          backpackItems={initialBackpackItems}
          allInventoryItems={initialAllInventoryItems}
          focusableTasks={focusableTasks}
          records={syncedStats.allRecords}
          editingRecord={editingFocusRecord}
          initialActivityId={manualInitialActivityId}
          initialItemId={manualInitialItemId}
          onRecordUpdated={handleRecordUpdated}
        />
      )}

      {/* Modal para Confirmação de Troca de Sessão Ativa */}
      {targetController.pendingSwitchTarget !== null && (
        <SwitchFocusTargetModal
          isOpen={targetController.pendingSwitchTarget !== null}
          onClose={() => targetController.setPendingSwitchTarget(null)}
          currentName={timer.target?.name || t("fallbacks.currentSession")}
          newTargetName={
            targetController.pendingSwitchTarget?.type === "activity"
              ? targetController.pendingSwitchTarget.activity?.name ||
                t("fallbacks.newActivity")
              : targetController.pendingSwitchTarget?.type === "item"
                ? targetController.pendingSwitchTarget.item?.rewardName ||
                  t("fallbacks.focusItem")
                : targetController.pendingSwitchTarget?.task?.title ||
                  t("fallbacks.currentSession")
          }
          isCurrentInventory={timer.target?.type === "inventory"}
          isCurrentTask={timer.target?.type === "task"}
          isNewInventory={targetController.pendingSwitchTarget?.type === "item"}
          isNewTask={targetController.pendingSwitchTarget?.type === "task"}
          onTransfer={targetController.handleTransferTarget}
          onSaveAndStartNew={targetController.handleSaveAndStartNew}
          onDiscardAndStartNew={targetController.handleDiscardAndStartNew}
        />
      )}
    </div>
  );
}
