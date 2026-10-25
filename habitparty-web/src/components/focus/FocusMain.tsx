"use client";

import { Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useFocusContextMenu } from "@/hooks/useFocusContextMenu";
import { useFocusMutations } from "@/hooks/useFocusMutations";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import type { FocusActivity, FocusRecordType } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { formatBackpackItemRemainingTime } from "@/utils/focusFormatters";
import { FocusActivitiesSection } from "./FocusActivitiesSection";
import { FocusBackpackSection } from "./FocusBackpackSection";
import { FocusHeroStage } from "./FocusHeroStage";

const FocusActivityModal = dynamic(
  () =>
    import("./modals/FocusActivityModal").then((mod) => mod.FocusActivityModal),
  { ssr: false },
);

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then(
      (mod) => mod.UpgradePremiumModal,
    ),
  { ssr: false },
);

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
  isCompact = false,
  onChangeMode,
}: FocusMainProps) {
  const controls = useFocusTimerControls();

  const { isActive, isPaused, target } = controls;
  const isTimerRunning = isActive && !isPaused;

  // Modais de Criação/Edição de Atividade e Upgrade VIP centralizado
  const [activityModalOpen, setActivityModalOpen] = useState(
    Boolean(initialCreateActivity),
  );
  const [editingActivity, setEditingActivity] = useState<FocusActivity | null>(
    null,
  );
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const handleOpenUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingActivity(null);
    setActivityModalOpen(true);
  }, []);

  useEffect(() => {
    if (!initialCreateActivity) return;
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
  }, [initialCreateActivity]);

  // Hook dedicado às mutações de atividades e itens da mochila
  const {
    returnModalItem,
    setReturnModalItem,
    isReturningToBackpack,
    handleConfirmReturnToBackpack,
    deleteModalActivity,
    setDeleteModalActivity,
    isDeletingActivity,
    handleConfirmDeleteActivity,
    handleConsumeItem,
  } = useFocusMutations({
    activities,
    selectedActivityId,
    activeTarget: target,
    onSelectActivity,
    onResetTarget: controls.resetTarget,
    onSelectActivityTarget: controls.selectActivityTarget,
    onRefreshData,
  });

  // Hook desacoplado de menu de contexto
  const { contextMenu, openActivityMenu, openItemMenu, closeMenu, menuItems } =
    useFocusContextMenu({
      onStartFocusActivity,
      onStartFocusItem,
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
    });

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
          onStartFocusActivity={onStartFocusActivity}
          onStartFocusItem={onStartFocusItem}
          onChangeMode={onChangeMode}
          onOpenUpgradeModal={handleOpenUpgradeModal}
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
          onStartFocus={onStartFocusActivity}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenUpgradeModal={handleOpenUpgradeModal}
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
          onStartFocus={onStartFocusItem}
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

      {/* 6. Modal de Atividade (Carregado sob demanda) */}
      {activityModalOpen && (
        <FocusActivityModal
          isOpen={activityModalOpen}
          onClose={() => setActivityModalOpen(false)}
          activityToEdit={editingActivity}
          onSuccess={onRefreshData}
        />
      )}

      {/* 7. Modal de Devolver Item para a Mochila (Carregado sob demanda) */}
      {returnModalItem && (
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
                  "{returnModalItem.rewardName || "Item de Foco"}"
                </strong>{" "}
                para a sua mochila?
              </p>
              {returnModalItem.remainingSeconds !== undefined &&
                returnModalItem.remainingSeconds !== null && (
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
      )}

      {/* 8. Modal de Excluir Atividade (Carregado sob demanda) */}
      {deleteModalActivity && (
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
                "{deleteModalActivity.name}"
              </strong>
              ? O histórico de sessões anteriores continuará preservado.
            </p>
          }
          confirmText="Sim, excluir"
          variant="danger"
        />
      )}

      {/* 9. Instância Única de Upgrade Premium */}
      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </div>
  );
}
