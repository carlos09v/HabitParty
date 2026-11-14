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

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then((mod) => ({
      default: mod.UpgradePremiumModal,
    })),
  { ssr: false },
);

const FocusActivityModal = dynamic(
  () =>
    import("@/components/focus/modals/FocusActivityModal").then((mod) => ({
      default: mod.FocusActivityModal,
    })),
  { ssr: false },
);

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

/**
 * Widget de Atividades de Foco com seletor de período próprio (Hoje | Semana | Mês).
 */
export function ActivitiesWidget({
  activities = [],
  records = [],
  isCompact = false,
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
    contextMenu,
    setContextMenu,
    activityToEdit,
    setActivityToEdit,
    isActivityModalOpen,
    setIsActivityModalOpen,
    activityToDelete,
    setActivityToDelete,
    isDeleting,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleOpenCreateModal,
    handleContextMenu,
    handleMenuButtonClick,
    handleConfirmDelete,
    handleActivitySaved,
  } = useActivitiesWidget(activities, records);

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
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {t("title")}
          </h4>
          <output
            className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums shrink-0"
            aria-label={t("title")}
          >
            {activeActivities.length}/{maxActivities}
          </output>
          {blockedActivitiesCount === 0 && !isLimitReached && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              aria-label={t("addButton")}
              title={t("addButton")}
              className="flex items-center justify-center w-6 h-6 rounded-md border bg-primary/15 dark:bg-primary/25 text-primary dark:text-neutral-100 border-primary/35 dark:border-primary-light/45 hover:bg-gold hover:text-on-gold hover:border-gold dark:hover:bg-gold dark:hover:text-on-gold dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95 transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer shrink-0"
            >
              <Plus size={13} strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>

        <fieldset
          className="inline-flex items-center rounded-lg bg-surface dark:bg-white/5 border border-neutral-700 dark:border-white/10 p-0.5 shrink-0 m-0"
          aria-label={t("periodAriaLabel")}
        >
          {ACTIVITY_PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id)}
                aria-pressed={isActive}
                className={cn(
                  "px-1.5 py-0.5 rounded-md text-label-g font-semibold transition-colors cursor-pointer",
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
          <div className="rounded-lg border border-dashed border-neutral-700 dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs dark:shadow-none p-3 text-center text-xs text-neutral-400">
            {t("empty")}
          </div>
        ) : (
          activeActivities.map((act) => (
            <ActivityWidgetRow
              key={act.id}
              activity={act}
              minutes={activityTimeMap[act.id] || 0}
              isCompact={isCompact}
              isContextMenuOpen={
                contextMenu.isOpen && contextMenu.activity?.id === act.id
              }
              onContextMenu={handleContextMenu}
              onMenuButtonClick={handleMenuButtonClick}
            />
          ))
        )}

        {blockedActivitiesCount > 0 && (
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            title={t("lockedPreservedTitle", { count: blockedActivitiesCount })}
            className={cn(
              "group flex items-center justify-between rounded-lg border transition-colors text-left w-full cursor-pointer",
              isCompact ? "p-1.5" : "p-2",
              "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15 hover:border-amber-500/50 dark:bg-gold/5 dark:border-gold/25 dark:hover:bg-gold/15 dark:hover:border-gold/50",
            )}
          >
            <div
              className={cn(
                "flex items-center min-w-0",
                isCompact ? "gap-1.5" : "gap-2",
              )}
            >
              <div className="p-1 rounded bg-amber-500/15 text-amber-700 dark:bg-gold/15 dark:text-gold shrink-0">
                <Lock size={isCompact ? 12 : 14} />
              </div>
              <span
                className={cn(
                  "font-medium text-neutral-300 group-hover:text-neutral-100 truncate",
                  isCompact ? "text-xs" : "text-body-s",
                )}
              >
                {t("lockedCount", { count: blockedActivitiesCount })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-tiny font-bold uppercase tracking-wider text-amber-800 bg-amber-500/15 border border-amber-500/35 dark:text-gold dark:bg-gold/15 dark:border-gold/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                VIP 👑
              </span>
            </div>
          </button>
        )}

        {blockedActivitiesCount === 0 &&
          isLimitReached &&
          (!isPremium ? (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              title={t("upgradeTitle")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer font-bold w-full",
                isCompact ? "py-1.5 text-label-g" : "py-2 text-xs",
                "border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:border-amber-600 dark:border-gold/40 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20 dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-[0.99]",
              )}
            >
              <Crown size={14} className="fill-gold/20 shrink-0" />
              <span>{t("upgradeLabel")}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              title={t("limitReachedTitle", { max: maxActivities })}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border transition-colors cursor-not-allowed opacity-60 font-semibold w-full",
                isCompact ? "py-1.5 text-label-g" : "py-2 text-xs",
                "border-neutral-700 dark:border-neutral-700/60 bg-surface/60 dark:bg-surface/40 text-neutral-400 dark:text-neutral-500",
              )}
            >
              <Lock size={13} className="shrink-0" />
              <span>{t("limitReachedLabel", { max: maxActivities })}</span>
            </button>
          ))}
      </div>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, activity: null }))
        }
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
        <ConfirmationModal
          isOpen={Boolean(activityToDelete)}
          title={t("deleteModal.title")}
          description={
            <>
              {t("deleteModal.questionPrefix")}{" "}
              <span className="font-bold text-neutral-100">
                &quot;{activityToDelete?.name}&quot;
              </span>
              {t("deleteModal.questionSuffix")}
            </>
          }
          confirmText={t("deleteModal.confirm")}
          cancelText={t("deleteModal.cancel")}
          variant="danger"
          isLoading={isDeleting}
          onClose={() => {
            if (!isDeleting) setActivityToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
