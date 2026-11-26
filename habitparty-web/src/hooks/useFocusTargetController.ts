"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focusRules";
import type { useFocusContainerTimerSlice } from "@/hooks/useFocusTimer";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { removeBrowserQueryParam } from "@/utils";

export interface PendingSwitchTarget {
  type: "activity" | "item" | "task";
  activity?: FocusActivity;
  item?: InventoryItemResponseDTO;
  task?: { id: string; title: string };
}

interface UseFocusTargetControllerParams {
  initialActivities: FocusActivity[];
  initialBackpackItems: InventoryItemResponseDTO[];
  focusableTasks: FocusableTaskItem[];
  initialSelectedActivityId?: string | null;
  initialSelectedItemId?: string | null;
  isPremium: boolean;
  isGamified: boolean;
  timer: ReturnType<typeof useFocusContainerTimerSlice>;
  filterActivityId: string | null;
  setFilterActivityId: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Controla a seleção de alvo no palco de Foco, deep-links por URL (`?activityId=` e `?itemId=`),
 * sincronização segura com dados do servidor (sem apagar sessão ativa em fetches vazios ou tarefas
 * fora de `focusableTasks`) e confirmações de troca de alvo.
 */
export function useFocusTargetController({
  initialActivities,
  initialBackpackItems,
  focusableTasks,
  initialSelectedActivityId = null,
  initialSelectedItemId = null,
  isPremium,
  isGamified,
  timer,
  filterActivityId,
  setFilterActivityId,
}: UseFocusTargetControllerParams) {
  const t = useTranslations("focus.container");

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
    unlinkTaskFromTarget,
    resetTarget,
    transferTarget,
    syncTargetMetadata,
    completeSession,
  } = timer;

  const urlActivityId = initialSelectedActivityId || null;
  const urlItemId = initialSelectedItemId || null;

  const [consumedUrlItemId, setConsumedUrlItemId] = useState<string | null>(
    null,
  );
  const [selectedBackpackItemId, setSelectedBackpackItemId] = useState<
    string | null
  >(() =>
    urlItemId &&
    initialBackpackItems.some((item) => item.inventoryItemId === urlItemId)
      ? urlItemId
      : null,
  );
  const lastAppliedUrlActivityIdRef = useRef<string | null>(null);
  const lastAppliedUrlItemIdRef = useRef<string | null>(null);

  const [pendingSwitchTarget, setPendingSwitchTarget] =
    useState<PendingSwitchTarget | null>(null);

  const clearActivityQueryParam = useCallback(() => {
    removeBrowserQueryParam("activityId");
  }, []);

  const hasUnsavedWorkSession = phase === "WORK" && hasElapsedSeconds;
  const hasPendingUrlItemId =
    Boolean(urlItemId) &&
    consumedUrlItemId !== urlItemId &&
    initialBackpackItems.some((item) => item.inventoryItemId === urlItemId);

  // Limpa automaticamente modal pendente caso a sessão ativa encerre externamente (ex.: PiP ou outra aba)
  useEffect(() => {
    if (pendingSwitchTarget && !hasUnsavedWorkSession) {
      setPendingSwitchTarget(null);
    }
  }, [pendingSwitchTarget, hasUnsavedWorkSession]);

  // Deep-link via URL: /focus?itemId=... (ex.: "Abrir no Foco" no Inventário)
  useEffect(() => {
    if (!urlItemId) {
      lastAppliedUrlItemIdRef.current = null;
      setConsumedUrlItemId(null);
      return;
    }
    if (lastAppliedUrlItemIdRef.current === urlItemId) return;

    lastAppliedUrlItemIdRef.current = urlItemId;
    setConsumedUrlItemId(urlItemId);
    removeBrowserQueryParam("itemId");

    const matchedItem = initialBackpackItems.find(
      (item) => item.inventoryItemId === urlItemId,
    );
    if (!matchedItem) {
      setSelectedBackpackItemId((prev) => (prev === urlItemId ? null : prev));
      return;
    }

    setSelectedBackpackItemId(urlItemId);
    setFilterActivityId(null);

    if (!isActive && !hasElapsedSeconds) {
      selectItemTarget(matchedItem);
    }
  }, [
    urlItemId,
    initialBackpackItems,
    isActive,
    hasElapsedSeconds,
    selectItemTarget,
    setFilterActivityId,
  ]);

  // Deep-link via URL: /focus?activityId=... (ex.: clique no widget do Dashboard)
  // Se o ID for inválido ou bloqueado no plano Free, limpa `filterActivityId` e o param da URL
  // para evitar sidebar vazia sem banner de "Limpar filtro".
  useEffect(() => {
    if (!urlActivityId) {
      lastAppliedUrlActivityIdRef.current = null;
      return;
    }

    if (lastAppliedUrlActivityIdRef.current === urlActivityId) {
      return;
    }

    const actIndex = initialActivities.findIndex((a) => a.id === urlActivityId);
    const isActLocked =
      actIndex !== -1 && !isPremium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
    if (actIndex === -1 || isActLocked) {
      lastAppliedUrlActivityIdRef.current = urlActivityId;
      setFilterActivityId((prev) => (prev === urlActivityId ? null : prev));
      clearActivityQueryParam();
      return;
    }

    lastAppliedUrlActivityIdRef.current = urlActivityId;
    setFilterActivityId(urlActivityId);
    setSelectedBackpackItemId(null);

    if (!isActive && !hasElapsedSeconds) {
      selectActivityTarget(initialActivities[actIndex]);
    }
  }, [
    urlActivityId,
    initialActivities,
    isPremium,
    isActive,
    hasElapsedSeconds,
    selectActivityTarget,
    setFilterActivityId,
    clearActivityQueryParam,
  ]);

  // Garante que filterActivityId nunca fique apontando para uma atividade removida
  useEffect(() => {
    if (
      filterActivityId &&
      !initialActivities.some((a) => a.id === filterActivityId)
    ) {
      setFilterActivityId(null);
      clearActivityQueryParam();
    }
  }, [
    filterActivityId,
    initialActivities,
    setFilterActivityId,
    clearActivityQueryParam,
  ]);

  // Sincroniza alvo com os dados reais do servidor (sem apagar sessão ativa em listas auxiliares ou transitórias)
  useEffect(() => {
    const preferredIndex = urlActivityId
      ? initialActivities.findIndex((a) => a.id === urlActivityId)
      : -1;
    const isPreferredValid =
      preferredIndex !== -1 &&
      (isPremium || preferredIndex < MAX_FOCUS_ACTIVITIES_FREE);
    const defaultActivity = isPreferredValid
      ? initialActivities[preferredIndex]
      : initialActivities[0];

    const isSessionInFlight = isActive || hasElapsedSeconds;

    if (!target) {
      if (!isSessionInFlight && !hasPendingUrlItemId && defaultActivity) {
        selectActivityTarget(defaultActivity);
      }
      return;
    }

    if (target.type === "inventory") {
      const currentItem = initialBackpackItems.find(
        (item) => item.inventoryItemId === target.id,
      );
      if (!currentItem) {
        if (!isSessionInFlight || initialBackpackItems.length > 0) {
          resetTarget();
          if (defaultActivity) {
            selectActivityTarget(defaultActivity);
          }
        }
      } else {
        syncTargetMetadata({
          id: currentItem.inventoryItemId,
          name: currentItem.rewardName,
          icon: currentItem.rewardIcon,
          remainingSeconds: currentItem.remainingSeconds ?? undefined,
        });
      }
    } else if (target.type === "activity") {
      const actIndex = initialActivities.findIndex(
        (act) => act.id === target.id,
      );
      const existsInActivities = actIndex !== -1;
      const isActLocked =
        existsInActivities &&
        !isPremium &&
        actIndex >= MAX_FOCUS_ACTIVITIES_FREE;

      if (!existsInActivities || isActLocked) {
        if (!isSessionInFlight || initialActivities.length > 0) {
          resetTarget();
          if (defaultActivity) {
            selectActivityTarget(defaultActivity);
          }
        }
      } else {
        const currentAct = initialActivities[actIndex];
        syncTargetMetadata({
          id: currentAct.id,
          name: currentAct.name,
          icon: currentAct.icon,
          targetMinutes: currentAct.targetTimeMinutes,
        });
        if (target.taskId) {
          const linkedTask = focusableTasks.find(
            (tItem) => tItem.id === target.taskId,
          );
          if (!linkedTask) {
            // Nunca desvincula silenciosamente uma tarefa enquanto há sessão em andamento
            if (!isSessionInFlight) {
              unlinkTaskFromTarget();
            }
          } else if (linkedTask.title !== target.taskName) {
            syncTargetMetadata({
              id: currentAct.id,
              taskId: linkedTask.id,
              taskName: linkedTask.title,
            });
          }
        }
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
      } else if (!isSessionInFlight) {
        // Nunca destrói sessão em andamento de tarefas ausentes na lista auxiliar `focusableTasks`
        resetTarget();
        if (defaultActivity) {
          selectActivityTarget(defaultActivity);
        }
      }
    }
  }, [
    target,
    urlActivityId,
    hasPendingUrlItemId,
    isActive,
    hasElapsedSeconds,
    initialBackpackItems,
    initialActivities,
    focusableTasks,
    isPremium,
    resetTarget,
    selectActivityTarget,
    syncTargetMetadata,
    unlinkTaskFromTarget,
  ]);

  /**
   * Seleciona uma atividade no palco (sem acoplar obrigatoriamente ao filtro de métricas da sidebar).
   */
  const handleSelectActivityStage = useCallback(
    (activityId: string | null) => {
      if (!activityId) {
        setFilterActivityId(null);
        clearActivityQueryParam();
        return;
      }

      setSelectedBackpackItemId(null);
      if (!isActive && !hasElapsedSeconds) {
        const actIndex = initialActivities.findIndex(
          (a) => a.id === activityId,
        );
        const isActLocked = !isPremium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
        if (actIndex !== -1 && !isActLocked) {
          selectActivityTarget(initialActivities[actIndex]);
        }
      }
    },
    [
      clearActivityQueryParam,
      isActive,
      hasElapsedSeconds,
      initialActivities,
      isPremium,
      selectActivityTarget,
      setFilterActivityId,
    ],
  );

  /**
   * Alterna explicitamente o filtro de métricas da sidebar direita por atividade.
   */
  const handleToggleActivityFilter = useCallback(
    (activityId: string | null) => {
      const next =
        activityId && filterActivityId === activityId ? null : activityId;
      setFilterActivityId(next);
      if (!next || (urlActivityId && next !== urlActivityId)) {
        clearActivityQueryParam();
      }
    },
    [
      filterActivityId,
      setFilterActivityId,
      urlActivityId,
      clearActivityQueryParam,
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
      if (!isPremium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE) {
        toast.error(
          isGamified
            ? t("lockedActivityToast")
            : t("lockedActivityToastProductivity"),
        );
        return;
      }

      if (
        target?.type === "activity" &&
        target.id === act.id &&
        hasUnsavedWorkSession
      ) {
        setSelectedBackpackItemId(null);
        syncTargetMetadata({
          id: act.id,
          name: act.name,
          icon: act.icon,
          targetMinutes: act.targetTimeMinutes,
          recordType: act.recordType,
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
      setSelectedBackpackItemId(null);
      startFocusActivity(act);
    },
    [
      initialActivities,
      isPremium,
      isGamified,
      t,
      target?.type,
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
      if (
        target?.type === "inventory" &&
        target.id === item.inventoryItemId &&
        hasUnsavedWorkSession
      ) {
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
      setSelectedBackpackItemId(item.inventoryItemId || null);
      startFocusItem(item);
    },
    [
      target?.type,
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
      // 1. Re-selecionar a mesma tarefa já em sessão ativa/pausada: retoma sem zerar elapsedSeconds!
      if (
        target?.type === "task" &&
        target.id === task.id &&
        hasUnsavedWorkSession
      ) {
        setSelectedBackpackItemId(null);
        syncTargetMetadata({
          id: task.id,
          name: task.title,
          taskId: task.id,
          taskName: task.title,
        });
        if (isPaused) {
          resumeTimer();
        }
        return;
      }

      // 2. Macro Atividade selecionada (ociosa ou sem outra tarefa vinculada): anexa a tarefa (Macro + Micro)
      if (
        target?.type === "activity" &&
        (!target.taskId || target.taskId === task.id)
      ) {
        selectTaskTarget(task);
        return;
      }

      // 3. Sem sessão em andamento: inicia foco direto na tarefa
      if (!hasUnsavedWorkSession) {
        setSelectedBackpackItemId(null);
        startFocusTask(task);
        return;
      }

      // 4. Sessão em andamento em outro alvo: pede confirmação de troca
      setPendingSwitchTarget({ type: "task", task });
    },
    [
      target,
      hasUnsavedWorkSession,
      isPaused,
      syncTargetMetadata,
      resumeTimer,
      selectTaskTarget,
      startFocusTask,
    ],
  );

  const handleTransferTarget = useCallback(() => {
    if (!pendingSwitchTarget) return;
    if (
      pendingSwitchTarget.type === "activity" &&
      pendingSwitchTarget.activity
    ) {
      transferTarget(pendingSwitchTarget.activity);
    } else if (
      pendingSwitchTarget.type === "task" &&
      pendingSwitchTarget.task
    ) {
      selectTaskTarget(pendingSwitchTarget.task);
      if (isPaused || !isActive) {
        resumeTimer();
      }
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
    (targetToStart: PendingSwitchTarget) => {
      if (targetToStart.type === "activity" && targetToStart.activity) {
        setSelectedBackpackItemId(null);
        startFocusActivity(targetToStart.activity);
      } else if (targetToStart.type === "item" && targetToStart.item) {
        setSelectedBackpackItemId(targetToStart.item.inventoryItemId || null);
        startFocusItem(targetToStart.item);
      } else if (targetToStart.type === "task" && targetToStart.task) {
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

  // O switcher Pomodoro/Cronômetro fica oculto enquanto há sessão ativa,
  // portanto changeMode atua diretamente em modo ocioso.
  const handleChangeMode = useCallback(
    (newMode: FocusRecordType) => {
      if (newMode === mode || hasUnsavedWorkSession) return;
      changeMode(newMode);
    },
    [mode, hasUnsavedWorkSession, changeMode],
  );

  return {
    selectedBackpackItemId,
    setSelectedBackpackItemId,
    pendingSwitchTarget,
    setPendingSwitchTarget,
    handleSelectActivityStage,
    handleToggleActivityFilter,
    handleSelectBackpackItem,
    handleStartFocusActivity,
    handleStartFocusItem,
    handleStartFocusTask,
    handleTransferTarget,
    handleSaveAndStartNew,
    handleDiscardAndStartNew,
    handleChangeMode,
  };
}
