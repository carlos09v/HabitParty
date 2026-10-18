"use client";

import { Timer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createFocusRecordAction,
  deleteFocusActivityAction,
} from "@/actions/focusActions";
import {
  consumeInventoryItem,
  returnItemToBackpack,
} from "@/actions/inventoryActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useFocusContextMenu } from "@/hooks/useFocusContextMenu";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { toLocalISOString } from "@/utils/date";
import { formatBackpackItemRemainingTime } from "@/utils/focusFormatters";
import { soundEffects } from "@/utils/soundEffects";
import { FocusActivitiesSection } from "./FocusActivitiesSection";
import { FocusBackpackSection } from "./FocusBackpackSection";
import { FocusHeroStage } from "./FocusHeroStage";
import { FocusActivityModal } from "./modals/FocusActivityModal";

interface FocusMainProps {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  isPremium?: boolean;
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string | null) => void;
  onStartFocusActivity: (act: FocusActivity) => void;
  onStartFocusItem: (item: InventoryItemResponseDTO) => void;
  onOpenManualRecord?: (params: {
    activityId?: string;
    itemId?: string;
  }) => void;
  onRefreshData: () => void;
  initialCreateActivity?: boolean;
  isCompact?: boolean;
  onChangeMode?: (mode: FocusRecordType) => void;
}

export function FocusMain({
  activities,
  backpackItems,
  isPremium = false,
  selectedActivityId,
  onSelectActivity,
  onStartFocusActivity,
  onStartFocusItem,
  onOpenManualRecord,
  onRefreshData,
  initialCreateActivity = false,
  isCompact: propIsCompact,
  onChangeMode,
}: FocusMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const controls = useFocusTimerControls();
  const { isCompact: storeIsCompact } = useCompactMode();

  const isCompact = propIsCompact ?? storeIsCompact;
  const { isActive, isPaused, target } = controls;
  const isTimerRunning = isActive && !isPaused;

  // Modais de Criação/Edição de Atividade
  const [activityModalOpen, setActivityModalOpen] = useState(
    Boolean(initialCreateActivity),
  );
  const [editingActivity, setEditingActivity] = useState<FocusActivity | null>(
    null,
  );

  useEffect(() => {
    if (
      initialCreateActivity ||
      searchParams.get("createActivity") === "true"
    ) {
      setEditingActivity(null);
      setActivityModalOpen(true);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("createActivity")) {
          url.searchParams.delete("createActivity");
          window.history.replaceState(
            null,
            "",
            url.pathname + (url.search ? url.search : ""),
          );
        }
      }
      const params = new URLSearchParams(searchParams.toString());
      if (params.has("createActivity")) {
        params.delete("createActivity");
        const nextUrl = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname;
        router.replace(nextUrl, { scroll: false });
      }
    }
  }, [initialCreateActivity, searchParams, pathname, router]);

  // Modal de Confirmação para Devolver Item da Mochila
  const [returnModalItem, setReturnModalItem] =
    useState<InventoryItemResponseDTO | null>(null);
  const [isReturningToBackpack, setIsReturningToBackpack] = useState(false);

  // Modal de Confirmação para Excluir Atividade
  const [deleteModalActivity, setDeleteModalActivity] =
    useState<FocusActivity | null>(null);
  const [isDeletingActivity, setIsDeletingActivity] = useState(false);

  // Hook desacoplado de menu de contexto
  const { contextMenu, openActivityMenu, openItemMenu, closeMenu, menuItems } =
    useFocusContextMenu({
      onStartFocusActivity: (act) => {
        onSelectActivity?.(act.id);
        onStartFocusActivity(act);
      },
      onStartFocusItem: (item) => {
        onSelectActivity?.(null);
        onStartFocusItem(item);
      },
      onEditActivity: (act) => {
        setEditingActivity(act);
        setActivityModalOpen(true);
      },
      onAddManualRecord: (params) => {
        onOpenManualRecord?.(params);
      },
      onRequestReturnToBackpack: (item) => {
        setReturnModalItem(item);
      },
      onRequestDeleteActivity: (act) => {
        setDeleteModalActivity(act);
      },
      onRefreshData,
    });

  const handleConfirmDeleteActivity = async () => {
    if (!deleteModalActivity) return;
    setIsDeletingActivity(true);
    try {
      const res = await deleteFocusActivityAction(
        deleteModalActivity.id,
        false,
      );
      if (res.success) {
        if (selectedActivityId === deleteModalActivity.id) {
          onSelectActivity?.(null);
        }
        if (target?.id === deleteModalActivity.id) {
          controls.resetTarget();
          const remainingActivities = activities.filter(
            (a) => a.id !== deleteModalActivity.id,
          );
          if (remainingActivities.length > 0) {
            controls.selectActivityTarget(remainingActivities[0]);
            onSelectActivity?.(remainingActivities[0].id);
          } else {
            onSelectActivity?.(null);
          }
        }
        toast.success("Atividade excluída com sucesso.");
        setDeleteModalActivity(null);
        onRefreshData();
      } else {
        toast.error(res.error || "Erro ao excluir atividade.");
      }
    } catch {
      toast.error("Erro ao excluir atividade.");
    } finally {
      setIsDeletingActivity(false);
    }
  };

  const handleConfirmReturnToBackpack = async () => {
    if (!returnModalItem?.inventoryItemId) return;
    setIsReturningToBackpack(true);
    try {
      const res = await returnItemToBackpack(returnModalItem.inventoryItemId);
      if (res.success) {
        if (target?.id === returnModalItem.inventoryItemId) {
          controls.resetTarget();
          if (activities.length > 0) {
            controls.selectActivityTarget(activities[0]);
            onSelectActivity?.(activities[0].id);
          } else {
            onSelectActivity?.(null);
          }
        }
        toast.success("Item devolvido para a mochila.");
        setReturnModalItem(null);
        onRefreshData();
      } else {
        toast.error(res.error || "Erro ao devolver item para a mochila.");
      }
    } catch {
      toast.error("Erro ao devolver item para a mochila.");
    } finally {
      setIsReturningToBackpack(false);
    }
  };

  const handleConsumeItem = async (item: InventoryItemResponseDTO) => {
    if (!item.inventoryItemId) return;
    try {
      if (item.remainingSeconds && item.remainingSeconds > 0) {
        const now = new Date();
        const endTime = toLocalISOString(now);
        const startTime = toLocalISOString(
          new Date(now.getTime() - item.remainingSeconds * 1000),
        );
        await createFocusRecordAction({
          inventoryItemId: item.inventoryItemId,
          recordType: "STOPWATCH",
          completedPomos: 0,
          startTime,
          endTime,
        });
      }

      const res = await consumeInventoryItem(item.inventoryItemId);
      if (res.success) {
        soundEffects.playFocusSessionCompleteSound();
        triggerCelebrationConfetti();
        toast.success(
          `🎉 Recompensa aproveitada com sucesso! "${item.rewardName || "Item"}" concluído!`,
        );

        if (target?.id === item.inventoryItemId) {
          controls.resetTarget();
          if (activities.length > 0) {
            controls.selectActivityTarget(activities[0]);
            onSelectActivity?.(activities[0].id);
          } else {
            onSelectActivity?.(null);
          }
        }

        onRefreshData();
      } else {
        toast.error(res.error || "Erro ao concluir item.");
      }
    } catch {
      toast.error("Erro ao concluir item.");
    }
  };

  // Deseleciona a atividade ativa caso o usuário clique em áreas vazias
  useEffect(() => {
    if (!selectedActivityId) return;

    const handlePointerDown = (e: MouseEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (!targetEl) return;
      if (
        targetEl.closest("[data-focus-card]") ||
        targetEl.closest("[role='dialog']") ||
        targetEl.closest("aside") ||
        targetEl.closest("button") ||
        targetEl.closest("input") ||
        targetEl.closest("textarea")
      ) {
        return;
      }
      onSelectActivity?.(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedActivityId, onSelectActivity]);

  return (
    <div className="relative flex-1 min-w-0 h-full flex flex-col overflow-hidden transition-all duration-200">
      {/* Área Rolável de Conteúdo */}
      <div
        className={cn(
          "flex-1 overflow-y-auto custom-scrollbar flex flex-col pr-1",
          isCompact
            ? "p-3 sm:p-4 gap-3 sm:gap-4 pb-6"
            : "p-5 sm:p-6 gap-5 sm:gap-6 pb-8",
        )}
      >
        {/* 1. Card de Boas-Vindas (inicia colapsado por padrão para priorizar o Palco Heróico) */}
        <WelcomeCard
          title={WELCOME_CARD_DETAILS.focus.title}
          subtitle={WELCOME_CARD_DETAILS.focus.subtitle}
          bullets={WELCOME_CARD_DETAILS.focus.bullets}
          imageSrc={WELCOME_CARD_DETAILS.focus.imageSrc}
          storageKey="focus"
          compact={isCompact}
          defaultExpanded={false}
        />

        {/* 2. Palco de Foco Heróico */}
        <FocusHeroStage
          activities={activities}
          backpackItems={backpackItems}
          onSelectActivity={onSelectActivity}
          onStartFocusActivity={(act) => {
            onSelectActivity?.(act.id);
            onStartFocusActivity(act);
          }}
          onStartFocusItem={(item) => {
            onSelectActivity?.(null);
            onStartFocusItem(item);
          }}
          onChangeMode={onChangeMode}
          isCompact={isCompact}
        />

        {/* 3. Seção de Atividades */}
        <FocusActivitiesSection
          activities={activities}
          isPremium={isPremium}
          activeTargetId={target?.id}
          isTimerActive={isActive}
          isTimerRunning={isTimerRunning}
          onToggleTimer={controls.toggleTimer}
          selectedActivityId={selectedActivityId}
          onSelectActivity={onSelectActivity}
          onStartFocus={(act) => {
            onStartFocusActivity(act);
          }}
          onOpenCreateModal={() => {
            setEditingActivity(null);
            setActivityModalOpen(true);
          }}
          onContextMenu={openActivityMenu}
          isCompact={isCompact}
        />

        {/* 4. Seção da Mochila */}
        <FocusBackpackSection
          items={backpackItems}
          activeTargetId={target?.id}
          isTimerActive={isActive}
          isTimerRunning={isTimerRunning}
          onToggleTimer={controls.toggleTimer}
          onStartFocus={(item) => {
            onStartFocusItem(item);
          }}
          onContextMenu={openItemMenu}
          onConsume={handleConsumeItem}
          isCompact={isCompact}
        />
      </div>

      {/* 5. Context Menu Reutilizado */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeMenu}
        items={menuItems}
      />

      {/* 6. Modal de Atividade */}
      <FocusActivityModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        activityToEdit={editingActivity}
        onSuccess={onRefreshData}
      />

      {/* 7. Modal de Devolver Item para a Mochila (via ConfirmationModal) */}
      <ConfirmationModal
        isOpen={Boolean(returnModalItem)}
        onClose={() => setReturnModalItem(null)}
        onConfirm={handleConfirmReturnToBackpack}
        isLoading={isReturningToBackpack}
        title="Devolver para a Mochila"
        variant="warning"
        confirmText="Sim, devolver para mochila"
        cancelText="Não, manter no Foco"
        description={
          <div className="flex flex-col gap-3">
            <p>
              Tem certeza de que deseja devolver o item{" "}
              <strong className="text-neutral-100">
                "{returnModalItem?.rewardName || "Item de Foco"}"
              </strong>{" "}
              para a sua mochila?
            </p>
            {returnModalItem?.remainingSeconds !== undefined &&
              returnModalItem?.remainingSeconds !== null && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gold/10 border border-gold/30 text-tiny text-gold font-medium w-fit">
                  <Timer size={12} className="text-gold" />
                  <span>
                    Saldo restante:{" "}
                    {formatBackpackItemRemainingTime(
                      returnModalItem.remainingSeconds,
                    )}
                  </span>
                </div>
              )}
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
              <strong>Atenção:</strong> A sessão ativa no cronômetro será
              desarmada e o item sairá da área de foco. O saldo restante
              continuará salvo na sua mochila.
            </p>
          </div>
        }
      />

      {/* 8. Modal de Excluir Atividade */}
      <ConfirmationModal
        isOpen={Boolean(deleteModalActivity)}
        onClose={() => setDeleteModalActivity(null)}
        onConfirm={handleConfirmDeleteActivity}
        isLoading={isDeletingActivity}
        title="Excluir Atividade"
        description={
          <p>
            Deseja realmente excluir a atividade{" "}
            <strong className="text-neutral-100">
              "{deleteModalActivity?.name}"
            </strong>
            ? O histórico de sessões anteriores continuará preservado.
          </p>
        }
        confirmText="Sim, excluir"
        variant="danger"
      />
    </div>
  );
}
