"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteReward,
  redeemReward,
  reorderRewards,
} from "@/actions/rewardActions";
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
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import { useUserStore } from "@/store/userStore";
import type { Reward } from "@/types/reward";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";
import { AddRewardCard, RewardCard } from "./RewardCard";

const RewardFormModal = dynamic(
  () =>
    import("./RewardFormModal").then((mod) => ({
      default: mod.RewardFormModal,
    })),
  { ssr: false },
);

export function RewardsContainer({
  isCompact = false,
  initialRewards,
}: {
  isCompact?: boolean;
  initialRewards: Reward[];
}) {
  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("rewards");

  const {
    items: rewards,
    setItems: setRewards,
    sensors,
    handleDragEnd,
  } = useReorderableList<Reward>({
    initialItems: initialRewards,
    onReorderServerAction: reorderRewards,
    isFiltering,
  });

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    reward: Reward | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    reward: null,
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const { user, updateUserPartial } = useUserStore();
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleBuy = async (reward: Reward) => {
    if (isRedeeming) return;

    if (
      user &&
      typeof user.currentCoins === "number" &&
      user.currentCoins < reward.price
    ) {
      toast.error("Moedas insuficientes para resgatar este item!");
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await redeemReward(reward.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao resgatar recompensa.");
        return;
      }

      if (user && typeof user.currentCoins === "number") {
        updateUserPartial({
          currentCoins: Math.max(0, user.currentCoins - reward.price),
        });
      }

      soundEffects.playBuySound();
      toast.success(
        `Você comprou "${reward.title}"! O item foi enviado para a sua Mochila.`,
      );
    } catch (_error) {
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setIsRedeeming(false);
    }
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

  const handleRewardSuccess = (savedReward: Reward) => {
    setRewards((prev) => {
      const exists = prev.some((r) => r.id === savedReward.id);
      if (exists) {
        return prev.map((r) => (r.id === savedReward.id ? savedReward : r));
      }
      return [savedReward, ...prev];
    });
  };

  const handleDelete = async (target: Reward) => {
    setRewards((prev) => prev.filter((r) => r.id !== target.id));
    toast.success(`Recompensa "${target.title}" excluída com sucesso!`);
    await deleteReward(target.id);
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
          id="rewards-dnd-context"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
        >
          <SortableContext
            items={filteredRewards.map((r) => r.id)}
            strategy={
              viewMode === "card"
                ? rectSortingStrategy
                : verticalListSortingStrategy
            }
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
                    isCompact={isCompact}
                  />
                ))}
                <AddRewardCard onClick={handleAddProduct} viewMode="card" />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 w-full pb-8">
                <ItemRowHeader isCompact={isCompact} mode="reward" />

                <ul className="flex flex-col gap-2 w-full">
                  {filteredRewards.map((reward) => {
                    const canAfford =
                      typeof user?.currentCoins === "number"
                        ? user.currentCoins >= reward.price
                        : true;

                    return (
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
                        disabled={!canAfford}
                        disabledTitle={
                          !canAfford ? "Moedas insuficientes" : undefined
                        }
                        actionLabel="Comprar"
                        onAction={() => handleBuy(reward)}
                        onContextMenu={(e) => handleContextMenu(e, reward)}
                        isCompact={isCompact}
                        dragData={{ type: "Reward", reward }}
                      />
                    );
                  })}
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
                await handleDelete(contextMenu.reward);
              }
            },
          },
        ]}
      />

      {/* Modal de Formulário (Criação / Edição de Recompensa com Lazy Loading) */}
      {isFormModalOpen && (
        <RewardFormModal
          isOpen={isFormModalOpen}
          rewardToEdit={editingReward}
          onSuccess={handleRewardSuccess}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingReward(null);
          }}
        />
      )}
    </>
  );
}
