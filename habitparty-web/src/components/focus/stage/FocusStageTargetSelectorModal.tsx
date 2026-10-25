"use client";

import { ArrowRightLeft, Backpack, Layers, Lock } from "lucide-react";
import { useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { getFocusIcon, MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type { FocusActivity } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";

export interface FocusStageTargetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  currentTargetId?: string;
  onSelectActivity?: (activity: FocusActivity) => void;
  onSelectBackpackItem?: (item: InventoryItemResponseDTO) => void;
  onOpenUpgradeModal?: () => void;
}

export function FocusStageTargetSelectorModal({
  isOpen,
  onClose,
  activities,
  backpackItems,
  currentTargetId,
  onSelectActivity,
  onSelectBackpackItem,
  onOpenUpgradeModal,
}: FocusStageTargetSelectorModalProps) {
  const [selectorTab, setSelectorTab] = useState<"ACTIVITIES" | "BACKPACK">(
    "ACTIVITIES",
  );
  const isPremium = useUserStore((s) => s.is_Premium);

  const activeActivities = activities;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular ao Timer"
      description="Selecione onde contabilizar sua sessão de foco."
      headerExtra={
        <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
          <ArrowRightLeft size={16} />
        </div>
      }
    >
      <div className="flex flex-col gap-3 mt-1">
        {/* Abas: Atividades vs Mochila */}
        <div className="flex items-center rounded-xl bg-surface/90 p-1 border border-primary/30 w-full">
          <button
            type="button"
            onClick={() => setSelectorTab("ACTIVITIES")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              selectorTab === "ACTIVITIES"
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            <Layers size={13} />
            <span>Atividades ({activeActivities.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectorTab("BACKPACK")}
            className={cn(
              "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              selectorTab === "BACKPACK"
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            <Backpack size={13} />
            <span>Mochila ({backpackItems.length})</span>
          </button>
        </div>

        {/* Lista de Conteúdo */}
        <div className="overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1 max-h-[340px]">
          {selectorTab === "ACTIVITIES" ? (
            activeActivities.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-primary/30 rounded-xl">
                Nenhuma atividade cadastrada. Crie uma na tela principal.
              </div>
            ) : (
              activeActivities.map((act, index) => {
                const IconComp = getFocusIcon(act.icon);
                const isCurrent = currentTargetId === act.id;
                const isLocked =
                  !isPremium && index >= MAX_FOCUS_ACTIVITIES_FREE;

                return (
                  <div
                    key={act.id}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      isLocked
                        ? "bg-neutral-900/40 border-gold/30 opacity-80"
                        : isCurrent
                          ? "bg-gold/15 border-gold/60 text-gold"
                          : "bg-surface/60 border-primary/20 hover:border-gold/40 hover:bg-surface",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                          isLocked
                            ? "bg-gold/15 text-gold border-gold/30"
                            : "bg-primary-dark/40 border-primary/30 text-primary-light",
                        )}
                      >
                        {isLocked ? <Lock size={15} /> : <IconComp size={16} />}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-xs font-bold truncate",
                            isLocked ? "text-neutral-300" : "text-neutral-100",
                          )}
                        >
                          {act.name}
                        </span>
                        <span className="text-tiny text-neutral-400">
                          {isLocked
                            ? "Pausada"
                            : act.recordType === "POMO"
                              ? `Pomodoro (${act.targetTimeMinutes || 35}m)`
                              : "Cronômetro Livre"}
                        </span>
                      </div>
                    </div>

                    {isLocked ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenUpgradeModal?.();
                        }}
                        title="Atividade pausada. Reative o plano Premium para cronometrar nesta atividade!"
                        className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 flex items-center gap-1 shadow-glow-gold-xs"
                      >
                        <Lock size={12} />
                        <span>Pausada 👑</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          if (isCurrent) return;
                          onSelectActivity?.(act);
                          onClose();
                        }}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                          isCurrent
                            ? "bg-gold text-neutral-900 shadow-glow-gold-xs cursor-default"
                            : "bg-surface/80 hover:bg-gold/20 text-neutral-300 hover:text-gold border border-primary/30 cursor-pointer",
                        )}
                      >
                        {isCurrent ? "Selecionado" : "Vincular"}
                      </button>
                    )}
                  </div>
                );
              })
            )
          ) : backpackItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-primary/30 rounded-xl">
              Nenhum item ou cupom em foco. Acesse a mochila para enviar itens
              ao foco.
            </div>
          ) : (
            backpackItems.map((item) => {
              const isCurrent = currentTargetId === item.inventoryItemId;
              const remainingMinutes = getItemRemainingMinutes(
                item.remainingSeconds,
              );

              return (
                <div
                  key={item.inventoryItemId}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                    isCurrent
                      ? "bg-gold/15 border-gold/60 text-gold"
                      : "bg-surface/60 border-primary/20 hover:border-gold/40 hover:bg-surface",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-dark/40 border border-primary/30 flex items-center justify-center text-primary-light shrink-0">
                      <Backpack size={16} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-neutral-100 truncate">
                        {item.rewardName || "Item de Foco"}
                      </span>
                      <span className="text-tiny text-neutral-400">
                        {remainingMinutes > 0
                          ? `${remainingMinutes}m restantes de saldo`
                          : "Cupom com tempo concluído"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      if (isCurrent) return;
                      onSelectBackpackItem?.(item);
                      onClose();
                    }}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0",
                      isCurrent
                        ? "bg-gold text-neutral-900 shadow-glow-gold-xs cursor-default"
                        : "bg-surface/80 hover:bg-gold/20 text-neutral-300 hover:text-gold border border-primary/30 cursor-pointer",
                    )}
                  >
                    {isCurrent ? "Selecionado" : "Vincular"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseModal>
  );
}
