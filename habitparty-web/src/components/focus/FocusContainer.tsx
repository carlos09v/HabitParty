"use client";

import { BarChart2, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteFocusRecordAction } from "@/actions/focusActions";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { calculateFocusMetrics } from "@/utils/focusMetrics";
import { FocusMain } from "./FocusMain";
import { FocusManualRecordModal } from "./modals/FocusManualRecordModal";
import { SwitchFocusTargetModal } from "./modals/SwitchFocusTargetModal";
import { SwitchTimerModeModal } from "./modals/SwitchTimerModeModal";
import { FocusSidebarRight } from "./sidebar-right/FocusSidebarRight";

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

  // Deslocamento da semana para o gráfico semanal (0 = Esta semana, -1 = semana passada...)
  const [weekOffset, setWeekOffset] = useState(0);

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

  // Controles e ações do timer desacoplados de variáveis de ticking a cada segundo.
  // Evita re-renders a cada 1 segundo em toda a árvore de FocusContainer!
  const {
    isActive,
    mode,
    target,
    hasElapsedSeconds,
    changeMode,
    startFocusActivity,
    startFocusItem,
    selectActivityTarget,
    resetTarget,
    transferTarget,
    completeSession,
  } = useFocusTimerControls({
    onSessionSaved: () => {
      setSelectedActivityId(null);
      router.refresh();
    },
  });

  // Sincroniza o alvo com os dados reais do servidor: se o alvo for item da mochila que não existe mais
  // (ou se foi consumido), desvincula imediatamente para não deixar o Hero com alvo fantasma.
  useEffect(() => {
    if (!target) {
      if (!isActive && !hasElapsedSeconds && initialActivities.length > 0) {
        selectActivityTarget(initialActivities[0]);
        setSelectedActivityId(initialActivities[0].id);
      }
      return;
    }

    if (target.type === "inventory") {
      const existsInBackpack = initialBackpackItems.some(
        (item) => item.inventoryItemId === target.id,
      );
      if (!existsInBackpack) {
        resetTarget();
        if (initialActivities.length > 0) {
          selectActivityTarget(initialActivities[0]);
          setSelectedActivityId(initialActivities[0].id);
        }
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
  ]);

  // Ao selecionar uma atividade apenas para ver métricas/registros:
  // Se o cronômetro estiver em andamento ou pausado com tempo decorrido, NUNCA reseta o timer!
  const handleSelectActivity = (activityId: string | null) => {
    setSelectedActivityId(activityId);

    // Só define o alvo ocioso se não houver sessão ativa nem tempo decorrido
    if (!isActive && !hasElapsedSeconds && activityId) {
      const act = initialActivities.find((a) => a.id === activityId);
      if (act) {
        selectActivityTarget(act);
      }
    }
  };

  const handleStartFocusActivity = (act: FocusActivity) => {
    const actIndex = initialActivities.findIndex((a) => a.id === act.id);
    if (!is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE) {
      toast.error(
        "Esta atividade está guardada na mochila. Assine o plano Premium para cronometrar nela!",
      );
      return;
    }

    // Se o timer estiver em andamento ou pausado com tempo não salvo em outro alvo
    if ((isActive || hasElapsedSeconds) && target?.id !== act.id) {
      setPendingSwitchTarget({ type: "activity", activity: act });
      return;
    }
    setSelectedActivityId(act.id);
    startFocusActivity(act);
  };

  const handleStartFocusItem = (item: InventoryItemResponseDTO) => {
    // Se o timer estiver em andamento ou pausado com tempo não salvo em outro alvo
    if (
      (isActive || hasElapsedSeconds) &&
      target?.id !== item.inventoryItemId
    ) {
      setPendingSwitchTarget({ type: "item", item });
      return;
    }
    setSelectedActivityId(null);
    startFocusItem(item);
  };

  // Opção 1: Transferir tempo decorrido para a nova atividade sem reiniciar
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

  // Opção 2: Salvar a sessão atual e iniciar o novo foco do zero
  const handleSaveAndStartNew = async () => {
    const targetToStart = pendingSwitchTarget;
    if (!targetToStart) return;

    const saved = await completeSession();
    if (saved) {
      if (targetToStart.type === "activity" && targetToStart.activity) {
        setSelectedActivityId(targetToStart.activity.id);
        startFocusActivity(targetToStart.activity);
      } else if (targetToStart.item) {
        setSelectedActivityId(null);
        startFocusItem(targetToStart.item);
      }
    }
    setPendingSwitchTarget(null);
  };

  // Opção 3: Descartar a sessão atual e iniciar o novo foco do zero
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

    // Se o timer estiver em andamento ou tiver tempo decorrido não salvo, solicita confirmação
    if (isActive || hasElapsedSeconds) {
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
    const res = await deleteFocusRecordAction(recordId);
    if (res.success) {
      toast.success("Registro de foco removido com sucesso!");
      router.refresh();
    } else {
      toast.error(res.error || "Erro ao excluir registro de foco.");
    }
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

  // Atividade selecionada e registros relevantes filtrados
  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) return null;
    return initialActivities.find((a) => a.id === selectedActivityId) || null;
  }, [initialActivities, selectedActivityId]);

  const relevantRecords = useMemo(() => {
    if (!selectedActivityId) return initialRecords;
    return initialRecords.filter(
      (r) => r.focusActivityId === selectedActivityId,
    );
  }, [initialRecords, selectedActivityId]);

  // Cálculo determinístico das métricas e dados semanais
  const { metrics, weeklyDays, totalWeekMinutes, weekLabel, weekDateRange } =
    useMemo(() => {
      return calculateFocusMetrics(relevantRecords, weekOffset);
    }, [relevantRecords, weekOffset]);

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
            <span>Timer & Sessão</span>
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
            <span>Métricas & Histórico</span>
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
          onRefreshData={() => router.refresh()}
          initialCreateActivity={initialCreateActivity}
          isCompact={isCompact}
        />
      </div>

      {/* Sidebar Direita de Visão Geral, Gráfico e Histórico */}
      <FocusSidebarRight
        metrics={metrics}
        weeklyDays={weeklyDays}
        totalWeekMinutes={totalWeekMinutes}
        recentRecords={relevantRecords.slice(0, 10)}
        weekOffset={weekOffset}
        weekLabel={weekLabel}
        weekDateRange={weekDateRange}
        onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
        onNextWeek={() => setWeekOffset((prev) => Math.min(0, prev + 1))}
        onResetWeek={() => setWeekOffset(0)}
        onAddRecord={() => handleOpenManualRecordModal()}
        onOptionsClick={() => router.push("/history?tab=FOCUS")}
        onDeleteRecord={handleDeleteRecord}
        onRecordUpdated={() => router.refresh()}
        selectedActivityName={selectedActivity?.name}
        onClearSelectedActivity={() => handleSelectActivity(null)}
        isCompact={isCompact}
        className={cn(
          mobileTab === "metrics" ? "flex flex-1 w-full" : "hidden xl:flex",
        )}
      />

      {/* Modal Centralizado de Inserção de Registro Manual */}
      <FocusManualRecordModal
        isOpen={manualRecordModalOpen}
        onClose={() => {
          setManualRecordModalOpen(false);
          setManualInitialActivityId(undefined);
          setManualInitialItemId(undefined);
        }}
        activities={initialActivities}
        backpackItems={initialBackpackItems}
        initialActivityId={manualInitialActivityId}
        initialItemId={manualInitialItemId}
        onSuccess={() => router.refresh()}
      />

      {/* Modal para Confirmação de Troca de Sessão Ativa (Opção 2 - Escolha Inteligente) */}
      <SwitchFocusTargetModal
        isOpen={pendingSwitchTarget !== null}
        onClose={() => setPendingSwitchTarget(null)}
        currentName={target?.name || "Sessão Atual"}
        newTargetName={
          pendingSwitchTarget?.type === "activity"
            ? pendingSwitchTarget.activity?.name || "Nova Atividade"
            : pendingSwitchTarget?.item?.rewardName || "Item de Foco"
        }
        isCurrentInventory={target?.type === "inventory"}
        isNewInventory={pendingSwitchTarget?.type === "item"}
        onTransfer={handleTransferTarget}
        onSaveAndStartNew={handleSaveAndStartNew}
        onDiscardAndStartNew={handleDiscardAndStartNew}
      />

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
