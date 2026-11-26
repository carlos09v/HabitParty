"use client";

import { Crown, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ActivityWidgetRow } from "@/components/dashboard/sidebar-right/ActivityWidgetRow";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { ACTIVITY_PERIOD_OPTIONS } from "@/constants/dashboard";
import { useActivitiesWidget } from "@/hooks/useActivitiesWidget";
import type { ActivitiesWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

const FocusActivityModal = dynamic(
  () =>
    import("@/components/focus/modals/FocusActivityModal").then((mod) => ({
      default: mod.FocusActivityModal,
    })),
  { ssr: false },
);

const DeleteFocusActivityModal = dynamic(
  () =>
    import("@/components/focus/modals/DeleteFocusActivityModal").then(
      (mod) => ({
        default: mod.DeleteFocusActivityModal,
      }),
    ),
  { ssr: false },
);

const SwitchFocusTargetModal = dynamic(
  () =>
    import("@/components/focus/modals/SwitchFocusTargetModal").then((mod) => ({
      default: mod.SwitchFocusTargetModal,
    })),
  { ssr: false },
);

/**
 * Widget de Atividades de Foco com seletor de período próprio (Hoje | Semana | Mês),
 * total focado no período e botão rápido de Play/Pause por atividade.
 */
export function ActivitiesWidget({
  activities = [],
  records = [],
  initialIsPremium = false,
  timeZone,
}: ActivitiesWidgetProps) {
  const t = useTranslations("dashboard.sidebarRight.activitiesWidget");
  const {
    period,
    setPeriod,
    isPremium,
    maxActivities,
    isLimitReached,
    activeActivities,
    blockedActivitiesCount,
    activityTimeMap,
    totalPeriodMinutes,
    contextMenu,
    closeContextMenu,
    activityToEdit,
    setActivityToEdit,
    isActivityModalOpen,
    setIsActivityModalOpen,
    activityToDelete,
    setActivityToDelete,
    deleteHistory,
    setDeleteHistory,
    isDeleting,
    openUpgradeModal,
    handleOpenCreateModal,
    handleContextMenu,
    handleMenuButtonClick,
    handleConfirmDelete,
    handleActivitySaved,
    pendingFocusActivity,
    currentFocusTarget,
    clearPendingFocusActivity,
    handleStartActivityFocus,
    handleTransferToPendingActivity,
    handleSaveAndStartPendingActivity,
    handleDiscardAndStartPendingActivity,
  } = useActivitiesWidget(activities, records, initialIsPremium, timeZone);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu.activity) return [];
    return [
      {
        label: t("contextMenu.edit"),
        icon: <Pencil size={14} />,
        onClick: () => {
          setActivityToEdit(contextMenu.activity);
          setIsActivityModalOpen(true);
        },
      },
      {
        label: t("contextMenu.delete"),
        icon: <Trash2 size={14} />,
        variant: "destructive",
        onClick: () => {
          setActivityToDelete(contextMenu.activity);
        },
      },
    ];
  }, [
    contextMenu.activity,
    setActivityToDelete,
    setActivityToEdit,
    setIsActivityModalOpen,
    t,
  ]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {t("title")}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums shrink-0">
            {activeActivities.length}/{maxActivities}
          </span>
          {totalPeriodMinutes > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-md bg-amber-500/12 dark:bg-gold/15 border border-amber-500/30 dark:border-gold/30 text-tiny font-bold text-amber-800 dark:text-gold tabular-nums shrink-0"
              title={t("periodTotalTitle", {
                duration: formatFocusMinutes(totalPeriodMinutes),
              })}
            >
              {formatFocusMinutes(totalPeriodMinutes)}
            </span>
          )}
          {blockedActivitiesCount === 0 && !isLimitReached && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              aria-label={t("addButton")}
              title={t("addButton")}
              className="flex items-center justify-center w-6 h-6 rounded-md border bg-primary/15 dark:bg-primary/25 text-primary dark:text-neutral-100 border-primary/35 dark:border-primary-light/45 hover:bg-gold hover:text-on-gold hover:border-gold dark:hover:bg-gold dark:hover:text-on-gold dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95 transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>

        <fieldset className="inline-flex items-center rounded-lg bg-surface dark:bg-white/5 border border-neutral-700 dark:border-white/10 p-0.5 shrink-0 m-0">
          <legend className="sr-only">{t("periodAriaLabel")}</legend>
          {ACTIVITY_PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                aria-pressed={isActive}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-label-g font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  isActive
                    ? "bg-gold text-on-gold font-bold shadow-xs"
                    : "text-neutral-400 hover:text-neutral-200",
                )}
              >
                {t(`periods.${opt.id}`)}
              </button>
            );
          })}
        </fieldset>
      </div>

      <div className="flex flex-col gap-1.5 w-full">
        {activeActivities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-700 dark:border-white/10 bg-card dark:bg-white/5 shadow-2xs dark:shadow-none p-3 text-center flex flex-col items-center gap-2">
            <span className="text-xs text-neutral-400">{t("empty")}</span>
            {blockedActivitiesCount === 0 && !isLimitReached && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-primary/15 dark:bg-primary/25 text-primary dark:text-neutral-100 border-primary/35 dark:border-primary-light/45 hover:bg-gold hover:text-on-gold hover:border-gold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
                <span>{t("createFirstCta")}</span>
              </button>
            )}
          </div>
        ) : (
          activeActivities.map((act) => (
            <ActivityWidgetRow
              key={act.id}
              activity={act}
              minutes={activityTimeMap[act.id] || 0}
              isContextMenuOpen={
                contextMenu.isOpen && contextMenu.activity?.id === act.id
              }
              onContextMenu={handleContextMenu}
              onMenuButtonClick={handleMenuButtonClick}
              onQuickFocus={handleStartActivityFocus}
            />
          ))
        )}

        {blockedActivitiesCount > 0 && (
          <button
            type="button"
            onClick={openUpgradeModal}
            title={t("lockedPreservedTitle", { count: blockedActivitiesCount })}
            className="group flex items-center justify-between rounded-lg border transition-colors text-left w-full cursor-pointer p-2 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/50 dark:bg-gold/5 dark:border-gold/25 dark:hover:bg-gold/15 dark:hover:border-gold/50"
          >
            <div className="flex items-center min-w-0 gap-2">
              <div className="p-1 rounded bg-amber-500/15 text-amber-700 dark:bg-gold/15 dark:text-gold shrink-0">
                <Lock size={14} aria-hidden="true" />
              </div>
              <span className="font-medium text-neutral-300 group-hover:text-neutral-100 truncate text-body-s">
                {t("lockedCount", { count: blockedActivitiesCount })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-tiny font-bold uppercase tracking-wider text-amber-800 bg-amber-500/15 border border-amber-500/35 dark:text-gold dark:bg-gold/15 dark:border-gold/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                VIP <span aria-hidden="true">👑</span>
              </span>
            </div>
          </button>
        )}

        {blockedActivitiesCount === 0 &&
          isLimitReached &&
          (!isPremium ? (
            <button
              type="button"
              onClick={openUpgradeModal}
              title={t("upgradeTitle")}
              className="flex items-center justify-center gap-1.5 rounded-lg border transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer font-bold w-full py-2 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:border-amber-600 dark:border-gold/40 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20 dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-[0.99]"
            >
              <Crown
                size={14}
                className="fill-gold/20 shrink-0"
                aria-hidden="true"
              />
              <span>{t("upgradeLabel")}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={t("limitReachedTitle", { max: maxActivities })}
              className="flex items-center justify-center gap-1.5 rounded-lg border transition-colors cursor-not-allowed opacity-60 font-semibold w-full py-2 text-xs border-neutral-700 dark:border-neutral-700/60 bg-surface/60 dark:bg-surface/40 text-neutral-400 dark:text-neutral-500"
            >
              <Lock size={13} className="shrink-0" aria-hidden="true" />
              <span>{t("limitReachedLabel", { max: maxActivities })}</span>
            </button>
          ))}
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      {isActivityModalOpen && (
        <FocusActivityModal
          isOpen={isActivityModalOpen}
          activityToEdit={activityToEdit}
          onClose={() => {
            setIsActivityModalOpen(false);
            setActivityToEdit(null);
          }}
          onSuccess={handleActivitySaved}
        />
      )}

      {Boolean(activityToDelete) && (
        <DeleteFocusActivityModal
          activity={activityToDelete}
          isDeleting={isDeleting}
          deleteHistory={deleteHistory}
          onDeleteHistoryChange={setDeleteHistory}
          onClose={() => {
            if (!isDeleting) setActivityToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}

      {pendingFocusActivity && currentFocusTarget && (
        <SwitchFocusTargetModal
          isOpen={true}
          onClose={clearPendingFocusActivity}
          currentName={currentFocusTarget.name}
          newTargetName={pendingFocusActivity.name}
          isCurrentInventory={currentFocusTarget.type === "inventory"}
          isCurrentTask={currentFocusTarget.type === "task"}
          onTransfer={handleTransferToPendingActivity}
          onSaveAndStartNew={handleSaveAndStartPendingActivity}
          onDiscardAndStartNew={handleDiscardAndStartPendingActivity}
        />
      )}
    </div>
  );
}
