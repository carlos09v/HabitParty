"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Gamepad2, Gift, GripVertical } from "lucide-react";
import { PACKAGE_LEVEL_COLOR, REWARD_TYPE_META } from "@/constants/reward";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn } from "@/utils";

export interface ItemRowProps {
  id: string;
  title: string;
  description?: string;
  type: string;
  packageLevel?: string | null;
  category?: string | null;
  iconName?: string;
  baseDurationMinutes?: number | null;
  isCompact?: boolean;
  quantity?: number;
  price?: number;
  actionLabel: string;
  onAction: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  dragData?: Record<string, unknown>;
}

export function ItemRow({
  id,
  title,
  description,
  type,
  packageLevel,
  category,
  iconName,
  baseDurationMinutes,
  isCompact = false,
  quantity,
  price,
  actionLabel,
  onAction,
  onContextMenu,
  dragData,
}: ItemRowProps) {
  const typeMeta = REWARD_TYPE_META[type as RewardType];

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

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={onContextMenu}
      className={cn(
        "grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] items-center rounded-lg bg-surface border border-white/20 hover:border-gold/50 transition-all shadow-xs select-none group",
        isCompact ? "gap-3 px-3 py-2" : "gap-4 px-4 py-2.5",
        isDragging && "opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* Coluna 1: Grip + Ícone + [Qtd] + Título e Descrição */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-4 flex items-center justify-center shrink-0">
          <GripVertical
            size={isCompact ? 12 : 14}
            className="text-neutral-500 group-hover:text-neutral-300 transition-colors cursor-grab active:cursor-grabbing"
            aria-hidden="true"
          />
        </div>

        <div
          className={cn(
            "rounded-md bg-white/10 border border-white/10 flex items-center justify-center text-primary-light group-hover:text-gold transition-colors shrink-0",
            isCompact ? "w-7 h-7" : "w-8 h-8",
          )}
        >
          {iconName === "mystery_box" ? (
            <Gift
              size={isCompact ? 13 : 16}
              className="text-orange-400"
              aria-hidden="true"
            />
          ) : (
            <Gamepad2 size={isCompact ? 13 : 16} aria-hidden="true" />
          )}
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

      {/* Coluna 2: Badge de Tipo */}
      <div className="flex items-center min-w-0">
        <span
          className={cn(
            "text-label-m font-semibold border truncate",
            isCompact ? "px-1 py-0.5 rounded" : "px-1.5 py-0.5 rounded-md",
            typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
          )}
        >
          {typeMeta?.label || type}
        </span>
      </div>

      {/* Coluna 3: Pacote & Categoria */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        {packageLevel &&
          packageLevel !== "Nenhum" &&
          packageLevel !== "NONE" && (
            <span
              className={cn(
                "text-label-m font-medium border truncate",
                isCompact ? "px-1 py-0.5 rounded" : "px-1.5 py-0.5 rounded-md",
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
              "text-label-m font-medium bg-white/10 border border-white/10 text-neutral-300 truncate",
              isCompact ? "px-1 py-0.5 rounded" : "px-1.5 py-0.5 rounded-md",
            )}
          >
            {category}
          </span>
        )}
      </div>

      {/* Coluna 4: Duração */}
      <div className="flex items-center gap-1.5 text-neutral-300 min-w-0">
        {type === "TimeBased" && baseDurationMinutes ? (
          <>
            <Clock
              size={isCompact ? 11 : 13}
              className="text-neutral-400 shrink-0"
              aria-hidden="true"
            />
            <span
              className={cn(
                "truncate text-neutral-300",
                isCompact ? "text-label-m" : "text-label-g",
              )}
            >
              {baseDurationMinutes} min
            </span>
          </>
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
      <div className="flex items-center justify-end gap-3 sm:gap-4 shrink-0">
        {typeof price === "number" && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gold border border-orange-500 flex items-center justify-center shrink-0 shadow-xs">
              <span className="text-label-m text-neutral-900 font-bold leading-none">
                H
              </span>
            </div>
            <span
              className={cn(
                "font-bold text-neutral-100",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {price}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onAction}
          aria-label={`${actionLabel} ${title}`}
          className={cn(
            "rounded-md bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 active:scale-95 text-neutral-900 font-bold transition-all cursor-pointer shadow-xs",
            isCompact ? "px-2.5 py-0.5 text-label-g" : "px-3 py-1 text-xs",
          )}
        >
          {actionLabel}
        </button>
      </div>
    </li>
  );
}

export interface ItemRowHeaderProps {
  isCompact?: boolean;
  mode?: "reward" | "inventory";
}

export function ItemRowHeader({
  isCompact = false,
  mode = "reward",
}: ItemRowHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.8fr)_minmax(0,1.2fr)_auto] items-center text-xs font-semibold text-neutral-400 border-b border-white/10 select-none",
        isCompact ? "gap-3 px-3 py-1.5" : "gap-4 px-4 py-2",
      )}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-4 shrink-0" />
        <div className={cn("shrink-0", isCompact ? "w-7" : "w-8")} />
        {mode === "inventory" && (
          <div className={cn("shrink-0", isCompact ? "w-6" : "w-7")} />
        )}
        <span>{mode === "inventory" ? "Item" : "Produto"}</span>
      </div>
      <span>Tipo</span>
      <span>Pacote & Categoria</span>
      <span>Duração</span>
      <span className="text-right pr-2">
        {mode === "inventory" ? "Ação" : "Preço / Ação"}
      </span>
    </div>
  );
}
