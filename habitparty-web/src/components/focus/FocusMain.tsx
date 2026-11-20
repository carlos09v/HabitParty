"use client";

import { Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ContextualBackButton } from "@/components/ui/ContextualBackButton";
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
import { removeBrowserQueryParam } from "@/utils";
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

const DeleteFocusActivityModal = dynamic(
  () =>
    import("./modals/DeleteFocusActivityModal").then(
      (mod) => mod.DeleteFocusActivityModal,
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
  todaySummary?: {
    minutes: number;
    sessionsCount: number;
  };
  todayRewardableMinutes?: number;
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
  initialLinkActivity?: boolean;
  initialFromSource?: string | null;
  onChangeMode?: (mode: FocusRecordType) => void;
  onActivityDeleted?: (activityId: string, deleteHistory: boolean) => void;
}

export function FocusMain({
  activities,
  backpackItems,
  focusableTasks = [],
  todaySummary,
  todayRewardableMinutes,
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
  initialLinkActivity = false,
  initialFromSource = null,
  onChangeMode,
  onActivityDeleted,
}: FocusMainProps) {
  const t = useTranslations("focus.main");
  const { isGamified } = useExperienceMode();
  const controls = useFocusTimerControls();
  const fromSource = initialFromSource;
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
    removeBrowserQueryParam("createActivity");
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
    consumingItemIds,
  } = useFocusMutations({
    activities,
    selectedActivityId,
    activeTarget: target,
    onSelectActivity,
    onResetTarget: controls.resetTarget,
    onSelectActivityTarget: controls.selectActivityTarget,
    onActivityDeleted,
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

  const focusWelcomeStats = useMemo(() => {
    const scrollToSection = (sectionId: string) => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const stats = calculateFocusWelcomeStats(
      activities,
      backpackItems,
      locale,
      isGamified,
      todaySummary,
    );

    return stats.map((stat, index) => {
      if (index === 0) {
        return {
          ...stat,
          onClick: () => scrollToSection("focus-activities-section"),
        };
      }
      if (index === 1) {
        return {
          ...stat,
          onClick: () => scrollToSection("focus-backpack-section"),
        };
      }
      return stat;
    });
  }, [activities, backpackItems, locale, isGamified, todaySummary]);

  const backTarget =
    fromSource === "tasks"
      ? { href: "/tasks", label: t("back.tasks") }
      : fromSource === "dashboard"
        ? { href: "/dashboard", label: t("back.dashboard") }
        : fromSource === "inventory"
          ? {
              href: "/inventory",
              label: isGamified
                ? t("back.inventoryGamified")
                : t("back.inventoryProductivity"),
            }
          : null;

  return (
    <div className="relative flex-1 min-w-0 h-full flex flex-col overflow-hidden">
      {/* Área Rolável de Conteúdo */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] custom-scrollbar flex flex-col p-3.5 sm:p-6 gap-4 sm:gap-6 pb-8">
        {backTarget && (
          <div className="flex items-center">
            <ContextualBackButton
              fallbackHref={backTarget.href}
              label={backTarget.label}
            />
          </div>
        )}

        <WelcomeCard storageKey="focus" stats={focusWelcomeStats} />

        {/* 2. Palco de Foco Heróico */}
        <FocusHeroStage
          activities={activities}
          backpackItems={backpackItems}
          focusableTasks={focusableTasks}
          todayRewardableMinutes={todayRewardableMinutes}
          onSelectActivity={onSelectActivity}
          onStartFocusActivity={onStartFocusActivity}
          onStartFocusItem={onStartFocusItem}
          onStartFocusTask={onStartFocusTask}
          onChangeMode={onChangeMode}
          onOpenUpgradeModal={handleOpenUpgradeModal}
          onCreateActivity={handleOpenCreateModal}
          initialLinkActivity={initialLinkActivity}
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
          consumingItemIds={consumingItemIds}
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
              <p className="text-xs text-amber-800 dark:text-amber-200/90 bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
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
        <DeleteFocusActivityModal
          activity={deleteModalActivity}
          isDeleting={isDeletingActivity}
          deleteHistory={deleteActivityHistory}
          onDeleteHistoryChange={setDeleteActivityHistory}
          onClose={() => setDeleteModalActivity(null)}
          onConfirm={handleConfirmDeleteActivity}
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
