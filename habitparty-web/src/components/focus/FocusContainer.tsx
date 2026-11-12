"use client";

import { BarChart2, Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { executeDeleteFocusRecord } from "@/hooks/useFocusMutations";
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
import { cn } from "@/utils";
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
  initialFocusableTasks?: FocusableTaskItem[];
  initialSelectedActivityId?: string | null;
  initialCreateActivity?: boolean;
}

export function FocusContainer({
  initialActivities,
  initialBackpackItems,
  initialRecords,
  initialFocusableTasks = [],
  initialSelectedActivityId = null,
  initialCreateActivity = false,
}: FocusContainerProps) {
  const t = useTranslations("focus.container");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const is_Premium = useUserStore((s) => s.is_Premium);
  useIdlePreload(preloadFocusContainerModalChunks);

  const [focusableTasks, setFocusableTasks] = useState<FocusableTaskItem[]>(
    initialFocusableTasks,
  );

  useEffect(() => {
    setFocusableTasks(initialFocusableTasks);
  }, [initialFocusableTasks]);

  useEffect(() => {
    const handleTaskCompleted = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId?: string }>).detail;
      if (detail?.taskId) {
        setFocusableTasks((prev) =>
          prev.filter((task) => task.id !== detail.taskId),
        );
      }
    };
    window.addEventListener(
      "habitparty:task-completed-from-focus",
      handleTaskCompleted,
    );
    return () => {
      window.removeEventListener(
        "habitparty:task-completed-from-focus",
        handleTaskCompleted,
      );
    };
  }, []);

  const urlActivityId =
    searchParams.get("activityId") || initialSelectedActivityId || null;

  // Atividade selecionada para filtro de métricas (não interfere no timer ativo)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    urlActivityId,
  );
  const [selectedBackpackItemId, setSelectedBackpackItemId] = useState<
    string | null
  >(null);
  const lastAppliedUrlActivityIdRef = useRef<string | null>(null);

  const clearActivityQueryParam = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("activityId")) {
      url.searchParams.delete("activityId");
      const nextUrl = url.search
        ? `${pathname}?${url.searchParams.toString()}`
        : pathname;
      window.history.replaceState(null, "", nextUrl);
    }
  }, [pathname]);

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
    onSessionSaved: () => {
      setSelectedActivityId(null);
      setSelectedBackpackItemId(null);
    },
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
  } = useFocusAnalytics({
    initialActivities,
    initialRecords,
    selectedActivityId,
  });

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

  const handleSelectActivity = (activityId: string | null) => {
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
      const actIndex = initialActivities.findIndex((a) => a.id === activityId);
      const isActLocked = !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
      if (actIndex !== -1 && !isActLocked) {
        selectActivityTarget(initialActivities[actIndex]);
      }
    }
  };

  const handleSelectBackpackItem = (item: InventoryItemResponseDTO | null) => {
    if (!item) {
      setSelectedBackpackItemId(null);
      return;
    }
    const itemId = item.inventoryItemId || null;
    const isDeselecting = itemId !== null && selectedBackpackItemId === itemId;

    if (isDeselecting) {
      setSelectedBackpackItemId(null);
      return;
    }

    setSelectedActivityId(null);
    setSelectedBackpackItemId(itemId);

    if (!isActive && !hasElapsedSeconds) {
      selectItemTarget(item);
    }
  };

  const handleStartFocusActivity = (act: FocusActivity) => {
    const actIndex = initialActivities.findIndex((a) => a.id === act.id);
    if (!is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE) {
      toast.error(t("lockedActivityToast"));
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
  };

  const handleStartFocusItem = (item: InventoryItemResponseDTO) => {
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
  };

  const handleStartFocusTask = (task: { id: string; title: string }) => {
    // Se a sessão atual for uma Atividade, vincula a tarefa como micro-tarefa na atividade
    if (target?.type === "activity") {
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
  };

  const handleTransferTarget = () => {
    if (!pendingSwitchTarget) return;
    if (
      pendingSwitchTarget.type === "activity" &&
      pendingSwitchTarget.activity
    ) {
      transferTarget(pendingSwitchTarget.activity);
      setSelectedActivityId(pendingSwitchTarget.activity.id);
    }
    setPendingSwitchTarget(null);
  };

  const handleSaveAndStartNew = async (): Promise<boolean> => {
    const targetToStart = pendingSwitchTarget;
    if (!targetToStart) return false;

    const saved = await completeSession();
    if (!saved) {
      return false;
    }

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
    return true;
  };

  const handleDiscardAndStartNew = () => {
    if (!pendingSwitchTarget) return;
    if (
      pendingSwitchTarget.type === "activity" &&
      pendingSwitchTarget.activity
    ) {
      setSelectedActivityId(pendingSwitchTarget.activity.id);
      startFocusActivity(pendingSwitchTarget.activity);
    } else if (
      pendingSwitchTarget.type === "item" &&
      pendingSwitchTarget.item
    ) {
      setSelectedActivityId(null);
      startFocusItem(pendingSwitchTarget.item);
    } else if (
      pendingSwitchTarget.type === "task" &&
      pendingSwitchTarget.task
    ) {
      setSelectedActivityId(null);
      setSelectedBackpackItemId(null);
      startFocusTask(pendingSwitchTarget.task);
    }
    setPendingSwitchTarget(null);
  };

  const handleChangeMode = (newMode: FocusRecordType) => {
    if (newMode === mode) return;

    if (hasUnsavedWorkSession) {
      setPendingSwitchMode(newMode);
      return;
    }

    changeMode(newMode);
  };

  const handleConfirmSwitchMode = () => {
    if (!pendingSwitchMode) return;
    changeMode(pendingSwitchMode);
    setPendingSwitchMode(null);
  };

  const handleDeleteRecord = async (
    recordId: string,
    deleteHistory: boolean,
  ) => {
    await executeDeleteFocusRecord(
      recordId,
      {
        success: t("deleteRecordSuccess"),
        error: t("deleteRecordError"),
      },
      undefined,
      deleteHistory,
    );
  };

  const handleOpenManualRecordModal = (params?: {
    activityId?: string;
    itemId?: string;
  }) => {
    setManualInitialActivityId(
      params?.activityId ?? selectedActivityId ?? undefined,
    );
    setManualInitialItemId(params?.itemId);
    setManualRecordModalOpen(true);
  };

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
          initialCreateActivity={initialCreateActivity}
        />
      </div>

      {/* Sidebar Direita de Visão Geral, Gráfico e Histórico */}
      <FocusSidebarRight
        metrics={metrics}
        weeklyDays={weeklyDays}
        totalWeekMinutes={totalWeekMinutes}
        recentRecords={recentRecords}
        weekOffset={weekOffset}
        weekLabel={weekLabel}
        weekDateRange={weekDateRange}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onResetWeek={handleResetWeek}
        onAddRecord={() => handleOpenManualRecordModal()}
        onOptionsClick={() => router.push("/history?tab=FOCUS")}
        onDeleteRecord={handleDeleteRecord}
        selectedActivityName={selectedActivity?.name}
        onClearSelectedActivity={() => handleSelectActivity(null)}
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
          records={initialRecords}
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
