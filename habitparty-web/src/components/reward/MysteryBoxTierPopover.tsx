"use client";

import { useLocale, useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import type { MysteryBoxTier } from "@/constants/reward";
import type { AppLocale } from "@/i18n/config";
import { cn, formatCoins } from "@/utils";

interface MysteryBoxTierPopoverProps {
  tier: MysteryBoxTier;
  alignClass?: string;
  customPrice?: number;
}

export function MysteryBoxTierPopover({
  tier,
  alignClass = "bottom-full mb-2.5 left-1/2 -translate-x-1/2",
  customPrice,
}: MysteryBoxTierPopoverProps) {
  const t = useTranslations("rewards.tierPopover");
  const tMystery = useTranslations("rewards.mysteryBox");
  const tOptions = useTranslations("rewards.options");
  const locale = useLocale() as AppLocale;

  const TierIcon = tier.icon;
  const displayPrice =
    customPrice !== undefined ? customPrice : tier.recommendedPrice;
  const tierKey = tier.backendPackageLevel;
  const tierName = tMystery(`tiers.${tierKey}.name`);
  const tierConcept = tMystery(`tiers.${tierKey}.concept`);
  const tierBadge = tOptions(`packages.${tierKey}`);

  return (
    <aside
      aria-label={t("detailsAria", { name: tierName })}
      className={cn(
        "absolute z-50 w-64 sm:w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150",
        alignClass,
      )}
    >
      <div className="rounded-xl bg-popover/98 border border-white/20 p-3.5 shadow-popover-dark backdrop-blur-md flex flex-col gap-2.5 text-neutral-100">
        {/* Header do Popover */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center border",
                tier.borderClass,
                tier.bgClass,
              )}
            >
              <TierIcon size={14} className={tier.textClass} />
            </div>
            <span className="text-body-s font-bold text-neutral-100">
              {tierName}
            </span>
          </div>
          <span
            className={cn(
              "text-label-m font-bold px-1.5 py-0.5 rounded border leading-none",
              tier.badgeClass,
            )}
          >
            {tierBadge}
          </span>
        </div>

        {/* Proposta da Caixa */}
        <p className="text-label-g text-neutral-300 leading-snug">
          {tierConcept}
        </p>

        {/* Tabela de Chances / Drop Rates */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-label-m text-neutral-400 font-semibold uppercase tracking-wider">
            <span>{t("rngHeader")}</span>
            <span>{t("dropPercentHeader")}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {tier.dropRates.map((drop, index) => {
              const dropIndex = String(index) as "0" | "1" | "2";
              const dropLabel = tMystery(
                `tiers.${tierKey}.drops.${dropIndex}.label`,
              );
              const dropDescription = tMystery(
                `tiers.${tierKey}.drops.${dropIndex}.description`,
              );

              return (
                <div
                  key={drop.label}
                  className="flex flex-col gap-0.5 p-1.5 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center justify-between text-tiny font-bold">
                    <span className="text-neutral-200 truncate pr-1">
                      {dropLabel}
                    </span>
                    <span
                      className={cn(
                        "font-black shrink-0",
                        drop.badgeVariant === "emerald"
                          ? "text-success-400"
                          : drop.badgeVariant === "amber"
                            ? "text-amber-400"
                            : drop.badgeVariant === "purple"
                              ? "text-magenta"
                              : "text-gold",
                      )}
                    >
                      {drop.percentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    {dropDescription}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé do Popover: Custo Econômico Recomendado ou Preço Atual */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10 text-tiny">
          <span className="text-neutral-400">
            {customPrice !== undefined ? t("priceInCoins") : t("balancedPrice")}
          </span>
          <span className="font-bold text-gold flex items-center gap-1">
            <CoinIcon size={12} withGlow />
            {formatCoins(displayPrice, { locale })} {t("coinsUnit")}
          </span>
        </div>
      </div>
    </aside>
  );
}
