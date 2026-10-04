"use client";

import { Clock, Gamepad2, Gift, Plus } from "lucide-react";
import type { Reward } from "@/types/reward";
import { cn } from "@/utils";
import { PACKAGE_LEVEL_COLOR, REWARD_TYPE_META } from "@/constants/reward";

interface RewardCardProps {
  reward: Reward;
  onBuy?: (reward: Reward) => void;
}

export function RewardCard({ reward, onBuy }: RewardCardProps) {
  const typeMeta = REWARD_TYPE_META[reward.type];

  return (
    <article className="flex flex-col justify-between p-4 rounded-xl bg-surface border border-white/20 hover:border-gold/50 hover:bg-surface-hover transition-all duration-200 group select-none shadow-sm gap-4 min-h-[180px]">
      {/* TOPO: Ícone do Item + Badge de Tipo */}
      <header className="flex items-center justify-between w-full">
        {/* Ícone representativo */}
        <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-primary-light group-hover:text-gold transition-colors">
          {reward.iconName === "mystery_box" ? (
            <Gift size={20} className="text-orange-400" aria-hidden="true" />
          ) : (
            <Gamepad2 size={20} aria-hidden="true" />
          )}
        </div>

        {/* Badge de Tipo */}
        <span
          className={cn(
            "text-xs font-bold px-2.5 py-1 rounded-md border",
            typeMeta?.color || "text-neutral-200 bg-white/10 border-white/20",
          )}
        >
          {typeMeta?.label || reward.type}
        </span>
      </header>

      {/* MEIO: Título, Descrição e Tags */}
      <section className="flex flex-col gap-1.5 w-full min-w-0">
        <h4 className="text-base font-bold text-neutral-100 truncate group-hover:text-gold transition-colors">
          {reward.title}
        </h4>
        <p className="text-sm text-neutral-300 truncate">
          {reward.description}
        </p>

        {/* Badges de Pacote e Tag */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {reward.packageLevel && (
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-md border",
                PACKAGE_LEVEL_COLOR[reward.packageLevel] ||
                  "text-neutral-300 bg-white/10 border-white/15",
              )}
            >
              {reward.packageLevel}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white/10 border border-white/10 text-neutral-300">
            {reward.category}
          </span>
        </div>
      </section>

      {/* BASE: Duração e Preço */}
      <footer className="flex items-center justify-between pt-3 border-t border-white/10 w-full gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-300 min-w-0">
          {reward.duration ? (
            <>
              <Clock size={14} className="text-neutral-400 shrink-0" aria-hidden="true" />
              <span>{reward.duration}</span>
            </>
          ) : (
            <span className="text-xs text-neutral-400">Uso Imediato</span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5" aria-label={`Preço: ${reward.price} moedas`}>
            <div className="w-5 h-5 rounded-full bg-gold border border-orange-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] text-neutral-900 font-bold">H</span>
            </div>
            <span className="text-sm font-bold text-neutral-100">
              {reward.price}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onBuy?.(reward)}
            aria-label={`Comprar ${reward.title}`}
            className="px-3 py-1.5 rounded-lg bg-warning-500 hover:bg-warning-400 focus:outline-none focus:ring-2 focus:ring-warning-300 focus:ring-offset-2 focus:ring-offset-surface active:scale-95 text-neutral-900 font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            Comprar
          </button>
        </div>
      </footer>
    </article>
  );
}

interface AddRewardCardProps {
  onClick?: () => void;
  viewMode?: "card" | "list";
}

export function AddRewardCard({ onClick, viewMode = "card" }: AddRewardCardProps) {
  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Adicionar nova recompensa"
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-all cursor-pointer",
          "border-white/20 bg-card/40 text-sm font-semibold text-neutral-300",
          "hover:border-gold hover:text-gold hover:bg-card/60 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gold",
        )}
      >
        <Plus size={16} aria-hidden="true" />
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
        "flex flex-col items-center justify-center p-6 rounded-xl border border-dashed transition-all cursor-pointer group min-h-[180px]",
        "border-primary/50 bg-white/5 hover:bg-white/10 hover:border-gold text-neutral-300 hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold",
      )}
    >
      <div className="p-3 rounded-xl bg-white/10 group-hover:bg-gold/20 text-primary-light group-hover:text-gold transition-colors mb-3">
        <Plus size={24} aria-hidden="true" />
      </div>
      <span className="text-sm font-semibold">Adicionar Produto</span>
    </button>
  );
}
