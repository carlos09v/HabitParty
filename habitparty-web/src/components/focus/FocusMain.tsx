"use client";

import { Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusContextMenu } from "@/hooks/useFocusContextMenu";
import { useFocusMutations } from "@/hooks/useFocusMutations";
import { useFocusTimerControls } from "@/hooks/useFocusTimer";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import type { AppLocale } from "@/i18n/config";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { calculateFocusWelcomeStats } from "@/utils/catalogMetrics";
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

function preloadFocusMainModalChunks() {
  void import("./modals/FocusActivityModal");
}

interface FocusMainProps {
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  isPremium?: boolean;
  selectedActivityId?: string | null;
  selectedBackpackItemId?: string | null;
  onSelectActivity?: (activityId: string | null) => void;
  onSelectBackpackItem?: (item: InventoryItemResponseDTO | null) => void;
  onStartFocusActivity: (act: FocusActivity) => void;
  onStartFocusItem: (item: InventoryItemResponseDTO) => void;
  onStartFocusTask?: (task: { id: string; title: string }) => void;
  onOpenManualRecord?: (params: {
    activityId?: string;
    itemId?: string;
  }) => void;
  initialCreateActivity?: boolean;
  isCompact?: boolean;
  onChangeMode?: (mode: FocusRecordType) => void;
}

export function FocusMain({
  activities,
  backpackItems,
  focusableTasks = [],
  isPremium = false,
  selectedActivityId,
  selectedBackpackItemId,
  onSelectActivity,
  onSelectBackpackItem,
  onStartFocusActivity,
  onStartFocusItem,
  onStartFocusTask,
  onOpenManualRecord,
  initialCreateActivity = false,
  isCompact = false,
  onChangeMode,
}: FocusMainProps) {
  const t = useTranslations("focus.main");
  const { isGamified } = useExperienceMode();
  const controls = useFocusTimerControls();
  useIdlePreload(preloadFocusMainModalChunks);

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
    deleteActivityHistory,
    setDeleteActivityHistory,
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

  // Deseleciona a atividade ou item da mochila ativo caso o usuário clique em áreas vazias
  useEffect(() => {
    if (!selectedActivityId && !selectedBackpackItemId) return;

    let isReady = false;
    const timer = setTimeout(() => {
      isReady = true;
    }, 150);

    const handlePointerDown = (e: MouseEvent) => {
      if (!isReady) return;
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
      onSelectBackpackItem?.(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [
    selectedActivityId,
    selectedBackpackItemId,
    onSelectActivity,
    onSelectBackpackItem,
  ]);

  const locale = useLocale() as AppLocale;

  const focusWelcomeStats = useMemo(
    () =>
      calculateFocusWelcomeStats(activities, backpackItems, locale, isGamified),
    [activities, backpackItems, locale, isGamified],
  );

  return (
    <div className="relative flex-1 min-w-0 h-full flex flex-col overflow-hidden">
      {/* Área Rolável de Conteúdo */}
      <div
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col pr-1",
          isCompact
            ? "p-3 sm:p-4 gap-3 sm:gap-4 pb-6"
            : "p-5 sm:p-6 gap-5 sm:gap-6 pb-8",
        )}
      >
        {/* 1. Card de Boas-Vindas (inicia colapsado por padrão para priorizar o Palco Heróico) */}
        <WelcomeCard
          storageKey="focus"
          stats={focusWelcomeStats}
          compact={isCompact}
          defaultExpanded={false}
        />

        {/* 2. Palco de Foco Heróico */}
        <FocusHeroStage
          activities={activities}
          backpackItems={backpackItems}
          focusableTasks={focusableTasks}
          onSelectActivity={onSelectActivity}
          onStartFocusActivity={onStartFocusActivity}
          onStartFocusItem={onStartFocusItem}
          onStartFocusTask={onStartFocusTask}
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
          selectedItemId={selectedBackpackItemId}
          onSelectItem={onSelectBackpackItem}
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
        />
      )}

      {/* 7. Modal de Devolver Item para a Mochila (Carregado sob demanda) */}
      {returnModalItem && (
        <ConfirmationModal
          isOpen={Boolean(returnModalItem)}
          onClose={() => setReturnModalItem(null)}
          onConfirm={handleConfirmReturnToBackpack}
          isLoading={isReturningToBackpack}
          title={
            isGamified
              ? t("returnModal.titleGamified")
              : t("returnModal.titleProductivity")
          }
          variant="warning"
          confirmText={
            isGamified
              ? t("returnModal.confirmGamified")
              : t("returnModal.confirmProductivity")
          }
          cancelText={t("returnModal.cancel")}
          description={
            <div className="flex flex-col gap-3">
              <p>
                {t.rich(
                  isGamified
                    ? "returnModal.questionGamified"
                    : "returnModal.questionProductivity",
                  {
                    name:
                      returnModalItem.rewardName ||
                      t("returnModal.fallbackName"),
                    strong: (chunks) => (
                      <strong className="text-neutral-100">{chunks}</strong>
                    ),
                  },
                )}
              </p>
              {returnModalItem.remainingSeconds !== undefined &&
                returnModalItem.remainingSeconds !== null && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gold/10 border border-gold/30 text-tiny text-gold font-medium w-fit">
                    <Timer size={12} className="text-gold" />
                    <span>
                      {t("returnModal.remainingBalance", {
                        time: formatBackpackItemRemainingTime(
                          returnModalItem.remainingSeconds,
                          locale,
                        ),
                      })}
                    </span>
                  </div>
                )}
              <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
                {t.rich(
                  isGamified
                    ? "returnModal.warningGamified"
                    : "returnModal.warningProductivity",
                  {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  },
                )}
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
          title={t("deleteModal.title")}
          description={
            <p>
              {t.rich("deleteModal.question", {
                name: deleteModalActivity.name,
                strong: (chunks) => (
                  <strong className="text-neutral-100">{chunks}</strong>
                ),
              })}
            </p>
          }
          confirmText={t("deleteModal.confirm")}
          variant="danger"
          checkboxLabel={t("deleteModal.deleteHistoryLabel")}
          checkboxHint={t("deleteModal.deleteHistoryHint")}
          checkboxChecked={deleteActivityHistory}
          onCheckboxChange={setDeleteActivityHistory}
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
