"use client";

import { Check, Gift, Loader2, Package, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  COUPON_PACKAGE_OPTIONS,
  calculateSuggestedCouponPrice,
  REWARD_DESCRIPTION_MAX_LENGTH,
  REWARD_FORM_CATEGORY_OPTIONS,
  REWARD_FORM_TYPE_KEYS,
  REWARD_ICONS,
  REWARD_TYPE_META,
  SINGLE_USE_TIER_OPTIONS,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useRewardForm } from "@/hooks/useRewardForm";
import type {
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";
import { cn } from "@/utils";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";
import { MysteryBoxLootEditor } from "./MysteryBoxLootEditor";
import { MysteryBoxSelector } from "./MysteryBoxSelector";
import { RewardPriceGuidance } from "./RewardPriceGuidance";

interface RewardPriceFieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  guidanceType?: RewardType;
  packageLevel?: PackageLevel;
  onApplySuggestedPrice?: (suggestedPrice: number) => void;
}

function RewardPriceField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
  guidanceType,
  packageLevel,
  onApplySuggestedPrice,
}: RewardPriceFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="rewardPrice"
          className="text-body-s text-neutral-100 font-medium"
        >
          {label} <span className="text-gold">*</span>
        </label>
        {hint && (
          <span className="text-label-m text-amber-700 dark:text-gold font-medium">
            {hint}
          </span>
        )}
      </div>
      <Input
        id="rewardPrice"
        type="number"
        step="any"
        min="0"
        max={99999}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        compact
        icon={<CoinIcon size={16} withGlow />}
        className="font-bold h-[42px]"
        required
        disabled={disabled}
      />
      {guidanceType && (
        <RewardPriceGuidance
          type={guidanceType}
          price={value}
          packageLevel={packageLevel}
          onApplySuggestedPrice={onApplySuggestedPrice}
          disabled={disabled}
        />
      )}
    </div>
  );
}

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: Reward | null;
  existingRewards?: Reward[];
  onSuccess?: (reward: Reward) => void;
}

const MAX_REWARD_TITLE_LENGTH = 30;

export function RewardFormModal({
  isOpen,
  onClose,
  rewardToEdit,
  existingRewards = [],
  onSuccess,
}: RewardFormModalProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const tMystery = useTranslations("rewards.mysteryBox");
  const { isGamified, isProductivity } = useExperienceMode();

  const {
    isEditing,
    isPending,
    title,
    handleTitleChange,
    description,
    setDescription,
    price,
    handlePriceChange,
    applySuggestedPrice,
    type,
    handleTypeChange,
    category,
    setCategory,
    packageLevel,
    setPackageLevel,
    handleMysteryBoxTierSelect,
    baseDurationMinutes,
    setBaseDurationMinutes,
    handleBaseDurationChange,
    selectedIcon,
    handleIconSelect,
    lootItems,
    handleLootSlotChange,
    handleApplyLootPreset,
    handleSubmit,
  } = useRewardForm({
    isOpen,
    rewardToEdit,
    onSuccess,
    onClose,
  });

  const segmentedTypeOptions: SegmentedControlOption<RewardType>[] = useMemo(
    () =>
      REWARD_FORM_TYPE_KEYS.filter(
        (typeKey) =>
          !isProductivity ||
          typeKey !== "MysteryBox" ||
          rewardToEdit?.type === "MysteryBox",
      ).map((typeKey) => {
        const meta = REWARD_TYPE_META[typeKey];
        const Icon = meta?.icon;
        return {
          value: typeKey,
          label: tOptions(`types.${toRewardTypeMessageKey(typeKey)}`),
          icon: Icon,
        };
      }),
    [isProductivity, rewardToEdit?.type, tOptions],
  );

  const categoryOptions = useMemo(
    () =>
      REWARD_FORM_CATEGORY_OPTIONS.map((opt) => ({
        value: opt.value,
        label: tOptions(`categories.${toCategoryMessageKey(opt.value)}`),
      })),
    [tOptions],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      headerIcon={<Gift size={20} />}
      title={isEditing ? t("editTitle") : t("createTitle")}
      description={
        isEditing
          ? isGamified
            ? t("editDescription")
            : t("editDescriptionProductivity")
          : isGamified
            ? t("createDescription")
            : t("createDescriptionProductivity")
      }
      maxWidth="max-w-lg"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 1. SELETOR DE TIPO NO TOPO (SegmentedControl) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-body-s text-neutral-100 font-medium select-none">
            {t("typeLabel")} <span className="text-gold">*</span>
          </span>
          <SegmentedControl<RewardType>
            options={segmentedTypeOptions}
            value={type}
            onChange={(val) => handleTypeChange(val)}
            disabled={isPending}
            size="md"
          />
          {isProductivity && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface/50 border border-primary/20 text-xs text-neutral-300 mt-1">
              <Package size={15} className="text-gold shrink-0" />
              <span>{t("mysteryBoxAdventureHint")}</span>
            </div>
          )}
        </div>

        {/* 2. NOME DA RECOMPENSA E ÍCONE */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rewardTitle"
              className="text-body-s text-neutral-100 font-medium select-none"
            >
              {t("titleLabel")} <span className="text-gold">*</span>
            </label>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors",
                title.length >= MAX_REWARD_TITLE_LENGTH
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {title.length}/{MAX_REWARD_TITLE_LENGTH}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={REWARD_ICONS}
              value={selectedIcon}
              onChange={handleIconSelect}
              disabled={isPending}
              title={t("iconPickerTitle")}
            />
            <Input
              id="rewardTitle"
              type="text"
              value={title}
              onChange={(e) =>
                handleTitleChange(
                  e.target.value.slice(0, MAX_REWARD_TITLE_LENGTH),
                )
              }
              placeholder={t("titlePlaceholder")}
              compact
              className="h-[42px]"
              required
              maxLength={MAX_REWARD_TITLE_LENGTH}
              disabled={isPending}
            />
          </div>
          <span className="text-label-g text-neutral-400">
            {t("iconHelperText")}
          </span>
        </div>

        {/* 3. DESCRIÇÃO (LOGO ABAIXO DO NOME/TÍTULO COM CONTADOR CONDICIONAL PADRÃO TASK) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rewardDescription"
              className="text-body-s text-neutral-100 font-medium select-none"
            >
              {t("descriptionLabel")}
            </label>
            <DescriptionCharCounter
              length={description.length}
              max={REWARD_DESCRIPTION_MAX_LENGTH}
            />
          </div>
          <Textarea
            id="rewardDescription"
            rows={2}
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value.slice(0, REWARD_DESCRIPTION_MAX_LENGTH),
              )
            }
            placeholder={t("descriptionPlaceholder")}
            compact
            maxLength={REWARD_DESCRIPTION_MAX_LENGTH}
            disabled={isPending}
          />
        </div>

        {/* 4. BLOCO DE CUSTO E DURAÇÃO (VALOR NÃO FICA ESCONDIDO EM ÚLTIMO) */}
        {type === "TimeBased" ? (
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Duração ao lado do Custo */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="rewardDuration"
                  className="text-body-s text-neutral-100 font-medium"
                >
                  {t("durationLabel")} <span className="text-gold">*</span>
                </label>
                <Input
                  id="rewardDuration"
                  type="number"
                  min={5}
                  max={1440}
                  step={5}
                  value={baseDurationMinutes}
                  onChange={(e) => handleBaseDurationChange(e.target.value)}
                  onBlur={() => {
                    if (
                      !baseDurationMinutes ||
                      Number(baseDurationMinutes) < 5
                    ) {
                      handleBaseDurationChange("5");
                    }
                  }}
                  placeholder={t("durationPlaceholder")}
                  compact
                  className="font-semibold h-[42px]"
                  disabled={isPending}
                />
              </div>

              {/* Custo */}
              <RewardPriceField
                label={
                  isGamified ? t("priceLabel") : t("priceLabelProductivity")
                }
                value={price}
                onChange={handlePriceChange}
                placeholder={t("pricePlaceholder")}
                disabled={isPending}
              />
            </div>

            <RewardPriceGuidance
              type={type}
              price={price}
              durationMinutes={baseDurationMinutes}
              packageLevel={packageLevel}
              onApplySuggestedPrice={applySuggestedPrice}
              disabled={isPending}
            />

            {/* Chips de Pacote / Atalhos de Tempo */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-body-s text-neutral-100 font-medium">
                  {t("packageLevelLabel")}
                </span>
                <span className="text-label-m text-neutral-400">
                  {t("packageLevelHint")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COUPON_PACKAGE_OPTIONS.map((pkg) => {
                  const isSelected =
                    packageLevel === pkg.id ||
                    (pkg.id === "Nenhum" &&
                      (!packageLevel ||
                        packageLevel === "NONE" ||
                        packageLevel === "Nenhum"));

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isPending}
                      onClick={() => {
                        setPackageLevel(pkg.id);
                        if (pkg.suggestedMinutes) {
                          setBaseDurationMinutes(String(pkg.suggestedMinutes));
                        }
                        if (typeof pkg.suggestedPrice === "number") {
                          applySuggestedPrice(pkg.suggestedPrice);
                        } else {
                          const proportionalPrice =
                            calculateSuggestedCouponPrice(
                              Number(baseDurationMinutes) || 30,
                            );
                          applySuggestedPrice(proportionalPrice);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
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
                        {tOptions(
                          `couponPackages.${toPackageMessageKey(pkg.id)}`,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : type === "SingleUse" ? (
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
            {/* Custo */}
            <RewardPriceField
              label={isGamified ? t("priceLabel") : t("priceLabelProductivity")}
              value={price}
              onChange={handlePriceChange}
              placeholder={t("pricePlaceholder")}
              disabled={isPending}
              guidanceType={type}
            />

            {/* Atalhos opcionais de horizonte temporal para Uso Único */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-body-s text-neutral-100 font-medium">
                  {t("singleUseTiersLabel")}
                </span>
                <span className="text-label-m text-neutral-400">
                  {t("singleUseTiersHint")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SINGLE_USE_TIER_OPTIONS.map((tier) => {
                  const isSelected =
                    Number.parseFloat(price.replace(",", ".")) ===
                    tier.suggestedPrice;

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={isPending}
                      onClick={() => applySuggestedPrice(tier.suggestedPrice)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
                        isSelected ? tier.selectedClass : tier.unselectedClass,
                        isPending && "opacity-50 cursor-not-allowed",
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
          </div>
        ) : (
          /* MysteryBox: Custo em destaque seguido por Seletor e Editor de Prêmios */
          <div className="flex flex-col gap-3">
            <RewardPriceField
              label={isGamified ? t("priceLabel") : t("priceLabelProductivity")}
              hint={t("suggestedPriceByRarity")}
              value={price}
              onChange={handlePriceChange}
              placeholder={t("pricePlaceholder")}
              disabled={isPending}
              guidanceType={type}
              packageLevel={packageLevel}
              onApplySuggestedPrice={applySuggestedPrice}
            />

            <MysteryBoxSelector
              selectedLevel={packageLevel}
              onSelect={(tier) =>
                handleMysteryBoxTierSelect(
                  tier.id,
                  tier.recommendedPrice,
                  tMystery(`tiers.${tier.backendPackageLevel}.name`),
                )
              }
              disabled={isPending}
            />
            <MysteryBoxLootEditor
              packageLevel={packageLevel}
              lootItems={lootItems}
              onChangeSlot={handleLootSlotChange}
              onApplyPreset={handleApplyLootPreset}
              existingRewards={existingRewards}
              disabled={isPending}
            />
          </div>
        )}

        {/* 5. CLASSIFICAÇÃO (CATEGORIA COMO TAG) NO FIM */}
        <div className="flex flex-col gap-3 pt-1 border-t border-neutral-700/50 dark:border-white/5">
          <Select
            id="rewardCategory"
            label={t("categoryLabel")}
            value={category}
            onChange={(val) => setCategory(val as RewardCategory)}
            options={categoryOptions}
            disabled={isPending}
            compact
            triggerClassName="h-[42px]"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-neutral-700 dark:border-white/10 mt-1 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <X size={14} />
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="animate-spin text-on-gold" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{isEditing ? t("saveChanges") : t("saveReward")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
