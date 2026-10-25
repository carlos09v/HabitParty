"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import { memo, type default as React, useState } from "react";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import { CoinIcon } from "@/components/ui/CoinIcon";
import {
  getMysteryBoxTier,
  getRewardIcon,
  isMysteryBoxReward,
  PACKAGE_LEVEL_COLOR,
  PACKAGE_LEVEL_GLOW,
  PACKAGE_LEVEL_ICON_THEME,
  REWARD_TYPE_META,
} from "@/constants/reward";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import {
  formatBackpackItemRemainingTime,
  formatFocusMinutes,
} from "@/utils/focusFormatters";

export interface GamifiedItemCardProps {
  id: string;
  title: string;
  description?: string;
  iconName?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  baseDurationMinutes?: number | null;
  remainingSeconds?: number | null;
  isCompact?: boolean;
  quantity?: number;
  price?: number;
  canAfford?: boolean;
  actionLabel: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
  inUse?: boolean;
}

const RARITY_TOP_BAR: Partial<Record<PackageLevel, string>> = {
  Lendário: "via-gold opacity-90",
  Épico: "via-magenta opacity-90",
  Premium: "via-info opacity-90",
  Básico: "via-success-500 opacity-70",
};

/**
 * Card gamificado unificado e memoizado para itens da Vitrine (Rewards) e da Mochila (Inventory).
 */
export const GamifiedItemCard = memo(function GamifiedItemCard({
  id,
  title,
  description,
  iconName,
  type,
  packageLevel,
  category,
  baseDurationMinutes,
  remainingSeconds,
  isCompact = false,
  quantity,
  price,
  canAfford = true,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  onContextMenu,
  dragData,
  inUse = false,
}: GamifiedItemCardProps) {
  const typeMeta = REWARD_TYPE_META[type as RewardType];
  const RewardIcon = getRewardIcon(iconName, type);
  const isMystery = isMysteryBoxReward(type, iconName);
  const mysteryTier = isMystery ? getMysteryBoxTier(packageLevel) : null;

  const [isHovered, setIsHovered] = useState(false);
  const [popoverPlacement, setPopoverPlacement] = useState<{
    side: "left" | "right";
    vertical: "top" | "bottom";
  }>({ side: "right", vertical: "top" });

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (isMystery) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.right;
      const spaceBelow = window.innerHeight - rect.top;

      const side = spaceRight < 310 ? "left" : "right";
      const vertical = spaceBelow < 380 && rect.bottom > 380 ? "bottom" : "top";

      setPopoverPlacement({ side, vertical });
    }
    setIsHovered(true);
  };

  const packageGlow = packageLevel
    ? PACKAGE_LEVEL_GLOW[packageLevel as PackageLevel]
    : undefined;
  const packageIconTheme = packageLevel
    ? PACKAGE_LEVEL_ICON_THEME[packageLevel as PackageLevel]
    : undefined;
  const topBarClass = packageLevel
    ? RARITY_TOP_BAR[packageLevel as PackageLevel]
    : undefined;

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
  const isPrimaryDisabled = !canAfford || (inUse && !isFocusNavigate);

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={(e) =>
        handleMouseEnter(e as unknown as React.MouseEvent<HTMLElement>)
      }
      onBlur={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col justify-between rounded-xl bg-gradient-to-b from-surface via-surface to-popover/95 border transition-[border-color,background-color,box-shadow,transform] duration-150 group select-none shadow-sm hover:shadow-card-deep hover:-translate-y-0.5",
        isHovered && isMystery && !isDragging
          ? "overflow-visible z-40"
          : "overflow-hidden",
        inUse
          ? "border-amber-500/40 bg-amber-500/5"
          : packageGlow || "border-white/15 hover:border-gold/50",
        isCompact ? "p-2.5 gap-2" : "p-3.5 gap-2.5",
        isDragging && "!transition-none opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Detalhe de Raridade no Topo do Card */}
      {topBarClass && (
        <div
          className={cn(
            "absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent to-transparent pointer-events-none",
            topBarClass,
          )}
        />
      )}

      {/* TOPO INTEGRADO: Ícone + Título/Descrição + Badges de Tipo/Quantidade */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <header className="flex items-start gap-2.5 w-full min-w-0">
          <div
            className={cn(
              "rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105",
              packageIconTheme ||
                "bg-white/10 border-white/15 text-primary-light group-hover:text-gold group-hover:border-gold/40",
              isCompact ? "w-9 h-9" : "w-10 h-10",
            )}
          >
            <RewardIcon
              size={isCompact ? 17 : 20}
              className={isMystery ? "text-amber-400" : undefined}
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            <div className="flex items-center justify-between gap-1.5 w-full min-w-0">
              <h4
                className={cn(
                  "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors leading-tight",
                  isCompact ? "text-xs" : "text-body-s",
                )}
              >
                {title}
              </h4>

              <div className="flex items-center gap-1 shrink-0">
                {inUse && (
                  <span className="inline-flex items-center gap-1 font-bold rounded border border-amber-500/40 bg-amber-500/15 text-amber-300 text-tiny px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Em Foco
                  </span>
                )}

                {typeof quantity === "number" && (
                  <span
                    className={cn(
                      "font-bold bg-white/10 border border-white/20 text-neutral-100 px-1.5 py-0.5",
                      isCompact
                        ? "text-tiny rounded"
                        : "text-label-g rounded-md",
                    )}
                  >
                    {quantity}x
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex items-center gap-1 border font-medium leading-none shrink-0 text-tiny px-1.5 py-0.5",
                    isCompact ? "rounded" : "rounded-md",
                    typeMeta?.color ||
                      "text-neutral-200 bg-white/10 border-white/20",
                  )}
                >
                  {typeMeta?.icon && (
                    <typeMeta.icon
                      size={isCompact ? 9 : 10}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{typeMeta?.label || type}</span>
                </span>
              </div>
            </div>

            {description && description.trim() !== "" ? (
              <p
                className={cn(
                  "text-neutral-400 truncate leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {description}
              </p>
            ) : (
              <p
                className={cn(
                  "text-neutral-500 italic truncate leading-tight",
                  isCompact ? "text-label-g" : "text-xs",
                )}
              >
                {type === "TimeBased"
                  ? "Cupom de tempo para sessão de lazer"
                  : isMystery
                    ? "Contém uma recompensa surpresa aleatória"
                    : "Recompensa de resgate imediato"}
              </p>
            )}
          </div>
        </header>

        {/* LINHA DE BADGES: Duração em Destaque + Raridade + Categoria */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {type === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-bold tracking-tight leading-none",
                  isCompact ? "text-tiny" : "text-label-g",
                  remainingSeconds <= 1
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                    : "bg-gold/15 border-gold/40 text-gold shadow-glow-gold-xs",
                )}
              >
                <Clock
                  size={isCompact ? 10 : 12}
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
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-extrabold tracking-tight leading-none bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
                  isCompact ? "text-tiny" : "text-label-g",
                )}
                title={`Duração do cupom: ${baseDurationMinutes} minutos`}
              >
                <Clock
                  size={isCompact ? 10 : 12}
                  className="text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {formatFocusMinutes(baseDurationMinutes)}
                </span>
              </span>
            ) : null
          ) : null}

          {Boolean(
            packageLevel &&
              packageLevel !== "Nenhum" &&
              packageLevel !== "NONE",
          ) && (
            <span
              className={cn(
                "font-semibold rounded border text-tiny px-1.5 py-0.5 leading-none",
                PACKAGE_LEVEL_COLOR[packageLevel as PackageLevel] ||
                  "text-neutral-300 bg-white/10 border-white/15",
              )}
            >
              {packageLevel}
            </span>
          )}
          {Boolean(
            category && category !== "Nenhum" && category !== "NONE",
          ) && (
            <span className="font-medium rounded bg-white/8 border border-white/10 text-neutral-300 text-tiny px-1.5 py-0.5 leading-none">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* BASE: Preço (na Loja) ou Status + Botões de Ação */}
      <footer className="flex items-center justify-between pt-2.5 border-t border-white/10 w-full gap-2">
        <div className="flex items-center min-w-0">
          {typeof price === "number" ? (
            <div className="flex items-center gap-1.5 bg-gold/10 border border-gold/25 px-2.5 py-1 rounded-lg">
              <CoinIcon size={15} withGlow />
              <span className="text-xs font-extrabold text-neutral-100">
                {formatCoins(price)}
              </span>
            </div>
          ) : !(secondaryActionLabel && onSecondaryAction) ? (
            <span className="text-neutral-400 font-medium truncate text-tiny">
              {inUse
                ? "Sessão ativa"
                : isMystery
                  ? "Caixa lacrada"
                  : "Disponível"}
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 shrink-0",
            typeof price !== "number" &&
              secondaryActionLabel &&
              onSecondaryAction &&
              "w-full justify-end",
          )}
        >
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              disabled={inUse}
              aria-label={`${secondaryActionLabel} ${title}`}
              title={
                inUse
                  ? "Item em uso no Focus"
                  : `${secondaryActionLabel} ${title}`
              }
              className={cn(
                "rounded-lg font-semibold transition-all shadow-xs border text-neutral-200",
                inUse
                  ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
                  : "border-primary/40 bg-surface/80 hover:bg-gold/15 hover:border-gold/60 hover:text-gold active:scale-95 cursor-pointer",
                isCompact ? "px-2.5 py-1 text-label-g" : "px-3 py-1.5 text-xs",
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
                  : !canAfford
                    ? "Moedas insuficientes"
                    : `${actionLabel} por ${price ? `${price} moedas` : title}`
            }
            className={cn(
              "rounded-lg font-bold transition-all shadow-xs",
              typeof price !== "number" &&
                secondaryActionLabel &&
                onSecondaryAction &&
                "flex-1 sm:flex-initial text-center",
              isFocusNavigate
                ? "bg-gold hover:bg-gold-hover text-neutral-900 border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95"
                : canAfford && !inUse
                  ? "bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1 focus:ring-offset-surface active:scale-95 text-neutral-900 cursor-pointer"
                  : "bg-white/10 text-neutral-400 border border-white/10 cursor-not-allowed opacity-60",
              isCompact ? "px-2.5 py-1 text-label-g" : "px-3.5 py-1.5 text-xs",
            )}
          >
            {actionLabel}
          </button>
        </div>
      </footer>

      {/* Popover Informativo com Chances e Drops da Caixa Misteriosa */}
      {isHovered && isMystery && mysteryTier && !isDragging && (
        <MysteryBoxTierPopover
          tier={mysteryTier}
          customPrice={price}
          alignClass={cn(
            "max-sm:left-1/2 max-sm:-translate-x-1/2 max-sm:top-full max-sm:mt-2",
            popoverPlacement.vertical === "bottom"
              ? "sm:bottom-0 sm:top-auto"
              : "sm:top-0 sm:bottom-auto",
            popoverPlacement.side === "right"
              ? "sm:left-full sm:right-auto sm:ml-3 sm:translate-x-0"
              : "sm:right-full sm:left-auto sm:mr-3 sm:translate-x-0",
          )}
        />
      )}
    </article>
  );
});
