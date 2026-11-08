import { ArrowUpRight, Backpack } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { cn } from "@/utils";
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
  isCompact?: boolean;
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
  isCompact = false,
}: FocusBackpackSectionProps) {
  const t = useTranslations("focus.backpack");

  return (
    <section
      className="flex flex-col gap-3 w-full"
      aria-label={t("sectionAria")}
    >
      {/* Header com Título, Contador e Link para a Mochila */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "font-bold text-neutral-100",
              isCompact ? "text-body-m sm:text-subtitle-s" : "text-subtitle-s",
            )}
          >
            {t("title")}
          </h3>

          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-primary/30 bg-surface/60 text-neutral-300 text-xs font-semibold tabular-nums"
            title={t("counterTitle")}
          >
            <span>{items.length}</span>
          </div>
        </div>

        <Link
          href="/inventory"
          className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-gold transition-colors group cursor-pointer"
          title={t("manageLinkTitle")}
        >
          <span>{t("manageLinkLabel")}</span>
          <ArrowUpRight
            size={13}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
      </div>

      {/* Lista de Itens da Mochila em Foco */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-surface/30 p-6 flex flex-col items-center justify-center text-center gap-2">
          <Backpack size={26} className="text-neutral-500 mb-0.5" />
          <p className="text-body-s text-neutral-300">{t("emptyTitle")}</p>
          <p className="text-tiny text-neutral-400 max-w-sm">
            {t("emptyDescription")}
          </p>
          <Link
            href="/inventory"
            className="mt-1 text-xs font-bold text-gold hover:underline"
          >
            {t("emptyAction")}
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
              isCompact={isCompact}
            />
          ))}
        </div>
      )}
    </section>
  );
}
