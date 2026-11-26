import {
  Backpack,
  Check,
  Filter,
  GripVertical,
  Loader2,
  Lock,
  MoreVertical,
  Pause,
  Play,
  Sparkles,
  Timer,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, type HTMLAttributes, memo } from "react";
import { getFocusIcon } from "@/constants/focusIcons";
import { PACKAGE_LEVEL_COLOR } from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { FocusActivity } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  cn,
  openContextMenuFromButton,
  STOP_DRAG_PROPAGATION_PROPS,
} from "@/utils";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
  isBackpackItemTimeDepleted,
} from "@/utils/focusFormatters";
import {
  BACKEND_TO_UI_PACKAGE,
  getRewardIcon,
  toPackageMessageKey,
} from "@/utils/rewardMapper";

export interface FocusCardBaseProps {
  isActiveTarget?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  onLockedClick?: () => void;
  isDragging?: boolean;
  sortableRef?: (node: HTMLElement | null) => void;
  sortableActivatorRef?: (node: HTMLElement | null) => void;
  sortableStyle?: CSSProperties;
  sortableAttributes?: HTMLAttributes<HTMLElement>;
  sortableListeners?: HTMLAttributes<HTMLElement>;
}

export interface FocusActivityCardVariantProps extends FocusCardBaseProps {
  variant: "activity";
  activity: FocusActivity;
  todayMinutes?: number;
  isStagedTarget?: boolean;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: (activity: FocusActivity) => void;
  onToggleFilter?: (activity: FocusActivity) => void;
  onStartFocus: (activity: FocusActivity) => void;
  onContextMenu: (e: React.MouseEvent, activity: FocusActivity) => void;
}

export interface FocusBackpackCardVariantProps extends FocusCardBaseProps {
  variant: "backpack";
  item: InventoryItemResponseDTO;
  isSelected?: boolean;
  isConsuming?: boolean;
  onSelect?: (item: InventoryItemResponseDTO) => void;
  onStartFocus: (item: InventoryItemResponseDTO) => void;
  onContextMenu: (e: React.MouseEvent, item: InventoryItemResponseDTO) => void;
  onConsume?: (item: InventoryItemResponseDTO) => void;
}

export type FocusCardProps =
  | FocusActivityCardVariantProps
  | FocusBackpackCardVariantProps;

/**
 * Card Unificado de Foco para Atividades e Itens da Mochila.
 * Usa o padrão de stretched button (`before:absolute before:inset-0`) + alça de drag dedicada
 * para eliminar `nested-interactive`, preservando teclado 100% nativo e desacoplando `@dnd-kit`.
 */
export const FocusCard = memo(function FocusCard(props: FocusCardProps) {
  const t = useTranslations("focus.card");
  const locale = useLocale() as AppLocale;
  const {
    isActiveTarget = false,
    isTimerRunning = false,
    onToggleTimer,
    isDragging = false,
    sortableRef,
    sortableActivatorRef,
    sortableStyle,
    sortableAttributes,
    sortableListeners,
  } = props;

  const isActivity = props.variant === "activity";
  const activity = isActivity ? props.activity : null;
  const todayMinutes = isActivity ? (props.todayMinutes ?? 0) : 0;
  const isStagedTarget = isActivity ? Boolean(props.isStagedTarget) : false;
  const isLocked = isActivity ? Boolean(props.isLocked) : false;
  const item = !isActivity ? props.item : null;
  const isConsuming = !isActivity ? Boolean(props.isConsuming) : false;
  const isSelected = Boolean(props.isSelected);
  const isDraggable = isActivity && !isLocked && Boolean(sortableListeners);

  const IconComponent = isActivity
    ? getFocusIcon(activity?.icon)
    : item?.rewardIcon
      ? getRewardIcon(item.rewardIcon, item.rewardType)
      : Backpack;

  const uiPackageLevel = item?.rewardPackageLevel
    ? BACKEND_TO_UI_PACKAGE[item.rewardPackageLevel]
    : undefined;
  const packageBadgeColor = uiPackageLevel
    ? PACKAGE_LEVEL_COLOR[toPackageMessageKey(uiPackageLevel)]
    : null;
  const isTimeDepleted = isBackpackItemTimeDepleted(item?.remainingSeconds);

  const title = isActivity
    ? activity?.name || ""
    : item?.rewardName || t("defaultItemName");

  const handleCardClick = () => {
    if (isLocked) {
      props.onLockedClick?.();
      return;
    }
    if (isActivity && props.onSelect && activity) {
      props.onSelect(activity);
    } else if (!isActivity && item) {
      if (isTimeDepleted) {
        if (!isConsuming) {
          props.onConsume?.(item);
        }
      } else if (props.onSelect) {
        props.onSelect(item);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isActivity && activity) {
      props.onContextMenu(e, activity);
    } else if (!isActivity && item) {
      props.onContextMenu(e, item);
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocked) {
      props.onLockedClick?.();
      return;
    }
    if (isActiveTarget && onToggleTimer) {
      if (isActivity && activity) {
        useFocusTimerStore.getState().syncTargetMetadata({
          id: activity.id,
          name: activity.name,
          icon: activity.icon,
          targetMinutes: activity.targetTimeMinutes,
          recordType: activity.recordType,
        });
      } else if (!isActivity && item) {
        useFocusTimerStore.getState().syncTargetMetadata({
          id: item.inventoryItemId,
          name: item.rewardName,
          icon: item.rewardIcon,
        });
      }
      onToggleTimer();
    } else {
      if (isActivity && activity) {
        props.onStartFocus(activity);
      } else if (!isActivity && item) {
        props.onStartFocus(item);
      }
    }
  };

  return (
    <article
      ref={sortableRef}
      style={sortableStyle}
      data-focus-card="true"
      data-selected={isSelected}
      onContextMenu={handleContextMenu}
      className={cn(
        "group relative flex items-center justify-between rounded-xl border bg-card dark:bg-card/85 shadow-2xs dark:shadow-none transition-[border-color,background-color,opacity,transform] duration-150 select-none p-3.5 sm:p-4 gap-3 focus-within:ring-2 focus-within:ring-gold/40",
        isSelected
          ? "ring-2 ring-gold border-gold/80 bg-gold/15 shadow-glow-gold-xs"
          : isActiveTarget
            ? "border-gold/80 bg-gold/10 shadow-glow-gold-xs"
            : isStagedTarget
              ? "border-primary/55 bg-primary/[0.06] dark:border-gold/45 dark:bg-gold/[0.06]"
              : isLocked
                ? "border-white/5 bg-surface/30 opacity-80 hover:opacity-100 hover:border-gold/30"
                : "border-neutral-700 dark:border-primary/30 hover:border-gold/40 hover:bg-card-hover dark:hover:bg-card-hover/90",
        isDragging &&
          "transition-none! opacity-60 ring-2 ring-gold shadow-glow-gold-md z-50 will-change-transform",
      )}
    >
      {/* Esquerda: Alça de Drag dedicada + Botão Stretched de Seleção */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        {isDraggable && (
          <button
            ref={sortableActivatorRef}
            type="button"
            {...sortableAttributes}
            {...sortableListeners}
            aria-label={t("reorderActivityAria", { title })}
            className="relative z-10 min-w-6 min-h-8 pointer-coarse:min-w-9 pointer-coarse:min-h-9 -ml-1.5 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-white/5 cursor-grab active:cursor-grabbing shrink-0 touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 transition-colors"
          >
            <GripVertical size={14} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={handleCardClick}
          aria-label={
            isLocked
              ? t("lockedActivityAria", { title })
              : isActivity
                ? t("selectActivityAria", { title })
                : t("selectItemAria", { title })
          }
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 before:content-[''] before:absolute before:inset-0 before:rounded-xl"
        >
          <div
            className={cn(
              "rounded-lg flex items-center justify-center shrink-0 border transition-colors w-10 h-10",
              isActiveTarget
                ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:bg-gold/20 dark:border-gold/60 dark:text-gold"
                : isLocked
                  ? "bg-neutral-800 border-neutral-700 text-neutral-400 group-hover:text-primary dark:bg-white/5 dark:border-white/10 dark:text-neutral-500 dark:group-hover:text-gold"
                  : "bg-primary/10 border-primary/25 text-primary group-hover:text-primary-dark group-hover:border-primary/40 dark:bg-primary-dark/30 dark:border-primary/40 dark:text-primary-light dark:group-hover:text-gold dark:group-hover:border-gold/40",
            )}
          >
            <IconComponent size={20} aria-hidden="true" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
              <h3 className="font-semibold text-neutral-100 group-hover:text-primary dark:group-hover:text-gold transition-colors truncate max-w-full text-body-m">
                {title}
              </h3>

              {isLocked && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 border border-amber-500/35 dark:bg-gold/15 dark:text-gold dark:border-gold/30 text-[11px] font-bold shrink-0">
                  <Lock size={10} aria-hidden="true" />
                  {t("pausedBadge")}
                </span>
              )}

              {uiPackageLevel && packageBadgeColor && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-bold border shrink-0",
                    packageBadgeColor,
                  )}
                >
                  {item?.rewardPackageLevel
                    ? t(`packageLevels.${item.rewardPackageLevel}`)
                    : uiPackageLevel}
                </span>
              )}

              {isActiveTarget && (
                <span
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 dark:bg-gold/20 text-amber-800 dark:text-gold border border-amber-500/40 dark:border-gold/40 text-[11px] font-bold shrink-0",
                    isTimerRunning && "motion-safe:animate-pulse",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-gold"
                  />
                  {t("inTimerBadge")}
                </span>
              )}
            </div>

            {/* Subtítulo / Detalhe de Tempo */}
            {isActivity ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-tiny text-neutral-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Timer
                    size={12}
                    aria-hidden="true"
                    className="text-neutral-500"
                  />
                  {activity?.recordType === "POMO"
                    ? t("pomodoroDuration", {
                        minutes: activity?.targetTimeMinutes || 35,
                      })
                    : t("freeStopwatch")}
                </span>
                {todayMinutes > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-px rounded bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
                    {t("todayDurationBadge", {
                      duration: formatFocusMinutes(todayMinutes),
                    })}
                  </span>
                )}
              </div>
            ) : item?.remainingSeconds !== undefined &&
              item?.remainingSeconds !== null ? (
              <span
                className={cn(
                  "flex items-center gap-1 font-medium text-tiny leading-none mt-0.5",
                  isTimeDepleted
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-gold",
                )}
              >
                <Timer
                  size={11}
                  aria-hidden="true"
                  className={
                    isTimeDepleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-gold"
                  }
                />
                {formatBackpackItemRemainingTime(item.remainingSeconds, locale)}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-tiny text-neutral-400 leading-none mt-0.5">
                <Sparkles size={11} aria-hidden="true" />
                {t("activeCoupon")}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Direita: Ações elevadas acima do stretched button (z-10) */}
      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
        {isActivity && activity && props.onToggleFilter && (
          <button
            type="button"
            {...STOP_DRAG_PROPAGATION_PROPS}
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleFilter?.(activity);
            }}
            aria-pressed={isSelected}
            aria-label={
              isSelected
                ? t("clearMetricsFilterAria", { title })
                : t("filterMetricsAria", { title })
            }
            title={
              isSelected
                ? t("clearMetricsFilterTitle")
                : t("filterMetricsTitle")
            }
            className={cn(
              "flex items-center justify-center rounded-lg border transition-colors cursor-pointer min-w-8 min-h-8 pointer-coarse:min-w-9 pointer-coarse:min-h-9",
              isSelected
                ? "bg-gold/20 border-gold/60 text-amber-800 dark:text-gold"
                : "border-transparent text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-surface dark:hover:bg-white/10",
            )}
          >
            <Filter size={14} aria-hidden="true" />
          </button>
        )}

        {!isActivity && isTimeDepleted ? (
          <button
            type="button"
            disabled={isConsuming}
            aria-busy={isConsuming}
            {...STOP_DRAG_PROPAGATION_PROPS}
            onClick={(e) => {
              e.stopPropagation();
              if (item && !isConsuming) {
                props.onConsume?.(item);
              }
            }}
            aria-label={t("completeItemAria", { title })}
            title={t("completeItemTitle")}
            className={cn(
              "flex items-center justify-center rounded-lg border transition-colors cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-neutral-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] disabled:opacity-65 disabled:cursor-not-allowed min-w-9 min-h-9 pointer-coarse:min-w-10 pointer-coarse:min-h-10",
              !isConsuming && "motion-safe:animate-pulse",
            )}
          >
            {isConsuming ? (
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
            ) : (
              <Check size={18} aria-hidden="true" className="stroke-[3]" />
            )}
          </button>
        ) : isLocked ? (
          <button
            type="button"
            {...STOP_DRAG_PROPAGATION_PROPS}
            onClick={(e) => {
              e.stopPropagation();
              props.onLockedClick?.();
            }}
            aria-label={t("lockedActivityAria", { title })}
            title={t("lockedActivityTitle")}
            className="flex items-center justify-center rounded-lg border transition-[transform,background-color,border-color,color] duration-150 cursor-pointer bg-amber-500/10 dark:bg-gold/10 hover:bg-amber-500/20 dark:hover:bg-gold/20 text-amber-800 dark:text-gold border-amber-500/40 dark:border-gold/30 hover:border-amber-600 dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95 min-w-9 min-h-9 pointer-coarse:min-w-10 pointer-coarse:min-h-10"
          >
            <Lock size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            {...STOP_DRAG_PROPAGATION_PROPS}
            onClick={handleActionClick}
            aria-label={
              isActiveTarget
                ? isTimerRunning
                  ? t("pauseFocusAria", { title })
                  : t("resumeFocusAria", { title })
                : t("startFocusAria", { title })
            }
            title={
              isActiveTarget
                ? isTimerRunning
                  ? t("pauseFocusTitle")
                  : t("resumeFocusTitle")
                : t("startFocusTitle")
            }
            className={cn(
              "flex items-center justify-center rounded-lg border transition-colors cursor-pointer min-w-9 min-h-9 pointer-coarse:min-w-10 pointer-coarse:min-h-10",
              isActiveTarget
                ? "bg-gold text-on-gold border-gold font-bold shadow-glow-gold-xs hover:bg-gold-hover"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20 hover:border-primary dark:bg-surface/80 dark:hover:bg-gold/20 dark:text-neutral-200 dark:hover:text-gold dark:border-primary/30 dark:hover:border-gold/50",
            )}
          >
            {isActiveTarget && isTimerRunning ? (
              <Pause size={16} aria-hidden="true" className="fill-on-gold" />
            ) : (
              <Play
                size={16}
                aria-hidden="true"
                className={
                  isActiveTarget ? "fill-on-gold ml-0.5" : "fill-current ml-0.5"
                }
              />
            )}
          </button>
        )}

        <button
          type="button"
          {...STOP_DRAG_PROPAGATION_PROPS}
          onClick={(e) => openContextMenuFromButton(e, handleContextMenu)}
          aria-label={t("moreActionsAria", { title })}
          title={t("moreActionsAria", { title })}
          className="flex items-center justify-center rounded-lg border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold min-w-9 min-h-9 pointer-coarse:min-w-10 pointer-coarse:min-h-10"
        >
          <MoreVertical size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
});
