"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Backpack,
  Check,
  GripVertical,
  Lock,
  Pause,
  Play,
  Sparkles,
  Timer,
} from "lucide-react";
import { type CSSProperties, type HTMLAttributes, memo } from "react";
import { getFocusIcon } from "@/constants/focus";
import { getRewardIcon, PACKAGE_LEVEL_COLOR } from "@/constants/reward";
import type { FocusActivity } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import {
  formatBackpackItemRemainingTime,
  isBackpackItemTimeDepleted,
} from "@/utils/focusFormatters";
import { BACKEND_TO_UI_PACKAGE } from "@/utils/rewardMapper";

export interface FocusCardBaseProps {
  isActiveTarget?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  onLockedClick?: () => void;
  isCompact?: boolean;
  isDragging?: boolean;
  sortableRef?: (node: HTMLElement | null) => void;
  sortableStyle?: CSSProperties;
  sortableAttributes?: HTMLAttributes<HTMLElement>;
  sortableListeners?: HTMLAttributes<HTMLElement>;
}

export interface FocusActivityCardVariantProps extends FocusCardBaseProps {
  variant: "activity";
  activity: FocusActivity;
  isSelected?: boolean;
  isLocked?: boolean;
  onSelect?: (activity: FocusActivity) => void;
  onStartFocus: (activity: FocusActivity) => void;
  onContextMenu: (e: React.MouseEvent, activity: FocusActivity) => void;
}

export interface FocusBackpackCardVariantProps extends FocusCardBaseProps {
  variant: "backpack";
  item: InventoryItemResponseDTO;
  onStartFocus: (item: InventoryItemResponseDTO) => void;
  onContextMenu: (e: React.MouseEvent, item: InventoryItemResponseDTO) => void;
  onConsume?: (item: InventoryItemResponseDTO) => void;
}

export type FocusCardProps =
  | FocusActivityCardVariantProps
  | FocusBackpackCardVariantProps;

/**
 * Card Unificado de Foco para Atividades e Itens da Mochila.
 * Memoizado para evitar re-renders desnecessários durante drag-and-drop ou interações no palco.
 */
export const FocusCard = memo(function FocusCard(props: FocusCardProps) {
  const {
    isActiveTarget = false,
    isTimerRunning = false,
    onToggleTimer,
    isCompact = false,
    isDragging = false,
    sortableRef,
    sortableStyle,
    sortableAttributes,
    sortableListeners,
  } = props;

  const isActivity = props.variant === "activity";
  const activity = isActivity ? props.activity : null;
  const isLocked = isActivity ? Boolean(props.isLocked) : false;
  const item = !isActivity ? props.item : null;
  const isSelected = isActivity ? Boolean(props.isSelected) : false;
  const isDraggable = isActivity && !isLocked && Boolean(sortableListeners);

  // Resolução do ícone
  const IconComponent = isActivity
    ? getFocusIcon(activity?.icon)
    : item?.rewardIcon
      ? getRewardIcon(item.rewardIcon, item.rewardType)
      : Backpack;

  // Metadados específicos de mochila
  const uiPackageLevel = item?.rewardPackageLevel
    ? BACKEND_TO_UI_PACKAGE[item.rewardPackageLevel]
    : undefined;
  const packageBadgeColor = uiPackageLevel
    ? PACKAGE_LEVEL_COLOR[uiPackageLevel]
    : null;
  const isTimeDepleted = isBackpackItemTimeDepleted(item?.remainingSeconds);

  const title = isActivity
    ? activity?.name
    : item?.rewardName || "Item de Foco";

  const handleCardClick = (e?: React.MouseEvent) => {
    if (isLocked) {
      props.onLockedClick?.();
      return;
    }
    if (isActivity && props.onSelect && activity) {
      props.onSelect(activity);
    } else if (!isActivity && isTimeDepleted && item) {
      if (e) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        triggerCelebrationConfetti(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
      }
      props.onConsume?.(item);
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
      {...sortableAttributes}
      {...sortableListeners}
      data-focus-card="true"
      data-selected={isSelected}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      onContextMenu={handleContextMenu}
      className={cn(
        "group relative flex items-center justify-between rounded-xl border bg-card/60 backdrop-blur-sm transition-[border-color,background-color,box-shadow,opacity] duration-200 select-none",
        isActivity
          ? isLocked
            ? "cursor-pointer"
            : isDraggable
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-pointer"
          : "",
        isCompact ? "p-3 gap-2.5" : "p-3.5 sm:p-4 gap-3",
        isSelected
          ? "ring-2 ring-gold border-gold/80 bg-gold/15 shadow-glow-gold-xs"
          : isActiveTarget
            ? "border-gold/80 bg-gold/10 shadow-glow-gold-xs"
            : isLocked
              ? "border-white/5 bg-surface/30 opacity-75 hover:opacity-100 hover:border-gold/30"
              : "border-primary/30 hover:border-gold/40 hover:bg-card-hover/80",
        isDragging &&
          "!transition-none opacity-60 ring-2 ring-gold shadow-glow-gold-md z-50 will-change-transform",
      )}
    >
      {/* Esquerda: Ícone + Detalhes */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        {isDraggable && (
          <GripVertical
            size={14}
            aria-hidden="true"
            className="text-neutral-500 opacity-0 group-hover:opacity-70 transition-opacity shrink-0 -ml-1 hidden sm:block"
          />
        )}

        <div
          className={cn(
            "rounded-lg flex items-center justify-center shrink-0 border transition-all",
            isCompact ? "w-9 h-9" : "w-10 h-10",
            isActiveTarget
              ? "bg-gold/20 border-gold/60 text-gold"
              : isLocked
                ? "bg-white/5 border-white/10 text-neutral-500 group-hover:text-gold"
                : "bg-primary-dark/30 border-primary/40 text-primary-light group-hover:text-gold group-hover:border-gold/40",
          )}
        >
          <IconComponent size={isCompact ? 18 : 20} />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h4
              className={cn(
                "font-semibold text-neutral-100 group-hover:text-gold transition-colors truncate",
                isCompact ? "text-body-s" : "text-body-m",
              )}
            >
              {title}
            </h4>

            {isLocked && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 text-tiny font-bold shrink-0">
                <Lock size={10} />
                Pausada 👑
              </span>
            )}

            {uiPackageLevel && packageBadgeColor && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-tiny font-bold border shrink-0",
                  packageBadgeColor,
                )}
              >
                {uiPackageLevel}
              </span>
            )}

            {isActiveTarget && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/40 text-tiny font-bold animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                No Timer
              </span>
            )}
          </div>

          {/* Subtítulo / Detalhe de Tempo */}
          {isActivity ? (
            <div className="flex items-center gap-2 text-tiny text-neutral-400 mt-0.5">
              <span className="flex items-center gap-1">
                <Timer size={12} className="text-neutral-500" />
                {activity?.recordType === "POMO"
                  ? `Pomodoro (${activity?.targetTimeMinutes || 35}m)`
                  : "Cronômetro Livre"}
              </span>
            </div>
          ) : item?.remainingSeconds !== undefined &&
            item?.remainingSeconds !== null ? (
            <span
              className={cn(
                "flex items-center gap-1 font-medium text-tiny leading-none mt-0.5",
                isTimeDepleted ? "text-emerald-400" : "text-gold",
              )}
            >
              <Timer
                size={11}
                className={isTimeDepleted ? "text-emerald-400" : "text-gold"}
              />
              {formatBackpackItemRemainingTime(item.remainingSeconds)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-tiny text-neutral-400 leading-none mt-0.5">
              <Sparkles size={11} />
              Cupom Ativo
            </span>
          )}
        </div>
      </div>

      {/* Direita: Ações (Play OU Check para Concluir) */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {!isActivity && isTimeDepleted ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              triggerCelebrationConfetti(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
              );
              if (item) props.onConsume?.(item);
            }}
            aria-label={`Concluir item ${title}`}
            title="Tempo esgotado! Clique para concluir e consumir este item"
            className={cn(
              "flex items-center justify-center rounded-lg border transition-all cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-neutral-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse",
              isCompact ? "w-8 h-8" : "w-9 h-9",
            )}
          >
            <Check size={isCompact ? 16 : 18} className="stroke-[3]" />
          </button>
        ) : isLocked ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              props.onLockedClick?.();
            }}
            aria-label={`Atividade ${title} pausada no plano Free. Clique para desbloquear com Premium`}
            title="Atividade pausada no plano Free (máx. 4 ativas). Assine o Premium para desbloquear 👑"
            className={cn(
              "flex items-center justify-center rounded-lg border transition-all cursor-pointer bg-gold/10 hover:bg-gold/20 text-gold border-gold/30 hover:border-gold hover:shadow-glow-gold-xs active:scale-95",
              isCompact ? "w-8 h-8" : "w-9 h-9",
            )}
          >
            <Lock size={isCompact ? 14 : 16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActionClick}
            aria-label={
              isActiveTarget
                ? isTimerRunning
                  ? `Pausar foco em ${title}`
                  : `Continuar foco em ${title}`
                : `Iniciar foco em ${title}`
            }
            title={
              isActiveTarget
                ? isTimerRunning
                  ? "Pausar Foco"
                  : "Continuar Foco"
                : "Iniciar Foco"
            }
            className={cn(
              "flex items-center justify-center rounded-lg border transition-all cursor-pointer",
              isCompact ? "w-8 h-8" : "w-9 h-9",
              isActiveTarget
                ? "bg-gold text-neutral-900 border-gold font-bold shadow-glow-gold-xs hover:bg-gold-hover"
                : "bg-surface/80 hover:bg-gold/20 text-neutral-200 hover:text-gold border-primary/30 hover:border-gold/50",
            )}
          >
            {isActiveTarget && isTimerRunning ? (
              <Pause size={isCompact ? 14 : 16} className="fill-neutral-900" />
            ) : (
              <Play
                size={isCompact ? 14 : 16}
                className={
                  isActiveTarget
                    ? "fill-neutral-900 ml-0.5"
                    : "fill-current ml-0.5"
                }
              />
            )}
          </button>
        )}
      </div>
    </article>
  );
});

/**
 * Wrapper Sortable exclusivo para atividades destravadas.
 * Atividades travadas (plano Free com > 4 atividades) NÃO passam por useSortable,
 * ficando congeladas nas últimas posições sem custo de medição no @dnd-kit.
 */
export const SortableFocusActivityCard = memo(
  function SortableFocusActivityCard(
    props: Omit<
      FocusActivityCardVariantProps,
      | "sortableRef"
      | "sortableStyle"
      | "sortableAttributes"
      | "sortableListeners"
      | "isDragging"
    >,
  ) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: props.activity.id,
      disabled: Boolean(props.isLocked),
    });

    const style: CSSProperties = {
      transform: CSS.Translate.toString(transform),
      transition: isDragging ? undefined : transition,
    };

    return (
      <FocusCard
        {...props}
        isDragging={isDragging}
        sortableRef={setNodeRef}
        sortableStyle={style}
        sortableAttributes={attributes}
        sortableListeners={listeners}
      />
    );
  },
);
