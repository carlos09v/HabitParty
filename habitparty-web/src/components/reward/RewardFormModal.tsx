"use client";

import { Check, Gift, Info, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { RewardGroupPackagesEditor } from "@/components/reward/form/RewardGroupPackagesEditor";
import {
  type MysteryBoxFormTab,
  RewardMysteryBoxSection,
} from "@/components/reward/form/RewardMysteryBoxSection";
import { RewardSingleUseSection } from "@/components/reward/form/RewardSingleUseSection";
import { RewardTimeBasedSection } from "@/components/reward/form/RewardTimeBasedSection";
import { RewardTypeSelector } from "@/components/reward/form/RewardTypeSelector";
import { BaseModal } from "@/components/ui/BaseModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  REWARD_DESCRIPTION_MAX_LENGTH,
  REWARD_FORM_CATEGORY_VALUES,
  REWARD_ICONS,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardPrefillDraft } from "@/hooks/useRewardCatalogActions";
import { useRewardForm } from "@/hooks/useRewardForm";
import type {
  Reward,
  RewardCategory,
  RewardGroupContext,
} from "@/types/reward";
import { cn } from "@/utils";
import { analyzeRewardPrice, parseLocalizedPrice } from "@/utils/rewardEconomy";
import { MAX_REWARD_TITLE_LENGTH } from "@/utils/rewardFormHelpers";
import {
  toCategoryMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: Reward | null;
  groupToEdit?: (RewardGroupContext & { activeVariantId?: string }) | null;
  prefillDraft?: RewardPrefillDraft | null;
  existingRewards?: Reward[];
  restrictToDebtOnly?: boolean;
  onSuccess?: (reward: Reward | Reward[]) => void;
  onGroupSuccess?: (sourceIds: string[], savedRewards: Reward[]) => void;
}

export function RewardFormModal({
  isOpen,
  onClose,
  rewardToEdit,
  groupToEdit,
  prefillDraft,
  existingRewards = [],
  restrictToDebtOnly = false,
  onSuccess,
  onGroupSuccess,
}: RewardFormModalProps) {
  const t = useTranslations("rewards.formModal");
  const tOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode();

  const {
    isEditing,
    isEditingGroup,
    isPending,
    isDirty,
    groupTierUsage,
    canCreateMultiplePackages,
    groupVariants,
    removedGroupVariantsCount,
    handleAddGroupVariant,
    handleUpdateGroupVariant,
    handleRemoveGroupVariant,
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
    handleCategoryChange,
    handleDebtToggleChange,
    packageLevel,
    setPackageLevel,
    handleSingleUseTierSelect,
    handleMysteryBoxTierSelect,
    baseDurationMinutes,
    setBaseDurationMinutes,
    handleBaseDurationChange,
    createMultiplePackages,
    setCreateMultiplePackages,
    selectedBatchPackages,
    toggleBatchPackage,
    selectedIcon,
    handleIconSelect,
    lootItems,
    handleLootSlotChange,
    handleApplyLootPreset,
    handleSubmit,
  } = useRewardForm({
    isOpen,
    rewardToEdit,
    groupToEdit,
    prefillDraft,
    existingRewards,
    restrictToDebtOnly,
    onSuccess,
    onGroupSuccess,
    onClose,
  });

  const categoryOptions = useMemo(
    () =>
      REWARD_FORM_CATEGORY_VALUES.map((cat) => ({
        value: cat,
        label: tOptions(`categories.${toCategoryMessageKey(cat)}`),
      })),
    [tOptions],
  );

  const priceAnalysis = useMemo(() => {
    const numericPrice = parseLocalizedPrice(price) || 0;
    const numericDuration =
      Number.parseInt(baseDurationMinutes || "30", 10) || 30;
    return analyzeRewardPrice({
      type,
      price: numericPrice,
      durationMinutes: numericDuration,
      packageLevel,
      category,
    });
  }, [type, price, baseDurationMinutes, packageLevel, category]);

  const hasPriceWarning = priceAnalysis.status !== "ok";
  const resolvedTypeKey = toRewardTypeMessageKey(type);
  const isMysteryBox = resolvedTypeKey === "MysteryBox";
  const [activeMysteryTab, setActiveMysteryTab] =
    useState<MysteryBoxFormTab>("identity");
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const mysterySlotInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) {
      setIsDiscardConfirmOpen(false);
      return;
    }
    setActiveMysteryTab("identity");
    const frameId = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen]);

  const handleRequestClose = () => {
    if (isPending) return;
    if (isDirty) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    onClose();
  };

  // Evita que campos obrigatórios na aba oculta bloqueiem o submit silenciosamente
  const handleFormSubmit = (e: React.FormEvent) => {
    if (!isMysteryBox) {
      handleSubmit(e);
      return;
    }

    if (!title.trim()) {
      setActiveMysteryTab("identity");
      window.requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
      handleSubmit(e);
      return;
    }

    const numericPrice = parseLocalizedPrice(price);
    if (
      Number.isNaN(numericPrice) ||
      numericPrice <= 0 ||
      numericPrice > 99999
    ) {
      setActiveMysteryTab("identity");
      if (numericPrice > 99999) {
        e.preventDefault();
        window.requestAnimationFrame(() => {
          priceInputRef.current?.focus();
          priceInputRef.current?.reportValidity();
        });
        return;
      }
      window.requestAnimationFrame(() => {
        priceInputRef.current?.focus();
      });
      handleSubmit(e);
      return;
    }

    if (packageLevel === "Nenhum" || packageLevel === "NONE") {
      setActiveMysteryTab("identity");
      handleSubmit(e);
      return;
    }

    const emptySlotIndex = lootItems.findIndex((item) => !item.name.trim());
    if (emptySlotIndex !== -1) {
      e.preventDefault();
      setActiveMysteryTab("loot");
      window.requestAnimationFrame(() => {
        const slotInput = mysterySlotInputRefs.current[emptySlotIndex];
        slotInput?.focus();
        slotInput?.reportValidity();
      });
      return;
    }

    handleSubmit(e);
  };

  const titlePlaceholder =
    resolvedTypeKey === "TimeBased"
      ? t("titlePlaceholderTimeBased")
      : resolvedTypeKey === "MysteryBox"
        ? isGamified
          ? t("titlePlaceholderMysteryBox")
          : t("titlePlaceholderMysteryBoxProductivity")
        : t("titlePlaceholderSingleUse");

  const titleField = (
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
          ref={titleInputRef}
          id="rewardTitle"
          type="text"
          value={title}
          onChange={(e) =>
            handleTitleChange(e.target.value.slice(0, MAX_REWARD_TITLE_LENGTH))
          }
          placeholder={titlePlaceholder}
          compact
          className="h-[42px]"
          required
          maxLength={MAX_REWARD_TITLE_LENGTH}
          disabled={isPending}
        />
      </div>
    </div>
  );

  const descriptionField = (
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
          setDescription(e.target.value.slice(0, REWARD_DESCRIPTION_MAX_LENGTH))
        }
        placeholder={t("descriptionPlaceholder")}
        compact
        maxLength={REWARD_DESCRIPTION_MAX_LENGTH}
        disabled={isPending}
      />
    </div>
  );

  const isDebtCategory = toCategoryMessageKey(category) === "DEBT";

  const categoryField = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 min-h-5">
        <label
          htmlFor="rewardCategory"
          className="font-medium text-neutral-100 select-none text-body-s"
        >
          {t("categoryLabel")}
        </label>
        <InfoTooltip
          title={t("categoryTooltipTitle")}
          icon={<Info size={14} className="text-gold shrink-0" />}
          size={14}
          align="left"
          side="top"
          ariaLabel={t("categoryTooltipAria")}
        >
          <p className="text-neutral-300 leading-relaxed text-label-g">
            {t("categoryTooltipIntro")}
          </p>
          <ul className="flex flex-col gap-1.5 text-label-g text-neutral-200 leading-relaxed">
            <li>
              •{" "}
              <strong className="text-emerald-700 dark:text-emerald-300">
                {t("categoryTooltipConstructiveTitle")}
              </strong>{" "}
              {t("categoryTooltipConstructiveDesc")}
            </li>
            <li className="pl-2 text-neutral-300 italic">
              {t("categoryTooltipHybridTip")}
            </li>
            <li>
              •{" "}
              <strong className="text-amber-700 dark:text-amber-300">
                {t("categoryTooltipEntertainmentTitle")}
              </strong>{" "}
              {t("categoryTooltipEntertainmentDesc")}
            </li>
            <li>
              •{" "}
              <strong className="text-neutral-100">
                {t("categoryTooltipStandardTitle")}
              </strong>{" "}
              {t("categoryTooltipStandardDesc")}
            </li>
          </ul>
        </InfoTooltip>
      </div>
      <Select
        id="rewardCategory"
        aria-label={t("categoryLabel")}
        value={category}
        onChange={(val) => handleCategoryChange(val as RewardCategory)}
        options={categoryOptions}
        disabled={isPending}
        compact
        triggerClassName="h-[42px]"
      />
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleRequestClose}
        headerIcon={<Gift size={20} />}
        title={
          isEditingGroup
            ? t("editGroupTitle")
            : isEditing
              ? t("editTitle")
              : t("createTitle")
        }
        description={
          isEditingGroup
            ? t("editGroupDescription")
            : isEditing
              ? isGamified
                ? t("editDescription")
                : t("editDescriptionProductivity")
              : isGamified
                ? t("createDescription")
                : t("createDescriptionProductivity")
        }
        maxWidth="max-w-3xl"
        className="sm:p-5"
        preventClose={isPending}
      >
        <form
          onSubmit={handleFormSubmit}
          noValidate={isMysteryBox}
          className="flex flex-col gap-3"
        >
          <RewardTypeSelector
            value={type}
            resolvedTypeKey={resolvedTypeKey}
            isGamified={isGamified}
            disabled={isPending || isEditingGroup || restrictToDebtOnly}
            onChange={(val) => {
              handleTypeChange(val);
              setActiveMysteryTab("identity");
            }}
          />

          {isMysteryBox ? (
            <RewardMysteryBoxSection
              activeMysteryTab={activeMysteryTab}
              onTabChange={setActiveMysteryTab}
              isGamified={isGamified}
              isPending={isPending}
              type={type}
              price={price}
              onPriceChange={handlePriceChange}
              priceInputRef={priceInputRef}
              hasPriceWarning={hasPriceWarning}
              packageLevel={packageLevel}
              priceAnalysis={priceAnalysis}
              onApplySuggestedPrice={applySuggestedPrice}
              onSelectMysteryTier={handleMysteryBoxTierSelect}
              lootItems={lootItems}
              onChangeSlot={handleLootSlotChange}
              onApplyPreset={handleApplyLootPreset}
              existingRewards={existingRewards}
              slotInputRefs={mysterySlotInputRefs}
              titleField={titleField}
              descriptionField={descriptionField}
              categoryField={categoryField}
            />
          ) : (
            /* LAYOUT EM 2 COLUNAS NO DESKTOP PARA USO ÚNICO E CUPOM DE TEMPO */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* COLUNA ESQUERDA: IDENTIDADE & CATEGORIA */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {titleField}
                {descriptionField}
                {(resolvedTypeKey === "TimeBased" || !isDebtCategory) &&
                  categoryField}
              </div>

              {/* COLUNA DIREITA: ECONOMIA & REGRAS */}
              <div className="md:col-span-7 flex flex-col gap-3">
                {isEditingGroup ? (
                  <RewardGroupPackagesEditor
                    type={type}
                    category={category}
                    isGamified={isGamified}
                    isPending={isPending}
                    variants={groupVariants}
                    removedCount={removedGroupVariantsCount}
                    onAddVariant={handleAddGroupVariant}
                    onUpdateVariant={handleUpdateGroupVariant}
                    onRemoveVariant={handleRemoveGroupVariant}
                  />
                ) : resolvedTypeKey === "TimeBased" ? (
                  <RewardTimeBasedSection
                    isEditing={isEditing}
                    isPending={isPending}
                    isGamified={isGamified}
                    type={type}
                    category={category}
                    createMultiplePackages={createMultiplePackages}
                    canCreateMultiplePackages={canCreateMultiplePackages}
                    onCreateMultiplePackagesChange={setCreateMultiplePackages}
                    selectedBatchPackages={selectedBatchPackages}
                    onToggleBatchPackage={toggleBatchPackage}
                    packageLevel={packageLevel}
                    onSelectPackageLevel={setPackageLevel}
                    usedPackageKeys={groupTierUsage.usedPackageKeys}
                    existingGroupCount={groupTierUsage.matchingCount}
                    baseDurationMinutes={baseDurationMinutes}
                    onSetBaseDurationMinutes={setBaseDurationMinutes}
                    onBaseDurationChange={handleBaseDurationChange}
                    price={price}
                    onPriceChange={handlePriceChange}
                    hasPriceWarning={hasPriceWarning}
                    priceAnalysis={priceAnalysis}
                    onApplySuggestedPrice={applySuggestedPrice}
                  />
                ) : (
                  <RewardSingleUseSection
                    isDebtCategory={isDebtCategory}
                    isDebtToggleDisabled={restrictToDebtOnly}
                    category={category}
                    isGamified={isGamified}
                    isPending={isPending}
                    type={type}
                    packageLevel={packageLevel}
                    usedPackageKeys={groupTierUsage.usedPackageKeys}
                    price={price}
                    onPriceChange={handlePriceChange}
                    hasPriceWarning={hasPriceWarning}
                    priceAnalysis={priceAnalysis}
                    onApplySuggestedPrice={applySuggestedPrice}
                    onSingleUseTierSelect={handleSingleUseTierSelect}
                    onDebtToggleChange={handleDebtToggleChange}
                  />
                )}
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-neutral-700 dark:border-white/10 pt-3">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isPending}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg text-xs font-semibold text-neutral-300 hover:text-neutral-50 hover:bg-surface dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <X size={14} />
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
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

      <ConfirmationModal
        isOpen={isDiscardConfirmOpen}
        onClose={() => setIsDiscardConfirmOpen(false)}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          onClose();
        }}
        title={t("discardChanges.title")}
        description={t("discardChanges.description")}
        confirmText={t("discardChanges.confirmText")}
        cancelText={t("discardChanges.cancelText")}
        variant="warning"
      />
    </>
  );
}
