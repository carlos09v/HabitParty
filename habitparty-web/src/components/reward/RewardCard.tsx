import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Plus } from "lucide-react";
import {
  getRewardIcon,
  PACKAGE_LEVEL_COLOR,
  REWARD_TYPE_META,
} from "@/constants/reward";
import { useCompactMode } from "@/hooks/useCompactMode";
import type {
  AddRewardCardProps,
  PackageLevel,
  RewardCardProps,
  RewardType,
} from "@/types/reward";
import { cn } from "@/utils";

export function RewardCard({ reward, onBuy, onContextMenu }: RewardCardProps) {
  const { isCompact } = useCompactMode();
  const typeMeta = REWARD_TYPE_META[reward.type as RewardType];
  const RewardIcon = getRewardIcon(reward.icon || reward.iconName, reward.type);
  const isMystery =
    (reward.icon || reward.iconName) === "mystery_box" ||
    reward.type === "MysteryBox" ||
    reward.type === "MISTERY_BOX";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: reward.id,
    data: { type: "Reward", reward },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, reward);
        }
      }}
      className={cn(
        "flex flex-col justify-between rounded-lg bg-surface border border-white/20 hover:border-gold/50 hover:bg-surface-hover transition-all duration-200 group select-none shadow-sm",
        isCompact ? "p-2.5 gap-2 min-h-34" : "p-3.5 gap-3 min-h-39",
        isDragging && "opacity-50 ring-2 ring-gold z-50",
      )}
    >
      {/* TOPO: Ícone do Item + Badge de Tipo */}
      <header className="flex items-center justify-between w-full">
        {/* Ícone representativo compacto */}
        <div
          className={cn(
            "rounded-md bg-white/10 border border-white/10 flex items-center justify-center text-primary-light group-hover:text-gold transition-colors shrink-0",
            isCompact ? "w-6 h-6" : "w-7 h-7",
          )}
        >
          <RewardIcon
            size={isCompact ? 13 : 15}
            className={isMystery ? "text-orange-400" : undefined}
            aria-hidden="true"
          />
        </div>

        {/* Badge de Tipo */}
        <span
          className={cn(
            "border",
            isCompact
              ? "font-semibold text-label-m px-1 py-0.5 rounded"
              : "font-medium text-[10px] leading-tight px-1.5 py-0.5 rounded",
            typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
          )}
        >
          {typeMeta?.label || (reward.type as RewardType)}
        </span>
      </header>

      {/* MEIO: Título, Descrição e Tags */}
      <section className="flex flex-col gap-1 w-full min-w-0">
        <h4
          className={cn(
            "font-bold text-neutral-100 truncate group-hover:text-gold transition-colors leading-tight",
            isCompact ? "text-xs" : "text-body-s",
          )}
        >
          {reward.title}
        </h4>
        <p
          className={cn(
            "text-neutral-300 truncate leading-tight",
            isCompact ? "text-tiny" : "text-label-g",
          )}
        >
          {reward.description}
        </p>

        {/* Badges de Pacote e Tag */}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {Boolean(
            reward.packageLevel &&
              reward.packageLevel !== "Nenhum" &&
              reward.packageLevel !== "NONE",
          ) && (
            <span
              className={cn(
                "font-medium rounded border text-label-m px-1.5 py-0.5",
                PACKAGE_LEVEL_COLOR[reward.packageLevel as PackageLevel] ||
                  "text-neutral-300 bg-white/10 border-white/15",
              )}
            >
              {reward.packageLevel as PackageLevel}
            </span>
          )}
          {Boolean(
            reward.category &&
              reward.category !== "Nenhum" &&
              reward.category !== "NONE",
          ) && (
            <span
              className={cn(
                "font-medium rounded bg-white/10 border border-white/10 text-neutral-300 text-label-m px-1.5 py-0.5",
              )}
            >
              {reward.category}
            </span>
          )}
        </div>
      </section>

      {/* BASE: Duração e Preço */}
      <footer className="flex items-center justify-between pt-2 border-t border-white/10 w-full gap-2">
        <div className="flex items-center gap-1 text-tiny text-neutral-300 min-w-0">
          {(reward.type as RewardType) === "TimeBased" &&
          reward.baseDurationMinutes ? (
            <>
              <Clock
                size={isCompact ? 10 : 12}
                className="text-neutral-400 shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">{reward.baseDurationMinutes} min</span>
            </>
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
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-gold border border-orange-500 flex items-center justify-center shrink-0">
              <span className="text-label-m text-neutral-900 font-bold leading-none">
                H
              </span>
            </div>
            <span className="text-xs font-bold text-neutral-100">
              {reward.price}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onBuy?.(reward)}
            aria-label={`Comprar ${reward.title}`}
            className={cn(
              "rounded-md bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-1 focus:ring-offset-surface active:scale-95 text-neutral-900 font-bold transition-all cursor-pointer shadow-xs",
              isCompact ? "px-2 py-0.5 text-label-g" : "px-2.5 py-1 text-xs",
            )}
          >
            Comprar
          </button>
        </div>
      </footer>
    </article>
  );
}

export function AddRewardCard({
  onClick,
  viewMode = "card",
}: AddRewardCardProps) {
  const { isCompact } = useCompactMode();
  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Adicionar nova recompensa"
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed transition-all cursor-pointer",
          "border-white/20 bg-card/40 text-xs font-semibold text-neutral-300",
          "hover:border-gold hover:text-gold hover:bg-card/60 hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-gold",
        )}
      >
        <Plus size={15} aria-hidden="true" />
        <span>Adicionar Produto</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Adicionar nova recompensa"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed transition-all cursor-pointer group gap-2",
        isCompact ? "p-2 min-h-29" : "p-3 min-h-34",
        "border-primary/50 bg-white/5 hover:bg-white/10 hover:border-gold text-neutral-300 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold",
      )}
    >
      <div className="p-2 rounded-lg bg-white/10 group-hover:bg-gold/20 text-primary-light group-hover:text-gold transition-colors">
        <Plus size={isCompact ? 15 : 18} aria-hidden="true" />
      </div>
      <span className="text-xs font-semibold">Adicionar Produto</span>
    </button>
  );
}
