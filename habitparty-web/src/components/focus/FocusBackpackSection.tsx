import { ArrowUpRight, Backpack, Package } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { FocusCard } from "./FocusCard";

interface FocusBackpackSectionProps {
  items: InventoryItemResponseDTO[];
  activeTargetId?: string;
  selectedItemId?: string | null;
  onSelectItem?: (item: InventoryItemResponseDTO) => void;
  isTimerActive?: boolean;
  isTimerRunning?: boolean;
  onToggleTimer?: () => void;
  onStartFocus: (item: InventoryItemResponseDTO) => void;
  onContextMenu: (e: React.MouseEvent, item: InventoryItemResponseDTO) => void;
  onConsume?: (item: InventoryItemResponseDTO) => void;
  consumingItemIds?: Set<string>;
}

export function FocusBackpackSection({
  items,
  activeTargetId,
  selectedItemId,
  onSelectItem,
  isTimerActive = false,
  isTimerRunning = false,
  onToggleTimer,
  onStartFocus,
  onContextMenu,
  onConsume,
  consumingItemIds,
}: FocusBackpackSectionProps) {
  const t = useTranslations("focus.backpack");
  const { isGamified } = useExperienceMode();

  // Quando não há nenhum cupom no palco, colapsa para uma barra compacta de 1 linha
  if (items.length === 0) {
    return (
      <section
        id="focus-backpack-section"
        aria-label={
          isGamified ? t("sectionAria") : t("sectionAriaProductivity")
        }
        className="w-full"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-dashed border-neutral-700/80 dark:border-primary/25 bg-card/50 dark:bg-surface/25">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-surface border border-neutral-700 dark:border-primary/25 flex items-center justify-center text-neutral-400 shrink-0">
              {isGamified ? <Backpack size={14} /> : <Package size={14} />}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
              <h2 className="text-xs font-semibold text-neutral-200 truncate">
                {isGamified ? t("title") : t("titleProductivity")}
              </h2>
              <span className="text-tiny text-neutral-400 truncate">
                {isGamified ? t("emptyTitle") : t("emptyTitleProductivity")}
              </span>
            </div>
          </div>

          <Link
            href="/inventory"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-gold hover:underline shrink-0 group"
            title={t("manageLinkTitle")}
          >
            <span>
              {isGamified ? t("emptyAction") : t("emptyActionProductivity")}
            </span>
            <ArrowUpRight
              size={13}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      id="focus-backpack-section"
      className="flex flex-col gap-3 w-full"
      aria-label={isGamified ? t("sectionAria") : t("sectionAriaProductivity")}
    >
      {/* Header com Título, Contador e Link para a Mochila / Inventário */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-neutral-100 text-subtitle-s">
            {isGamified ? t("title") : t("titleProductivity")}
          </h2>

          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-primary/30 bg-surface/60 text-neutral-300 text-xs font-semibold tabular-nums"
            title={
              isGamified ? t("counterTitle") : t("counterTitleProductivity")
            }
          >
            <span>{items.length}</span>
          </div>
        </div>

        <Link
          href="/inventory"
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-gold transition-colors group cursor-pointer"
          title={t("manageLinkTitle")}
        >
          <span>
            {isGamified
              ? t("manageLinkLabel")
              : t("manageLinkLabelProductivity")}
          </span>
          <ArrowUpRight
            size={13}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Lista de Itens em Foco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {items.map((item) => (
          <FocusCard
            key={item.inventoryItemId}
            variant="backpack"
            item={item}
            isSelected={Boolean(
              selectedItemId && selectedItemId === item.inventoryItemId,
            )}
            onSelect={onSelectItem}
            isActiveTarget={Boolean(
              isTimerActive && activeTargetId === item.inventoryItemId,
            )}
            isTimerRunning={Boolean(
              isTimerActive &&
                activeTargetId === item.inventoryItemId &&
                isTimerRunning,
            )}
            onToggleTimer={onToggleTimer}
            onStartFocus={onStartFocus}
            onContextMenu={onContextMenu}
            onConsume={onConsume}
            isConsuming={Boolean(
              item.inventoryItemId &&
                consumingItemIds?.has(item.inventoryItemId),
            )}
          />
        ))}
      </div>
    </section>
  );
}
