"use client";

import { BarChart2, Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useFocusAnalytics } from "@/hooks/useFocusAnalytics";
import { executeDeleteFocusRecord } from "@/hooks/useFocusMutations";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
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

interface FocusContainerProps {
  initialActivities: FocusActivity[];
  initialBackpackItems: InventoryItemResponseDTO[];
  initialRecords: FocusRecord[];
  initialSelectedActivityId?: string | null;
  initialCreateActivity?: boolean;
  isCompact?: boolean;
}

export function FocusContainer({
  initialActivities,
  initialBackpackItems,
  initialRecords,
  initialSelectedActivityId = null,
  initialCreateActivity = false,
  isCompact: propIsCompact,
}: FocusContainerProps) {
  const t = useTranslations("focus.container");
  const router = useRouter();
  const is_Premium = useUserStore((s) => s.is_Premium);
  const { isCompact: storeIsCompact } = useCompactMode();

  const isCompact = propIsCompact ?? storeIsCompact;

  // Atividade selecionada para filtro de métricas (não interfere no timer ativo)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    initialSelectedActivityId,
  );

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
    type: "activity" | "item";
    activity?: FocusActivity;
    item?: InventoryItemResponseDTO;
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
    selectActivityTarget,
    resetTarget,
    transferTarget,
    syncTargetMetadata,
    completeSession,
  } = useFocusTimerControls({
    onSessionSaved: () => {
      setSelectedActivityId(null);
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

  // Sincroniza o alvo com os dados reais do servidor
  useEffect(() => {
    if (!target) {
      if (!isActive && !hasElapsedSeconds && initialActivities.length > 0) {
        selectActivityTarget(initialActivities[0]);
        setSelectedActivityId(initialActivities[0].id);
      }
      return;
    }

    if (target.type === "inventory") {
      const currentItem = initialBackpackItems.find(
        (item) => item.inventoryItemId === target.id,
      );
      if (!currentItem) {
        resetTarget();
        if (initialActivities.length > 0) {
          selectActivityTarget(initialActivities[0]);
          setSelectedActivityId(initialActivities[0].id);
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
        if (initialActivities.length > 0) {
          selectActivityTarget(initialActivities[0]);
          setSelectedActivityId(initialActivities[0].id);
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
    }
  }, [
    target,
    isActive,
    hasElapsedSeconds,
    initialBackpackItems,
    initialActivities,
    is_Premium,
    resetTarget,
    selectActivityTarget,
    syncTargetMetadata,
  ]);

  const handleSelectActivity = (activityId: string | null) => {
    setSelectedActivityId(activityId);

    if (!isActive && !hasElapsedSeconds && activityId) {
      const actIndex = initialActivities.findIndex((a) => a.id === activityId);
      const isActLocked = !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
      if (actIndex !== -1 && !isActLocked) {
        selectActivityTarget(initialActivities[actIndex]);
      }
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
    startFocusActivity(act);
  };

  const handleStartFocusItem = (item: InventoryItemResponseDTO) => {
    if (target?.id === item.inventoryItemId && hasUnsavedWorkSession) {
      setSelectedActivityId(null);
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
    startFocusItem(item);
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
    } else if (targetToStart.item) {
      setSelectedActivityId(null);
      startFocusItem(targetToStart.item);
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
    } else if (pendingSwitchTarget.item) {
      setSelectedActivityId(null);
      startFocusItem(pendingSwitchTarget.item);
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

  const handleDeleteRecord = async (recordId: string) => {
    await executeDeleteFocusRecord(recordId, {
      success: t("deleteRecordSuccess"),
      error: t("deleteRecordError"),
    });
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
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
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
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer",
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
          isPremium={is_Premium}
          selectedActivityId={selectedActivityId}
          onSelectActivity={handleSelectActivity}
          onStartFocusActivity={handleStartFocusActivity}
          onStartFocusItem={handleStartFocusItem}
          onChangeMode={handleChangeMode}
          onOpenManualRecord={handleOpenManualRecordModal}
          initialCreateActivity={initialCreateActivity}
          isCompact={isCompact}
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
        isCompact={isCompact}
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
              : pendingSwitchTarget?.item?.rewardName ||
                t("fallbacks.focusItem")
          }
          isCurrentInventory={target?.type === "inventory"}
          isNewInventory={pendingSwitchTarget?.type === "item"}
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
