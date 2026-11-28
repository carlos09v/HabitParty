import { Clock, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { RewardPriceGuidance } from "@/components/reward/RewardPriceGuidance";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  COUPON_PACKAGE_OPTIONS,
  MAX_REWARD_PACKAGES_PER_CARD,
  SINGLE_USE_TIER_OPTIONS,
  TIER_CHIP_STYLES,
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
  analyzeRewardPrice,
  calculateSuggestedCouponPrice,
  parseLocalizedPrice,
} from "@/utils/rewardEconomy";
import {
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";

export interface EditableGroupVariant {
  localKey: string;
  id?: string;
  packageLevel: PackageLevel;
  durationMinutes: string;
  price: string;
  originalSuffix: string;
  originalPackageLevel: PackageLevel;
  isOriginallySelected: boolean;
}

interface RewardGroupPackagesEditorProps {
  type: RewardType;
  category: RewardCategory;
  isGamified: boolean;
  isPending: boolean;
  variants: EditableGroupVariant[];
  removedCount: number;
  onAddVariant: () => void;
  onUpdateVariant: (
    localKey: string,
    patch: Partial<EditableGroupVariant>,
  ) => void;
  onRemoveVariant: (localKey: string) => void;
}

export function RewardGroupPackagesEditor({
  type,
  category,
  isGamified,
  isPending,
  variants,
  removedCount,
  onAddVariant,
  onUpdateVariant,
  onRemoveVariant,
}: RewardGroupPackagesEditorProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const baseId = useId();
  const isTimeBased = toRewardTypeMessageKey(type) === "TimeBased";
  const canAddMore = variants.length < MAX_REWARD_PACKAGES_PER_CARD;

  return (
    <fieldset className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-neutral-700/40 dark:border-white/5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <legend className="text-body-s text-neutral-100 font-semibold">
            {t("groupEditor.title", {
              count: variants.length,
              max: MAX_REWARD_PACKAGES_PER_CARD,
            })}
          </legend>
          <span className="text-tiny text-neutral-400">
            {t("groupEditor.subtitle")}
          </span>
        </div>

        {canAddMore && (
          <button
            type="button"
            disabled={isPending}
            onClick={onAddVariant}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary dark:border-gold/40 dark:bg-gold/15 dark:text-gold text-xs font-bold hover:bg-primary/20 dark:hover:bg-gold/25 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={13} aria-hidden="true" />
            <span>{t("groupEditor.addPackage")}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-0.5 custom-scrollbar">
        {variants.map((variant, index) => {
          const pkgKey = toPackageMessageKey(variant.packageLevel);
          const chipStyle = TIER_CHIP_STYLES[pkgKey] ?? TIER_CHIP_STYLES.NONE;
          const durationNum =
            Number.parseInt(variant.durationMinutes || "0", 10) || 0;
          const numericPrice = parseLocalizedPrice(variant.price) || 0;

          const usedByOtherRows = new Set<PackageMessageKey>();
          for (const other of variants) {
            if (other.localKey === variant.localKey) continue;
            const otherKey = toPackageMessageKey(other.packageLevel);
            if (otherKey !== "NONE") {
              usedByOtherRows.add(otherKey);
            }
          }

          const availableTierOptions = COUPON_PACKAGE_OPTIONS.filter((opt) => {
            const optKey = toPackageMessageKey(opt.id);
            return optKey === "NONE" || !usedByOtherRows.has(optKey);
          }).map((opt) => ({
            value: opt.id,
            label: tOptions(`packages.${toPackageMessageKey(opt.id)}`),
          }));

          const priceAnalysis = analyzeRewardPrice({
            type,
            price: numericPrice,
            durationMinutes: isTimeBased ? durationNum || 30 : undefined,
            packageLevel: variant.packageLevel,
            category,
          });
          const hasPriceWarning = priceAnalysis.status !== "ok";

          const tierId = `${baseId}-tier-${index}`;
          const durationId = `${baseId}-duration-${index}`;
          const priceId = `${baseId}-price-${index}`;

          return (
            <div
              key={variant.localKey}
              className={cn(
                "flex flex-col gap-2 p-2.5 rounded-xl border bg-card/60 dark:bg-white/[0.03] transition-colors",
                variant.isOriginallySelected
                  ? "border-primary/50 dark:border-gold/45 ring-1 ring-primary/20 dark:ring-gold/20"
                  : "border-neutral-700/80 dark:border-white/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {chipStyle.dotColor && (
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        chipStyle.dotColor,
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-xs font-bold text-neutral-100 truncate">
                    {t("groupEditor.packageIndex", { index: index + 1 })}
                    {isTimeBased && durationNum > 0
                      ? ` · ${formatFocusMinutes(durationNum)}`
                      : ""}
                  </span>
                  {variant.isOriginallySelected && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 dark:bg-gold/20 text-primary dark:text-gold text-[10px] font-bold leading-none shrink-0">
                      {t("groupEditor.activeBadge")}
                    </span>
                  )}
                  {!variant.id && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold leading-none shrink-0">
                      {t("groupEditor.newBadge")}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isPending || variants.length <= 1}
                  onClick={() => onRemoveVariant(variant.localKey)}
                  aria-label={t("groupEditor.removePackageAria", {
                    index: index + 1,
                  })}
                  title={
                    variants.length <= 1
                      ? t("groupEditor.keepOneHint")
                      : t("groupEditor.removePackageTitle")
                  }
                  className="inline-flex items-center justify-center w-7 h-7 rounded-md text-neutral-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>

              <div
                className={cn(
                  "grid grid-cols-1 gap-2 items-end",
                  isTimeBased ? "sm:grid-cols-3" : "sm:grid-cols-2",
                )}
              >
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={tierId}
                    className="text-[11px] font-medium text-neutral-300"
                  >
                    {t("groupEditor.tierLabel")}
                  </label>
                  <Select
                    id={tierId}
                    value={variant.packageLevel}
                    onChange={(val) => {
                      const nextLevel = val as PackageLevel;
                      const nextKey = toPackageMessageKey(nextLevel);
                      if (!variant.id) {
                        if (isTimeBased) {
                          const preset = COUPON_PACKAGE_OPTIONS.find(
                            (opt) => opt.id === nextLevel,
                          );
                          if (preset?.suggestedMinutes) {
                            onUpdateVariant(variant.localKey, {
                              packageLevel: nextLevel,
                              durationMinutes: String(preset.suggestedMinutes),
                              price: String(
                                calculateSuggestedCouponPrice(
                                  preset.suggestedMinutes,
                                  category,
                                ),
                              ),
                            });
                            return;
                          }
                        } else {
                          const singlePreset = SINGLE_USE_TIER_OPTIONS.find(
                            (opt) => opt.id === nextKey,
                          );
                          if (singlePreset) {
                            onUpdateVariant(variant.localKey, {
                              packageLevel: nextLevel,
                              price: String(
                                adjustSuggestedPriceForCategory(
                                  singlePreset.suggestedPrice,
                                  category,
                                  "SingleUse",
                                ),
                              ),
                            });
                            return;
                          }
                        }
                      }
                      onUpdateVariant(variant.localKey, {
                        packageLevel: nextLevel,
                      });
                    }}
                    options={availableTierOptions}
                    disabled={isPending}
                    compact
                    triggerClassName="h-[36px] text-xs"
                  />
                </div>

                {isTimeBased && (
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor={durationId}
                      className="text-[11px] font-medium text-neutral-300"
                    >
                      {t("groupEditor.durationLabel")}
                    </label>
                    <Input
                      id={durationId}
                      name={`duration-${index}`}
                      type="number"
                      min={5}
                      max={1440}
                      step={5}
                      value={variant.durationMinutes}
                      onChange={(e) =>
                        onUpdateVariant(variant.localKey, {
                          durationMinutes: e.target.value,
                        })
                      }
                      onBlur={() => {
                        const parsed = Number.parseInt(
                          variant.durationMinutes,
                          10,
                        );
                        if (Number.isNaN(parsed) || parsed < 5) {
                          onUpdateVariant(variant.localKey, {
                            durationMinutes: "5",
                          });
                        } else if (parsed > 1440) {
                          onUpdateVariant(variant.localKey, {
                            durationMinutes: "1440",
                          });
                        }
                      }}
                      compact
                      icon={<Clock size={13} />}
                      className="h-[36px] text-xs font-semibold tabular-nums"
                      required
                      disabled={isPending}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={priceId}
                    className="text-[11px] font-medium text-neutral-300"
                  >
                    {isGamified
                      ? t("groupEditor.priceCoinsLabel")
                      : t("groupEditor.priceCreditsLabel")}
                  </label>
                  <Input
                    id={priceId}
                    name={`price-${index}`}
                    type="number"
                    step="any"
                    min="0.01"
                    max={99999}
                    value={variant.price}
                    onChange={(e) =>
                      onUpdateVariant(variant.localKey, {
                        price: e.target.value,
                      })
                    }
                    compact
                    icon={<CoinIcon size={13} withGlow />}
                    className={cn(
                      "h-[36px] text-xs font-bold tabular-nums",
                      hasPriceWarning &&
                        "border-amber-500/60 focus:border-amber-500 dark:border-amber-400/50 dark:focus:border-amber-400",
                    )}
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-neutral-700/35 dark:border-white/5">
                <RewardPriceGuidance
                  type={type}
                  category={category}
                  price={variant.price}
                  durationMinutes={
                    isTimeBased ? variant.durationMinutes : undefined
                  }
                  packageLevel={variant.packageLevel}
                  analysis={priceAnalysis}
                  onApplySuggestedPrice={(suggested) =>
                    onUpdateVariant(variant.localKey, {
                      price: String(suggested),
                    })
                  }
                  disabled={isPending}
                />
              </div>
            </div>
          );
        })}
      </div>

      {removedCount > 0 && (
        <p className="text-tiny text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5">
          {t("groupEditor.removedNotice", { count: removedCount })}
        </p>
      )}
    </fieldset>
  );
}
