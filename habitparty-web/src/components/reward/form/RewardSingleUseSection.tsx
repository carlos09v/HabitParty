import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { RewardPriceField } from "@/components/reward/form/RewardPriceField";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Switch } from "@/components/ui/Switch";
import {
  DEBT_UNIT_PRICE_PRESETS,
  SINGLE_USE_NONE_OPTION,
  SINGLE_USE_TIER_OPTIONS,
} from "@/constants/reward";
import type {
  PackageLevel,
  PackageMessageKey,
  RewardCategory,
  RewardType,
} from "@/types/reward";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import {
  adjustSuggestedPriceForCategory,
  parseLocalizedPrice,
  type RewardPriceAnalysis,
} from "@/utils/rewardEconomy";
import { toPackageMessageKey } from "@/utils/rewardMapper";

interface RewardSingleUseSectionProps {
  isDebtCategory: boolean;
  isDebtToggleDisabled?: boolean;
  category: RewardCategory;
  isGamified: boolean;
  isPending: boolean;
  type: RewardType;
  packageLevel: PackageLevel;
  usedPackageKeys?: Set<PackageMessageKey>;
  price: string;
  onPriceChange: (value: string) => void;
  hasPriceWarning: boolean;
  priceAnalysis: RewardPriceAnalysis;
  onApplySuggestedPrice: (price: number) => void;
  onSingleUseTierSelect: (
    tierLevel: PackageLevel,
    suggestedPrice?: number,
  ) => void;
  onDebtToggleChange: (checked: boolean) => void;
}

export function RewardSingleUseSection({
  isDebtCategory,
  isDebtToggleDisabled = false,
  category,
  isGamified,
  isPending,
  type,
  packageLevel,
  usedPackageKeys,
  price,
  onPriceChange,
  hasPriceWarning,
  priceAnalysis,
  onApplySuggestedPrice,
  onSingleUseTierSelect,
  onDebtToggleChange,
}: RewardSingleUseSectionProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const parsedPrice = parseLocalizedPrice(price) || 0;

  return (
    <>
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
        {isDebtCategory ? (
          /* Tabela linear de preço unitário para Dívida (sem pacotes ou descontos) */
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-body-s text-neutral-100 font-medium">
                  {t("debtUnitPricingLabel")}
                </span>
                <InfoTooltip
                  title={t("debtUnitPricingTooltipTitle")}
                  icon={
                    <Info
                      size={13}
                      className="text-rose-700 dark:text-rose-300 shrink-0"
                    />
                  }
                  size={13}
                  align="left"
                  side="top"
                  ariaLabel={t("debtUnitPricingTooltipTitle")}
                >
                  <p className="text-label-g text-neutral-300 leading-relaxed">
                    {t("debtUnitPricingTooltipBody")}
                  </p>
                </InfoTooltip>
              </div>
              <span className="text-label-m text-rose-700 dark:text-rose-300">
                {t("debtUnitPricingHint")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DEBT_UNIT_PRICE_PRESETS.map((preset) => {
                const isSelected = parsedPrice === preset.price;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isPending}
                    onClick={() => onApplySuggestedPrice(preset.price)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95 tabular-nums",
                      isSelected
                        ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-200 ring-2 ring-rose-500/25"
                        : "bg-surface/70 border-neutral-600 text-neutral-300 hover:text-neutral-100 hover:border-rose-500/40 dark:bg-white/5 dark:border-white/10",
                      isPending && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span>{formatFocusMinutes(preset.minutes)}</span>
                    <span className="opacity-60">•</span>
                    <span>{preset.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Atalhos opcionais de horizonte/raridade ACIMA do preço */
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-body-s text-neutral-100 font-medium">
                  {t("singleUseTiersLabel")}
                </span>
                <InfoTooltip
                  title={t("singleUseTiersTooltipTitle")}
                  icon={<Info size={13} className="text-gold shrink-0" />}
                  size={13}
                  align="left"
                  side="top"
                  ariaLabel={t("singleUseTiersTooltipTitle")}
                >
                  <p className="text-label-g text-neutral-300 leading-relaxed">
                    {t("singleUseTiersTooltipBody")}
                  </p>
                </InfoTooltip>
              </div>
              <span className="text-label-m text-neutral-400">
                {t("singleUseTiersHint")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                aria-pressed={toPackageMessageKey(packageLevel) === "NONE"}
                disabled={isPending}
                onClick={() => onSingleUseTierSelect("Nenhum")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
                  toPackageMessageKey(packageLevel) === "NONE"
                    ? SINGLE_USE_NONE_OPTION.selectedClass
                    : SINGLE_USE_NONE_OPTION.unselectedClass,
                  isPending && "opacity-50 cursor-not-allowed",
                )}
              >
                <span>{tOptions("singleUseTiers.NONE")}</span>
              </button>

              {SINGLE_USE_TIER_OPTIONS.map((tier) => {
                const isTierUsedInCard = Boolean(usedPackageKeys?.has(tier.id));
                const isSelected =
                  !isTierUsedInCard &&
                  toPackageMessageKey(packageLevel) === tier.id;
                const isTierDisabled = isPending || isTierUsedInCard;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isTierDisabled}
                    title={
                      isTierUsedInCard ? t("tierAlreadyUsedInCard") : undefined
                    }
                    onClick={() => {
                      if (isTierUsedInCard) return;
                      onSingleUseTierSelect(
                        tier.packageLevel,
                        adjustSuggestedPriceForCategory(
                          tier.suggestedPrice,
                          category,
                        ),
                      );
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] select-none",
                      isTierDisabled
                        ? "opacity-40 cursor-not-allowed border-neutral-700 bg-surface/40 text-neutral-500 line-through"
                        : cn(
                            "cursor-pointer active:scale-95",
                            isSelected
                              ? tier.selectedClass
                              : tier.unselectedClass,
                          ),
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        tier.dotColor,
                      )}
                    />
                    <span>{tOptions(`singleUseTiers.${tier.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Custo */}
        <div className="pt-2 border-t border-neutral-700/40 dark:border-white/5">
          <RewardPriceField
            label={
              isDebtCategory
                ? t("debtUnitPriceFieldLabel")
                : isGamified
                  ? t("priceLabel")
                  : t("priceLabelProductivity")
            }
            hint={isDebtCategory ? t("debtUnitPriceFieldHint") : undefined}
            value={price}
            onChange={onPriceChange}
            placeholder={t("pricePlaceholder")}
            disabled={isPending}
            hasWarning={!isDebtCategory && hasPriceWarning}
            guidanceType={isDebtCategory ? undefined : type}
            category={isDebtCategory ? undefined : category}
            packageLevel={isDebtCategory ? undefined : packageLevel}
            priceAnalysis={isDebtCategory ? undefined : priceAnalysis}
            onApplySuggestedPrice={
              isDebtCategory ? undefined : onApplySuggestedPrice
            }
          />
        </div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors",
          isDebtCategory
            ? "bg-rose-500/10 border-rose-500/35 dark:bg-rose-500/10 dark:border-rose-400/40"
            : "bg-background border-neutral-700 dark:bg-surface/30 dark:border-white/10",
        )}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="rewardDebtToggle"
              className="text-body-s font-semibold text-neutral-100 cursor-pointer select-none"
            >
              {t("debtToggleLabel")}
            </label>
            <InfoTooltip
              title={t("debtTooltipTitle")}
              icon={
                <Info
                  size={14}
                  className="text-rose-700 dark:text-rose-300 shrink-0"
                />
              }
              size={14}
              align="left"
              side="top"
              ariaLabel={t("debtTooltipAria")}
            >
              <p className="text-neutral-300 leading-relaxed text-label-g">
                {t("debtTooltipBody")}
              </p>
              <ul className="flex flex-col gap-1 py-0.5 text-label-g text-neutral-200">
                <li>
                  •{" "}
                  {isGamified
                    ? t("debtTooltipPointDirect")
                    : t("debtTooltipPointDirectProductivity")}
                </li>
                <li>
                  •{" "}
                  {isGamified
                    ? t("debtTooltipPointExample")
                    : t("debtTooltipPointExampleProductivity")}
                </li>
              </ul>
            </InfoTooltip>
          </div>
          <span className="text-tiny text-neutral-400 leading-snug">
            {isGamified
              ? t("debtToggleSubtitle")
              : t("debtToggleSubtitleProductivity")}
          </span>
          {isDebtCategory && (
            <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 mt-0.5">
              {t("debtCategoryAutoHint")}
            </span>
          )}
        </div>

        <Switch
          id="rewardDebtToggle"
          checked={isDebtCategory}
          onCheckedChange={onDebtToggleChange}
          disabled={isPending || isDebtToggleDisabled}
          aria-label={t("debtToggleAria")}
        />
      </div>
    </>
  );
}
