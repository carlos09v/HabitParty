import { ArrowRight, FileText, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type MutableRefObject,
  type ReactNode,
  type Ref,
  useId,
  useMemo,
  useRef,
} from "react";
import { RewardPriceField } from "@/components/reward/form/RewardPriceField";
import { MysteryBoxLootEditor } from "@/components/reward/MysteryBoxLootEditor";
import { MysteryBoxSelector } from "@/components/reward/MysteryBoxSelector";
import { getMysteryBadgeVariantClass } from "@/constants/reward";
import type {
  MysteryBoxLootItem,
  PackageLevel,
  Reward,
  RewardType,
} from "@/types/reward";
import { cn } from "@/utils";
import type { RewardPriceAnalysis } from "@/utils/rewardEconomy";
import { getMysteryBoxTier } from "@/utils/rewardMapper";

export type MysteryBoxFormTab = "identity" | "loot";

interface RewardMysteryBoxSectionProps {
  activeMysteryTab: MysteryBoxFormTab;
  onTabChange: (tab: MysteryBoxFormTab) => void;
  isGamified: boolean;
  isPending: boolean;
  type: RewardType;
  price: string;
  onPriceChange: (value: string) => void;
  priceInputRef: Ref<HTMLInputElement>;
  hasPriceWarning: boolean;
  packageLevel: PackageLevel;
  priceAnalysis: RewardPriceAnalysis;
  onApplySuggestedPrice: (price: number) => void;
  onSelectMysteryTier: (
    tierId: PackageLevel,
    recommendedPrice: number,
    defaultName: string,
  ) => void;
  lootItems: readonly [
    MysteryBoxLootItem,
    MysteryBoxLootItem,
    MysteryBoxLootItem,
  ];
  onChangeSlot: (index: 0 | 1 | 2, updated: MysteryBoxLootItem) => void;
  onApplyPreset: (
    presetItems: readonly [
      MysteryBoxLootItem,
      MysteryBoxLootItem,
      MysteryBoxLootItem,
    ],
  ) => void;
  existingRewards: Reward[];
  slotInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  titleField: ReactNode;
  descriptionField: ReactNode;
  categoryField: ReactNode;
}

export function RewardMysteryBoxSection({
  activeMysteryTab,
  onTabChange,
  isGamified,
  isPending,
  type,
  price,
  onPriceChange,
  priceInputRef,
  hasPriceWarning,
  packageLevel,
  priceAnalysis,
  onApplySuggestedPrice,
  onSelectMysteryTier,
  lootItems,
  onChangeSlot,
  onApplyPreset,
  existingRewards,
  slotInputRefs,
  titleField,
  descriptionField,
  categoryField,
}: RewardMysteryBoxSectionProps) {
  const t = useTranslations("rewards.formModal");
  const tMystery = useTranslations("rewards.mysteryBox");
  const mysteryTabBaseId = useId();
  const mysteryTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeTier = getMysteryBoxTier(packageLevel);

  const mysteryTabs = useMemo(
    () => [
      {
        id: "identity" as const,
        label: isGamified
          ? t("mysteryTabIdentity")
          : t("mysteryTabIdentityProductivity"),
        icon: FileText,
      },
      {
        id: "loot" as const,
        label: isGamified
          ? t("mysteryTabPrizes")
          : t("mysteryTabPrizesProductivity"),
        icon: SlidersHorizontal,
        badge: isGamified
          ? t("mysteryTabPrizesBadge", { count: lootItems.length })
          : t("mysteryTabPrizesBadgeProductivity", { count: lootItems.length }),
      },
    ],
    [isGamified, t, lootItems.length],
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
      onTabChange(targetTab.id);
      mysteryTabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label={
          isGamified ? t("mysteryTabsAria") : t("mysteryTabsAriaProductivity")
        }
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
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleMysteryTabKeyDown(e, index)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer select-none rounded-t-lg -mb-px border-b-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary text-primary bg-primary/10 dark:border-gold dark:text-gold dark:bg-gold/10 font-bold"
                  : "border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-surface/60 dark:hover:text-neutral-200 dark:hover:bg-white/5",
              )}
            >
              <TabIcon size={14} className="shrink-0" aria-hidden="true" />
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
                inputRef={priceInputRef}
                label={
                  isGamified ? t("priceLabel") : t("priceLabelProductivity")
                }
                hint={
                  isGamified
                    ? t("suggestedPriceByRarity")
                    : t("suggestedPriceByRarityProductivity")
                }
                value={price}
                onChange={onPriceChange}
                placeholder={t("pricePlaceholder")}
                disabled={isPending}
                hasWarning={hasPriceWarning}
                guidanceType={type}
                packageLevel={packageLevel}
                priceAnalysis={priceAnalysis}
                onApplySuggestedPrice={onApplySuggestedPrice}
              />
            </div>
          </div>

          {/* COLUNA DIREITA: RARIDADE/FAIXA (2x2), PREVIEW DOS PRÊMIOS & CATEGORIA */}
          <div className="flex flex-col gap-3">
            <MysteryBoxSelector
              layout="2x2"
              selectedLevel={packageLevel}
              onSelect={(tier) =>
                onSelectMysteryTier(
                  tier.id,
                  tier.recommendedPrice,
                  tMystery(
                    `${isGamified ? "tiers" : "tiersProductivity"}.${tier.backendPackageLevel}.name`,
                  ),
                )
              }
              disabled={isPending}
            />

            <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-background border border-neutral-700 dark:bg-surface/30 dark:border-white/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-tiny font-bold text-neutral-200">
                  {isGamified
                    ? t("mysteryLootPreviewLabel")
                    : t("mysteryLootPreviewLabelProductivity")}
                </span>
                <button
                  type="button"
                  onClick={() => onTabChange("loot")}
                  className="inline-flex items-center gap-1 text-tiny font-bold text-primary dark:text-gold hover:underline cursor-pointer"
                >
                  <span>
                    {isGamified
                      ? t("mysteryCustomizeLootCta")
                      : t("mysteryCustomizeLootCtaProductivity")}
                  </span>
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
          onChangeSlot={onChangeSlot}
          onApplyPreset={onApplyPreset}
          existingRewards={existingRewards}
          disabled={isPending}
          slotInputRefs={slotInputRefs}
        />
      </div>
    </div>
  );
}
