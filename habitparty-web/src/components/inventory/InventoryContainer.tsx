"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { reorderInventory } from "@/actions/inventoryActions";
import { InventoryCard } from "@/components/inventory/InventoryCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { ItemRow, ItemRowHeader } from "@/components/ui/ItemRow";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  REWARD_CATEGORY_OPTIONS,
  REWARD_PACKAGE_OPTIONS,
  REWARD_TAG_OPTIONS,
  REWARD_TYPE_OPTIONS,
} from "@/constants/reward";
import { useViewMode } from "@/hooks/useViewMode";
import { useInventoryStore } from "@/store/inventoryStore";
import type { InventoryFilterState, InventoryItem } from "@/types/inventory";
import { cn } from "@/utils";

export function InventoryContainer({
  initialItems,
  isCompact = false,
}: {
  initialItems: InventoryItem[];
  isCompact?: boolean;
}) {
  const [viewMode, setViewMode] = useViewMode("inventory", "card");
  const [filters, setFilters] = useState<InventoryFilterState>({
    search: "",
    type: "",
    category: "",
    tag: "",
    packageLevel: "",
    viewMode: "card",
  });

  const {
    items,
    setInitialData,
    reorderItems,
    rollback,
    commitReorder,
    consumeItem,
  } = useInventoryStore();

  useEffect(() => {
    setInitialData(initialItems);
  }, [initialItems, setInitialData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
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
      const matchTag = true;
      const matchPackage =
        !filters.packageLevel ||
        item.reward.packageLevel === filters.packageLevel;

      return matchSearch && matchType && matchCat && matchTag && matchPackage;
    });
  }, [items, filters]);

  const handleUseItem = (item: InventoryItem) => {
    consumeItem(item.id);
    console.log(`Usou item: ${item.reward.title}`);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      reorderItems(oldIndex, newIndex);

      try {
        const reordered = Array.from(items);
        const [movedItem] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, movedItem);

        const updates = reordered.map((i, index) => ({
          itemId: i.id,
          newIndex: index,
        }));

        const result = await reorderInventory(updates);

        if (!result.success) {
          rollback();
          toast.error(result.error || "Erro ao reordenar item.");
        } else {
          commitReorder();
        }
      } catch (_error) {
        rollback();
        toast.error("Erro de comunicação com o servidor.");
      }
    }
  };

  return (
    <>
      <WelcomeCard
        compact={isCompact}
        title="Sua Mochila!"
        subtitle="Gerencie seus itens e recompensas adquiridas."
        bullets={[
          "Aqui ficam todos os itens comprados na Loja.",
          "Use seus itens quando quiser.",
          "Itens esgotados desaparecem automaticamente.",
        ]}
        imageSrc="/assets/undraw/inventory/undraw_camping_1hz9.svg"
        imageWidth={isCompact ? 130 : 162}
        imageHeight={isCompact ? 70 : 87}
        storageKey="inventory"
        className="mb-4 sm:mb-6"
      />

      <section className="flex flex-col gap-4 sm:gap-6 w-full h-full pb-10">
        <FilterBar
          search={{
            value: filters.search || "",
            onChange: (v) =>
              setFilters((prev: InventoryFilterState) => ({
                ...prev,
                search: v,
              })),
          }}
          viewMode={{
            value: viewMode,
            onChange: setViewMode,
          }}
          dropdownFilters={[
            {
              id: "type",
              label: "Tipo",
              options: REWARD_TYPE_OPTIONS,
              value: filters.type || "",
            },
            {
              id: "category",
              label: "Categorias",
              options: REWARD_CATEGORY_OPTIONS,
              value: filters.category || "",
            },
            {
              id: "tag",
              label: "Tags",
              options: REWARD_TAG_OPTIONS,
              value: filters.tag || "",
            },
            {
              id: "packageLevel",
              label: "Pacote",
              options: REWARD_PACKAGE_OPTIONS,
              value: filters.packageLevel || "",
            },
          ]}
          onDropdownChange={(id, value) =>
            setFilters((prev: InventoryFilterState) => ({
              ...prev,
              [id]: value,
            }))
          }
          onClearDropdowns={() =>
            setFilters((prev: InventoryFilterState) => ({
              ...prev,
              search: "",
              type: "",
              category: "",
              tag: "",
              packageLevel: "",
            }))
          }
        />

        {filteredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-neutral-400 border border-dashed border-white/10 rounded-xl">
            <p>Nenhum item encontrado com estes filtros.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <SortableContext
              items={filteredItems.map((i) => i.id)}
              strategy={rectSortingStrategy}
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
                    {filteredItems.map((item) => (
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
                        quantity={item.quantity}
                        actionLabel="Usar"
                        onAction={() => handleUseItem(item)}
                        isCompact={isCompact}
                        dragData={{ type: "InventoryItem", item }}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </section>
    </>
  );
}
