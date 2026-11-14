"use client";

import { Check, HelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type { AppLocale } from "@/i18n/config";
import type { MysteryBoxTier, PackageLevel } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import { MysteryBoxTierPopover } from "./MysteryBoxTierPopover";

interface MysteryBoxSelectorProps {
  selectedLevel?: PackageLevel;
  onSelect: (tier: MysteryBoxTier) => void;
  disabled?: boolean;
  layout?: "4-col" | "2x2";
}

interface MysteryBoxTierCardProps {
  tier: MysteryBoxTier;
  selected: boolean;
  disabled: boolean;
  layout: "4-col" | "2x2";
  align: "left" | "right" | "center";
  onSelect: (tier: MysteryBoxTier) => void;
}

const TIER_POPOVER_ESTIMATED_HEIGHT = 310;
const TIER_POPOVER_ESTIMATED_WIDTH = 288;

function MysteryBoxTierCard({
  tier,
  selected,
  disabled,
  layout,
  align,
  onSelect,
}: MysteryBoxTierCardProps) {
  const t = useTranslations("rewards.mysteryBox");
  const tOptions = useTranslations("rewards.options");
  const locale = useLocale() as AppLocale;

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    open,
    close,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLElement>({
    align,
    estimatedHeight: TIER_POPOVER_ESTIMATED_HEIGHT,
    estimatedWidth: TIER_POPOVER_ESTIMATED_WIDTH,
    offset: 10,
    margin: 12,
    zIndex: 160,
    disabled,
  });

  const TierIcon = tier.icon;
  const tierName = t(`tiers.${tier.backendPackageLevel}.name`);
  const tierRarityLabel = tOptions(`packages.${tier.backendPackageLevel}`);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center h-full w-full"
    >
      {/* Card Interativo da Caixa */}
      <button
        ref={triggerRef}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onSelect(tier)}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={(e) => {
          if (e.currentTarget.matches(":focus-visible")) {
            open();
          }
        }}
        onBlur={close}
        className={cn(
          "relative w-full flex flex-col items-center justify-between p-2 rounded-xl border transition-[transform,translate,scale,border-color,background-color,box-shadow] duration-200 cursor-pointer select-none text-left group overflow-hidden",
          layout === "2x2" ? "h-[116px]" : "h-[136px]",
          "hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          selected
            ? cn(tier.borderSelectedClass, tier.bgSelectedClass)
            : cn(tier.borderClass, tier.bgClass, "bg-card dark:bg-popover/40"),
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
              isOpen || selected ? `0 0 12px ${tier.accentGlow}` : undefined,
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

      {/* Popover via Portal (position: fixed) para sobrepor o modal sem expandir scroll */}
      {shouldRenderPortal &&
        isOpen &&
        !disabled &&
        coords &&
        createPortal(
          <MysteryBoxTierPopover
            tier={tier}
            popoverRef={popoverRef}
            style={floatingStyle}
          />,
          document.body,
        )}
    </div>
  );
}

export function MysteryBoxSelector({
  selectedLevel,
  onSelect,
  disabled = false,
  layout = "4-col",
}: MysteryBoxSelectorProps) {
  const t = useTranslations("rewards.mysteryBox");

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
        <span
          id="mystery-box-grid-label"
          className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5"
        >
          <span>{t("levelLabel")}</span>
          <span className="text-gold">*</span>
          <span className="text-label-m text-neutral-400 font-normal">
            {t("hoverHint")}
          </span>
        </span>
        <span className="text-label-m text-primary dark:text-primary-light flex items-center gap-1">
          <HelpCircle size={12} />
          <span>{t("raritiesCount")}</span>
        </span>
      </div>

      <div
        id="mystery-box-grid"
        role="radiogroup"
        aria-labelledby="mystery-box-grid-label"
        className={cn(
          "grid grid-cols-2 gap-2.5 w-full items-stretch relative",
          layout === "4-col" && "sm:grid-cols-4",
        )}
      >
        {MYSTERY_BOX_TIERS.map((tier, index) => {
          const align =
            layout === "2x2"
              ? index % 2 === 0
                ? "left"
                : "right"
              : index === 0
                ? "left"
                : index === 3
                  ? "right"
                  : "center";

          return (
            <MysteryBoxTierCard
              key={tier.id}
              tier={tier}
              selected={isTierSelected(tier)}
              disabled={disabled}
              layout={layout}
              align={align}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
