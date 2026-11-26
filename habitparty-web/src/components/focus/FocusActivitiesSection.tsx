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
} from "@/constants/focusRules";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { FocusActivity } from "@/types/focus";
import { cn } from "@/utils";
import { FocusCard } from "./FocusCard";
import { SortableFocusActivityCard } from "./SortableFocusActivityCard";

const DND_MODIFIERS = [restrictToParentElement, restrictToWindowEdges];

interface FocusActivitiesSectionProps {
  activities: FocusActivity[];
  todayDurationByActivityId?: Record<string, number>;
  isPremium?: boolean;
  activeTargetId?: string;
  isTimerActive?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string | null) => void;
  onToggleActivityFilter?: (activityId: string | null) => void;
  onStartFocus: (activity: FocusActivity) => void;
  onOpenCreateModal: () => void;
  onOpenUpgradeModal: () => void;
  onContextMenu: (e: React.MouseEvent, activity: FocusActivity) => void;
}

export function FocusActivitiesSection({
  activities,
  todayDurationByActivityId,
  isPremium = false,
  activeTargetId,
  isTimerActive = false,
  isTimerRunning = false,
  onToggleTimer,
  selectedActivityId,
  onSelectActivity,
  onToggleActivityFilter,
  onStartFocus,
  onOpenCreateModal,
  onOpenUpgradeModal,
  onContextMenu,
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

  const unlockedActivityIds = useMemo(
    () =>
      (isPremium
        ? orderedActivities
        : orderedActivities.slice(0, MAX_FOCUS_ACTIVITIES_FREE)
      ).map((act) => act.id),
    [orderedActivities, isPremium],
  );

  const canReorder = unlockedActivityIds.length > 1;

  const selectedActivity = useMemo(
    () =>
      selectedActivityId
        ? orderedActivities.find((act) => act.id === selectedActivityId) || null
        : null,
    [orderedActivities, selectedActivityId],
  );

  const handleSelectCard = useCallback(
    (act: FocusActivity) => {
      onSelectActivity?.(act.id);
    },
    [onSelectActivity],
  );

  const handleToggleFilter = useCallback(
    (act: FocusActivity) => {
      onToggleActivityFilter?.(act.id);
    },
    [onToggleActivityFilter],
  );

  const planName = isPremium ? t("planPremium") : t("planFree");
  const createButtonAria = isLimitReached
    ? isPremium
      ? t("maxLimitReachedTitle", { max: maxActivities })
      : t("goPremiumButton")
    : t("newActivityButton");

  const renderCards = () => (
    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2.5 p-0.5">
      {orderedActivities.map((act, index) => {
        const isLocked = !isPremium && index >= maxActivities;
        const isActTarget = Boolean(isTimerActive && activeTargetId === act.id);
        const isActStaged = Boolean(
          !isTimerActive && activeTargetId === act.id,
        );
        const isActRunning = Boolean(isActTarget && isTimerRunning);
        const isActFiltered = selectedActivityId === act.id;
        const todayMinutes = todayDurationByActivityId?.[act.id] ?? 0;

        if (isLocked || !canReorder) {
          return (
            <FocusCard
              key={act.id}
              variant="activity"
              activity={act}
              todayMinutes={todayMinutes}
              isLocked={isLocked}
              onLockedClick={onOpenUpgradeModal}
              isActiveTarget={isActTarget}
              isStagedTarget={isActStaged}
              isTimerRunning={isActRunning}
              onToggleTimer={onToggleTimer}
              isSelected={isActFiltered}
              onSelect={handleSelectCard}
              onToggleFilter={
                onToggleActivityFilter ? handleToggleFilter : undefined
              }
              onStartFocus={onStartFocus}
              onContextMenu={onContextMenu}
            />
          );
        }

        return (
          <SortableFocusActivityCard
            key={act.id}
            variant="activity"
            activity={act}
            todayMinutes={todayMinutes}
            isLocked={false}
            onLockedClick={onOpenUpgradeModal}
            isActiveTarget={isActTarget}
            isStagedTarget={isActStaged}
            isTimerRunning={isActRunning}
            onToggleTimer={onToggleTimer}
            isSelected={isActFiltered}
            onSelect={handleSelectCard}
            onToggleFilter={
              onToggleActivityFilter ? handleToggleFilter : undefined
            }
            onStartFocus={onStartFocus}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  );

  return (
    <section
      id="focus-activities-section"
      className="flex flex-col gap-3 w-full"
      aria-label={t("sectionAria")}
    >
      {/* Header com Título, Chip de Filtro, Contador e Botão de Criar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h2 className="font-bold text-neutral-100 text-subtitle-s">
            {t("title")}
          </h2>

          {selectedActivity && (
            <div className="flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 rounded-full bg-gold/10 border border-gold/40 text-xs text-amber-800 dark:text-gold font-medium animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[11px] text-neutral-400 hidden sm:inline">
                {t("filteringLabel")}
              </span>
              <span className="font-bold truncate max-w-[130px]">
                {selectedActivity.name}
              </span>
              <button
                type="button"
                onClick={() => onToggleActivityFilter?.(null)}
                className="min-w-6 min-h-6 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-full flex items-center justify-center hover:bg-gold/20 text-amber-800 dark:text-gold transition-colors cursor-pointer"
                title={t("clearFilterTitle")}
                aria-label={t("clearFilterAria", {
                  name: selectedActivity.name,
                })}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
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
              <Crown
                size={12}
                aria-hidden="true"
                className="text-amber-700 dark:text-gold fill-gold/20"
              />
            )}
            <span className="tabular-nums">
              {orderedActivities.length}/{maxActivities}
            </span>
            <span className="text-tiny text-neutral-400 hidden sm:inline">
              ({planName})
            </span>
          </div>

          <button
            type="button"
            onClick={isLimitReached ? onOpenUpgradeModal : onOpenCreateModal}
            disabled={isLimitReached && isPremium}
            aria-label={createButtonAria}
            className={cn(
              "flex items-center gap-1.5 min-h-8 pointer-coarse:min-h-9 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
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
                <Crown size={14} aria-hidden="true" className="fill-gold/20" />
                <span>{t("goPremiumButton")}</span>
              </>
            ) : (
              <>
                <Plus size={14} aria-hidden="true" />
                <span className="hidden sm:inline">
                  {t("newActivityButton")}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de Atividades (pula DndContext quando há ≤ 1 atividade destravada) */}
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
      ) : canReorder ? (
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
            {renderCards()}
          </SortableContext>
        </DndContext>
      ) : (
        renderCards()
      )}
    </section>
  );
}
