"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createFocusRecordAction } from "@/actions/focusActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn, toLocalISOString } from "@/utils";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";

interface FocusManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  initialActivityId?: string;
  initialItemId?: string;
  onSuccess: () => void;
}

export function FocusManualRecordModal({
  isOpen,
  onClose,
  activities,
  backpackItems,
  initialActivityId,
  initialItemId,
  onSuccess,
}: FocusManualRecordModalProps) {
  const is_Premium = useUserStore((s) => s.is_Premium);
  const selectableActivities = useMemo(() => {
    return is_Premium
      ? activities
      : activities.slice(0, MAX_FOCUS_ACTIVITIES_FREE);
  }, [activities, is_Premium]);

  const [targetType, setTargetType] = useState<"ACTIVITY" | "ITEM" | "FREE">(
    initialItemId ? "ITEM" : initialActivityId ? "ACTIVITY" : "FREE",
  );
  const [selectedActivityId, setSelectedActivityId] = useState(
    initialActivityId || (selectableActivities[0]?.id ?? ""),
  );
  const [selectedItemId, setSelectedItemId] = useState(
    initialItemId || (backpackItems[0]?.inventoryItemId ?? ""),
  );
  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");
  const [durationMinutes, setDurationMinutes] = useState(35);
  const [completedPomos, setCompletedPomos] = useState(1);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = backpackItems.find(
    (b) => b.inventoryItemId === selectedItemId,
  );
  const selectedItemMinutes = getItemRemainingMinutes(
    selectedItem?.remainingSeconds,
  );

  // Sincroniza o tipo de alvo e IDs quando o modal abre ou props mudam
  useEffect(() => {
    if (isOpen) {
      if (initialItemId) {
        setTargetType("ITEM");
        setSelectedItemId(initialItemId);
        const item = backpackItems.find(
          (b) => b.inventoryItemId === initialItemId,
        );
        const itemMins = getItemRemainingMinutes(item?.remainingSeconds);
        if (itemMins > 0) {
          setDurationMinutes(itemMins);
        }
      } else if (initialActivityId) {
        setTargetType("ACTIVITY");
        const actIndex = activities.findIndex(
          (a) => a.id === initialActivityId,
        );
        const isLocked = !is_Premium && actIndex >= MAX_FOCUS_ACTIVITIES_FREE;
        const validId = isLocked
          ? (selectableActivities[0]?.id ?? "")
          : initialActivityId;
        setSelectedActivityId(validId);
        const act = activities.find((a) => a.id === validId);
        if (act?.targetTimeMinutes) {
          setDurationMinutes(act.targetTimeMinutes);
        }
      } else {
        setTargetType("FREE");
      }
      setNotes("");
    }
  }, [
    isOpen,
    initialActivityId,
    initialItemId,
    activities,
    backpackItems,
    is_Premium,
    selectableActivities,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsSubmitting(true);
    try {
      const now = new Date();
      const startTime = toLocalISOString(
        new Date(now.getTime() - durationMinutes * 60 * 1000),
      );
      const endTime = toLocalISOString(now);

      const res = await createFocusRecordAction({
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
        const recordData = res.data as
          | { xpEarned?: number; coinsEarned?: number }
          | undefined;
        const xp = recordData?.xpEarned ?? 0;
        const coins = recordData?.coinsEarned ?? 0;
        if (xp > 0 || coins > 0) {
          toast.success(
            `Registro salvo! (+${xp} XP • +${Number(coins).toFixed(2)} 🪙)`,
          );
        } else {
          toast.success("Registro de foco adicionado com sucesso!");
        }
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Falha ao registrar sessão de foco.");
      }
    } catch {
      toast.error("Ocorreu um erro ao salvar o registro manual.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Registro de Foco"
      description="Lance manualmente uma sessão de foco concluída no seu histórico."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* Associação: Atividade, Mochila ou Livre */}
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s text-neutral-100 font-medium">
            Vincular Sessão
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTargetType("ACTIVITY")}
              className={cn(
                "py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer truncate",
                targetType === "ACTIVITY"
                  ? "bg-gold/20 border-gold text-gold font-bold shadow-glow-gold-xs"
                  : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100 hover:border-gold/40",
              )}
            >
              Atividade
            </button>
            <button
              type="button"
              onClick={() => setTargetType("ITEM")}
              className={cn(
                "py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer truncate",
                targetType === "ITEM"
                  ? "bg-gold/20 border-gold text-gold font-bold shadow-glow-gold-xs"
                  : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100 hover:border-gold/40",
              )}
            >
              Mochila
            </button>
            <button
              type="button"
              onClick={() => setTargetType("FREE")}
              className={cn(
                "py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer truncate",
                targetType === "FREE"
                  ? "bg-gold/20 border-gold text-gold font-bold shadow-glow-gold-xs"
                  : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100 hover:border-gold/40",
              )}
            >
              Livre
            </button>
          </div>
        </div>

        {/* Select de Atividade */}
        {targetType === "ACTIVITY" && (
          <div className="flex flex-col gap-1.5">
            <Select
              id="select-activity"
              label="Selecione a Atividade"
              value={selectedActivityId}
              onChange={(val) => setSelectedActivityId(val)}
              options={selectableActivities.map((act) => ({
                value: act.id,
                label: act.name,
              }))}
            />
            {!is_Premium && activities.length > MAX_FOCUS_ACTIVITIES_FREE && (
              <span className="text-[11px] text-gold/90 font-medium px-1">
                👑 {activities.length - MAX_FOCUS_ACTIVITIES_FREE} atividade(s)
                pausadas estão indisponíveis para registro manual no plano Free.
              </span>
            )}
          </div>
        )}

        {/* Select de Item da Mochila */}
        {targetType === "ITEM" && (
          <Select
            id="select-item"
            label="Selecione o Item da Mochila"
            value={selectedItemId}
            onChange={(newId) => {
              setSelectedItemId(newId);
              const found = backpackItems.find(
                (b) => b.inventoryItemId === newId,
              );
              const foundMins = getItemRemainingMinutes(
                found?.remainingSeconds,
              );
              if (foundMins > 0) {
                setDurationMinutes(foundMins);
              }
            }}
            options={backpackItems.map((item) => {
              const mins = getItemRemainingMinutes(item.remainingSeconds);
              return {
                value: item.inventoryItemId || "",
                label: `${item.rewardName || "Item de Foco"}${mins > 0 ? ` (${mins}m restantes)` : ""}`,
              };
            })}
          />
        )}

        {/* Modo Pomodoro vs Cronômetro (apenas para Atividade ou Livre) */}
        {targetType !== "ITEM" && (
          <div className="flex flex-col gap-1.5">
            <span className="text-body-s text-neutral-100 font-medium">
              Tipo de Modo
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecordType("POMO")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  recordType === "POMO"
                    ? "bg-gold/20 border-gold text-gold font-bold shadow-glow-gold-xs"
                    : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100",
                )}
              >
                Pomodoro
              </button>
              <button
                type="button"
                onClick={() => setRecordType("STOPWATCH")}
                className={cn(
                  "py-2 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                  recordType === "STOPWATCH"
                    ? "bg-gold/20 border-gold text-gold font-bold shadow-glow-gold-xs"
                    : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-neutral-100",
                )}
              >
                Cronômetro
              </button>
            </div>
          </div>
        )}

        {/* Duração e Ciclos */}
        {targetType === "ITEM" ? (
          <div className="flex flex-col gap-1.5">
            <Input
              id="duration-minutes"
              label={`Duração a debitar (${selectedItemMinutes}m disponíveis)`}
              type="number"
              min={1}
              max={selectedItemMinutes > 0 ? selectedItemMinutes : undefined}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
            {selectedItem && (
              <span className="text-label-g text-gold/90 font-medium px-1">
                Saldo atual do cupom: {selectedItemMinutes} minutos restantes.
              </span>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              recordType === "POMO" ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <Input
              id="duration-minutes"
              label="Duração (minutos)"
              type="number"
              min={1}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />

            {recordType === "POMO" && (
              <Input
                id="completed-pomos"
                label="Ciclos Concluídos"
                type="number"
                min={0}
                max={50}
                value={completedPomos}
                onChange={(e) => setCompletedPomos(Number(e.target.value))}
              />
            )}
          </div>
        )}

        {/* Notas */}
        <Input
          id="record-notes"
          label="Anotações / Observações"
          placeholder="Ex: Concluído capítulo 4 de Matemática..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Ações */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-gold text-neutral-900 hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Registrando..." : "Salvar Registro"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
