"use client";

import {
  ArrowRight,
  Check,
  Clock,
  FileText,
  Gift,
  Info,
  Loader2,
  Package,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { DescriptionCharCounter } from "@/components/ui/DescriptionCharCounter";
import { DurationHoursBadge } from "@/components/ui/DurationHoursBadge";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/Input";
import { NumberStepperInput } from "@/components/ui/NumberStepperInput";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";
import {
  COUPON_PACKAGE_OPTIONS,
  getMysteryBadgeVariantClass,
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
  analyzeRewardPrice,
  type RewardPriceAnalysis,
} from "@/utils/rewardEconomy";
import {
  getMysteryBoxTier,
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
  hasWarning?: boolean;
  guidanceType?: RewardType;
  packageLevel?: PackageLevel;
  priceAnalysis?: RewardPriceAnalysis;
  onApplySuggestedPrice?: (suggestedPrice: number) => void;
}

function RewardPriceField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  disabled,
  hasWarning = false,
  guidanceType,
  packageLevel,
  priceAnalysis,
  onApplySuggestedPrice,
}: RewardPriceFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 min-h-5">
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
        min="0.01"
        max={99999}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        compact
        icon={<CoinIcon size={16} withGlow />}
        className={cn(
          "font-bold h-[42px]",
          hasWarning &&
            "border-amber-500/60 focus:border-amber-500 dark:border-amber-400/50 dark:focus:border-amber-400",
        )}
        required
        disabled={disabled}
      />
      {guidanceType && (
        <RewardPriceGuidance
          type={guidanceType}
          price={value}
          packageLevel={packageLevel}
          analysis={priceAnalysis}
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
type MysteryBoxFormTab = "identity" | "loot";

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
    handleCategoryChange,
    handleDebtToggleChange,
    packageLevel,
    setPackageLevel,
    handleSingleUseTierSelect,
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

  const priceAnalysis = useMemo(() => {
    const numericPrice = Number.parseFloat(price.replace(",", ".")) || 0;
    const numericDuration =
      Number.parseInt(baseDurationMinutes || "30", 10) || 30;
    return analyzeRewardPrice({
      type,
      price: numericPrice,
      durationMinutes: numericDuration,
      packageLevel,
    });
  }, [type, price, baseDurationMinutes, packageLevel]);

  const hasPriceWarning = priceAnalysis.status !== "ok";
  const resolvedTypeKey = toRewardTypeMessageKey(type);
  const isMysteryBox = resolvedTypeKey === "MysteryBox";
  const [activeMysteryTab, setActiveMysteryTab] =
    useState<MysteryBoxFormTab>("identity");
  const mysteryTabBaseId = useId();
  const durationHoursHintId = useId();
  const typeGuideId = useId();
  const mysteryTabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveMysteryTab("identity");
    }
  }, [isOpen]);

  const mysteryTabs = useMemo(
    () => [
      {
        id: "identity" as const,
        label: t("mysteryTabIdentity"),
        icon: FileText,
      },
      {
        id: "loot" as const,
        label: t("mysteryTabPrizes"),
        icon: SlidersHorizontal,
        badge: t("mysteryTabPrizesBadge", { count: lootItems.length }),
      },
    ],
    [t, lootItems.length],
  );

  const handleMysteryTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % mysteryTabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + mysteryTabs.length) % mysteryTabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = mysteryTabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const targetTab = mysteryTabs[nextIndex];
      setActiveMysteryTab(targetTab.id);
      mysteryTabRefs.current[nextIndex]?.focus();
    }
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
        document.getElementById("rewardTitle")?.focus();
      });
      handleSubmit(e);
      return;
    }

    const numericPrice = Number.parseFloat(price.replace(",", "."));
    if (
      Number.isNaN(numericPrice) ||
      numericPrice <= 0 ||
      numericPrice > 99999
    ) {
      setActiveMysteryTab("identity");
      if (numericPrice > 99999) {
        e.preventDefault();
        window.requestAnimationFrame(() => {
          const priceInput = document.getElementById(
            "rewardPrice",
          ) as HTMLInputElement | null;
          priceInput?.focus();
          priceInput?.reportValidity();
        });
        return;
      }
      window.requestAnimationFrame(() => {
        document.getElementById("rewardPrice")?.focus();
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
        const slotInput = document.getElementById(
          `mystery-slot-name-${emptySlotIndex}`,
        ) as HTMLInputElement | null;
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
        ? t("titlePlaceholderMysteryBox")
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
  const numericDuration = Number.parseInt(baseDurationMinutes || "0", 10) || 0;
  const activeTier = getMysteryBoxTier(packageLevel);

  const categoryField = (
    <div className="flex flex-col gap-1.5">
      <Select
        id="rewardCategory"
        label={t("categoryLabel")}
        value={category}
        onChange={(val) => handleCategoryChange(val as RewardCategory)}
        options={categoryOptions}
        disabled={isPending}
        compact
        triggerClassName="h-[42px]"
      />
    </div>
  );

  const typeGuideConfig =
    resolvedTypeKey === "TimeBased"
      ? {
          icon: Ticket,
          badgeClass:
            "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
          containerClass:
            "bg-emerald-500/[0.06] border-emerald-500/25 dark:bg-emerald-500/10 dark:border-emerald-500/25",
          title: t("typeGuides.TimeBased.title"),
          description: isGamified
            ? t("typeGuides.TimeBased.descriptionGamified")
            : t("typeGuides.TimeBased.descriptionProductivity"),
        }
      : resolvedTypeKey === "MysteryBox"
        ? {
            icon: Sparkles,
            badgeClass:
              "bg-amber-500/15 text-amber-700 border-amber-500/35 dark:text-gold",
            containerClass:
              "bg-amber-500/[0.06] border-amber-500/25 dark:bg-gold/10 dark:border-gold/25",
            title: t("typeGuides.MysteryBox.title"),
            description: t("typeGuides.MysteryBox.description"),
          }
        : {
            icon: Zap,
            badgeClass:
              "bg-purple-500/15 text-purple-700 border-purple-500/30 dark:text-purple-300",
            containerClass:
              "bg-purple-500/[0.06] border-purple-500/25 dark:bg-primary/10 dark:border-primary/30",
            title: t("typeGuides.SingleUse.title"),
            description: isGamified
              ? t("typeGuides.SingleUse.descriptionGamified")
              : t("typeGuides.SingleUse.descriptionProductivity"),
          };

  const GuideIcon = typeGuideConfig.icon;

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
      maxWidth="max-w-3xl"
      className="sm:p-5"
      preventClose={isPending}
    >
      <form
        onSubmit={handleFormSubmit}
        noValidate={isMysteryBox}
        className="flex flex-col gap-3"
      >
        {/* 1. SELETOR DE TIPO NO TOPO + EXPLICAÇÃO COMPACTA */}
        <fieldset
          aria-describedby={typeGuideId}
          className="border-0 p-0 m-0 min-w-0"
        >
          <legend className="text-body-s text-neutral-100 font-medium select-none mb-1.5 p-0">
            {t("typeLabel")} <span className="text-gold">*</span>
          </legend>
          <div className="flex flex-col gap-1.5">
            <SegmentedControl<RewardType>
              options={segmentedTypeOptions}
              value={type}
              onChange={(val) => {
                handleTypeChange(val);
                setActiveMysteryTab("identity");
              }}
              disabled={isPending}
              size="md"
              ariaLabel={t("typeLabel")}
            />

            <div
              id={typeGuideId}
              className={cn(
                "flex items-start sm:items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors",
                typeGuideConfig.containerClass,
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0",
                  typeGuideConfig.badgeClass,
                )}
                aria-hidden="true"
              >
                <GuideIcon size={12} />
              </span>
              <p className="text-label-g text-neutral-300 leading-snug min-w-0">
                <strong className="font-bold text-neutral-100">
                  {typeGuideConfig.title}
                </strong>
                {" · "}
                <span>{typeGuideConfig.description}</span>
              </p>
            </div>

            {isProductivity && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface/50 border border-primary/20 text-label-g text-neutral-300">
                <Package size={14} className="text-gold shrink-0" />
                <span>{t("mysteryBoxAdventureHint")}</span>
              </div>
            )}
          </div>
        </fieldset>

        {isMysteryBox ? (
          /* MODO EM 2 ABAS PARA MYSTERY BOX */
          <div className="flex flex-col gap-3">
            <div
              role="tablist"
              aria-label={t("mysteryTabsAria")}
              className="grid grid-cols-2 border-b border-neutral-700 dark:border-white/10"
            >
              {mysteryTabs.map((tab, index) => {
                const isSelected = activeMysteryTab === tab.id;
                const TabIcon = tab.icon;
                const tabId = `${mysteryTabBaseId}-tab-${tab.id}`;
                const panelId = `${mysteryTabBaseId}-panel-${tab.id}`;

                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      mysteryTabRefs.current[index] = el;
                    }}
                    type="button"
                    role="tab"
                    id={tabId}
                    aria-selected={isSelected}
                    aria-controls={panelId}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setActiveMysteryTab(tab.id)}
                    onKeyDown={(e) => handleMysteryTabKeyDown(e, index)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer select-none rounded-t-lg -mb-px border-b-2",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-primary text-primary bg-primary/10 dark:border-gold dark:text-gold dark:bg-gold/10 font-bold"
                        : "border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-surface/60 dark:hover:text-neutral-200 dark:hover:bg-white/5",
                    )}
                  >
                    <TabIcon
                      size={14}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={cn(
                          "text-tiny px-1.5 py-0.5 rounded-full border leading-none tabular-nums shrink-0",
                          isSelected
                            ? "bg-primary/15 border-primary/35 text-primary dark:bg-gold/20 dark:border-gold/40 dark:text-gold"
                            : "bg-surface border-neutral-700 text-neutral-300 dark:bg-white/5 dark:border-white/10 dark:text-neutral-400",
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ABA 1: DADOS, CUSTO, RARIDADE & PREVIEW DOS PRÊMIOS */}
            <div
              role="tabpanel"
              id={`${mysteryTabBaseId}-panel-identity`}
              aria-labelledby={`${mysteryTabBaseId}-tab-identity`}
              hidden={activeMysteryTab !== "identity"}
              className={activeMysteryTab !== "identity" ? "hidden" : undefined}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {/* COLUNA ESQUERDA: NOME, DESCRIÇÃO & CUSTO */}
                <div className="flex flex-col gap-3">
                  {titleField}
                  {descriptionField}

                  <div className="p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
                    <RewardPriceField
                      label={
                        isGamified
                          ? t("priceLabel")
                          : t("priceLabelProductivity")
                      }
                      hint={t("suggestedPriceByRarity")}
                      value={price}
                      onChange={handlePriceChange}
                      placeholder={t("pricePlaceholder")}
                      disabled={isPending}
                      hasWarning={hasPriceWarning}
                      guidanceType={type}
                      packageLevel={packageLevel}
                      priceAnalysis={priceAnalysis}
                      onApplySuggestedPrice={applySuggestedPrice}
                    />
                  </div>
                </div>

                {/* COLUNA DIREITA: RARIDADE (2x2), PREVIEW DOS PRÊMIOS & CATEGORIA */}
                <div className="flex flex-col gap-3">
                  <MysteryBoxSelector
                    layout="2x2"
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

                  <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-tiny font-bold text-neutral-200">
                        {t("mysteryLootPreviewLabel")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveMysteryTab("loot")}
                        className="inline-flex items-center gap-1 text-tiny font-bold text-primary dark:text-gold hover:underline cursor-pointer"
                      >
                        <span>{t("mysteryCustomizeLootCta")}</span>
                        <ArrowRight size={11} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lootItems.map((slot, idx) => {
                        const drop = activeTier.dropRates[idx];
                        const badgeClass = getMysteryBadgeVariantClass(
                          drop?.badgeVariant,
                        );
                        return (
                          <span
                            key={`${idx}-${slot.name}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-card dark:bg-white/5 border border-neutral-700/80 dark:border-white/10 text-[10px] text-neutral-200 max-w-full"
                          >
                            <span
                              className={cn(
                                "px-1 py-px rounded border font-black tabular-nums leading-none",
                                badgeClass,
                              )}
                            >
                              {drop?.percentage ?? 33}%
                            </span>
                            <span className="truncate max-w-[110px]">
                              {slot.name || "..."}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {categoryField}
                </div>
              </div>
            </div>

            {/* ABA 2: PERSONALIZAR PRÊMIOS DA CAIXA */}
            <div
              role="tabpanel"
              id={`${mysteryTabBaseId}-panel-loot`}
              aria-labelledby={`${mysteryTabBaseId}-tab-loot`}
              hidden={activeMysteryTab !== "loot"}
              className={activeMysteryTab !== "loot" ? "hidden" : undefined}
            >
              <MysteryBoxLootEditor
                packageLevel={packageLevel}
                lootItems={lootItems}
                onChangeSlot={handleLootSlotChange}
                onApplyPreset={handleApplyLootPreset}
                existingRewards={existingRewards}
                disabled={isPending}
              />
            </div>
          </div>
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
              {resolvedTypeKey === "TimeBased" ? (
                <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
                  {/* Atalhos Rápidos ACIMA dos inputs para não sobrescrever após digitação */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
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
                          toPackageMessageKey(packageLevel) ===
                          toPackageMessageKey(pkg.id);

                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            aria-pressed={isSelected}
                            disabled={isPending}
                            onClick={() => {
                              setPackageLevel(pkg.id);
                              if (pkg.suggestedMinutes) {
                                setBaseDurationMinutes(
                                  String(pkg.suggestedMinutes),
                                );
                              }
                              if (typeof pkg.suggestedPrice === "number") {
                                applySuggestedPrice(pkg.suggestedPrice);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
                              isSelected
                                ? pkg.selectedClass
                                : pkg.unselectedClass,
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start pt-2 border-t border-neutral-700/40 dark:border-white/5">
                    {/* Duração ao lado do Custo */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2 min-h-5">
                        <label
                          htmlFor="rewardDuration"
                          className="text-body-s text-neutral-100 font-medium"
                        >
                          {t("durationLabel")}{" "}
                          <span className="text-gold">*</span>
                        </label>
                      </div>
                      <NumberStepperInput
                        id="rewardDuration"
                        min={5}
                        max={1440}
                        step={5}
                        value={baseDurationMinutes}
                        onChange={(e) =>
                          handleBaseDurationChange(e.target.value)
                        }
                        onBlur={() => {
                          if (
                            !baseDurationMinutes ||
                            Number(baseDurationMinutes) < 5
                          ) {
                            handleBaseDurationChange("5");
                          }
                        }}
                        onStep={(delta) => {
                          const base = Number.isFinite(numericDuration)
                            ? numericDuration
                            : 0;
                          const next = Math.min(
                            1440,
                            Math.max(5, base + delta),
                          );
                          handleBaseDurationChange(String(next));
                        }}
                        decrementDisabled={numericDuration <= 5}
                        incrementDisabled={numericDuration >= 1440}
                        placeholder={t("durationPlaceholder")}
                        compact
                        icon={<Clock size={16} />}
                        aria-describedby={
                          numericDuration >= 60
                            ? durationHoursHintId
                            : undefined
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
                      label={
                        isGamified
                          ? t("priceLabel")
                          : t("priceLabelProductivity")
                      }
                      value={price}
                      onChange={handlePriceChange}
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
                    onApplySuggestedPrice={applySuggestedPrice}
                    disabled={isPending}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
                    {/* Atalhos opcionais de horizonte/raridade ACIMA do preço */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
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
                            toPackageMessageKey(packageLevel) ===
                              toPackageMessageKey(tier.packageLevel) ||
                            (toPackageMessageKey(packageLevel) === "NONE" &&
                              Number.parseFloat(price.replace(",", ".")) ===
                                tier.suggestedPrice);

                          return (
                            <button
                              key={tier.id}
                              type="button"
                              aria-pressed={isSelected}
                              disabled={isPending}
                              onClick={() =>
                                handleSingleUseTierSelect(
                                  tier.packageLevel,
                                  tier.suggestedPrice,
                                )
                              }
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-label-g font-semibold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer select-none active:scale-95",
                                isSelected
                                  ? tier.selectedClass
                                  : tier.unselectedClass,
                                isPending && "opacity-50 cursor-not-allowed",
                              )}
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  tier.dotColor,
                                )}
                              />
                              <span>
                                {tOptions(`singleUseTiers.${tier.id}`)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custo */}
                    <div className="pt-2 border-t border-neutral-700/40 dark:border-white/5">
                      <RewardPriceField
                        label={
                          isGamified
                            ? t("priceLabel")
                            : t("priceLabelProductivity")
                        }
                        value={price}
                        onChange={handlePriceChange}
                        placeholder={t("pricePlaceholder")}
                        disabled={isPending}
                        hasWarning={hasPriceWarning}
                        guidanceType={type}
                        priceAnalysis={priceAnalysis}
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
                              className="text-rose-600 dark:text-rose-300 shrink-0"
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
                      onCheckedChange={handleDebtToggleChange}
                      disabled={isPending}
                      aria-label={t("debtToggleAria")}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-neutral-700 dark:border-white/10 pt-3">
          <button
            type="button"
            onClick={onClose}
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
  );
}
