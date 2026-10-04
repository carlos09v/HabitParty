"use client";

import { useMemo, useState } from "react";
import { MOCK_REWARDS } from "@/mocks/rewards";
import type { Reward } from "@/types/reward";
import { AddRewardCard, RewardCard } from "./RewardCard";
import { type RewardFilterState, RewardFilters } from "./RewardFilters";
import { cn } from "@/utils";
import { REWARD_TYPE_META } from "@/constants/reward";

const INITIAL_FILTERS: RewardFilterState = {
  search: "",
  type: "",
  category: "",
  tag: "",
  packageLevel: "",
  viewMode: "card",
};

export function RewardsContainer() {
  const [filters, setFilters] = useState<RewardFilterState>(INITIAL_FILTERS);
  const [rewards, setRewards] = useState<Reward[]>(MOCK_REWARDS);

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
    const title = prompt("Digite o nome da nova recompensa:");
    if (!title) return;

    const newReward: Reward = {
      id: `rew-${Date.now()}`,
      title,
      description: "Nova recompensa personalizada",
      type: "TimeBased",
      packageLevel: "Básico",
      category: "Entretenimento",
      duration: "30min",
      price: 25,
      iconName: "joystick",
    };

    setRewards((prev) => [...prev, newReward]);
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
      if (filters.packageLevel && r.packageLevel !== filters.packageLevel) return false;
      return true;
    });
  }, [rewards, filters]);

  return (
    <section className="flex flex-col gap-6 w-full h-full pb-10">
      <RewardFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {filters.viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pb-8">
          {filteredRewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} onBuy={handleBuy} />
          ))}
          <AddRewardCard onClick={handleAddProduct} viewMode="card" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 w-full pb-8" role="list">
          {filteredRewards.map((reward) => {
            const typeMeta = REWARD_TYPE_META[reward.type];

            return (
              <article
                key={reward.id}
                role="listitem"
                className="grid grid-cols-1 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 rounded-xl bg-surface border border-white/20 hover:border-gold/50 transition-all shadow-sm"
              >
                {/* Coluna 1: Título e Descrição */}
                <div className="flex flex-col min-w-0">
                  <h4 className="text-base font-bold text-neutral-100 truncate">
                    {reward.title}
                  </h4>
                  <p className="text-sm text-neutral-400 truncate mt-1">
                    {reward.description}
                  </p>
                </div>

                {/* Coluna 2: Tipo de Recompensa */}
                <div className="flex items-center">
                  <span
                    className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-md border truncate",
                      typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20"
                    )}
                  >
                    {typeMeta?.label || reward.type}
                  </span>
                </div>

                {/* Coluna 3: Categoria */}
                <div className="flex items-center">
                  <span className="text-xs font-medium px-3 py-1.5 rounded-md text-neutral-300 bg-white/10 border border-white/10 truncate">
                    {reward.category}
                  </span>
                </div>

                {/* Coluna 4: Preço e Botão */}
                <div className="flex items-center justify-end gap-5 shrink-0">
                  <div className="flex items-center gap-2" aria-label={`Preço: ${reward.price} moedas`}>
                    <div className="w-5 h-5 rounded-full bg-gold border border-orange-500 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] text-neutral-900 font-bold">H</span>
                    </div>
                    <span className="text-base font-bold text-neutral-100">
                      {reward.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuy(reward)}
                    aria-label={`Comprar ${reward.title}`}
                    className="px-4 py-2 rounded-lg bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 active:scale-95 text-neutral-900 font-bold text-sm transition-all cursor-pointer shadow-sm"
                  >
                    Comprar
                  </button>
                </div>
              </article>
            );
          })}

          <AddRewardCard onClick={handleAddProduct} viewMode="list" />
        </div>
      )}
    </section>
  );
}
