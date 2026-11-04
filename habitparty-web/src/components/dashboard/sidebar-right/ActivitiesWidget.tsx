"use client";

import { ChevronRight, Crown, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteFocusActivity } from "@/actions/focusActions";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import {
  ACTIVITY_PERIOD_OPTIONS,
  type ActivityPeriodOption,
} from "@/constants/dashboard";
import {
  DEFAULT_POMO_MINUTES,
  getFocusIcon,
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_FOCUS_ACTIVITIES_PREMIUM,
} from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type { ActivitiesWidgetProps } from "@/types/dashboard";
import type { FocusActivity } from "@/types/focus";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import { calculateActivityDurationMap } from "@/utils/focusMetrics";

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
  const [period, setPeriod] = useState<ActivityPeriodOption>("today");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);

  // Sincronização otimista de atividades
  const [activitiesList, setActivitiesList] =
    useState<FocusActivity[]>(activities);

  useEffect(() => {
    setActivitiesList(activities);
  }, [activities]);

  // Context Menu da atividade
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    activity: FocusActivity | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    activity: null,
  });

  // Modal de edição da atividade
  const [activityToEdit, setActivityToEdit] = useState<FocusActivity | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal de exclusão da atividade
  const [activityToDelete, setActivityToDelete] =
    useState<FocusActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const maxActivities = isPremium
    ? MAX_FOCUS_ACTIVITIES_PREMIUM
    : MAX_FOCUS_ACTIVITIES_FREE;
  const isLimitReached = activitiesList.length >= maxActivities;

  const activeActivities = activitiesList.slice(0, maxActivities);
  const blockedActivitiesCount = !isPremium
    ? Math.max(0, activitiesList.length - maxActivities)
    : 0;

  const activityTimeMap = useMemo(
    () => calculateActivityDurationMap(records, period),
    [records, period],
  );

  const handleContextMenu = (e: React.MouseEvent, act: FocusActivity) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      activity: act,
    });
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteFocusActivity(activityToDelete.id, false);
      if (!res.success) {
        toast.error(res.error || t("deleteError"));
        return;
      }
      toast.success(t("deleteSuccess", { name: activityToDelete.name }));
      setActivitiesList((prev) =>
        prev.filter((a) => a.id !== activityToDelete.id),
      );
      setActivityToDelete(null);
    } catch {
      toast.error(t("deleteUnexpectedError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu.activity) return [];
    return [
      {
        label: t("contextMenu.edit"),
        icon: <Pencil size={14} />,
        onClick: () => {
          setActivityToEdit(contextMenu.activity);
          setIsEditModalOpen(true);
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
  }, [contextMenu.activity, t]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Seletor Independente de Período */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-1.5 min-w-0">
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {t("title")}
          </h4>
          <span className="text-tiny font-semibold text-neutral-400">
            ({activitiesList.length}/{maxActivities})
          </span>
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
                  "px-1.5 py-0.5 rounded-md text-label-g font-semibold transition-all cursor-pointer",
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

      {/* Lista de Atividades */}
      <div className="flex flex-col gap-1.5 w-full">
        {activeActivities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-700 dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs dark:shadow-none p-3 text-center text-xs text-neutral-400">
            {t("empty")}
          </div>
        ) : (
          activeActivities.map((act) => {
            const Icon = getFocusIcon(act.icon);
            const minutes = activityTimeMap[act.id] || 0;
            const typeLabel =
              act.recordType === "POMO"
                ? t("pomodoroDuration", {
                    minutes: act.targetTimeMinutes || DEFAULT_POMO_MINUTES,
                  })
                : t("freeStopwatch");

            return (
              <Link
                key={act.id}
                href={`/focus?activityId=${act.id}`}
                onContextMenu={(e) => handleContextMenu(e, act)}
                title={t("rightClickHint", {
                  name: act.name,
                  type: typeLabel,
                })}
                className={cn(
                  "group flex items-center justify-between rounded-lg border transition-all",
                  isCompact ? "p-1.5" : "p-2",
                  "bg-white dark:bg-primary-dark/20 border-neutral-700 dark:border-primary/30 shadow-2xs dark:shadow-none hover:bg-card-hover dark:hover:bg-primary-dark/40 hover:border-primary/35 dark:hover:border-primary-light/50",
                )}
              >
                <div
                  className={cn(
                    "flex items-center min-w-0 flex-1",
                    isCompact ? "gap-1.5" : "gap-2",
                  )}
                >
                  <div className="p-1 rounded bg-primary/10 dark:bg-primary-dark/40 text-primary dark:text-neutral-300 group-hover:text-primary-dark dark:group-hover:text-gold transition-colors shrink-0">
                    <Icon size={isCompact ? 13 : 15} />
                  </div>
                  <span
                    className={cn(
                      "font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors",
                      isCompact ? "text-xs" : "text-body-s",
                    )}
                  >
                    {act.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-xs font-bold text-neutral-200 group-hover:text-primary dark:group-hover:text-gold transition-colors">
                    {formatFocusMinutes(minutes)}
                  </span>
                  <ChevronRight
                    size={14}
                    className="text-neutral-500 group-hover:text-primary dark:group-hover:text-gold transition-colors"
                  />
                </div>
              </Link>
            );
          })
        )}

        {/* Card discreto de atividades bloqueadas */}
        {blockedActivitiesCount > 0 && (
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            title={t("lockedPreservedTitle", { count: blockedActivitiesCount })}
            className={cn(
              "group flex items-center justify-between rounded-lg border transition-all text-left w-full cursor-pointer",
              isCompact ? "p-1.5" : "p-2",
              "bg-gold/5 border-gold/25 hover:bg-gold/15 hover:border-gold/50",
            )}
          >
            <div
              className={cn(
                "flex items-center min-w-0",
                isCompact ? "gap-1.5" : "gap-2",
              )}
            >
              <div className="p-1 rounded bg-gold/15 text-gold shrink-0">
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
              <span className="text-tiny font-bold uppercase tracking-wider text-gold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30 flex items-center gap-1">
                VIP 👑
              </span>
            </div>
          </button>
        )}

        {/* Botão de Adicionar ou Limite Atingido (apenas se não houver itens bloqueados exibidos) */}
        {blockedActivitiesCount === 0 &&
          (isLimitReached ? (
            !isPremium ? (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                title={t("upgradeTitle")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group",
                  isCompact ? "py-1" : "p-1.5",
                  "border-gold/40 bg-gold/5 text-gold hover:bg-gold/15 hover:border-gold hover:shadow-glow-gold-xs",
                )}
              >
                <Crown size={14} className="fill-gold/20" />
                <span
                  className={cn(
                    "font-bold",
                    isCompact ? "text-label-g" : "text-xs",
                  )}
                >
                  {t("upgradeLabel")}
                </span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title={t("limitReachedTitle", { max: maxActivities })}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-not-allowed opacity-60",
                  isCompact ? "py-1" : "p-1.5",
                  "border-neutral-700 bg-neutral-800/30 text-neutral-400",
                )}
              >
                <Lock size={14} />
                <span
                  className={cn(
                    "font-semibold",
                    isCompact ? "text-label-g" : "text-xs",
                  )}
                >
                  {t("limitReachedLabel", { max: maxActivities })}
                </span>
              </button>
            )
          ) : (
            <Link
              href="/focus?createActivity=true"
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer group",
                isCompact ? "py-1" : "p-1.5",
                "border-primary-light/40 bg-primary-dark/15 text-primary-light hover:border-gold hover:text-gold hover:bg-primary-dark/30 hover:shadow-glow-gold-sm",
              )}
            >
              <Plus
                size={14}
                className="group-hover:scale-110 transition-transform"
              />
              <span
                className={cn(
                  "font-semibold",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {t("addButton")}
              </span>
            </Link>
          ))}
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />

      {/* Popover / Context Menu com Editar e Excluir */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, activity: null }))
        }
        items={contextMenuItems}
      />

      {/* Modal: Editar Atividade */}
      {isEditModalOpen && (
        <FocusActivityModal
          isOpen={isEditModalOpen}
          activityToEdit={activityToEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setActivityToEdit(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setActivityToEdit(null);
          }}
        />
      )}

      {/* Modal: Confirmação de Exclusão da Atividade */}
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
