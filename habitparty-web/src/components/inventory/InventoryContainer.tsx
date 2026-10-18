"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Backpack, SearchX, Store, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  consumeInventoryItem,
  reorderInventory,
  returnItemToBackpack,
  sendItemToFocus,
} from "@/actions/inventoryActions";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { MysteryBoxRouletteModal } from "@/components/inventory/MysteryBoxRouletteModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { ItemRow, ItemRowHeader } from "@/components/ui/ItemRow";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  INVENTORY_SORT_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
} from "@/constants/inventory";
import { REWARD_TYPE_OPTIONS } from "@/constants/reward";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";

import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { InventoryItem } from "@/types/inventory";
import { cn } from "@/utils";
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";
import {
  executeInventoryItemAction,
  getInventoryItemActionMeta,
} from "@/utils/inventoryHelpers";
import { soundEffects } from "@/utils/soundEffects";

export function InventoryContainer({
  initialItems,
  isCompact = false,
}: {
  initialItems: InventoryItem[];
  isCompact?: boolean;
}) {
  const router = useRouter();
  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("inventory");

  const { items, setItems, sensors, handleDragEnd } =
    useReorderableList<InventoryItem>({
      initialItems,
      onReorderServerAction: async (updates) => {
        return reorderInventory(
          updates.map((u) => ({ itemId: u.id, newIndex: u.newIndex })),
        );
      },
      isFiltering,
    });

  const [isUsing, setIsUsing] = useState(false);
  const [openingBoxItem, setOpeningBoxItem] = useState<InventoryItem | null>(
    null,
  );

  const handleOpenMysteryBox = (item: InventoryItem) => {
    setOpeningBoxItem(item);
  };

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch =
        !filters.search ||
        item.reward.title
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.reward.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchType = !filters.type || item.reward.type === filters.type;
      const matchCat =
        !filters.category || item.reward.category === filters.category;

      const matchStatus =
        !filters.status ||
        (filters.status === "IN_FOCUS"
          ? item.status === "IN_FOCUS"
          : item.status !== "IN_FOCUS");

      return matchSearch && matchType && matchCat && matchStatus;
    });

    if (filters.sortBy === "quantity-desc") {
      result = [...result].sort((a, b) => b.quantity - a.quantity);
    } else if (filters.sortBy === "name") {
      result = [...result].sort((a, b) =>
        a.reward.title.localeCompare(b.reward.title),
      );
    }

    return result;
  }, [items, filters]);

  const handleUseItem = async (item: InventoryItem) => {
    if (isUsing) return;
    setIsUsing(true);
    try {
      const res = await consumeInventoryItem(item.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao usar item.");
        return;
      }
      setItems((prev) =>
        prev
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
          )
          .filter((i) => i.quantity > 0),
      );
      soundEffects.playTaskCompleteSound();
      toast.success(`Você usou "${item.reward.title}"!`);
    } catch (_error) {
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setIsUsing(false);
    }
  };

  const [isSendingToFocus, setIsSendingToFocus] = useState(false);

  const handleSendToFocus = async (item: InventoryItem) => {
    if (isSendingToFocus) return;
    setIsSendingToFocus(true);
    try {
      const res = await sendItemToFocus(item.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao adicionar item ao Foco.");
        return;
      }
      setItems((prev) =>
        prev
          .map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
          )
          .filter((i) => i.quantity > 0),
      );
      soundEffects.playTaskCompleteSound();
      toast.success(`"${item.reward.title}" adicionado ao Foco com sucesso!`);
    } catch (_error) {
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setIsSendingToFocus(false);
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    item: InventoryItem | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    item: null,
  });

  const handleItemContextMenu = (e: React.MouseEvent, item: InventoryItem) => {
    if (item.status === "IN_FOCUS") {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        item,
      });
    }
  };

  const handleReturnToBackpack = async (item: InventoryItem) => {
    try {
      const res = await returnItemToBackpack(item.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao devolver item para a mochila.");
        return;
      }

      soundEffects.playTaskCompleteSound();
      toast.success(`"${item.reward.title}" devolvido para a mochila!`);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "AVAILABLE" } : i)),
      );
      router.refresh();
    } catch (_error) {
      toast.error("Erro de comunicação com o servidor.");
    }
  };

  const contextMenuItems = contextMenu.item
    ? [
        {
          label: "Devolver para a backpack",
          icon: <Undo2 size={15} />,
          onClick: () => {
            if (contextMenu.item) {
              handleReturnToBackpack(contextMenu.item);
            }
          },
        },
      ]
    : [];

  const { stats: welcomeStats } = useMemo(() => {
    return calculateInventoryWelcomeStats(items);
  }, [items]);

  return (
    <>
      <WelcomeCard
        compact={isCompact}
        title={WELCOME_CARD_DETAILS.inventory.title}
        subtitle={WELCOME_CARD_DETAILS.inventory.subtitle}
        bullets={WELCOME_CARD_DETAILS.inventory.bullets}
        imageSrc={WELCOME_CARD_DETAILS.inventory.imageSrc}
        stats={welcomeStats}
        imageWidth={
          isCompact
            ? WELCOME_CARD_DETAILS.inventory.compactWidth
            : WELCOME_CARD_DETAILS.inventory.normalWidth
        }
        imageHeight={
          isCompact
            ? WELCOME_CARD_DETAILS.inventory.compactHeight
            : WELCOME_CARD_DETAILS.inventory.normalHeight
        }
        storageKey="inventory"
      />

      <section className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 w-full pb-10">
        <FilterBar
          search={{
            value: filters.search,
            onChange: (v) => handleFilterChange({ search: v }),
          }}
          viewMode={{
            value: viewMode,
            onChange: setViewMode,
          }}
          dropdownFilters={[
            {
              id: "status",
              label: "Status",
              options: INVENTORY_STATUS_OPTIONS,
              value: filters.status || "",
            },
            {
              id: "type",
              label: "Tipo",
              options: REWARD_TYPE_OPTIONS,
              value: filters.type,
            },
            {
              id: "sortBy",
              label: "Ordenar",
              options: INVENTORY_SORT_OPTIONS,
              value: filters.sortBy || "",
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearFilters}
        />

        {filteredItems.length === 0 ? (
          <div className="flex flex-col gap-2.5 w-full pb-8">
            {viewMode === "list" && (
              <ItemRowHeader isCompact={isCompact} mode="inventory" />
            )}
            <div
              className={cn(
                "w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/30 bg-primary-dark/20 backdrop-blur-sm",
                isCompact ? "py-8 px-4 gap-2.5" : "py-12 px-6 gap-3.5",
              )}
            >
              <div className="w-12 h-12 rounded-full bg-primary/25 border border-primary/40 flex items-center justify-center text-gold shadow-xs">
                {items.length === 0 ? (
                  <Backpack size={24} aria-hidden="true" />
                ) : (
                  <SearchX size={24} aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col gap-1 items-center">
                <h4 className="text-body-m font-bold text-neutral-100">
                  {items.length === 0
                    ? "Sua mochila está vazia! 🎒"
                    : "Nenhum item encontrado"}
                </h4>
                <p className="text-body-s text-neutral-400 max-w-sm">
                  {items.length === 0
                    ? "Você ainda não possui itens ou cupons no seu inventário. Conquiste moedas completando suas tarefas diárias e resgate recompensas épicas na Loja!"
                    : "Não encontramos nenhum item que corresponda aos filtros aplicados."}
                </p>
                {items.length === 0 ? (
                  <Link
                    href="/rewards"
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-neutral-900 font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer"
                  >
                    <Store size={15} />
                    <span>Explorar a Loja</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-all cursor-pointer"
                  >
                    <span>Limpar Filtros</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <DndContext
            id="inventory-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={
                viewMode === "card"
                  ? rectSortingStrategy
                  : verticalListSortingStrategy
              }
            >
              {viewMode === "card" ? (
                <div
                  className={cn(
                    "w-full transition-all duration-200 pb-8",
                    isCompact
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3",
                  )}
                >
                  {filteredItems.map((item) => (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      onUse={handleUseItem}
                      onSendToFocus={handleSendToFocus}
                      onOpenMysteryBox={handleOpenMysteryBox}
                      onContextMenu={handleItemContextMenu}
                      isCompact={isCompact}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 w-full pb-8">
                  <ItemRowHeader isCompact={isCompact} mode="inventory" />
                  <ul
                    className="flex flex-col gap-2 w-full"
                    aria-label="Itens do inventário"
                  >
                    {filteredItems.map((item) => {
                      const { isInFocus, actionLabel, secondaryActionLabel } =
                        getInventoryItemActionMeta(item);

                      const handleAction = () => {
                        executeInventoryItemAction(item, {
                          onOpenFocus: () => router.push("/focus"),
                          onOpenMysteryBox: handleOpenMysteryBox,
                          onSendToFocus: handleSendToFocus,
                          onUse: handleUseItem,
                        });
                      };

                      const handleSecondaryAction = secondaryActionLabel
                        ? () => handleUseItem(item)
                        : undefined;

                      return (
                        <ItemRow
                          key={item.id}
                          id={item.id}
                          title={item.reward?.title || item.name}
                          description={
                            item.reward?.description || item.description
                          }
                          type={item.reward?.type || item.itemType}
                          packageLevel={item.reward?.packageLevel}
                          category={item.reward?.category}
                          iconName={item.reward?.iconName || item.iconName}
                          baseDurationMinutes={item.reward?.baseDurationMinutes}
                          remainingSeconds={item.remainingSeconds}
                          quantity={item.quantity}
                          inUse={isInFocus}
                          actionLabel={actionLabel}
                          onAction={handleAction}
                          secondaryActionLabel={secondaryActionLabel}
                          onSecondaryAction={handleSecondaryAction}
                          onContextMenu={(e) => handleItemContextMenu(e, item)}
                          isCompact={isCompact}
                          dragData={{ type: "InventoryItem", item }}
                        />
                      );
                    })}
                  </ul>
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </section>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={contextMenuItems}
      />

      <MysteryBoxRouletteModal
        isOpen={Boolean(openingBoxItem)}
        onClose={() => {
          setOpeningBoxItem(null);
          router.refresh();
        }}
        item={openingBoxItem}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
