"use client";

import { Check, Coins, HelpCircle } from "lucide-react";
import { useState } from "react";
import { MYSTERY_BOX_TIERS, type MysteryBoxTier } from "@/constants/reward";
import type { PackageLevel } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import { MysteryBoxTierPopover } from "./MysteryBoxTierPopover";

interface MysteryBoxSelectorProps {
  selectedLevel?: PackageLevel;
  onSelect: (tier: MysteryBoxTier) => void;
  disabled?: boolean;
}

export function MysteryBoxSelector({
  selectedLevel,
  onSelect,
  disabled = false,
}: MysteryBoxSelectorProps) {
  const [hoveredTierId, setHoveredTierId] = useState<string | null>(null);

  // Normaliza o nível selecionado para bater tanto com nomes em PT quanto EN
  const isTierSelected = (tier: MysteryBoxTier) => {
    if (!selectedLevel) return false;
    return (
      selectedLevel === tier.id ||
      selectedLevel === tier.backendPackageLevel ||
      selectedLevel.toUpperCase() === tier.backendPackageLevel
    );
  };

  return (
    <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between">
        <label
          htmlFor="mystery-box-grid"
          className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5"
        >
          <span>Nível da Caixa Misteriosa</span>
          <span className="text-gold">*</span>
          <span className="text-label-m text-neutral-400 font-normal">
            (passe o mouse para ver as chances)
          </span>
        </label>
        <span className="text-label-m text-primary-light flex items-center gap-1">
          <HelpCircle size={12} />
          <span>4 Raridades</span>
        </span>
      </div>

      <div
        id="mystery-box-grid"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full items-stretch relative"
      >
        {MYSTERY_BOX_TIERS.map((tier, index) => {
          const selected = isTierSelected(tier);
          const isHovered = hoveredTierId === tier.id;
          const TierIcon = tier.icon;

          // Alinhamento inteligente do popover para não estourar os limites da modal
          const popoverAlign =
            index === 0
              ? "left-0"
              : index === 1
                ? "left-0 sm:-left-4"
                : index === 2
                  ? "right-0 sm:-right-4"
                  : "right-0";

          return (
            <div
              key={tier.id}
              className="relative flex flex-col items-center h-full w-full"
            >
              {/* Card Interativo da Caixa */}
              <button
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onSelect(tier)}
                onMouseEnter={() => setHoveredTierId(tier.id)}
                onMouseLeave={() => setHoveredTierId(null)}
                onFocus={() => setHoveredTierId(tier.id)}
                onBlur={() => setHoveredTierId(null)}
                className={cn(
                  "relative w-full h-[160px] flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none text-left group overflow-hidden",
                  "hover:-translate-y-1 hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  selected
                    ? cn(tier.borderSelectedClass, tier.bgSelectedClass)
                    : cn(tier.borderClass, tier.bgClass, "bg-popover/40"),
                  disabled &&
                    "opacity-50 cursor-not-allowed hover:translate-y-0 hover:scale-100",
                )}
              >
                {/* Aura de iluminação superior no card */}
                <div
                  className="absolute top-0 inset-x-0 h-1 opacity-80 pointer-events-none transition-opacity duration-200"
                  style={{
                    background: `linear-gradient(to right, transparent, ${tier.accentGlow}, transparent)`,
                  }}
                />

                {/* Badge de Selecionado */}
                {selected && (
                  <div
                    className={cn(
                      "absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-neutral-950 font-black shadow-xs animate-in zoom-in-50 duration-150 z-10",
                      tier.id === "Lendário"
                        ? "bg-gold"
                        : tier.id === "Épico"
                          ? "bg-magenta text-white"
                          : tier.id === "Premium"
                            ? "bg-info text-neutral-950"
                            : "bg-success-500 text-neutral-950",
                    )}
                  >
                    <Check size={11} strokeWidth={3.5} />
                  </div>
                )}

                {/* Ícone Heroico Gamificado da Caixa */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 mt-0.5 shrink-0 shadow-inner group-hover:scale-110",
                    tier.borderClass,
                    selected
                      ? "bg-white/15 shadow-md"
                      : "bg-white/5 group-hover:bg-white/10",
                  )}
                  style={{
                    boxShadow:
                      isHovered || selected
                        ? `0 0 16px ${tier.accentGlow}`
                        : undefined,
                  }}
                >
                  <TierIcon
                    size={24}
                    className={cn(
                      "transition-transform duration-300 group-hover:rotate-6",
                      tier.textClass,
                    )}
                  />
                </div>

                {/* Nome da Raridade */}
                <div className="flex flex-col items-center my-auto w-full text-center px-0.5">
                  <span
                    className={cn(
                      "text-body-s font-bold leading-snug transition-colors line-clamp-1 truncate max-w-full",
                      selected
                        ? tier.textClass
                        : "text-neutral-100 group-hover:text-white",
                    )}
                    title={tier.name}
                  >
                    {tier.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium truncate max-w-full">
                    {tier.id}
                  </span>
                </div>

                {/* Custo Recomendado em Moedas (Embaixo da Caixa) */}
                <div
                  className={cn(
                    "flex items-center justify-center gap-1 mt-auto px-2 py-0.5 rounded-full border text-tiny font-bold w-full shrink-0",
                    selected
                      ? "bg-gold/20 border-gold/40 text-gold shadow-glow-gold-xs"
                      : "bg-white/5 border-white/10 text-neutral-300 group-hover:border-gold/30 group-hover:text-gold",
                  )}
                >
                  <Coins size={11} className="text-gold shrink-0" />
                  <span>{formatCoins(tier.recommendedPrice)}</span>
                </div>
              </button>

              {/* Popover Característico com as Chances de Drop e Proposta */}
              {isHovered && (
                <MysteryBoxTierPopover
                  tier={tier}
                  alignClass={cn("bottom-full mb-2.5", popoverAlign)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
