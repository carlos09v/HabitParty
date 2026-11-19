"use client";

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
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-surface/30 p-6 flex flex-col items-center justify-center text-center gap-2">
          {isGamified ? (
            <Backpack size={26} className="text-neutral-500 mb-0.5" />
          ) : (
            <Package size={26} className="text-neutral-500 mb-0.5" />
          )}
          <p className="text-body-s text-neutral-300">
            {isGamified ? t("emptyTitle") : t("emptyTitleProductivity")}
          </p>
          <p className="text-tiny text-neutral-400 max-w-sm">
            {isGamified
              ? t("emptyDescription")
              : t("emptyDescriptionProductivity")}
          </p>
          <Link
            href="/inventory"
            className="mt-1 text-xs font-bold text-gold hover:underline"
          >
            {isGamified ? t("emptyAction") : t("emptyActionProductivity")}
          </Link>
        </div>
      ) : (
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
      )}
    </section>
  );
}
