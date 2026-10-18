"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import { type default as React, useState } from "react";
import { MysteryBoxTierPopover } from "@/components/reward/MysteryBoxTierPopover";
import {
  getRewardIcon,
  MYSTERY_BOX_TIERS,
  PACKAGE_LEVEL_COLOR,
  PACKAGE_LEVEL_GLOW,
  PACKAGE_LEVEL_ICON_THEME,
  REWARD_TYPE_META,
} from "@/constants/reward";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import { formatBackpackItemRemainingTime } from "@/utils/focusFormatters";

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

/**
 * Card gamificado unificado para itens da Vitrine (Rewards) e da Mochila (Inventory).
 * Elimina centenas de linhas de duplicação entre RewardCard e InventoryCard.
 */
export function GamifiedItemCard({
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
  const isMystery =
    iconName === "mystery_box" ||
    type === "MysteryBox" ||
    type === "MISTERY_BOX";

  const mysteryTier = isMystery
    ? MYSTERY_BOX_TIERS.find(
        (t) =>
          t.id === packageLevel ||
          t.backendPackageLevel === packageLevel ||
          t.id.toLowerCase() === packageLevel?.toLowerCase() ||
          t.backendPackageLevel === packageLevel?.toUpperCase(),
      ) || MYSTERY_BOX_TIERS[0]
    : null;

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

      // Se houver menos de 310px à direita, abre à esquerda
      const side = spaceRight < 310 ? "left" : "right";
      // Se estiver muito próximo do rodapé, alinha pela base
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
        "relative flex flex-col justify-between rounded-xl bg-gradient-to-b from-surface via-surface to-popover/95 border transition-[border-color,background-color,box-shadow,transform] duration-150 group select-none shadow-sm hover:shadow-card-deep hover:-translate-y-1",
        isHovered && isMystery && !isDragging
          ? "overflow-visible z-40"
          : "overflow-hidden",
        inUse
          ? "border-amber-500/40 bg-amber-500/5"
          : packageGlow || "border-white/15 hover:border-gold/50",
        isCompact ? "p-3 gap-2.5 min-h-36" : "p-4 gap-3.5 min-h-42",
        isDragging && "!transition-none opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Detalhe de Raridade no Topo do Card */}
      {packageLevel === "Lendário" && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-90 pointer-events-none" />
      )}
      {packageLevel === "Épico" && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-magenta to-transparent opacity-90 pointer-events-none" />
      )}
      {packageLevel === "Premium" && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-info to-transparent opacity-90 pointer-events-none" />
      )}
      {packageLevel === "Básico" && (
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-success-500 to-transparent opacity-70 pointer-events-none" />
      )}

      {/* TOPO: Ícone do Item (Hero) + Quantidade (se houver) + Badge de Tipo */}
      <header className="flex items-center justify-between w-full">
        <div
          className={cn(
            "rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 group-hover:scale-105",
            packageIconTheme ||
              "bg-white/10 border-white/15 text-primary-light group-hover:text-gold group-hover:border-gold/40",
            isCompact ? "w-9 h-9" : "w-11 h-11",
          )}
        >
          <RewardIcon
            size={isCompact ? 18 : 22}
            className={isMystery ? "text-amber-400" : undefined}
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {inUse && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-bold rounded border border-amber-500/40 bg-amber-500/15 text-amber-300",
                isCompact
                  ? "text-label-m px-1.5 py-0.5"
                  : "text-[10px] px-2 py-0.5",
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Em Foco
            </span>
          )}

          {typeof quantity === "number" && (
            <span
              className={cn(
                "font-bold bg-white/10 border border-white/20 text-neutral-100",
                isCompact
                  ? "text-tiny px-1.5 py-0.5 rounded"
                  : "text-xs px-2 py-0.5 rounded-md",
              )}
            >
              {quantity}x
            </span>
          )}

          <span
            className={cn(
              "inline-flex items-center gap-1 border font-medium leading-none shrink-0",
              isCompact
                ? "text-label-m px-1.5 py-0.5 rounded"
                : "text-[10px] px-2 py-0.5 rounded-md",
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
      </header>

      {/* MEIO: Título, Descrição e Tags de Raridade/Categoria */}
      <section className="flex flex-col gap-1 w-full min-w-0">
        <h4
          className={cn(
            "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors leading-tight",
            isCompact ? "text-xs" : "text-body-s",
          )}
        >
          {title}
        </h4>
        <p
          className={cn(
            "text-neutral-300 truncate leading-tight",
            isCompact ? "text-tiny" : "text-label-g",
          )}
        >
          {description || "\u00A0"}
        </p>

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {Boolean(
            packageLevel &&
              packageLevel !== "Nenhum" &&
              packageLevel !== "NONE",
          ) && (
            <span
              className={cn(
                "font-semibold rounded border text-label-m px-1.5 py-0.5",
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
            <span
              className={cn(
                "font-medium rounded bg-white/10 border border-white/10 text-neutral-300 text-label-m px-1.5 py-0.5",
              )}
            >
              {category}
            </span>
          )}
        </div>
      </section>

      {/* BASE: Duração e Ação / Preço */}
      <footer className="flex items-center justify-between pt-2 border-t border-white/10 w-full gap-2">
        <div className="flex items-center gap-1 text-tiny text-neutral-300 min-w-0">
          {type === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <>
                <Clock
                  size={isCompact ? 10 : 12}
                  className={cn(
                    "shrink-0",
                    remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "truncate font-medium",
                    remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                  )}
                >
                  {formatBackpackItemRemainingTime(remainingSeconds)}
                </span>
              </>
            ) : baseDurationMinutes ? (
              <>
                <Clock
                  size={isCompact ? 10 : 12}
                  className="text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">{baseDurationMinutes} min</span>
              </>
            ) : (
              <span
                className={cn(
                  "text-neutral-400",
                  isCompact ? "text-[10px]" : "text-tiny",
                )}
              >
                Cupom
              </span>
            )
          ) : (
            <span
              className={cn(
                "text-neutral-400",
                isCompact ? "text-[10px]" : "text-tiny",
              )}
            >
              Uso Imediato
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {typeof price === "number" && (
            <div className="flex items-center gap-1.5">
              <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200/60 flex items-center justify-center shrink-0 shadow-glow-gold-xs">
                <span className="text-[10px] text-neutral-950 font-black leading-none">
                  H
                </span>
              </div>
              <span className="text-xs font-bold text-neutral-100">
                {formatCoins(price)}
              </span>
            </div>
          )}

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
                "rounded-md font-semibold transition-all shadow-xs border text-neutral-200",
                inUse
                  ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
                  : "border-primary/40 bg-surface/80 hover:bg-gold/15 hover:border-gold/60 hover:text-gold active:scale-95 cursor-pointer",
                isCompact ? "px-2 py-0.5 text-label-g" : "px-2.5 py-1 text-xs",
              )}
            >
              {secondaryActionLabel}
            </button>
          )}

          {(() => {
            const isFocusNavigate =
              inUse &&
              (actionLabel === "Abrir no Foco" ||
                actionLabel === "Ir para o Foco");
            const isDisabled = !canAfford || (inUse && !isFocusNavigate);

            return (
              <button
                type="button"
                onClick={onAction}
                disabled={isDisabled}
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
                  "rounded-md font-bold transition-all shadow-xs",
                  isFocusNavigate
                    ? "bg-gold hover:bg-gold-hover text-neutral-900 border border-gold shadow-glow-gold-xs cursor-pointer active:scale-95"
                    : canAfford && !inUse
                      ? "bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1 focus:ring-offset-surface active:scale-95 text-neutral-900 cursor-pointer"
                      : "bg-white/10 text-neutral-400 border border-white/10 cursor-not-allowed opacity-60",
                  isCompact
                    ? "px-2 py-0.5 text-label-g"
                    : "px-2.5 py-1 text-xs",
                )}
              >
                {actionLabel}
              </button>
            );
          })()}
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
}
