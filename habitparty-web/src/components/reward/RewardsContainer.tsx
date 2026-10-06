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
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteReward, reorderRewards } from "@/actions/rewardActions";
import { ContextMenu } from "@/components/ui/ContextMenu";
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
import { useRewardStore } from "@/store/rewardStore";
import type { Reward, RewardFilterState } from "@/types/reward";
import { cn } from "@/utils";
import { AddRewardCard, RewardCard } from "./RewardCard";
import { RewardFormModal } from "./RewardFormModal";

const INITIAL_FILTERS: RewardFilterState = {
  search: "",
  type: "",
  category: "",
  tag: "",
  packageLevel: "",
  viewMode: "card",
};

export function RewardsContainer({
  isCompact = false,
  initialRewards,
}: {
  isCompact?: boolean;
  initialRewards: Reward[];
}) {
  const [viewMode, setViewMode] = useViewMode("rewards", "card");
  const [filters, setFilters] = useState<RewardFilterState>(INITIAL_FILTERS);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    reward: Reward | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    reward: null,
  });

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const {
    items: rewards,
    setInitialData,
    reorderItems,
    rollback,
    commitReorder,
    deleteRewardItem,
  } = useRewardStore();

  useEffect(() => {
    setInitialData(initialRewards);
  }, [initialRewards, setInitialData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleFilterChange = (newFilters: Partial<RewardFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters((prev) => ({ ...INITIAL_FILTERS, viewMode: prev.viewMode }));
  };

  const handleBuy = (reward: Reward) => {
    alert(
      `Você comprou "${reward.title}" por ${reward.price} moedas! O item foi enviado para a sua Mochila.`,
    );
  };

  const handleAddProduct = () => {
    setEditingReward(null);
    setIsFormModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, reward: Reward) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      reward,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rewards.findIndex((i) => i.id === active.id);
      const newIndex = rewards.findIndex((i) => i.id === over.id);

      reorderItems(oldIndex, newIndex);

      try {
        const reordered = Array.from(rewards);
        const [movedItem] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, movedItem);

        const updates = reordered.map((r, index) => ({
          id: r.id,
          newIndex: index,
        }));

        const result = await reorderRewards(updates);

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

  const filteredRewards = useMemo(() => {
    return rewards.filter((r) => {
      if (
        filters.search &&
        !r.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !r.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.type && r.type !== filters.type) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.packageLevel && r.packageLevel !== filters.packageLevel)
        return false;
      return true;
    });
  }, [rewards, filters]);

  return (
    <>
      <WelcomeCard
        compact={isCompact}
        title="Colete sua recompensa!"
        subtitle="Gerencie sua Vitrine e troque suas moedas."
        bullets={[
          "Escolha entre itens de Uso Único ou Cupom!",
          "Gerencie sua Vitrine com produtos de sua escolha.",
          "Todo produto comprado irá para a Mochila.",
        ]}
        imageSrc="/assets/undraw/reward/undraw_gift-card_sfy8 1.svg"
        imageWidth={isCompact ? 130 : 162}
        imageHeight={isCompact ? 70 : 87}
        storageKey="rewards"
        className="mb-4 sm:mb-6"
      />

      <section className="flex flex-col gap-6 w-full h-full pb-10">
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
              id: "type",
              label: "Tipo",
              options: REWARD_TYPE_OPTIONS,
              value: filters.type,
            },
            {
              id: "category",
              label: "Categorias",
              options: REWARD_CATEGORY_OPTIONS,
              value: filters.category,
            },
            {
              id: "tag",
              label: "Tags",
              options: REWARD_TAG_OPTIONS,
              value: filters.tag,
            },
            {
              id: "packageLevel",
              label: "Pacote",
              options: REWARD_PACKAGE_OPTIONS,
              value: filters.packageLevel,
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearFilters}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext
            items={filteredRewards.map((r) => r.id)}
            strategy={rectSortingStrategy}
          >
            {viewMode === "card" ? (
              <div
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 transition-all duration-200 w-full pb-8",
                  isCompact
                    ? "lg:grid-cols-4 xl:grid-cols-5 gap-3.5"
                    : "lg:grid-cols-3 xl:grid-cols-4 gap-5",
                )}
              >
                {filteredRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onBuy={handleBuy}
                    onContextMenu={handleContextMenu}
                  />
                ))}
                <AddRewardCard onClick={handleAddProduct} viewMode="card" />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 w-full pb-8">
                {/* Cabeçalho da Lista */}
                <ItemRowHeader isCompact={isCompact} mode="reward" />

                <ul className="flex flex-col gap-2 w-full">
                  {filteredRewards.map((reward) => (
                    <ItemRow
                      key={reward.id}
                      id={reward.id}
                      title={reward.title}
                      description={reward.description}
                      type={reward.type}
                      packageLevel={reward.packageLevel}
                      category={reward.category}
                      iconName={reward.iconName}
                      baseDurationMinutes={reward.baseDurationMinutes}
                      price={reward.price}
                      actionLabel="Comprar"
                      onAction={() => handleBuy(reward)}
                      onContextMenu={(e) => handleContextMenu(e, reward)}
                      isCompact={isCompact}
                      dragData={{ type: "Reward", reward }}
                    />
                  ))}
                  <AddRewardCard onClick={handleAddProduct} viewMode="list" />
                </ul>
              </div>
            )}
          </SortableContext>
        </DndContext>
      </section>

      {/* Context Menu flutuante */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: "Editar",
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.reward) {
                setEditingReward(contextMenu.reward);
                setIsFormModalOpen(true);
              }
            },
          },
          {
            label: "Excluir",
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: async () => {
              if (contextMenu.reward) {
                const target = contextMenu.reward;
                deleteRewardItem(target.id);
                toast.success(
                  `Recompensa "${target.title}" excluída com sucesso!`,
                );
                await deleteReward(target.id);
              }
            },
          },
        ]}
      />

      {/* Modal de Formulário (Criação / Edição de Recompensa) */}
      <RewardFormModal
        isOpen={isFormModalOpen}
        rewardToEdit={editingReward}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingReward(null);
        }}
      />
    </>
  );
}
