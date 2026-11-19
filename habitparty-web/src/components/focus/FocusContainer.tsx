"use client";

import { BarChart2, Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getFocusActivityRecordsPage,
  getFocusRecordsPage,
} from "@/actions/focusActions";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { executeDeleteFocusRecord } from "@/hooks/useFocusMutations";
import {
  dispatchTaskFocusRecorded,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn, removeBrowserQueryParam } from "@/utils";
import { getTodayDateString } from "@/utils/date";
import { calculateProductiveMinutesForDate } from "@/utils/focusDailyYield";
import { mapFocusRecords } from "@/utils/focusMapper";
import { FocusMain } from "./FocusMain";
import { FocusSidebarRight } from "./sidebar-right/FocusSidebarRight";

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

const SwitchTimerModeModal = dynamic(
  () =>
    import("./modals/SwitchTimerModeModal").then(
      (mod) => mod.SwitchTimerModeModal,
    ),
  { ssr: false },
);

function preloadFocusContainerModalChunks() {
  void import("./modals/FocusManualRecordModal");
  void import("./modals/SwitchFocusTargetModal");
  void import("./modals/SwitchTimerModeModal");
}

interface FocusContainerProps {
  initialActivities: FocusActivity[];
  initialBackpackItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
  initialTotalRecordsCount?: number;
  initialHasMoreRecords?: boolean;
  initialLoadedRecordsPage?: number;
  initialFocusableTasks?: FocusableTaskItem[];
  initialSelectedActivityId?: string | null;
  initialCreateActivity?: boolean;
  initialLinkActivity?: boolean;
  initialFromSource?: string | null;
  initialDailyFocusGoalMinutes?: number | null;
}

export function FocusContainer({
  initialActivities,
  initialBackpackItems,
  initialRecords,
  initialTotalRecordsCount,
  initialHasMoreRecords = false,
  initialLoadedRecordsPage = 0,
  initialFocusableTasks = [],
  initialSelectedActivityId = null,
  initialCreateActivity = false,
  initialLinkActivity = false,
  initialFromSource = null,
  initialDailyFocusGoalMinutes = null,
}: FocusContainerProps) {
  const t = useTranslations("focus.container");
  const { isGamified } = useExperienceMode();
  const router = useRouter();
  const is_Premium = useUserStore((s) => s.is_Premium);
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

  const urlActivityId = initialSelectedActivityId || null;
  const shouldOpenLinkActivityModal = initialLinkActivity;

  // Atividade selecionada para filtro de métricas (não interfere no timer ativo)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    urlActivityId,
  );
  const [selectedBackpackItemId, setSelectedBackpackItemId] = useState<
    string | null
  >(null);
  const lastAppliedUrlActivityIdRef = useRef<string | null>(null);

  const clearActivityQueryParam = useCallback(() => {
    removeBrowserQueryParam("activityId");
  }, []);

  // Aba mobile ativa (< xl): "timer" para Timer & Sessão, "metrics" para Métricas & Histórico
  const [mobileTab, setMobileTab] = useState<"timer" | "metrics">("timer");

  // Modal centralizado de registro manual compartilhado entre Main e Sidebar
  const [manualRecordModalOpen, setManualRecordModalOpen] = useState(false);
  const [manualInitialActivityId, setManualInitialActivityId] = useState<
    string | undefined
  >();
  const [manualInitialItemId, setManualInitialItemId] = useState<
    string | undefined
  >();

  // Estado para confirmação de troca de alvo enquanto timer está ativo
  const [pendingSwitchTarget, setPendingSwitchTarget] = useState<{
    type: "activity" | "item" | "task";
    activity?: FocusActivity;
    item?: InventoryItemResponseDTO;
    task?: { id: string; title: string };
  } | null>(null);

  // Estado para confirmação de troca de modo (Pomodoro <-> Cronômetro)
  const [pendingSwitchMode, setPendingSwitchMode] =
    useState<FocusRecordType | null>(null);

  const handleSessionSaved = useCallback(() => {
    setSelectedActivityId(null);
    setSelectedBackpackItemId(null);
  }, []);

  // Controles e ações do timer desacoplados de variáveis de ticking a cada segundo e de sessionNotes.
  const {
    isActive,
    isPaused,
    mode,
    phase = "WORK",
    target,
    hasElapsedSeconds,
    resumeTimer,
    changeMode,
    startFocusActivity,
    startFocusItem,
    startFocusTask,
    selectActivityTarget,
    selectItemTarget,
    selectTaskTarget,
    resetTarget,
    transferTarget,
    syncTargetMetadata,
    completeSession,
  } = useFocusTimerControls({
    onSessionSaved: handleSessionSaved,
  });

  const [extraRecords, setExtraRecords] = useState<FocusRecord[]>([]);
  const [editedRecordsById, setEditedRecordsById] = useState<
    Record<string, FocusRecord>
  >({});
  const [deletedActivityIds, setDeletedActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletedRecordIds, setDeletedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [preservedActivityIds, setPreservedActivityIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadedRecordsPage, setLoadedRecordsPage] = useState(
    initialLoadedRecordsPage,
  );
  const [hasMoreServerRecords, setHasMoreServerRecords] = useState(
    initialHasMoreRecords,
  );
  const [totalServerRecords, setTotalServerRecords] = useState(
    initialTotalRecordsCount ?? initialRecords.length,
  );
  const [activityPagination, setActivityPagination] = useState<
    Record<
      string,
      { nextPage: number; hasMore: boolean; totalElements: number }
    >
  >({});
  const [isLoadingMoreRecords, setIsLoadingMoreRecords] = useState(false);
  const hasPaginatedBeyondInitialRef = useRef(false);

  useEffect(() => {
    setEditedRecordsById({});
    setDeletedActivityIds(new Set());
    setDeletedRecordIds(new Set());
    setPreservedActivityIds(new Set());
    setActivityPagination({});
    setTotalServerRecords(initialTotalRecordsCount ?? initialRecords.length);
    if (!hasPaginatedBeyondInitialRef.current) {
      setLoadedRecordsPage(initialLoadedRecordsPage);
      setHasMoreServerRecords(initialHasMoreRecords);
    }
  }, [
    initialRecords,
    initialHasMoreRecords,
    initialLoadedRecordsPage,
    initialTotalRecordsCount,
  ]);

  const allRecords = useMemo(() => {
    const transformRecord = (rec: FocusRecord): FocusRecord | null => {
      if (deletedRecordIds.has(rec.id)) {
        return null;
      }
      if (rec.focusActivityId && deletedActivityIds.has(rec.focusActivityId)) {
        return null;
      }
      const patched = editedRecordsById[rec.id] ?? rec;
      if (
        patched.focusActivityId &&
        preservedActivityIds.has(patched.focusActivityId)
      ) {
        return {
          ...patched,
          focusActivityId: undefined,
          activityName: undefined,
          activityIcon: undefined,
        };
      }
      return patched;
    };

    const seen = new Set<string>();
    const merged: FocusRecord[] = [];
    for (const rawList of [initialRecords, extraRecords]) {
      for (const rawRec of rawList) {
        if (seen.has(rawRec.id)) continue;
        seen.add(rawRec.id);
        const transformed = transformRecord(rawRec);
        if (transformed) merged.push(transformed);
      }
    }
    merged.sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime(),
    );
    return merged;
  }, [
    initialRecords,
    extraRecords,
    editedRecordsById,
    deletedRecordIds,
    deletedActivityIds,
    preservedActivityIds,
  ]);

  const {
    weekOffset,
    handlePrevWeek,
    handleNextWeek,
    handleResetWeek,
    selectedActivity,
    recentRecords,
    relevantRecordsCount,
    showMoreRecords,
    metrics,
    weeklyDays,
    totalWeekMinutes,
    weekLabel,
    weekDateRange,
  } = useFocusAnalytics({
    initialActivities,
    initialRecords: allRecords,
    selectedActivityId,
  });

  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const todayProductiveMinutes = useMemo(() => {
    const todayStr = getTodayDateString(new Date(), userTimeZone);
    return calculateProductiveMinutesForDate(
      allRecords,
      todayStr,
      userTimeZone,
    );
  }, [allRecords, userTimeZone]);

  const selectedActivityPagination = selectedActivityId
    ? activityPagination[selectedActivityId]
    : undefined;

  const hasMoreRecordsToShow = selectedActivityId
    ? recentRecords.length < relevantRecordsCount ||
      (hasMoreServerRecords && (selectedActivityPagination?.hasMore ?? true))
    : recentRecords.length < relevantRecordsCount || hasMoreServerRecords;

  const displayedTotalRecordsCount = selectedActivityId
    ? selectedActivityPagination
      ? Math.max(relevantRecordsCount, selectedActivityPagination.totalElements)
      : relevantRecordsCount
    : Math.max(totalServerRecords, allRecords.length);

  const handleShowMoreRecords = useCallback(async () => {
    const nextVisibleTarget = recentRecords.length + 10;
    const serverHasMoreForCurrentScope = selectedActivityId
      ? hasMoreServerRecords && (selectedActivityPagination?.hasMore ?? true)
      : hasMoreServerRecords;

    if (
      recentRecords.length < relevantRecordsCount &&
      (nextVisibleTarget <= relevantRecordsCount ||
        !serverHasMoreForCurrentScope)
    ) {
      showMoreRecords(10);
      return;
    }

    if (!serverHasMoreForCurrentScope || isLoadingMoreRecords) {
      showMoreRecords(10);
      return;
    }

    setIsLoadingMoreRecords(true);
    try {
      if (selectedActivityId) {
        const nextPage =
          selectedActivityPagination?.nextPage ??
          Math.floor(relevantRecordsCount / 20);
        const res = await getFocusActivityRecordsPage(
          selectedActivityId,
          nextPage,
        );
        if (!res.success || !res.data) {
          toast.error(!res.success ? res.error : t("loadMoreRecordsError"));
          return;
        }

        const mapped = mapFocusRecords(
          res.data.records,
          initialActivities,
          userTimeZone,
          initialBackpackItems,
        );
        if (mapped.length > 0) {
          setExtraRecords((prev) => [...prev, ...mapped]);
        }
        setActivityPagination((prev) => ({
          ...prev,
          [selectedActivityId]: {
            nextPage: res.data.currentPage + 1,
            hasMore: res.data.hasMore,
            totalElements: res.data.totalElements,
          },
        }));
        showMoreRecords(10);
        return;
      }

      const res = await getFocusRecordsPage(loadedRecordsPage + 1, 100);
      if (!res.success || !res.data) {
        toast.error(!res.success ? res.error : t("loadMoreRecordsError"));
        return;
      }

      hasPaginatedBeyondInitialRef.current = true;
      const mapped = mapFocusRecords(
        res.data.records,
        initialActivities,
        userTimeZone,
        initialBackpackItems,
      );
      if (mapped.length > 0) {
        setExtraRecords((prev) => [...prev, ...mapped]);
      }
      setLoadedRecordsPage(res.data.currentPage);
      setHasMoreServerRecords(res.data.hasMore);
      setTotalServerRecords(res.data.totalElements);
      showMoreRecords(10);
    } finally {
      setIsLoadingMoreRecords(false);
    }
  }, [
    recentRecords.length,
    relevantRecordsCount,
    selectedActivityId,
    selectedActivityPagination,
    hasMoreServerRecords,
    isLoadingMoreRecords,
    loadedRecordsPage,
    initialActivities,
    initialBackpackItems,
    userTimeZone,
    showMoreRecords,
    t,
  ]);

  // Há tempo de foco real pendente de decisão apenas na fase WORK com segundos decorridos (> 0s)
  const hasUnsavedWorkSession = phase === "WORK" && hasElapsedSeconds;

  // Sincroniza atividade vinda da URL (ex: clique no widget do Dashboard /focus?activityId=...)
  useEffect(() => {
    if (!urlActivityId) {
      lastAppliedUrlActivityIdRef.current = null;
      return;
    }

    if (lastAppliedUrlActivityIdRef.current === urlActivityId) {
      return;
    }

    const actIndex = initialActivities.findIndex((a) => a.id === urlActivityId);
    if (actIndex === -1) return;

    const isActLocked = !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
    if (isActLocked) return;

    lastAppliedUrlActivityIdRef.current = urlActivityId;
    setSelectedActivityId(urlActivityId);
    setSelectedBackpackItemId(null);

    if (!isActive && !hasElapsedSeconds) {
      selectActivityTarget(initialActivities[actIndex]);
    }
  }, [
    urlActivityId,
    initialActivities,
    is_Premium,
    isActive,
    hasElapsedSeconds,
    selectActivityTarget,
  ]);

  // Sincroniza o alvo com os dados reais do servidor
  useEffect(() => {
    const preferredIndex = urlActivityId
      ? initialActivities.findIndex((a) => a.id === urlActivityId)
      : -1;
    const isPreferredValid =
      preferredIndex !== -1 &&
      (is_Premium || preferredIndex < MAX_FOCUS_ACTIVITIES_FREE);
    const defaultActivity = isPreferredValid
      ? initialActivities[preferredIndex]
      : initialActivities[0];

    if (!target) {
      if (!isActive && !hasElapsedSeconds && defaultActivity) {
        selectActivityTarget(defaultActivity);
        setSelectedActivityId(
          isPreferredValid
            ? defaultActivity.id
            : (prev) => prev ?? defaultActivity.id,
        );
      }
      return;
    }

    if (target.type === "inventory") {
      const currentItem = initialBackpackItems.find(
        (item) => item.inventoryItemId === target.id,
      );
      if (!currentItem) {
        resetTarget();
        if (defaultActivity) {
          selectActivityTarget(defaultActivity);
          setSelectedActivityId(defaultActivity.id);
        }
      } else {
        syncTargetMetadata({
          id: currentItem.inventoryItemId,
          name: currentItem.rewardName,
          icon: currentItem.rewardIcon,
        });
      }
    } else if (target.type === "activity") {
      const actIndex = initialActivities.findIndex(
        (act) => act.id === target.id,
      );
      const existsInActivities = actIndex !== -1;
      const isActLocked = !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;

      if (!existsInActivities || isActLocked) {
        resetTarget();
        if (defaultActivity) {
          selectActivityTarget(defaultActivity);
          setSelectedActivityId(defaultActivity.id);
        }
      } else {
        const currentAct = initialActivities[actIndex];
        syncTargetMetadata({
          id: currentAct.id,
          name: currentAct.name,
          icon: currentAct.icon,
          targetMinutes: currentAct.targetTimeMinutes,
        });
      }
    } else if (target.type === "task") {
      const currentTask = focusableTasks.find(
        (tItem) => tItem.id === target.id,
      );
      if (currentTask) {
        syncTargetMetadata({
          id: currentTask.id,
          name: currentTask.title,
          taskId: currentTask.id,
          taskName: currentTask.title,
        });
      }
    }
  }, [
    target,
    urlActivityId,
    isActive,
    hasElapsedSeconds,
    initialBackpackItems,
    initialActivities,
    focusableTasks,
    is_Premium,
    resetTarget,
    selectActivityTarget,
    syncTargetMetadata,
  ]);

  const handleSelectActivity = useCallback(
    (activityId: string | null) => {
      setSelectedActivityId(activityId);
      if (activityId) {
        setSelectedBackpackItemId(null);
        if (urlActivityId && activityId !== urlActivityId) {
          clearActivityQueryParam();
        }
      } else {
        clearActivityQueryParam();
      }

      if (!isActive && !hasElapsedSeconds && activityId) {
        const actIndex = initialActivities.findIndex(
          (a) => a.id === activityId,
        );
        const isActLocked =
          !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
        if (actIndex !== -1 && !isActLocked) {
          selectActivityTarget(initialActivities[actIndex]);
        }
      }
    },
    [
      urlActivityId,
      clearActivityQueryParam,
      isActive,
      hasElapsedSeconds,
      initialActivities,
      is_Premium,
      selectActivityTarget,
    ],
  );

  const handleSelectBackpackItem = useCallback(
    (item: InventoryItemResponseDTO | null) => {
      if (!item) {
        setSelectedBackpackItemId(null);
        return;
      }
      const itemId = item.inventoryItemId || null;
      const isDeselecting =
        itemId !== null && selectedBackpackItemId === itemId;

      if (isDeselecting) {
        setSelectedBackpackItemId(null);
        return;
      }

      setSelectedActivityId(null);
      setSelectedBackpackItemId(itemId);

      if (!isActive && !hasElapsedSeconds) {
        selectItemTarget(item);
      }
    },
    [selectedBackpackItemId, isActive, hasElapsedSeconds, selectItemTarget],
  );

  const handleStartFocusActivity = useCallback(
    (act: FocusActivity) => {
      const actIndex = initialActivities.findIndex((a) => a.id === act.id);
      if (!is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE) {
        toast.error(
          isGamified
            ? t("lockedActivityToast")
            : t("lockedActivityToastProductivity"),
        );
        return;
      }

      if (target?.id === act.id && hasUnsavedWorkSession) {
        setSelectedActivityId(act.id);
        setSelectedBackpackItemId(null);
        syncTargetMetadata({
          id: act.id,
          name: act.name,
          icon: act.icon,
          targetMinutes: act.targetTimeMinutes,
        });
        if (isPaused) {
          resumeTimer();
        }
        return;
      }

      if (hasUnsavedWorkSession && target?.id !== act.id) {
        setPendingSwitchTarget({ type: "activity", activity: act });
        return;
      }
      setSelectedActivityId(act.id);
      setSelectedBackpackItemId(null);
      startFocusActivity(act);
    },
    [
      initialActivities,
      is_Premium,
      isGamified,
      t,
      target?.id,
      hasUnsavedWorkSession,
      syncTargetMetadata,
      isPaused,
      resumeTimer,
      startFocusActivity,
    ],
  );

  const handleStartFocusItem = useCallback(
    (item: InventoryItemResponseDTO) => {
      if (target?.id === item.inventoryItemId && hasUnsavedWorkSession) {
        setSelectedActivityId(null);
        setSelectedBackpackItemId(item.inventoryItemId || null);
        syncTargetMetadata({
          id: item.inventoryItemId,
          name: item.rewardName,
          icon: item.rewardIcon,
        });
        if (isPaused) {
          resumeTimer();
        }
        return;
      }

      if (hasUnsavedWorkSession && target?.id !== item.inventoryItemId) {
        setPendingSwitchTarget({ type: "item", item });
        return;
      }
      setSelectedActivityId(null);
      setSelectedBackpackItemId(item.inventoryItemId || null);
      startFocusItem(item);
    },
    [
      target?.id,
      hasUnsavedWorkSession,
      syncTargetMetadata,
      isPaused,
      resumeTimer,
      startFocusItem,
    ],
  );

  const handleStartFocusTask = useCallback(
    (task: { id: string; title: string }) => {
      // Vincula micro-tarefa em sessão de Atividade apenas se não houver outra tarefa vinculada com tempo não salvo
      if (
        target?.type === "activity" &&
        (!target.taskId || target.taskId === task.id || !hasUnsavedWorkSession)
      ) {
        selectTaskTarget(task);
        return;
      }

      // Se houver uma sessão ativa com tempo decorrido, solicita confirmação de troca
      if (hasUnsavedWorkSession && target?.id !== task.id) {
        setPendingSwitchTarget({ type: "task", task });
        return;
      }

      setSelectedActivityId(null);
      setSelectedBackpackItemId(null);
      startFocusTask(task);
    },
    [target, hasUnsavedWorkSession, selectTaskTarget, startFocusTask],
  );

  const handleTransferTarget = useCallback(() => {
    if (!pendingSwitchTarget) return;
    if (
      pendingSwitchTarget.type === "activity" &&
      pendingSwitchTarget.activity
    ) {
      transferTarget(pendingSwitchTarget.activity);
      setSelectedActivityId(pendingSwitchTarget.activity.id);
    } else if (
      pendingSwitchTarget.type === "task" &&
      pendingSwitchTarget.task
    ) {
      selectTaskTarget(pendingSwitchTarget.task);
      if (isPaused || !isActive) {
        resumeTimer();
      }
      setSelectedActivityId(null);
      setSelectedBackpackItemId(null);
    }
    setPendingSwitchTarget(null);
  }, [
    pendingSwitchTarget,
    transferTarget,
    selectTaskTarget,
    isPaused,
    isActive,
    resumeTimer,
  ]);

  const applyPendingTargetSwitch = useCallback(
    (targetToStart: NonNullable<typeof pendingSwitchTarget>) => {
      if (targetToStart.type === "activity" && targetToStart.activity) {
        setSelectedActivityId(targetToStart.activity.id);
        startFocusActivity(targetToStart.activity);
      } else if (targetToStart.type === "item" && targetToStart.item) {
        setSelectedActivityId(null);
        startFocusItem(targetToStart.item);
      } else if (targetToStart.type === "task" && targetToStart.task) {
        setSelectedActivityId(null);
        setSelectedBackpackItemId(null);
        startFocusTask(targetToStart.task);
      }
      setPendingSwitchTarget(null);
    },
    [startFocusActivity, startFocusItem, startFocusTask],
  );

  const handleSaveAndStartNew = useCallback(async (): Promise<boolean> => {
    const targetToStart = pendingSwitchTarget;
    if (!targetToStart) return false;

    const saved = await completeSession();
    if (!saved) {
      return false;
    }

    applyPendingTargetSwitch(targetToStart);
    return true;
  }, [pendingSwitchTarget, completeSession, applyPendingTargetSwitch]);

  const handleDiscardAndStartNew = useCallback(() => {
    if (!pendingSwitchTarget) return;
    applyPendingTargetSwitch(pendingSwitchTarget);
  }, [pendingSwitchTarget, applyPendingTargetSwitch]);

  const handleChangeMode = useCallback(
    (newMode: FocusRecordType) => {
      if (newMode === mode) return;

      if (hasUnsavedWorkSession) {
        setPendingSwitchMode(newMode);
        return;
      }

      changeMode(newMode);
    },
    [mode, hasUnsavedWorkSession, changeMode],
  );

  const handleConfirmSwitchMode = useCallback(() => {
    if (!pendingSwitchMode) return;
    changeMode(pendingSwitchMode);
    setPendingSwitchMode(null);
  }, [pendingSwitchMode, changeMode]);

  const handleDeleteRecord = useCallback(
    async (recordId: string, deleteHistory: boolean) => {
      const deletedRecord = allRecords.find((r) => r.id === recordId);
      await executeDeleteFocusRecord(
        recordId,
        {
          success: t("deleteRecordSuccess"),
          error: t("deleteRecordError"),
        },
        () => {
          setDeletedRecordIds((prev) => new Set(prev).add(recordId));
          setExtraRecords((prev) => prev.filter((r) => r.id !== recordId));
          setEditedRecordsById((prev) => {
            if (!(recordId in prev)) return prev;
            const next = { ...prev };
            delete next[recordId];
            return next;
          });
          setTotalServerRecords((prev) => Math.max(0, prev - 1));
          const activityId = deletedRecord?.focusActivityId;
          if (activityId) {
            setActivityPagination((prev) => {
              const current = prev[activityId];
              if (!current) return prev;
              return {
                ...prev,
                [activityId]: {
                  ...current,
                  totalElements: Math.max(0, current.totalElements - 1),
                },
              };
            });
          }
          if (deletedRecord?.taskId) {
            dispatchTaskFocusRecorded({
              taskId: deletedRecord.taskId,
              durationMinutes: -Math.max(1, deletedRecord.durationMinutes),
              cycles: -(deletedRecord.completedPomos ?? 0),
            });
          }
        },
        deleteHistory,
        deletedRecord,
      );
    },
    [allRecords, t],
  );

  const handleRecordUpdated = useCallback((updatedRecord: FocusRecord) => {
    setEditedRecordsById((prev) => ({
      ...prev,
      [updatedRecord.id]: updatedRecord,
    }));
  }, []);

  const handleActivityDeleted = useCallback(
    (activityId: string, deleteHistory: boolean) => {
      if (deleteHistory) {
        const affectedRecords = allRecords.filter(
          (r) => r.focusActivityId === activityId,
        );
        if (typeof window !== "undefined") {
          const taskDeltas = new Map<
            string,
            { minutes: number; pomos: number }
          >();
          for (const rec of affectedRecords) {
            if (!rec.taskId) continue;
            const prev = taskDeltas.get(rec.taskId) ?? { minutes: 0, pomos: 0 };
            taskDeltas.set(rec.taskId, {
              minutes: prev.minutes + Math.max(1, rec.durationMinutes),
              pomos: prev.pomos + (rec.completedPomos ?? 0),
            });
          }
          taskDeltas.forEach((delta, taskId) => {
            dispatchTaskFocusRecorded({
              taskId,
              durationMinutes: -delta.minutes,
              cycles: -delta.pomos,
            });
          });
        }
        setDeletedActivityIds((prev) => new Set(prev).add(activityId));
        setExtraRecords((prev) =>
          prev.filter((r) => r.focusActivityId !== activityId),
        );
        setTotalServerRecords((prev) =>
          Math.max(0, prev - affectedRecords.length),
        );
        setActivityPagination((prev) => {
          if (!(activityId in prev)) return prev;
          const next = { ...prev };
          delete next[activityId];
          return next;
        });
      } else {
        setPreservedActivityIds((prev) => new Set(prev).add(activityId));
      }
      router.refresh();
    },
    [allRecords, router],
  );

  const handleOpenManualRecordModal = useCallback(
    (params?: { activityId?: string; itemId?: string }) => {
      setManualInitialActivityId(
        params?.activityId ?? selectedActivityId ?? undefined,
      );
      setManualInitialItemId(params?.itemId);
      setManualRecordModalOpen(true);
    },
    [selectedActivityId],
  );

  const handleAddRecordSidebar = useCallback(() => {
    handleOpenManualRecordModal();
  }, [handleOpenManualRecordModal]);

  const handleOpenHistoryOptions = useCallback(() => {
    router.push("/history?tab=FOCUS");
  }, [router]);

  const handleClearSelectedActivity = useCallback(() => {
    handleSelectActivity(null);
  }, [handleSelectActivity]);

  const todaySummary = useMemo(
    () => ({
      minutes: metrics.todayFocusMinutes,
      sessionsCount: metrics.todayRecordsCount,
    }),
    [metrics.todayFocusMinutes, metrics.todayRecordsCount],
  );

  return (
    <div className="flex flex-col xl:flex-row h-full w-full overflow-hidden bg-background">
      {/* Abas Mobile (< xl) */}
      <div className="xl:hidden flex items-center justify-center p-2.5 bg-surface/60 border-b border-primary/20 shrink-0 z-20">
        <div className="flex items-center p-1 rounded-xl bg-primary-dark/40 border border-white/10 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setMobileTab("timer")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              mobileTab === "timer"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Timer size={14} />
            <span>{t("tabs.timer")}</span>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("metrics")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
              mobileTab === "metrics"
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-white/5",
            )}
          >
            <BarChart2 size={14} />
            <span>{t("tabs.metrics")}</span>
          </button>
        </div>
      </div>

      {/* Área Central Principal */}
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
          todaySummary={todaySummary}
          todayProductiveMinutes={todayProductiveMinutes}
          isPremium={is_Premium}
          selectedActivityId={selectedActivityId}
          selectedBackpackItemId={selectedBackpackItemId}
          onSelectActivity={handleSelectActivity}
          onSelectBackpackItem={handleSelectBackpackItem}
          onStartFocusActivity={handleStartFocusActivity}
          onStartFocusItem={handleStartFocusItem}
          onStartFocusTask={handleStartFocusTask}
          onChangeMode={handleChangeMode}
          onOpenManualRecord={handleOpenManualRecordModal}
          onActivityDeleted={handleActivityDeleted}
          initialCreateActivity={initialCreateActivity}
          initialLinkActivity={shouldOpenLinkActivityModal}
          initialFromSource={initialFromSource}
        />
      </div>

      {/* Sidebar Direita de Visão Geral, Gráfico e Histórico */}
      <FocusSidebarRight
        metrics={metrics}
        todayProductiveMinutes={todayProductiveMinutes}
        dailyFocusGoalMinutes={initialDailyFocusGoalMinutes}
        weeklyDays={weeklyDays}
        totalWeekMinutes={totalWeekMinutes}
        recentRecords={recentRecords}
        totalRecordsCount={displayedTotalRecordsCount}
        hasMoreRecords={hasMoreRecordsToShow}
        isLoadingMoreRecords={isLoadingMoreRecords}
        onShowMoreRecords={handleShowMoreRecords}
        weekOffset={weekOffset}
        weekLabel={weekLabel}
        weekDateRange={weekDateRange}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onResetWeek={handleResetWeek}
        onAddRecord={handleAddRecordSidebar}
        onOptionsClick={handleOpenHistoryOptions}
        onDeleteRecord={handleDeleteRecord}
        onRecordUpdated={handleRecordUpdated}
        selectedActivityName={selectedActivity?.name}
        onClearSelectedActivity={handleClearSelectedActivity}
        className={cn(
          mobileTab === "metrics" ? "flex flex-1 w-full" : "hidden xl:flex",
        )}
      />

      {/* Modal Centralizado de Inserção de Registro Manual (Carregado sob demanda) */}
      {manualRecordModalOpen && (
        <FocusManualRecordModal
          isOpen={manualRecordModalOpen}
          onClose={() => {
            setManualRecordModalOpen(false);
            setManualInitialActivityId(undefined);
            setManualInitialItemId(undefined);
          }}
          activities={initialActivities}
          backpackItems={initialBackpackItems}
          focusableTasks={focusableTasks}
          records={allRecords}
          initialActivityId={manualInitialActivityId}
          initialItemId={manualInitialItemId}
        />
      )}

      {/* Modal para Confirmação de Troca de Sessão Ativa (Carregado sob demanda) */}
      {pendingSwitchTarget !== null && (
        <SwitchFocusTargetModal
          isOpen={pendingSwitchTarget !== null}
          onClose={() => setPendingSwitchTarget(null)}
          currentName={target?.name || t("fallbacks.currentSession")}
          newTargetName={
            pendingSwitchTarget?.type === "activity"
              ? pendingSwitchTarget.activity?.name || t("fallbacks.newActivity")
              : pendingSwitchTarget?.type === "item"
                ? pendingSwitchTarget.item?.rewardName ||
                  t("fallbacks.focusItem")
                : pendingSwitchTarget?.task?.title ||
                  t("fallbacks.currentSession")
          }
          isCurrentInventory={target?.type === "inventory"}
          isCurrentTask={target?.type === "task"}
          isNewInventory={pendingSwitchTarget?.type === "item"}
          isNewTask={pendingSwitchTarget?.type === "task"}
          onTransfer={handleTransferTarget}
          onSaveAndStartNew={handleSaveAndStartNew}
          onDiscardAndStartNew={handleDiscardAndStartNew}
        />
      )}

      {/* Modal para Confirmação de Troca de Modo com Timer Ativo */}
      {pendingSwitchMode && (
        <SwitchTimerModeModal
          isOpen={pendingSwitchMode !== null}
          onClose={() => setPendingSwitchMode(null)}
          currentMode={mode}
          newMode={pendingSwitchMode}
          onConfirm={handleConfirmSwitchMode}
        />
      )}
    </div>
  );
}
