"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { RewardPriceField } from "@/components/reward/form/RewardPriceField";
import { RewardPriceGuidance } from "@/components/reward/RewardPriceGuidance";
import { DurationHoursBadge } from "@/components/ui/DurationHoursBadge";
import { NumberStepperInput } from "@/components/ui/NumberStepperInput";
import { Switch } from "@/components/ui/Switch";
import { COUPON_PACKAGE_OPTIONS } from "@/constants/reward";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import type { RewardPriceAnalysis } from "@/utils/rewardEconomy";
import { toPackageMessageKey } from "@/utils/rewardMapper";

interface RewardTimeBasedSectionProps {
  isEditing: boolean;
  isPending: boolean;
  isGamified: boolean;
  type: RewardType;
  createMultiplePackages: boolean;
  onCreateMultiplePackagesChange: (checked: boolean) => void;
  selectedBatchPackages: PackageLevel[];
  onToggleBatchPackage: (pkgId: PackageLevel) => void;
  packageLevel: PackageLevel;
  onSelectPackageLevel: (pkgId: PackageLevel) => void;
  baseDurationMinutes: string;
  onSetBaseDurationMinutes: (value: string) => void;
  onBaseDurationChange: (value: string) => void;
  price: string;
  onPriceChange: (value: string) => void;
  hasPriceWarning: boolean;
  priceAnalysis: RewardPriceAnalysis;
  onApplySuggestedPrice: (price: number) => void;
}

export function RewardTimeBasedSection({
  isEditing,
  isPending,
  isGamified,
  type,
  createMultiplePackages,
  onCreateMultiplePackagesChange,
  selectedBatchPackages,
  onToggleBatchPackage,
  packageLevel,
  onSelectPackageLevel,
  baseDurationMinutes,
  onSetBaseDurationMinutes,
  onBaseDurationChange,
  price,
  onPriceChange,
  hasPriceWarning,
  priceAnalysis,
  onApplySuggestedPrice,
}: RewardTimeBasedSectionProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const durationHoursHintId = useId();
  const numericDuration = Number.parseInt(baseDurationMinutes || "0", 10) || 0;

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
      {!isEditing && (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-700/40 dark:border-white/5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <label
              htmlFor="rewardMultiPackageToggle"
              className="text-body-s text-neutral-100 font-semibold cursor-pointer select-none"
            >
              {t("multiPackageToggleLabel")}
            </label>
            <span className="text-tiny text-neutral-400">
              {t("multiPackageToggleHint")}
            </span>
          </div>
          <Switch
            id="rewardMultiPackageToggle"
            checked={createMultiplePackages}
            onCheckedChange={onCreateMultiplePackagesChange}
            disabled={isPending}
            aria-label={t("multiPackageToggleLabel")}
          />
        </div>
      )}

      {/* Atalhos Rápidos / Seleção Múltipla ACIMA dos inputs */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-body-s text-neutral-100 font-medium">
            {createMultiplePackages
              ? t("multiPackageSelectLabel")
              : t("packageLevelLabel")}
          </span>
          <span className="text-label-m text-neutral-400">
            {createMultiplePackages
              ? t("multiPackageSelectHint")
              : t("packageLevelHint")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(createMultiplePackages
            ? COUPON_PACKAGE_OPTIONS.filter((pkg) => pkg.id !== "Nenhum")
            : COUPON_PACKAGE_OPTIONS
          ).map((pkg) => {
            const pkgKey = toPackageMessageKey(pkg.id);
            const isSelected = createMultiplePackages
              ? selectedBatchPackages.some(
                  (item) => toPackageMessageKey(item) === pkgKey,
                )
              : toPackageMessageKey(packageLevel) === pkgKey;

            return (
              <button
                key={pkg.id}
                type="button"
                aria-pressed={isSelected}
                disabled={isPending}
                onClick={() => {
                  if (createMultiplePackages) {
                    onToggleBatchPackage(pkg.id);
                    return;
                  }
                  onSelectPackageLevel(pkg.id);
                  if (pkg.suggestedMinutes) {
                    onSetBaseDurationMinutes(String(pkg.suggestedMinutes));
                  }
                  if (typeof pkg.suggestedPrice === "number") {
                    onApplySuggestedPrice(pkg.suggestedPrice);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
                  isSelected ? pkg.selectedClass : pkg.unselectedClass,
                  isPending && "opacity-50 cursor-not-allowed",
                )}
              >
                {pkg.dotColor && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      pkg.dotColor,
                    )}
                  />
                )}
                <span>
                  {tOptions(`couponPackages.${pkgKey}`)}
                  {createMultiplePackages &&
                  typeof pkg.suggestedPrice === "number"
                    ? ` • ${pkg.suggestedPrice}`
                    : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {createMultiplePackages ? (
        <div className="p-2.5 rounded-lg bg-card/70 dark:bg-white/5 border border-neutral-700/70 dark:border-white/10 text-label-m text-neutral-300 flex flex-col gap-1.5">
          <span className="font-semibold text-neutral-100">
            {t("multiPackagePreviewTitle", {
              count: selectedBatchPackages.length,
            })}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COUPON_PACKAGE_OPTIONS.filter(
              (pkg) =>
                pkg.id !== "Nenhum" &&
                selectedBatchPackages.some(
                  (item) =>
                    toPackageMessageKey(item) === toPackageMessageKey(pkg.id),
                ),
            ).map((pkg) => (
              <span
                key={pkg.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-neutral-700 dark:border-white/15 text-tiny text-neutral-200 tabular-nums"
              >
                {pkg.suggestedMinutes
                  ? formatFocusMinutes(pkg.suggestedMinutes)
                  : pkg.id}
                {" • "}
                {pkg.suggestedPrice ?? 8}
              </span>
            ))}
          </div>
          <span className="text-tiny text-neutral-400">
            {t("multiPackagePreviewHint")}
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start pt-2 border-t border-neutral-700/40 dark:border-white/5">
            {/* Duração ao lado do Custo */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 min-h-5">
                <label
                  htmlFor="rewardDuration"
                  className="text-body-s text-neutral-100 font-medium"
                >
                  {t("durationLabel")} <span className="text-gold">*</span>
                </label>
              </div>
              <NumberStepperInput
                id="rewardDuration"
                min={5}
                max={1440}
                step={5}
                value={baseDurationMinutes}
                onChange={(e) => onBaseDurationChange(e.target.value)}
                onBlur={() => {
                  if (!baseDurationMinutes || Number(baseDurationMinutes) < 5) {
                    onBaseDurationChange("5");
                  }
                }}
                onStep={(delta) => {
                  const base = Number.isFinite(numericDuration)
                    ? numericDuration
                    : 0;
                  const next = Math.min(1440, Math.max(5, base + delta));
                  onBaseDurationChange(String(next));
                }}
                decrementDisabled={numericDuration <= 5}
                incrementDisabled={numericDuration >= 1440}
                placeholder={t("durationPlaceholder")}
                compact
                icon={<Clock size={16} />}
                aria-describedby={
                  numericDuration >= 60 ? durationHoursHintId : undefined
                }
                className="font-semibold h-[42px]"
                disabled={isPending}
              />
              <DurationHoursBadge
                id={durationHoursHintId}
                minutes={numericDuration}
              />
            </div>

            {/* Custo */}
            <RewardPriceField
              label={isGamified ? t("priceLabel") : t("priceLabelProductivity")}
              value={price}
              onChange={onPriceChange}
              placeholder={t("pricePlaceholder")}
              disabled={isPending}
              hasWarning={hasPriceWarning}
            />
          </div>

          <RewardPriceGuidance
            type={type}
            price={price}
            durationMinutes={baseDurationMinutes}
            packageLevel={packageLevel}
            analysis={priceAnalysis}
            onApplySuggestedPrice={onApplySuggestedPrice}
            disabled={isPending}
          />
        </>
      )}
    </div>
  );
}
