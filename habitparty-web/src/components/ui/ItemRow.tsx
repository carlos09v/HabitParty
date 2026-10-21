"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";
import { type default as React, useEffect, useState } from "react";
import {
  getRewardIcon,
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

export function ItemRow({
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
  const isMystery =
    iconName === "mystery_box" ||
    type === "MysteryBox" ||
    type === "MISTERY_BOX";
  const packageIconTheme = packageLevel
    ? PACKAGE_LEVEL_ICON_THEME[packageLevel as PackageLevel]
    : undefined;
  const leftAccent =
    (packageLevel && RARITY_LEFT_ACCENT[packageLevel]) ||
    "border-l-4 border-l-transparent";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFocusNavigate =
    inUse &&
    (actionLabel === "Abrir no Foco" || actionLabel === "Ir para o Foco");
  const isDisabled = disabled || (inUse && !isFocusNavigate);

  const renderActionButton = (compactSize = false) => (
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
        compactSize
          ? "px-2.5 py-1 text-label-g"
          : "px-3 py-1.5 text-xs sm:py-1",
      )}
    >
      {actionLabel}
    </button>
  );

  const renderSecondaryButton = (compactSize = false) =>
    secondaryActionLabel && onSecondaryAction ? (
      <button
        type="button"
        onClick={onSecondaryAction}
        disabled={disabled || inUse}
        aria-label={`${secondaryActionLabel} ${title}`}
        title={
          inUse ? "Item em uso no Focus" : `${secondaryActionLabel} ${title}`
        }
        className={cn(
          "rounded-md font-semibold transition-all shadow-xs border text-neutral-200",
          disabled || inUse
            ? "bg-white/5 border-white/10 text-neutral-400 cursor-not-allowed opacity-60"
            : "border-primary/40 bg-surface/80 hover:bg-gold/15 hover:border-gold/60 hover:text-gold active:scale-95 cursor-pointer",
          compactSize ? "px-2 py-0.5 text-label-g" : "px-2.5 py-1 text-xs",
        )}
      >
        {secondaryActionLabel}
      </button>
    ) : null;

  return (
    <li
      ref={setNodeRef}
      style={mounted ? style : undefined}
      {...(mounted ? attributes : {})}
      {...(mounted ? listeners : {})}
      onContextMenu={onContextMenu}
      className={cn(
        "relative rounded-xl bg-gradient-to-r from-surface via-surface to-popover/95 border transition-all select-none group overflow-hidden",
        inUse
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-white/10 hover:border-gold/50 hover:shadow-card-deep hover:-translate-y-0.5",
        leftAccent,
        // Mobile: Flex column com espaçamento confortável
        "flex flex-col gap-2.5 p-3 sm:p-3.5",
        // Desktop (md+): Grid tradicional de 5 colunas
        "md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] md:items-center",
        isCompact ? "md:gap-3 md:px-3 md:py-2" : "md:gap-4 md:px-4 md:py-2.5",
        mounted && isDragging && "opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* ============================================================== */}
      {/* 1. VISUALIZAÇÃO MOBILE (< md)                                 */}
      {/* ============================================================== */}
      <div className="flex md:hidden flex-col gap-2.5 w-full">
        {/* Linha Superior: Grip + Ícone + Qtd + Título + Preço */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-4 flex items-center justify-center shrink-0">
              <GripVertical
                size={14}
                className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
                aria-hidden="true"
              />
            </div>

            <div
              className={cn(
                "rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0 w-9 h-9",
                packageIconTheme ||
                  "bg-white/10 border-white/15 text-primary-light group-hover:text-gold group-hover:border-gold/40",
              )}
            >
              <RewardIcon
                size={18}
                className={isMystery ? "text-amber-400" : undefined}
                aria-hidden="true"
              />
            </div>

            {typeof quantity === "number" && (
              <span className="font-bold bg-white/10 border border-white/20 text-neutral-100 text-xs px-1.5 py-0.5 rounded shrink-0">
                {quantity}x
              </span>
            )}

            <div className="flex flex-col min-w-0">
              <h4 className="font-bold text-neutral-100 text-sm truncate leading-tight group-hover:text-gold transition-colors">
                {title}
              </h4>
              {description && (
                <p className="text-neutral-400 text-xs truncate mt-0.5 leading-tight">
                  {description}
                </p>
              )}
            </div>
          </div>

          {typeof price === "number" && (
            <div className="flex items-center gap-1.5 shrink-0 bg-gold/10 border border-gold/25 px-2 py-0.5 rounded-lg">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200/60 flex items-center justify-center shrink-0 shadow-glow-gold-xs">
                <span className="text-[9px] text-neutral-950 font-black leading-none">
                  H
                </span>
              </div>
              <span className="font-bold text-neutral-100 text-xs">
                {formatCoins(price)}
              </span>
            </div>
          )}
        </div>

        {/* Linha Central: Chips/Badges informativos */}
        <div className="flex items-center gap-1.5 flex-wrap pl-6 text-xs">
          {inUse && (
            <span className="text-label-m font-bold border truncate inline-flex items-center gap-1 leading-none shrink-0 border-amber-500/40 bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Em Foco
            </span>
          )}

          <span
            className={cn(
              "text-label-m font-medium border truncate inline-flex items-center gap-1 leading-none shrink-0 px-1.5 py-0.5 rounded",
              typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
            )}
          >
            {typeMeta?.icon && (
              <typeMeta.icon
                size={10}
                className="shrink-0"
                aria-hidden="true"
              />
            )}
            <span>{typeMeta?.label || type}</span>
          </span>

          {packageLevel &&
            packageLevel !== "Nenhum" &&
            packageLevel !== "NONE" && (
              <span
                className={cn(
                  "text-label-m font-semibold border truncate rounded px-1.5 py-0.5",
                  PACKAGE_LEVEL_COLOR[packageLevel as PackageLevel] ||
                    "text-neutral-300 bg-white/10 border-white/15",
                )}
              >
                {packageLevel}
              </span>
            )}

          {category && category !== "Nenhum" && category !== "NONE" && (
            <span className="text-label-m font-medium bg-white/10 border border-white/10 text-neutral-300 truncate rounded px-1.5 py-0.5">
              {category}
            </span>
          )}

          {type === "TimeBased" || remainingSeconds !== undefined ? (
            remainingSeconds !== undefined && remainingSeconds !== null ? (
              <span
                className={cn(
                  "text-label-m font-medium inline-flex items-center gap-1",
                  remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                )}
              >
                <Clock
                  size={10}
                  className={cn(
                    "shrink-0",
                    remainingSeconds <= 1 ? "text-emerald-400" : "text-gold",
                  )}
                  aria-hidden="true"
                />
                {formatBackpackItemRemainingTime(remainingSeconds)}
              </span>
            ) : baseDurationMinutes ? (
              <span className="text-label-m text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                <Clock
                  size={10}
                  className="text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                {formatFocusMinutes(baseDurationMinutes)}
              </span>
            ) : (
              <span className="text-label-m text-neutral-400 truncate">
                Cupom
              </span>
            )
          ) : (
            <span className="text-label-m text-neutral-400 truncate">
              Uso Imediato
            </span>
          )}
        </div>

        {/* Linha Inferior: Botões de Ação */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
          {renderSecondaryButton(false)}
          {renderActionButton(false)}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. VISUALIZAÇÃO DESKTOP (md+)                                 */}
      {/* ============================================================== */}
      {/* Coluna 1: Grip + Ícone Hero + [Qtd] + Título e Descrição */}
      <div className="hidden md:flex items-center gap-2.5 sm:gap-3 min-w-0">
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
            isCompact ? "w-8.5 h-8.5" : "w-10 h-10",
          )}
        >
          <RewardIcon
            size={isCompact ? 16 : 20}
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

        <div className="flex flex-col min-w-0">
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

      {/* Coluna 2: Badge de Tipo com Micro-ícone */}
      <div className="hidden md:flex items-center gap-1.5 min-w-0 flex-wrap">
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
      <div className="hidden md:flex items-center gap-1.5 flex-wrap min-w-0">
        {packageLevel &&
          packageLevel !== "Nenhum" &&
          packageLevel !== "NONE" && (
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
        {category && category !== "Nenhum" && category !== "NONE" && (
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
      <div className="hidden md:flex items-center gap-1.5 text-neutral-300 min-w-0">
        {type === "TimeBased" || remainingSeconds !== undefined ? (
          remainingSeconds !== undefined && remainingSeconds !== null ? (
            <>
              <Clock
                size={isCompact ? 11 : 13}
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
                  isCompact ? "text-label-m" : "text-label-g",
                )}
              >
                {formatBackpackItemRemainingTime(remainingSeconds)}
              </span>
            </>
          ) : baseDurationMinutes ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-extrabold bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
                isCompact ? "text-[11px]" : "text-xs",
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

      {/* Coluna 5: Preço & Ação */}
      <div className="hidden md:flex items-center justify-end gap-3 sm:gap-4 shrink-0">
        {typeof price === "number" && (
          <div className="flex items-center gap-1.5">
            <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200/60 flex items-center justify-center shrink-0 shadow-glow-gold-xs">
              <span className="text-[10px] text-neutral-950 font-black leading-none">
                H
              </span>
            </div>
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
        {renderSecondaryButton(isCompact)}
        {renderActionButton(isCompact)}
      </div>
    </li>
  );
}

export {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "./ItemRowHeader";
