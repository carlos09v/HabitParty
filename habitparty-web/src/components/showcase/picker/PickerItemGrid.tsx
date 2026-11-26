import { Check, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { Pagination } from "@/components/ui/Pagination";
import {
  getRarityTheme,
  HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
} from "@/constants/achievements";
import type { AchievementRarity } from "@/types/showcase";
import { cn } from "@/utils/cn";

export interface PickerGridItem {
  key: string;
  iconKey: string;
  iconFallback?: "trophy" | "sparkles";
  title: string;
  titleWraps?: boolean;
  subtitle: string;
  subtitleClamp?: 1 | 2;
  rarity: AchievementRarity;
  rarityLabel?: string;
  extraBadge?: string;
  equippedSlot: number;
  disabled?: boolean;
  highlightRingOnEquipped?: boolean;
  onSelect: () => void;
}

interface PickerItemGridProps {
  items: PickerGridItem[];
  alreadyEquippedLabel: (slot: number) => string;
  emptyState?: {
    icon?: ReactNode;
    message: string;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  gridClassName?: string;
  cardPaddingClassName?: string;
}

/**
 * Grade unificada de cards selecionáveis para o Picker de Destaques
 * (Conquistas, Artefatos, Insígnias de Conta, Métricas e Ofensivas de Tarefas).
 */
export function PickerItemGrid({
  items,
  alreadyEquippedLabel,
  emptyState,
  pagination,
  gridClassName = "grid grid-cols-1 sm:grid-cols-2 gap-3",
  cardPaddingClassName = "p-3",
}: PickerItemGridProps) {
  if (items.length === 0 && emptyState) {
    return (
      <div className="rounded-xl border border-neutral-700 bg-surface/50 dark:border-primary/20 dark:bg-surface/40 p-8 text-center">
        {emptyState.icon}
        <p className="text-body-s text-neutral-300 max-w-md mx-auto">
          {emptyState.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={gridClassName}>
        {items.map((item) => {
          const theme = getRarityTheme(item.rarity);
          const isEquipped = item.equippedSlot !== -1;
          const isLocked = Boolean(item.disabled);

          return (
            <button
              key={item.key}
              type="button"
              disabled={isLocked}
              aria-pressed={isEquipped}
              onClick={() => {
                if (!isLocked) item.onSelect();
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                cardPaddingClassName,
                isLocked
                  ? "border-neutral-700 bg-surface/50 dark:border-primary/15 dark:bg-surface/20 opacity-55 cursor-not-allowed"
                  : isEquipped
                    ? cn(
                        "border-gold bg-gold/15 cursor-pointer",
                        item.highlightRingOnEquipped && "ring-1 ring-gold/50",
                      )
                    : "border-neutral-700 bg-card hover:border-primary/45 dark:border-primary/20 dark:bg-surface/50 cursor-pointer",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                  theme.iconBg,
                  theme.iconText,
                )}
              >
                <AchievementIcon
                  iconKey={item.iconKey}
                  size={20}
                  fallback={item.iconFallback}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    item.titleWraps && "flex-wrap",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold text-neutral-100",
                      item.titleWraps ? "break-words" : "truncate",
                    )}
                  >
                    {item.title}
                  </span>
                  {item.rarityLabel && (
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0",
                        theme.badgeBg,
                        theme.badgeText,
                        theme.badgeBorder,
                      )}
                    >
                      {item.rarityLabel}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "text-[11px] text-neutral-400 mt-0.5",
                    item.subtitleClamp === 2 ? "line-clamp-2" : "truncate",
                  )}
                >
                  {isLocked
                    ? item.subtitle
                    : isEquipped
                      ? alreadyEquippedLabel(item.equippedSlot + 1)
                      : item.subtitle}
                </p>
              </div>

              {item.extraBadge && (
                <span className="px-2 py-0.5 rounded-md bg-warning-500/15 border border-warning-500/35 text-warning-400 text-[11px] font-extrabold tabular-nums shrink-0">
                  {item.extraBadge}
                </span>
              )}

              {isLocked ? (
                <Lock
                  size={14}
                  className="text-neutral-400 shrink-0"
                  aria-hidden="true"
                />
              ) : isEquipped ? (
                <Check
                  size={16}
                  className="text-amber-800 dark:text-gold shrink-0"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={HIGHLIGHT_MODAL_ITEMS_PER_PAGE}
          isCompact
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
