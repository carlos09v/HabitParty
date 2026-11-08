"use client";

import { Check, Gift, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  COUPON_PACKAGE_OPTIONS,
  calculateSuggestedCouponPrice,
  REWARD_FORM_CATEGORY_OPTIONS,
  REWARD_FORM_TYPE_KEYS,
  REWARD_ICONS,
  REWARD_TYPE_META,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useRewardForm } from "@/hooks/useRewardForm";
import type { Reward, RewardCategory, RewardType } from "@/types/reward";
import { cn } from "@/utils";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";
import { MysteryBoxLootEditor } from "./MysteryBoxLootEditor";
import { MysteryBoxSelector } from "./MysteryBoxSelector";

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
    setPrice,
    type,
    handleTypeChange,
    category,
    setCategory,
    packageLevel,
    setPackageLevel,
    handleMysteryBoxTierSelect,
    baseDurationMinutes,
    setBaseDurationMinutes,
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

  const rewardTypeOptions = useMemo(
    () =>
      REWARD_FORM_TYPE_KEYS.filter(
        (typeKey) =>
          !isProductivity ||
          typeKey !== "MysteryBox" ||
          rewardToEdit?.type === "MysteryBox",
      ).map((typeKey) => {
        const meta = REWARD_TYPE_META[typeKey];
        const Icon = meta?.icon;
        const iconColorClass =
          typeKey === "TimeBased"
            ? "text-emerald-600 dark:text-emerald-400"
            : typeKey === "SingleUse"
              ? "text-primary dark:text-purple-400"
              : "text-amber-600 dark:text-gold";
        return {
          value: typeKey,
          label: tOptions(`types.${toRewardTypeMessageKey(typeKey)}`),
          icon: Icon ? (
            <Icon size={15} className={cn("shrink-0", iconColorClass)} />
          ) : undefined,
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
        {/* Nome da Recompensa e Ícone Integrados */}
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

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rewardDescription"
              className="text-body-s text-neutral-100 font-medium select-none"
            >
              {t("descriptionLabel")}
            </label>
            <span
              className={cn(
                "text-tiny tabular-nums transition-colors",
                description.length >= 120
                  ? "text-gold font-semibold"
                  : "text-neutral-400",
              )}
            >
              {description.length}/120
            </span>
          </div>
          <Textarea
            id="rewardDescription"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 120))}
            placeholder={t("descriptionPlaceholder")}
            compact
            maxLength={120}
            disabled={isPending}
          />
        </div>

        {/* Linha dupla: Tipo de Recompensa e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="rewardType"
            label={
              <span>
                {t("typeLabel")} <span className="text-gold">*</span>
              </span>
            }
            value={type}
            onChange={(val) => handleTypeChange(val as RewardType)}
            options={rewardTypeOptions}
            disabled={isPending}
            compact
            triggerClassName="h-[42px]"
          />

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

        {/* 4 Caixas Gamificadas + Editor de Prêmios da Caixa Misteriosa */}
        {type === "MysteryBox" && (
          <>
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
          </>
        )}

        {/* Seção Condicional se for TimeBased (Cupom - Opção C) */}
        {type === "TimeBased" && (
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rewardDuration"
                  className="text-body-s text-neutral-100 font-medium"
                >
                  {t("durationLabel")} <span className="text-gold">*</span>
                </label>
                <span className="text-label-m text-neutral-400">
                  {t("durationHint")}
                </span>
              </div>
              <Input
                id="rewardDuration"
                type="number"
                min={5}
                max={1440}
                step={5}
                value={baseDurationMinutes}
                onChange={(e) => setBaseDurationMinutes(e.target.value)}
                onBlur={() => {
                  if (!baseDurationMinutes || Number(baseDurationMinutes) < 5) {
                    setBaseDurationMinutes("5");
                  }
                }}
                placeholder={t("durationPlaceholder")}
                compact
                className="font-semibold h-[42px]"
                disabled={isPending}
              />
            </div>

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
                          setPrice(String(pkg.suggestedPrice));
                        } else {
                          const proportionalPrice =
                            calculateSuggestedCouponPrice(
                              Number(baseDurationMinutes) || 30,
                            );
                          setPrice(String(proportionalPrice));
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
        )}

        {/* Custo em Moedas/Créditos */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rewardPrice"
              className="text-body-s text-neutral-100 font-medium"
            >
              {isGamified ? t("priceLabel") : t("priceLabelProductivity")}{" "}
              <span className="text-gold">*</span>
            </label>
            {type === "MysteryBox" && (
              <span className="text-label-m text-amber-700 dark:text-gold font-medium">
                {t("suggestedPriceByRarity")}
              </span>
            )}
          </div>
          <Input
            id="rewardPrice"
            type="number"
            step="any"
            min="0"
            max={99999}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("pricePlaceholder")}
            compact
            icon={<CoinIcon size={16} withGlow />}
            className="font-bold h-[42px]"
            required
            disabled={isPending}
          />
          {type === "MysteryBox" && (
            <span className="text-label-m text-neutral-400">
              {t("mysteryBoxPriceHelper")}
            </span>
          )}
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
