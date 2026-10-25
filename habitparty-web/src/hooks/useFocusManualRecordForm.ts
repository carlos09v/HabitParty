"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createFocusRecord } from "@/actions/focusActions";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { getTodayDateString, toLocalISOString } from "@/utils/date";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";
import { toLocalDateKey } from "@/utils/focusMetrics";
import {
  calculateFocusRewardEstimate,
  toFocusRewardEstimate,
} from "@/utils/focusRewards";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusManualRecordFormParams {
  isOpen: boolean;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  records?: FocusRecord[];
  initialActivityId?: string;
  initialItemId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Hook de controle do formulário de inserção manual de foco.
 * Otimizado com estado inicial síncrono, useTransition e integração de recompensas unificada.
 */
export function useFocusManualRecordForm({
  activities,
  backpackItems,
  records = [],
  initialActivityId,
  initialItemId,
  onSuccess,
  onClose,
}: UseFocusManualRecordFormParams) {
  const isPremium = useUserStore((s) => s.is_Premium);
  const [isPending, startTransition] = useTransition();

  const selectableActivities = useMemo(() => {
    return isPremium
      ? activities
      : activities.slice(0, MAX_FOCUS_ACTIVITIES_FREE);
  }, [activities, isPremium]);

  // Inicialização de estado síncrona sem necessidade de useEffect
  const [targetType, setTargetType] = useState<"ACTIVITY" | "ITEM">(() =>
    initialItemId ? "ITEM" : "ACTIVITY",
  );

  const [selectedActivityId, setSelectedActivityId] = useState<string>(() => {
    if (
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
    ) {
      return initialActivityId;
    }
    return selectableActivities[0]?.id ?? "";
  });

  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialItemId) return initialItemId;
    return backpackItems[0]?.inventoryItemId ?? "";
  });

  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");

  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (initialItemId) {
      const item = backpackItems.find(
        (b) => b.inventoryItemId === initialItemId,
      );
      const mins = getItemRemainingMinutes(item?.remainingSeconds);
      if (mins > 0) return mins;
    }
    const validInitId =
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
        ? initialActivityId
        : selectableActivities[0]?.id;
    const act = selectableActivities.find((a) => a.id === validInitId);
    return act?.targetTimeMinutes || 35;
  });

  const [completedPomos, setCompletedPomos] = useState<number>(() => {
    const validInitId =
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
        ? initialActivityId
        : selectableActivities[0]?.id;
    const act = selectableActivities.find((a) => a.id === validInitId);
    if (act?.targetTimeMinutes && act.targetTimeMinutes > 45) {
      return Math.max(1, Math.round(act.targetTimeMinutes / 30));
    }
    return 1;
  });

  const [sessionDate, setSessionDate] = useState<string>(getTodayDateString);
  const [notes, setNotes] = useState("");

  const selectedItem = useMemo(() => {
    return backpackItems.find((b) => b.inventoryItemId === selectedItemId);
  }, [backpackItems, selectedItemId]);

  const selectedItemMinutes = useMemo(() => {
    return getItemRemainingMinutes(selectedItem?.remainingSeconds);
  }, [selectedItem]);

  const selectedActivity = useMemo(() => {
    return selectableActivities.find((a) => a.id === selectedActivityId);
  }, [selectableActivities, selectedActivityId]);

  // Minutos já focados na data selecionada (para avisar sobre soft/hard cap diário no preview)
  const priorFocusMinutesForDate = useMemo(() => {
    if (!sessionDate || records.length === 0) return 0;
    return records.reduce((sum, rec) => {
      if (rec.inventoryItemId) return sum;
      if (toLocalDateKey(rec.endTime) !== sessionDate) return sum;
      return sum + (rec.durationMinutes || 0);
    }, 0);
  }, [records, sessionDate]);

  const estimatedRewards = useMemo(() => {
    return calculateFocusRewardEstimate(
      targetType,
      recordType,
      durationMinutes,
      completedPomos,
      priorFocusMinutesForDate,
    );
  }, [
    targetType,
    recordType,
    durationMinutes,
    completedPomos,
    priorFocusMinutesForDate,
  ]);

  const rewardEstimate = useMemo(() => {
    return toFocusRewardEstimate(estimatedRewards, {
      durationMinutes,
      completedPomos,
      recordType,
    });
  }, [estimatedRewards, durationMinutes, completedPomos, recordType]);

  const handleTargetTypeChange = (type: "ACTIVITY" | "ITEM") => {
    setTargetType(type);
    if (type === "ITEM") {
      const item =
        backpackItems.find((b) => b.inventoryItemId === selectedItemId) ??
        backpackItems[0];
      if (item) {
        setSelectedItemId(item.inventoryItemId || "");
        const mins = getItemRemainingMinutes(item.remainingSeconds);
        if (mins > 0) setDurationMinutes(mins);
      }
    }
  };

  const handleSelectActivity = (actId: string) => {
    setSelectedActivityId(actId);
    const act = selectableActivities.find((a) => a.id === actId);
    if (act?.targetTimeMinutes) {
      setDurationMinutes(act.targetTimeMinutes);
      if (recordType === "POMO") {
        setCompletedPomos(
          act.targetTimeMinutes <= 45
            ? 1
            : Math.max(1, Math.round(act.targetTimeMinutes / 30)),
        );
      }
    }
  };

  const handleSelectBackpackItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = backpackItems.find((b) => b.inventoryItemId === itemId);
    const itemMins = getItemRemainingMinutes(item?.remainingSeconds);
    if (itemMins > 0) {
      setDurationMinutes(itemMins);
    }
  };

  const handlePresetSelect = (minutes: number) => {
    setDurationMinutes(minutes);
    if (recordType === "POMO") {
      if (minutes <= 45) {
        setCompletedPomos(1);
      } else if (minutes <= 60) {
        setCompletedPomos(2);
      } else {
        setCompletedPomos(Math.max(1, Math.round(minutes / 30)));
      }
    }
  };

  const handleCompletedPomosStep = (delta: number) => {
    setCompletedPomos((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === "ACTIVITY" && !selectedActivityId) {
      toast.error("Selecione uma atividade para vincular o registro.");
      return;
    }

    if (targetType === "ITEM" && !selectedItemId) {
      toast.error("Sem itens disponíveis na mochila para vincular.");
      return;
    }

    if (durationMinutes <= 0) {
      toast.error("A duração precisa ser maior que 0 minutos.");
      return;
    }

    if (
      targetType === "ITEM" &&
      selectedItemMinutes > 0 &&
      durationMinutes > selectedItemMinutes
    ) {
      toast.error(
        `A duração não pode exceder o tempo restante do item (${selectedItemMinutes}m).`,
      );
      return;
    }

    startTransition(async () => {
      try {
        const now = new Date();
        const todayStr = getTodayDateString();
        let endDate: Date;

        if (sessionDate) {
          const [y, m, d] = sessionDate.split("-").map(Number);
          if (sessionDate === todayStr) {
            endDate = new Date(
              y,
              m - 1,
              d,
              now.getHours(),
              now.getMinutes(),
              now.getSeconds(),
            );
          } else {
            // Datas retroativas usam fim de tarde como referência para não vazar para o dia anterior na madrugada
            endDate = new Date(y, m - 1, d, 18, 0, 0);
          }

          // Garante que o startDate permaneça dentro da própria data escolhida (exceto sessões > 24h)
          const dayStart = new Date(y, m - 1, d, 0, 0, 0);
          const dayEnd = new Date(y, m - 1, d, 23, 59, 0);
          const candidateStart = new Date(
            endDate.getTime() - durationMinutes * 60 * 1000,
          );
          if (candidateStart < dayStart && durationMinutes < 1440) {
            const shiftedEnd = new Date(
              dayStart.getTime() + durationMinutes * 60 * 1000,
            );
            endDate = shiftedEnd <= dayEnd ? shiftedEnd : dayEnd;
          }
        } else {
          endDate = now;
        }

        const startDate = new Date(
          endDate.getTime() - durationMinutes * 60 * 1000,
        );
        const startTime = toLocalISOString(startDate);
        const endTime = toLocalISOString(endDate);

        const res = await createFocusRecord({
          focusActivityId:
            targetType === "ACTIVITY" ? selectedActivityId : undefined,
          inventoryItemId: targetType === "ITEM" ? selectedItemId : undefined,
          recordType: targetType === "ITEM" ? "STOPWATCH" : recordType,
          completedPomos:
            targetType !== "ITEM" && recordType === "POMO" ? completedPomos : 0,
          startTime,
          endTime,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          const xp = Number(res.data?.xpEarned ?? 0);
          const coins = Number(res.data?.coinsEarned ?? 0);

          if (targetType === "ACTIVITY") {
            const rewardResult = awardUserRewards(xp, coins);
            if (!rewardResult.didLevelUp) {
              soundEffects.playCreateSound();
              if (xp > 0 || coins > 0) {
                toast.success(
                  `Registro salvo! (+${xp} XP • +${coins.toFixed(2)} 🪙)`,
                );
              } else {
                toast.success("Registro de foco adicionado com sucesso!");
              }
            }
          } else {
            soundEffects.playCreateSound();
            toast.success("Tempo do item registrado com sucesso!");
          }

          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Falha ao registrar sessão de foco.");
        }
      } catch {
        toast.error("Ocorreu um erro ao salvar o registro manual.");
      }
    });
  };

  return {
    isPremium,
    selectableActivities,
    targetType,
    handleTargetTypeChange,
    selectedActivityId,
    handleSelectActivity,
    selectedItemId,
    handleSelectBackpackItem,
    recordType,
    setRecordType,
    durationMinutes,
    setDurationMinutes,
    completedPomos,
    setCompletedPomos,
    sessionDate,
    setSessionDate,
    notes,
    setNotes,
    isSubmitting: isPending,
    selectedItem,
    selectedItemMinutes,
    selectedActivity,
    rewardEstimate,
    handlePresetSelect,
    handleCompletedPomosStep,
    handleSubmit,
  };
}
