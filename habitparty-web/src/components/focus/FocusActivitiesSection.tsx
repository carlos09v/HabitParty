"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Crown, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { reorderFocusActivities } from "@/actions/focusActions";
import {
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_FOCUS_ACTIVITIES_PREMIUM,
} from "@/constants/focus";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { FocusActivity } from "@/types/focus";
import { cn } from "@/utils";
import { FocusCard, SortableFocusActivityCard } from "./FocusCard";

const DND_MODIFIERS = [restrictToParentElement, restrictToWindowEdges];

interface FocusActivitiesSectionProps {
  activities: FocusActivity[];
  isPremium?: boolean;
  activeTargetId?: string;
  isTimerActive?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string | null) => void;
  onStartFocus: (activity: FocusActivity) => void;
  onOpenCreateModal: () => void;
  onOpenUpgradeModal: () => void;
  onContextMenu: (e: React.MouseEvent, activity: FocusActivity) => void;
  isCompact?: boolean;
}

export function FocusActivitiesSection({
  activities,
  isPremium = false,
  activeTargetId,
  isTimerActive = false,
  isTimerRunning = false,
  onToggleTimer,
  selectedActivityId,
  onSelectActivity,
  onStartFocus,
  onOpenCreateModal,
  onOpenUpgradeModal,
  onContextMenu,
  isCompact = false,
}: FocusActivitiesSectionProps) {
  const t = useTranslations("focus.activities");
  const maxActivities = isPremium
    ? MAX_FOCUS_ACTIVITIES_PREMIUM
    : MAX_FOCUS_ACTIVITIES_FREE;
  const isLimitReached = activities.length >= maxActivities;

  const handleReorderServer = useCallback(
    async (updates: { id: string; newIndex: number }[]) => {
      return reorderFocusActivities(
        updates.map((u) => ({ id: u.id, orderIndex: u.newIndex })),
      );
    },
    [],
  );

  const {
    items: orderedActivities,
    sensors,
    handleDragEnd,
  } = useReorderableList<FocusActivity>({
    initialItems: activities,
    onReorderServerAction: handleReorderServer,
    maxUnlockedCount: isPremium ? undefined : MAX_FOCUS_ACTIVITIES_FREE,
  });

  // Apenas as atividades ativas (destravadas) entram no SortableContext.
  // Quando o plano Premium expira e há > 4 atividades, as últimas 2 ficam travadas e imóveis.
  const unlockedActivityIds = useMemo(
    () =>
      (isPremium
        ? orderedActivities
        : orderedActivities.slice(0, MAX_FOCUS_ACTIVITIES_FREE)
      ).map((act) => act.id),
    [orderedActivities, isPremium],
  );

  const selectedActivity = useMemo(
    () =>
      selectedActivityId
        ? orderedActivities.find((act) => act.id === selectedActivityId) || null
        : null,
    [orderedActivities, selectedActivityId],
  );

  const handleSelectCard = useCallback(
    (act: FocusActivity) => {
      onSelectActivity?.(selectedActivityId === act.id ? null : act.id);
    },
    [onSelectActivity, selectedActivityId],
  );

  const planName = isPremium ? t("planPremium") : t("planFree");

  return (
    <section
      className="flex flex-col gap-3 w-full"
      aria-label={t("sectionAria")}
    >
      {/* Header com Título, Chip de Filtro, Contador e Botão de Criar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h3
            className={cn(
              "font-bold text-neutral-100",
              isCompact ? "text-body-m sm:text-subtitle-s" : "text-subtitle-s",
            )}
          >
            {t("title")}
          </h3>

          {/* Chip de Filtro Ativo (Visível, Discreto e Imediato) */}
          {selectedActivity && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:bg-gold/15 dark:border-gold/40 text-xs dark:text-gold font-medium animate-in fade-in zoom-in-95 duration-150">
              <span className="text-label-g text-neutral-400 hidden sm:inline">
                {t("filteringLabel")}
              </span>
              <span className="font-bold truncate max-w-[130px]">
                {selectedActivity.name}
              </span>
              <button
                type="button"
                onClick={() => onSelectActivity?.(null)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-amber-500/25 dark:hover:bg-gold/30 text-amber-800 dark:text-gold transition-colors cursor-pointer ml-0.5"
                title={t("clearFilterTitle")}
                aria-label={t("clearFilterAria", {
                  name: selectedActivity.name,
                })}
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Lado Direito: Limite do Plano + Botão de Adicionar */}
        <div className="flex items-center gap-2">
          {/* Badge do Limite */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium",
              isLimitReached
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-neutral-700 bg-surface dark:border-primary/30 dark:bg-surface/60 text-neutral-300",
            )}
            title={
              isLimitReached
                ? t("limitReachedTitle", {
                    current: orderedActivities.length,
                    max: maxActivities,
                    plan: planName,
                  })
                : t("limitUsedTitle", {
                    current: orderedActivities.length,
                    max: maxActivities,
                  })
            }
          >
            {isPremium && (
              <Crown size={12} className="text-gold fill-gold/20" />
            )}
            <span>
              {orderedActivities.length}/{maxActivities}
            </span>
            <span className="text-tiny text-neutral-400 hidden sm:inline">
              ({planName})
            </span>
          </div>

          {/* Botão + Adicionar / Upgrade */}
          <button
            type="button"
            onClick={isLimitReached ? onOpenUpgradeModal : onOpenCreateModal}
            disabled={isLimitReached && isPremium}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
              isLimitReached
                ? isPremium
                  ? "border-neutral-700 bg-surface dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 hover:border-amber-600 dark:border-gold/40 dark:bg-gold/15 dark:text-gold dark:hover:bg-gold/25 dark:hover:border-gold shadow-glow-gold-xs"
                : "border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 hover:border-amber-600 dark:border-gold/40 dark:bg-gold/15 dark:text-gold dark:hover:bg-gold/25 dark:hover:border-gold shadow-glow-gold-xs",
            )}
            title={
              isLimitReached
                ? isPremium
                  ? t("maxLimitReachedTitle", { max: maxActivities })
                  : t("upgradeLimitTitle")
                : t("createActivityTitle")
            }
          >
            {isLimitReached && !isPremium ? (
              <>
                <Crown size={14} className="fill-gold/20" />
                <span>{t("goPremiumButton")}</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span className="hidden sm:inline">
                  {t("newActivityButton")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Atividades com Reordenação Otimizada */}
      {orderedActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-700 dark:border-primary/30 bg-card/60 dark:bg-surface/30 p-6 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-body-s text-neutral-400">{t("emptyState")}</p>
          {!isLimitReached && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="text-xs font-bold text-amber-700 dark:text-gold hover:underline cursor-pointer"
            >
              {t("createFirstButton")}
            </button>
          )}
        </div>
      ) : (
        <DndContext
          id="focus-activities-dnd-context"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={DND_MODIFIERS}
          autoScroll={false}
        >
          <SortableContext
            items={unlockedActivityIds}
            strategy={rectSortingStrategy}
          >
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-hidden p-0.5">
              {orderedActivities.map((act, index) => {
                const isLocked = !isPremium && index >= maxActivities;
                const isActTarget = Boolean(
                  isTimerActive && activeTargetId === act.id,
                );
                const isActRunning = Boolean(isActTarget && isTimerRunning);
                const isActSelected = selectedActivityId === act.id;

                if (isLocked) {
                  return (
                    <FocusCard
                      key={act.id}
                      variant="activity"
                      activity={act}
                      isLocked
                      onLockedClick={onOpenUpgradeModal}
                      isActiveTarget={isActTarget}
                      isTimerRunning={isActRunning}
                      onToggleTimer={onToggleTimer}
                      isSelected={isActSelected}
                      onSelect={handleSelectCard}
                      onStartFocus={onStartFocus}
                      onContextMenu={onContextMenu}
                      isCompact={isCompact}
                    />
                  );
                }

                return (
                  <SortableFocusActivityCard
                    key={act.id}
                    variant="activity"
                    activity={act}
                    isLocked={false}
                    onLockedClick={onOpenUpgradeModal}
                    isActiveTarget={isActTarget}
                    isTimerRunning={isActRunning}
                    onToggleTimer={onToggleTimer}
                    isSelected={isActSelected}
                    onSelect={handleSelectCard}
                    onStartFocus={onStartFocus}
                    onContextMenu={onContextMenu}
                    isCompact={isCompact}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
