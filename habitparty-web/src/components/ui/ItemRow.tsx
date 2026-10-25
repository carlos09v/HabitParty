"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";
import { memo, type default as React } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import {
  getRewardIcon,
  isMysteryBoxReward,
  PACKAGE_LEVEL_COLOR,
  PACKAGE_LEVEL_ICON_THEME,
  REWARD_TYPE_META,
} from "@/constants/reward";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";

export interface ItemRowProps {
  id: string;
  title: string;
  description?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  iconName?: string;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  isCompact?: boolean;
  quantity?: number;
  price?: number;
  disabled?: boolean;
  disabledTitle?: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
}

const RARITY_LEFT_ACCENT: Record<string, string> = {
  Lendário: "border-l-4 border-l-gold",
  Épico: "border-l-4 border-l-magenta",
  Premium: "border-l-4 border-l-info",
  Básico: "border-l-4 border-l-success-500",
};

/**
 * Linha de lista reordenável e memoizada para Vitrine (Rewards) e Mochila (Inventory).
 * Utiliza uma única árvore DOM responsiva (Flex no mobile -> Grid de 5 colunas no desktop md+).
 */
export const ItemRow = memo(function ItemRow({
  id,
  title,
  description,
  type,
  packageLevel,
  category,
  iconName,
  baseDurationMinutes,
  remainingSeconds,
  isCompact = false,
  quantity,
  price,
  disabled = false,
  disabledTitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onContextMenu,
  dragData,
  inUse = false,
}: ItemRowProps) {
  const typeMeta = REWARD_TYPE_META[type as RewardType];
  const RewardIcon = getRewardIcon(iconName, type);
  const isMystery = isMysteryBoxReward(type, iconName);
  const packageIconTheme = packageLevel
    ? PACKAGE_LEVEL_ICON_THEME[packageLevel as PackageLevel]
    : undefined;
  const leftAccent =
    (packageLevel && RARITY_LEFT_ACCENT[packageLevel]) ||
    "border-l-4 border-l-transparent";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: dragData || { id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isFocusNavigate =
    inUse &&
    (actionLabel === "Abrir no Foco" || actionLabel === "Ir para o Foco");
  const isPrimaryDisabled = disabled || (inUse && !isFocusNavigate);

  const hasValidPackage = Boolean(
    packageLevel && packageLevel !== "Nenhum" && packageLevel !== "NONE",
  );
  const hasValidCategory = Boolean(
    category && category !== "Nenhum" && category !== "NONE",
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      className={cn(
        "relative rounded-xl bg-gradient-to-r from-surface via-surface to-popover/95 border transition-[border-color,background-color,box-shadow,transform] duration-150 select-none group overflow-hidden",
        inUse
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-white/10 hover:border-gold/50 hover:shadow-card-deep hover:-translate-y-0.5",
        leftAccent,
        "flex flex-col gap-2.5 p-3 sm:p-3.5",
        "md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] md:items-center",
        isCompact ? "md:gap-3 md:px-3 md:py-2" : "md:gap-4 md:px-4 md:py-2.5",
        isDragging && "!transition-none opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Coluna 1: Grip + Ícone + [Qtd] + Título/Descrição (+ Preço rápido no mobile) */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div className="w-4 flex items-center justify-center shrink-0">
            <GripVertical
              size={isCompact ? 12 : 14}
              className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
              aria-hidden="true"
            />
          </div>

          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105",
              packageIconTheme ||
                "bg-white/10 border-white/15 text-primary-light group-hover:text-gold group-hover:border-gold/40",
              isCompact ? "w-8.5 h-8.5" : "w-9 h-9 md:w-10 md:h-10",
            )}
          >
            <RewardIcon
              size={isCompact ? 16 : 19}
              className={isMystery ? "text-amber-400" : undefined}
              aria-hidden="true"
            />
          </div>

          {typeof quantity === "number" && (
            <span
              className={cn(
                "font-bold bg-white/10 border border-white/20 text-neutral-100 shrink-0",
                isCompact
                  ? "text-tiny px-1.5 py-0.5 rounded"
                  : "text-xs px-2 py-0.5 rounded-md",
              )}
            >
              {quantity}x
            </span>
          )}

          <div className="flex flex-col min-w-0 flex-1">
            <h4
              className={cn(
                "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors leading-tight",
                isCompact ? "text-xs" : "text-body-s",
              )}
            >
              {title}
            </h4>
            {description && (
              <p
                className={cn(
                  "text-neutral-400 truncate mt-0.5 leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Preço visível no topo direito apenas no Mobile (< md) */}
        {typeof price === "number" && (
          <div className="flex md:hidden items-center gap-1.5 shrink-0 bg-gold/10 border border-gold/25 px-2 py-0.5 rounded-lg">
            <CoinIcon size={14} withGlow />
            <span className="font-bold text-neutral-100 text-xs">
              {formatCoins(price)}
            </span>
          </div>
        )}
      </div>

      {/* Container de Metadados: No Mobile fica em linha única com wrap; no Desktop usa `md:contents` para ocupar as Colunas 2, 3 e 4 do Grid */}
      <div className="flex items-center gap-1.5 flex-wrap pl-6 md:pl-0 md:contents">
        {/* Coluna 2: Badge de Status (Em Foco) + Tipo */}
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {inUse && (
            <span
              className={cn(
                "text-label-m font-bold border truncate inline-flex items-center gap-1.5 leading-none shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-300",
                isCompact ? "px-1.5 py-0.5 rounded" : "px-2 py-0.5 rounded-md",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Em Foco
            </span>
          )}
          <span
            className={cn(
              "text-label-m font-medium border truncate inline-flex items-center gap-1 leading-none shrink-0",
              isCompact ? "px-1.5 py-0.5 rounded" : "px-2 py-0.5 rounded-md",
              typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
            )}
          >
            {typeMeta?.icon && (
              <typeMeta.icon
                size={isCompact ? 9 : 11}
                className="shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{typeMeta?.label || type}</span>
          </span>
        </div>

        {/* Coluna 3: Pacote (Raridade) & Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {hasValidPackage && (
            <span
              className={cn(
                "text-label-m font-semibold border truncate rounded",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-0.5",
                PACKAGE_LEVEL_COLOR[packageLevel as PackageLevel] ||
                  "text-neutral-300 bg-white/10 border-white/15",
              )}
            >
              {packageLevel}
            </span>
          )}
          {hasValidCategory && (
            <span
              className={cn(
                "text-label-m font-medium bg-white/10 border border-white/10 text-neutral-300 truncate rounded",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-0.5",
              )}
            >
              {category}
            </span>
          )}
        </div>

        {/* Coluna 4: Duração */}
        <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
          {type === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 truncate font-medium",
                  remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                  isCompact ? "text-label-m" : "text-label-g",
                )}
              >
                <Clock
                  size={isCompact ? 11 : 13}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatBackpackItemRemainingTime(remainingSeconds)}
                </span>
              </span>
            ) : baseDurationMinutes ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-extrabold bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                <Clock
                  size={isCompact ? 11 : 13}
                  className="text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatFocusMinutes(baseDurationMinutes)}
                </span>
              </span>
            ) : (
              <span
                className={cn(
                  "text-neutral-400 truncate",
                  isCompact ? "text-label-m" : "text-label-g",
                )}
              >
                Cupom
              </span>
            )
          ) : (
            <span
              className={cn(
                "text-neutral-400 truncate",
                isCompact ? "text-label-m" : "text-label-g",
              )}
            >
              Uso Imediato
            </span>
          )}
        </div>
      </div>

      {/* Coluna 5: Preço (Desktop) & Botões de Ação */}
      <div className="flex items-center justify-end gap-2 md:gap-3.5 pt-1 md:pt-0 border-t border-white/5 md:border-t-0 shrink-0">
        {typeof price === "number" && (
          <div className="hidden md:flex items-center gap-1.5">
            <CoinIcon size={isCompact ? 15 : 17} withGlow />
            <span
              className={cn(
                "font-bold text-neutral-100",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {formatCoins(price)}
            </span>
          </div>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={disabled || inUse}
            aria-label={`${secondaryActionLabel} ${title}`}
            title={
              inUse
                ? "Item em uso no Focus"
                : `${secondaryActionLabel} ${title}`
            }
            className={cn(
              "rounded-md font-semibold transition-all shadow-xs border text-neutral-200",
              disabled || inUse
                ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
                : "border-primary/40 bg-surface/80 hover:bg-gold/15 hover:border-gold/60 hover:text-gold active:scale-95 cursor-pointer",
              isCompact ? "px-2 py-0.5 text-label-g" : "px-2.5 py-1 text-xs",
            )}
          >
            {secondaryActionLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onAction}
          disabled={isPrimaryDisabled}
          aria-label={`${actionLabel} ${title}`}
          title={
            isFocusNavigate
              ? "Abrir a tela de Foco com esta sessão ativa"
              : inUse
                ? "Item em uso no Focus"
                : disabled
                  ? disabledTitle || "Moedas insuficientes"
                  : `${actionLabel} ${title}`
          }
          className={cn(
            "rounded-md font-bold transition-all shadow-xs",
            isFocusNavigate
              ? "bg-gold hover:bg-gold-hover text-neutral-900 border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95"
              : disabled || inUse
                ? "bg-white/10 text-neutral-400 border border-white/10 cursor-not-allowed opacity-60"
                : "bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1 focus:ring-offset-surface active:scale-95 text-neutral-900 cursor-pointer",
            isCompact
              ? "px-2.5 py-1 text-label-g"
              : "px-3 py-1.5 text-xs sm:py-1",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </li>
  );
});

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
