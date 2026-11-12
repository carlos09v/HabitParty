"use client";

import { Check, HelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import type { MysteryBoxTier, PackageLevel } from "@/types/reward";
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
  const t = useTranslations("rewards.mysteryBox");
  const tOptions = useTranslations("rewards.options");
  const locale = useLocale() as AppLocale;
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
          <span>{t("levelLabel")}</span>
          <span className="text-gold">*</span>
          <span className="text-label-m text-neutral-400 font-normal">
            {t("hoverHint")}
          </span>
        </label>
        <span className="text-label-m text-primary dark:text-primary-light flex items-center gap-1">
          <HelpCircle size={12} />
          <span>{t("raritiesCount")}</span>
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
          const tierName = t(`tiers.${tier.backendPackageLevel}.name`);
          const tierRarityLabel = tOptions(
            `packages.${tier.backendPackageLevel}`,
          );

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
                  "relative w-full h-[136px] flex flex-col items-center justify-between p-2 rounded-xl border transition-[transform,translate,scale,border-color,background-color,box-shadow] duration-200 cursor-pointer select-none text-left group overflow-hidden",
                  "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                  selected
                    ? cn(tier.borderSelectedClass, tier.bgSelectedClass)
                    : cn(
                        tier.borderClass,
                        tier.bgClass,
                        "bg-card dark:bg-popover/40",
                      ),
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
                      "absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-neutral-950 font-black shadow-xs animate-in zoom-in-50 duration-150 z-10",
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
                    "w-10 h-10 rounded-xl flex items-center justify-center border transition-[transform,scale,background-color,box-shadow] duration-300 shrink-0 shadow-inner group-hover:scale-105",
                    tier.borderClass,
                    selected
                      ? "bg-surface dark:bg-white/15 shadow-sm dark:shadow-md"
                      : "bg-surface/60 dark:bg-white/5 group-hover:bg-surface dark:group-hover:bg-white/10",
                  )}
                  style={{
                    boxShadow:
                      isHovered || selected
                        ? `0 0 12px ${tier.accentGlow}`
                        : undefined,
                  }}
                >
                  <TierIcon
                    size={20}
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
                        : "text-neutral-100 group-hover:text-neutral-50 dark:group-hover:text-white",
                    )}
                    title={tierName}
                  >
                    {tierName}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium truncate max-w-full">
                    {tierRarityLabel}
                  </span>
                </div>

                {/* Custo Recomendado em Moedas (Embaixo da Caixa) */}
                <div
                  className={cn(
                    "flex items-center justify-center gap-1 mt-auto px-2 py-0.5 rounded-full border text-tiny font-bold w-full shrink-0",
                    selected
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:bg-gold/20 dark:border-gold/40 dark:text-gold shadow-glow-gold-xs"
                      : "bg-surface dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-300 group-hover:border-amber-500/40 group-hover:text-amber-700 dark:group-hover:border-gold/30 dark:group-hover:text-gold",
                  )}
                >
                  <CoinIcon size={12} withGlow={selected} />
                  <span>{formatCoins(tier.recommendedPrice, { locale })}</span>
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
