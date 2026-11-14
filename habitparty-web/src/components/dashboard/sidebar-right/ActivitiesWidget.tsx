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

  // Modal de criação/edição da atividade
  const [activityToEdit, setActivityToEdit] = useState<FocusActivity | null>(
    null,
  );
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

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

  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const activityTimeMap = useMemo(
    () =>
      calculateActivityDurationMap(
        records,
        period,
        undefined,
        new Date(),
        userTimeZone,
      ),
    [records, period, userTimeZone],
  );

  const handleOpenCreateModal = () => {
    setActivityToEdit(null);
    setIsActivityModalOpen(true);
  };

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
  }, [contextMenu.activity, t]);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Contador Padronizado e Seletor Independente de Período */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {t("title")}
          </h4>
          <output
            className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums shrink-0"
            aria-label={t("title")}
          >
            {activeActivities.length}/{maxActivities}
          </output>
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
                  "group flex items-center justify-between rounded-lg border transition-colors",
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

        {/* Botão de Adicionar ou Limite Atingido padronizado com alto contraste */}
        {blockedActivitiesCount === 0 &&
          (isLimitReached ? (
            !isPremium ? (
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
            )
          ) : (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border font-bold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer w-full",
                isCompact ? "py-1.5 text-xs" : "py-2 text-xs",
                "bg-primary/15 dark:bg-primary/25 text-primary dark:text-neutral-100 border-primary/35 dark:border-primary-light/45",
                "hover:bg-gold hover:text-on-gold hover:border-gold dark:hover:bg-gold dark:hover:text-on-gold dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-[0.99]",
              )}
            >
              <Plus size={14} strokeWidth={2.5} className="shrink-0" />
              <span>{t("addButton")}</span>
            </button>
          ))}
      </div>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}

      {/* Popover / Context Menu com Editar e Excluir */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, activity: null }))
        }
        items={contextMenuItems}
      />

      {/* Modal: Criar ou Editar Atividade */}
      {isActivityModalOpen && (
        <FocusActivityModal
          isOpen={isActivityModalOpen}
          activityToEdit={activityToEdit}
          onClose={() => {
            setIsActivityModalOpen(false);
            setActivityToEdit(null);
          }}
          onSuccess={(savedActivity, isEditing) => {
            if (savedActivity) {
              if (isEditing) {
                setActivitiesList((prev) =>
                  prev.map((a) =>
                    a.id === savedActivity.id ? savedActivity : a,
                  ),
                );
              } else {
                setActivitiesList((prev) => [...prev, savedActivity]);
              }
            }
            setIsActivityModalOpen(false);
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
