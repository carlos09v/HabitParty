"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createReward,
  createRewardsBatch,
  saveRewardGroup,
  updateReward,
} from "@/actions/rewardActions";
import type { EditableGroupVariant } from "@/components/reward/form/RewardGroupPackagesEditor";
import {
  COUPON_PACKAGE_OPTIONS,
  DEBT_DEFAULT_UNIT_PRICE,
  MAX_REWARD_PACKAGES_PER_CARD,
  SINGLE_USE_TIER_OPTIONS,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardPrefillDraft } from "@/hooks/useRewardCatalogActions";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  MysteryBoxLootItem,
  PackageLevel,
  Reward,
  RewardCategory,
  RewardGroupContext,
  RewardType,
} from "@/types/reward";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import {
  adjustSuggestedPriceForCategory,
  calculateSuggestedCouponPrice,
  calculateSuggestedSingleUsePrice,
  parseLocalizedPrice,
  resolveSuggestedPackagePrice,
} from "@/utils/rewardEconomy";
import {
  buildBatchCouponPayloads,
  buildGroupUpdateDto,
  buildPrefillPackageTitle,
  buildSingleRewardFormInput,
  createDefaultLootTuple,
  type LootTuple,
  MAX_REWARD_TITLE_LENGTH,
} from "@/utils/rewardFormHelpers";
import {
  extractRewardGroupBaseTitle,
  extractRewardVariantSuffix,
  findMatchingGroupTierUsage,
} from "@/utils/rewardGrouping";
import {
  getMysteryBoxTier,
  mapRewardDtoToReward,
  mapRewardFormToCreatePayload,
  mapRewardFormToUpdatePayload,
  suggestRewardIconFromTitle,
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

const DEFAULT_BATCH_PACKAGES: readonly PackageLevel[] = [
  "Básico",
  "Premium",
  "Épico",
];

function resolvePrefillPackageTitle(
  baseTitle: string,
  durationMinutes?: number | null,
): string {
  const cleanBase = baseTitle.trim().replace(/\s+/g, " ");
  if (!cleanBase) return "";
  if (!durationMinutes || durationMinutes <= 0) {
    return buildPrefillPackageTitle(cleanBase, durationMinutes);
  }
  const suffix = ` (${formatFocusMinutes(durationMinutes)})`;
  if (cleanBase.toLowerCase().endsWith(suffix.toLowerCase())) {
    return cleanBase.slice(0, MAX_REWARD_TITLE_LENGTH).trim();
  }
  return buildPrefillPackageTitle(cleanBase, durationMinutes);
}

interface UseRewardFormProps {
  isOpen: boolean;
  rewardToEdit?: Reward | null;
  groupToEdit?: (RewardGroupContext & { activeVariantId?: string }) | null;
  prefillDraft?: RewardPrefillDraft | null;
  existingRewards?: Reward[];
  restrictToDebtOnly?: boolean;
  onSuccess?: (reward: Reward | Reward[]) => void;
  onGroupSuccess?: (sourceIds: string[], savedRewards: Reward[]) => void;
  onClose: () => void;
}

interface RewardFormSnapshot {
  title: string;
  description: string;
  price: string;
  type: RewardType;
  category: RewardCategory;
  packageLevel: PackageLevel;
  baseDurationMinutes: string;
  selectedIcon: string;
  lootItems: LootTuple;
  createMultiplePackages: boolean;
  selectedBatchPackages: PackageLevel[];
  groupVariants: EditableGroupVariant[];
}

function areLootTuplesEqual(a: LootTuple, b: LootTuple): boolean {
  for (let i = 0; i < 3; i++) {
    const slotA = a[i];
    const slotB = b[i];
    if (
      slotA.name !== slotB.name ||
      slotA.icon !== slotB.icon ||
      slotA.minutes !== slotB.minutes ||
      slotA.category !== slotB.category ||
      slotA.description !== slotB.description
    ) {
      return false;
    }
  }
  return true;
}

function areGroupVariantsEqual(
  a: EditableGroupVariant[],
  b: EditableGroupVariant[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i];
    const itemB = b[i];
    if (
      itemA.localKey !== itemB.localKey ||
      itemA.id !== itemB.id ||
      itemA.packageLevel !== itemB.packageLevel ||
      itemA.durationMinutes !== itemB.durationMinutes ||
      itemA.price !== itemB.price ||
      itemA.originalSuffix !== itemB.originalSuffix
    ) {
      return false;
    }
  }
  return true;
}

function areRewardFormSnapshotsEqual(
  a: RewardFormSnapshot,
  b: RewardFormSnapshot,
): boolean {
  if (
    a.title !== b.title ||
    a.description !== b.description ||
    a.price !== b.price ||
    a.type !== b.type ||
    a.category !== b.category ||
    a.packageLevel !== b.packageLevel ||
    a.baseDurationMinutes !== b.baseDurationMinutes ||
    a.selectedIcon !== b.selectedIcon ||
    a.createMultiplePackages !== b.createMultiplePackages ||
    a.selectedBatchPackages.length !== b.selectedBatchPackages.length
  ) {
    return false;
  }
  for (let i = 0; i < a.selectedBatchPackages.length; i++) {
    if (a.selectedBatchPackages[i] !== b.selectedBatchPackages[i]) {
      return false;
    }
  }
  return (
    areLootTuplesEqual(a.lootItems, b.lootItems) &&
    areGroupVariantsEqual(a.groupVariants, b.groupVariants)
  );
}

export function useRewardForm({
  isOpen,
  rewardToEdit,
  groupToEdit,
  prefillDraft,
  existingRewards = [],
  restrictToDebtOnly = false,
  onSuccess,
  onGroupSuccess,
  onClose,
}: UseRewardFormProps) {
  const t = useTranslations("rewards.hook");
  const tMystery = useTranslations("rewards.mysteryBox");
  const tOptions = useTranslations("rewards.options");
  const locale = useLocale() as AppLocale;
  const isPremium = useUserStore((s) => s.is_Premium);
  const { isGamified } = useExperienceMode();
  const isEditingGroup = Boolean(
    groupToEdit && groupToEdit.variants.length > 1,
  );
  const isEditing = Boolean(rewardToEdit) || isEditingGroup;
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("4");
  const [type, setType] = useState<RewardType>("SingleUse");
  const [category, setCategory] = useState<RewardCategory>("Nenhum");
  const lastRegularCategoryRef = useRef<RewardCategory>("Nenhum");
  const wasSingleUseDebtRef = useRef<boolean>(false);
  const hasManuallyEditedTitleRef = useRef<boolean>(false);
  const [packageLevel, setPackageLevel] = useState<PackageLevel>("Nenhum");
  const [baseDurationMinutes, setBaseDurationMinutes] = useState("30");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [hasManuallyEditedPrice, setHasManuallyEditedPrice] = useState(false);
  const [lootItems, setLootItems] = useState<LootTuple>(() =>
    createDefaultLootTuple("Básico", locale),
  );
  const [hasCustomizedLoot, setHasCustomizedLoot] = useState(false);
  const [createMultiplePackages, setCreateMultiplePackages] = useState(false);
  const [selectedBatchPackages, setSelectedBatchPackages] = useState<
    PackageLevel[]
  >([...DEFAULT_BATCH_PACKAGES]);
  const [groupVariants, setGroupVariants] = useState<EditableGroupVariant[]>(
    [],
  );
  const [initialSnapshot, setInitialSnapshot] =
    useState<RewardFormSnapshot | null>(null);
  const [hydrationTick, setHydrationTick] = useState(0);
  const needsSnapshotCaptureRef = useRef(false);
  const targetHydrationTickRef = useRef(0);

  const groupTierUsage = useMemo(
    () =>
      findMatchingGroupTierUsage(existingRewards, {
        title,
        type,
        category,
        excludeRewardId: rewardToEdit?.id,
      }),
    [existingRewards, title, type, category, rewardToEdit?.id],
  );

  const availableBatchPackageLevels = useMemo(
    () =>
      COUPON_PACKAGE_OPTIONS.filter((opt) => {
        const k = toPackageMessageKey(opt.id);
        return k !== "NONE" && !groupTierUsage.usedPackageKeys.has(k);
      }).map((opt) => opt.id),
    [groupTierUsage.usedPackageKeys],
  );

  const remainingGroupPackageSlots = Math.max(
    0,
    MAX_REWARD_PACKAGES_PER_CARD - groupTierUsage.matchingCount,
  );
  const canCreateMultiplePackages =
    availableBatchPackageLevels.length >= 2 && remainingGroupPackageSlots >= 2;

  useEffect(() => {
    if (!createMultiplePackages) return;
    if (!canCreateMultiplePackages) {
      setCreateMultiplePackages(false);
      return;
    }
    setSelectedBatchPackages((prev) => {
      const valid = prev.filter((pkg) => {
        const k = toPackageMessageKey(pkg);
        return k !== "NONE" && !groupTierUsage.usedPackageKeys.has(k);
      });
      if (valid.length > 0 && valid.length === prev.length) {
        return prev;
      }
      if (valid.length > 0) {
        return valid;
      }
      return availableBatchPackageLevels.slice(
        0,
        Math.min(remainingGroupPackageSlots, 3),
      );
    });
  }, [
    createMultiplePackages,
    canCreateMultiplePackages,
    availableBatchPackageLevels,
    remainingGroupPackageSlots,
    groupTierUsage.usedPackageKeys,
  ]);

  useEffect(() => {
    if (!isOpen || isEditingGroup || isEditing) return;
    const currentPkgKey = toPackageMessageKey(packageLevel);
    if (
      currentPkgKey === "NONE" ||
      !groupTierUsage.usedPackageKeys.has(currentPkgKey)
    ) {
      return;
    }

    let didAdjustPackage = false;
    if (toRewardTypeMessageKey(type) === "TimeBased") {
      didAdjustPackage = true;
      const nextAvailable = COUPON_PACKAGE_OPTIONS.find((opt) => {
        const k = toPackageMessageKey(opt.id);
        return k !== "NONE" && !groupTierUsage.usedPackageKeys.has(k);
      });
      if (nextAvailable) {
        setPackageLevel(nextAvailable.id);
        if (!hasManuallyEditedPrice) {
          if (nextAvailable.suggestedMinutes) {
            setBaseDurationMinutes(String(nextAvailable.suggestedMinutes));
            if (prefillDraft && !hasManuallyEditedTitleRef.current) {
              setTitle(
                resolvePrefillPackageTitle(
                  prefillDraft.title,
                  nextAvailable.suggestedMinutes,
                ),
              );
            }
          }
          if (
            nextAvailable.suggestedMinutes ||
            typeof nextAvailable.suggestedPrice === "number"
          ) {
            setPrice(
              String(resolveSuggestedPackagePrice(nextAvailable, category)),
            );
          }
        }
      } else {
        setPackageLevel("Nenhum");
      }
    } else if (toRewardTypeMessageKey(type) === "SingleUse") {
      didAdjustPackage = true;
      setPackageLevel("Nenhum");
    }

    if (didAdjustPackage && needsSnapshotCaptureRef.current) {
      targetHydrationTickRef.current += 1;
      setHydrationTick(targetHydrationTickRef.current);
    }
  }, [
    isOpen,
    isEditingGroup,
    isEditing,
    type,
    category,
    packageLevel,
    hasManuallyEditedPrice,
    groupTierUsage.usedPackageKeys,
    prefillDraft,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    needsSnapshotCaptureRef.current = true;
    targetHydrationTickRef.current += 1;
    setHydrationTick(targetHydrationTickRef.current);
    setInitialSnapshot(null);

    setHasManuallyChangedIcon(false);
    setHasManuallyEditedPrice(false);
    setCreateMultiplePackages(false);
    setSelectedBatchPackages([...DEFAULT_BATCH_PACKAGES]);

    if (groupToEdit && groupToEdit.variants.length > 1) {
      hasManuallyEditedTitleRef.current = true;
      const primary =
        groupToEdit.variants.find(
          (v) => v.id === groupToEdit.activeVariantId,
        ) ?? groupToEdit.variants[0];
      const firstNonEmptyDesc =
        groupToEdit.variants.find((v) => v.description?.trim())?.description ??
        "";
      const resolvedType = (primary.type as RewardType) || "TimeBased";
      const initialCat = (primary.category as RewardCategory) || "Nenhum";
      const initialIsDebt = toCategoryMessageKey(initialCat) === "DEBT";
      setTitle(
        groupToEdit.displayTitle || extractRewardGroupBaseTitle(primary.title),
      );
      setDescription(firstNonEmptyDesc);
      setType(resolvedType);
      setCategory(initialIsDebt ? "Nenhum" : initialCat);
      lastRegularCategoryRef.current = initialIsDebt ? "Nenhum" : initialCat;
      wasSingleUseDebtRef.current = false;
      setPackageLevel((primary.packageLevel as PackageLevel) || "Nenhum");
      setBaseDurationMinutes(
        primary.baseDurationMinutes !== undefined
          ? String(primary.baseDurationMinutes)
          : "30",
      );
      setPrice(primary.price !== undefined ? String(primary.price) : "8");
      setSelectedIcon(primary.icon || "gamepad");
      setGroupVariants(
        groupToEdit.variants.map((variant) => {
          const pkg = (variant.packageLevel as PackageLevel) || "Nenhum";
          return {
            localKey: variant.id,
            id: variant.id,
            packageLevel: pkg,
            durationMinutes: String(variant.baseDurationMinutes ?? 30),
            price: String(variant.price ?? 8),
            originalSuffix: extractRewardVariantSuffix(variant.title),
            originalPackageLevel: pkg,
            isOriginallySelected: variant.id === groupToEdit.activeVariantId,
          };
        }),
      );
      setLootItems(createDefaultLootTuple("Básico", locale));
      setHasCustomizedLoot(false);
      return;
    }

    if (rewardToEdit) {
      hasManuallyEditedTitleRef.current = true;
      setGroupVariants([]);
      setTitle(rewardToEdit.title || "");
      setDescription(rewardToEdit.description || "");
      setPrice(
        rewardToEdit.price !== undefined ? String(rewardToEdit.price) : "4",
      );
      const resolvedInitialType =
        (rewardToEdit.type as RewardType) || "SingleUse";
      setType(resolvedInitialType);
      const initialCat = (rewardToEdit.category as RewardCategory) || "Nenhum";
      const initialIsDebt = toCategoryMessageKey(initialCat) === "DEBT";
      setCategory(initialCat);
      lastRegularCategoryRef.current = initialIsDebt ? "Nenhum" : initialCat;
      wasSingleUseDebtRef.current =
        resolvedInitialType === "SingleUse" && initialIsDebt;
      const initialPkg = initialIsDebt
        ? "Nenhum"
        : (rewardToEdit.packageLevel as PackageLevel) || "Nenhum";
      setPackageLevel(initialPkg);
      setBaseDurationMinutes(
        rewardToEdit.baseDurationMinutes !== undefined
          ? String(rewardToEdit.baseDurationMinutes)
          : "30",
      );
      setSelectedIcon(
        rewardToEdit.icon ||
          (rewardToEdit.type === "MysteryBox" ? "mystery_box" : "gamepad"),
      );
      const tierObj = getMysteryBoxTier(initialPkg);
      if (rewardToEdit.lootItems && rewardToEdit.lootItems.length === 3) {
        setLootItems([
          { ...rewardToEdit.lootItems[0] },
          { ...rewardToEdit.lootItems[1] },
          { ...rewardToEdit.lootItems[2] },
        ]);
        setHasCustomizedLoot(true);
      } else {
        setLootItems(createDefaultLootTuple(tierObj.id, locale));
        setHasCustomizedLoot(false);
      }
      return;
    }

    if (prefillDraft) {
      hasManuallyEditedTitleRef.current = false;
      setGroupVariants([]);
      const draftCat = prefillDraft.category || "Nenhum";
      const draftIsDebt = toCategoryMessageKey(draftCat) === "DEBT";
      if (draftIsDebt && prefillDraft.type === "SingleUse") {
        setTitle(prefillDraft.title);
        setDescription(prefillDraft.description || "");
        setType("SingleUse");
        setCategory("Dívida");
        lastRegularCategoryRef.current = "Nenhum";
        wasSingleUseDebtRef.current = true;
        setPackageLevel("Nenhum");
        setBaseDurationMinutes("30");
        setPrice(String(prefillDraft.price ?? DEBT_DEFAULT_UNIT_PRICE));
        setSelectedIcon(prefillDraft.icon || "receipt");
        setLootItems(createDefaultLootTuple("Básico", locale));
        setHasCustomizedLoot(false);
        return;
      }

      if (prefillDraft.type === "MysteryBox") {
        const draftTier = getMysteryBoxTier(
          prefillDraft.suggestedPackageLevel || "Básico",
        );
        setTitle(prefillDraft.title);
        setDescription(prefillDraft.description || "");
        setType("MysteryBox");
        setCategory(draftIsDebt ? "Sorte" : draftCat);
        lastRegularCategoryRef.current = draftIsDebt ? "Sorte" : draftCat;
        wasSingleUseDebtRef.current = false;
        setPackageLevel(draftTier.id);
        setBaseDurationMinutes("30");
        setPrice(String(prefillDraft.price ?? draftTier.recommendedPrice));
        setSelectedIcon(prefillDraft.icon || "mystery_box");
        setLootItems(createDefaultLootTuple(draftTier.id, locale));
        setHasCustomizedLoot(false);
        return;
      }

      if (prefillDraft.type === "SingleUse") {
        const safeCat = draftIsDebt ? "Nenhum" : draftCat;
        const suggestedSinglePkg =
          prefillDraft.suggestedPackageLevel || "Nenhum";
        const suggestedSinglePrice =
          prefillDraft.price ??
          calculateSuggestedSingleUsePrice(suggestedSinglePkg, safeCat) ??
          4;
        setTitle(prefillDraft.title);
        setDescription(prefillDraft.description || "");
        setType("SingleUse");
        setCategory(safeCat);
        lastRegularCategoryRef.current = safeCat;
        wasSingleUseDebtRef.current = false;
        setPackageLevel(suggestedSinglePkg);
        setBaseDurationMinutes("30");
        setPrice(String(suggestedSinglePrice));
        setSelectedIcon(prefillDraft.icon || "gamepad");
        setLootItems(createDefaultLootTuple("Básico", locale));
        setHasCustomizedLoot(false);
        return;
      }

      const safeDraftCat = draftIsDebt ? "Nenhum" : draftCat;
      const draftPkg =
        COUPON_PACKAGE_OPTIONS.find(
          (opt) => opt.id === (prefillDraft.suggestedPackageLevel || "Premium"),
        ) ?? COUPON_PACKAGE_OPTIONS[2];
      const resolvedDuration =
        prefillDraft.baseDurationMinutes ?? draftPkg.suggestedMinutes ?? 60;
      setTitle(
        resolvePrefillPackageTitle(prefillDraft.title, resolvedDuration),
      );
      setDescription(prefillDraft.description || "");
      setType("TimeBased");
      setCategory(safeDraftCat);
      lastRegularCategoryRef.current = safeDraftCat;
      wasSingleUseDebtRef.current = false;
      setPackageLevel(draftPkg.id);
      setBaseDurationMinutes(String(resolvedDuration));
      setPrice(
        String(
          prefillDraft.price ??
            calculateSuggestedCouponPrice(resolvedDuration, safeDraftCat),
        ),
      );
      setSelectedIcon(prefillDraft.icon || "gamepad");
      setLootItems(createDefaultLootTuple("Básico", locale));
      setHasCustomizedLoot(false);
      return;
    }

    hasManuallyEditedTitleRef.current = false;
    setGroupVariants([]);
    setTitle("");
    setDescription("");
    setPrice("4");
    setType("SingleUse");
    setCategory("Nenhum");
    lastRegularCategoryRef.current = "Nenhum";
    wasSingleUseDebtRef.current = false;
    setPackageLevel("Nenhum");
    setBaseDurationMinutes("30");
    setSelectedIcon("gamepad");
    setLootItems(createDefaultLootTuple("Básico", locale));
    setHasCustomizedLoot(false);
  }, [isOpen, rewardToEdit, groupToEdit, prefillDraft, locale]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    if (isEditingGroup && groupToEdit) {
      const built = buildGroupUpdateDto({
        groupToEdit,
        groupVariants,
        title,
        description,
        selectedIcon,
        type,
        category,
        formatPackageLabel: (pkgKey) => tOptions(`packages.${pkgKey}`),
      });
      if (!built.ok) {
        toast.error(t(built.errorKey));
        return;
      }

      startTransition(async () => {
        const result = await saveRewardGroup(built.dto);
        if (!result.success || !result.data) {
          toast.error(!result.success ? result.error : t("updateError"));
          return;
        }

        const savedRewards = result.data.map(mapRewardDtoToReward);
        toast.success(
          t("groupUpdateSuccess", {
            title: title.trim(),
            count: savedRewards.length,
          }),
        );
        onGroupSuccess?.(built.dto.sourceRewardIds, savedRewards);
        onClose();
      });
      return;
    }

    const isBatchCouponCreation =
      !isEditing && type === "TimeBased" && createMultiplePackages;

    if (isBatchCouponCreation) {
      const { baseName, payloads } = buildBatchCouponPayloads({
        title,
        description,
        category,
        selectedIcon,
        selectedBatchPackages,
        usedPackageKeys: groupTierUsage.usedPackageKeys,
      });

      if (payloads.length === 0) {
        toast.error(t("batchPackagesRequired"));
        return;
      }
      if (
        groupTierUsage.matchingCount + payloads.length >
        MAX_REWARD_PACKAGES_PER_CARD
      ) {
        toast.error(
          t("groupTooManyPackagesError", {
            max: MAX_REWARD_PACKAGES_PER_CARD,
          }),
        );
        return;
      }

      startTransition(async () => {
        const result = await createRewardsBatch(payloads);
        if (!result.success) {
          toast.error(result.error || t("createError"));
          return;
        }

        const createdRewards = result.data.created.map(mapRewardDtoToReward);
        if (result.data.partialError) {
          onSuccess?.(createdRewards);
          toast.error(result.data.partialError);
          return;
        }

        soundEffects.playCreateSound();
        toast.success(
          t("batchCreateSuccess", {
            count: createdRewards.length,
            title: baseName,
          }),
        );
        onSuccess?.(createdRewards);
        onClose();
      });
      return;
    }

    const numericPrice = parseLocalizedPrice(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      toast.error(t("invalidPrice"));
      return;
    }

    const submittedPkgKey = toPackageMessageKey(packageLevel);
    if (
      submittedPkgKey !== "NONE" &&
      (type === "TimeBased" ||
        (type === "SingleUse" && toCategoryMessageKey(category) !== "DEBT")) &&
      groupTierUsage.usedPackageKeys.has(submittedPkgKey)
    ) {
      toast.error(t("duplicatePackageTierError"));
      return;
    }

    if (
      type === "MysteryBox" &&
      (packageLevel === "Nenhum" || packageLevel === "NONE")
    ) {
      toast.error(
        t(
          isGamified
            ? "mysteryBoxPackageRequired"
            : "mysteryBoxPackageRequiredProductivity",
        ),
      );
      return;
    }

    startTransition(async () => {
      const formInput = buildSingleRewardFormInput({
        title,
        description,
        numericPrice,
        type,
        category,
        packageLevel,
        baseDurationMinutes,
        selectedIcon,
        lootItems,
        locale,
      });

      if (isEditing && rewardToEdit) {
        const payload = mapRewardFormToUpdatePayload(formInput);
        const result = await updateReward(rewardToEdit.id, payload);

        if (!result.success) {
          toast.error(result.error || t("updateError"));
          return;
        }

        const updatedReward: Reward = result.data
          ? mapRewardDtoToReward(result.data)
          : { ...rewardToEdit, ...formInput };

        toast.success(t("updateSuccess"));
        onSuccess?.(updatedReward);
        onClose();
        return;
      }

      const payload = mapRewardFormToCreatePayload(formInput);
      const result = await createReward(payload);

      if (!result.success) {
        toast.error(result.error || t("createError"));
        return;
      }

      const newReward: Reward = result.data
        ? mapRewardDtoToReward(result.data)
        : {
            id: `rew-${Date.now()}`,
            ...formInput,
            description: formInput.description ?? "",
            orderIndex: existingRewards.length,
          };

      soundEffects.playCreateSound();
      toast.success(t("createSuccess", { title: formInput.title }), {
        description: t("createSuccessDescription"),
      });
      onSuccess?.(newReward);
      onClose();
    });
  };

  const isDefaultBoxTitle = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return true;
    const defaultTitles = new Set([
      t("defaultMysteryBoxTitle"),
      t("defaultMysteryBoxTitleProductivity"),
      tMystery("tiers.BASIC.name"),
      tMystery("tiers.PREMIUM.name"),
      tMystery("tiers.EPIC.name"),
      tMystery("tiers.LEGENDARY.name"),
      tMystery("tiersProductivity.BASIC.name"),
      tMystery("tiersProductivity.PREMIUM.name"),
      tMystery("tiersProductivity.EPIC.name"),
      tMystery("tiersProductivity.LEGENDARY.name"),
      "Caixa Misteriosa",
      "Mystery Box",
      "Sorteio de Pausa",
      "Break Draw",
      "Caixa Básica",
      "Caixa Premium",
      "Caixa Épica",
      "Caixa Lendária",
      "Basic Box",
      "Premium Box",
      "Epic Box",
      "Legendary Box",
    ]);
    return defaultTitles.has(trimmed);
  };

  const handleTypeChange = (newType: RewardType) => {
    if (restrictToDebtOnly && newType !== "SingleUse") {
      return;
    }
    const previousType = type;
    if (newType !== "SingleUse" && previousType === "SingleUse") {
      wasSingleUseDebtRef.current = toCategoryMessageKey(category) === "DEBT";
    }
    setType(newType);
    if (newType !== "SingleUse" && toCategoryMessageKey(category) === "DEBT") {
      setCategory(lastRegularCategoryRef.current || "Nenhum");
    }
    if (newType !== "TimeBased") {
      setCreateMultiplePackages(false);
    }
    setHasManuallyEditedPrice(false);
    if (newType === "MysteryBox") {
      const targetLevel =
        packageLevel === "Nenhum" || packageLevel === "NONE"
          ? "Básico"
          : packageLevel;
      const tierObj = getMysteryBoxTier(targetLevel);
      setPackageLevel(targetLevel);
      if (!isEditing) {
        setPrice(String(tierObj.recommendedPrice));
      } else if (price === "" || price === "0") {
        setPrice(String(tierObj.recommendedPrice));
      }
      if (!hasCustomizedLoot) {
        setLootItems(createDefaultLootTuple(tierObj.id, locale));
      }
      if (!hasManuallyChangedIcon) {
        setSelectedIcon("mystery_box");
      }
      if (isDefaultBoxTitle(title)) {
        const tierKey = tierObj.backendPackageLevel;
        const tierNamespace = isGamified ? "tiers" : "tiersProductivity";
        setTitle(
          targetLevel === "Básico"
            ? t(
                isGamified
                  ? "defaultMysteryBoxTitle"
                  : "defaultMysteryBoxTitleProductivity",
              )
            : tMystery(`${tierNamespace}.${tierKey}.name`),
        );
      }
    } else if (newType === "SingleUse") {
      if (previousType === "MysteryBox" && isDefaultBoxTitle(title)) {
        setTitle("");
      }
      if (wasSingleUseDebtRef.current) {
        setCategory("Dívida");
        setPackageLevel("Nenhum");
        if (!isEditing) {
          setPrice(String(DEBT_DEFAULT_UNIT_PRICE));
        }
      } else if (!isEditing) {
        setPackageLevel("Nenhum");
        setPrice("4");
      }
      if (!hasManuallyChangedIcon && selectedIcon === "mystery_box") {
        setSelectedIcon("gamepad");
      }
    } else if (newType === "TimeBased") {
      if (previousType === "MysteryBox" && isDefaultBoxTitle(title)) {
        setTitle("");
      }
      if (!hasManuallyChangedIcon && selectedIcon === "mystery_box") {
        setSelectedIcon("gamepad");
      }
      if (!isEditing) {
        if (packageLevel === "Nenhum" || packageLevel === "NONE") {
          setPackageLevel("Básico");
          setBaseDurationMinutes("30");
          setPrice(String(calculateSuggestedCouponPrice(30, category)));
        } else {
          const suggested = calculateSuggestedCouponPrice(
            Number(baseDurationMinutes) || 30,
            category,
          );
          setPrice(String(suggested));
        }
      }
    }
  };

  const handleSingleUseTierSelect = (
    tierPackageLevel: PackageLevel,
    suggestedPrice?: number,
  ) => {
    if (toPackageMessageKey(tierPackageLevel) === "NONE") {
      setPackageLevel("Nenhum");
      return;
    }

    const isAlreadySelected =
      toPackageMessageKey(packageLevel) ===
        toPackageMessageKey(tierPackageLevel) &&
      (typeof suggestedPrice !== "number" ||
        parseLocalizedPrice(price) === suggestedPrice);

    if (isAlreadySelected) {
      setPackageLevel("Nenhum");
      return;
    }

    setPackageLevel(tierPackageLevel);
    if (typeof suggestedPrice === "number") {
      setPrice(String(suggestedPrice));
      setHasManuallyEditedPrice(false);
    }
  };

  const toggleBatchPackage = (pkgLevel: PackageLevel) => {
    const key = toPackageMessageKey(pkgLevel);
    setSelectedBatchPackages((prev) => {
      const exists = prev.some((item) => toPackageMessageKey(item) === key);
      if (exists) {
        const availableSelected = prev.filter(
          (item) =>
            !groupTierUsage.usedPackageKeys.has(toPackageMessageKey(item)),
        );
        if (availableSelected.length <= 1) return prev;
        return prev.filter((item) => toPackageMessageKey(item) !== key);
      }
      return [...prev, pkgLevel];
    });
  };

  const handleMysteryBoxTierSelect = (
    tierId: PackageLevel,
    recommendedPrice: number,
    tierName?: string,
  ) => {
    setPackageLevel(tierId);
    setPrice(String(recommendedPrice));
    setHasManuallyEditedPrice(false);
    if (!hasManuallyChangedIcon) {
      setSelectedIcon("mystery_box");
    }
    const tierObj = getMysteryBoxTier(tierId);
    if (!hasCustomizedLoot) {
      setLootItems(createDefaultLootTuple(tierObj.id, locale));
    } else {
      setLootItems((prev) => [
        {
          ...prev[0],
          minutes:
            prev[0].minutes && prev[0].minutes > 0
              ? Math.min(prev[0].minutes, tierObj.slotMaxMinutes[0])
              : null,
        },
        {
          ...prev[1],
          minutes:
            prev[1].minutes && prev[1].minutes > 0
              ? Math.min(prev[1].minutes, tierObj.slotMaxMinutes[1])
              : null,
        },
        {
          ...prev[2],
          minutes:
            prev[2].minutes && prev[2].minutes > 0
              ? Math.min(prev[2].minutes, tierObj.slotMaxMinutes[2])
              : null,
        },
      ]);
    }
    if (isDefaultBoxTitle(title)) {
      const key = toPackageMessageKey(tierId);
      const tierNamespace = isGamified ? "tiers" : "tiersProductivity";
      const fallbackTierName =
        key !== "NONE"
          ? tMystery(`${tierNamespace}.${key}.name`)
          : `Caixa ${tierId}`;
      setTitle(tierName || fallbackTierName);
    }
  };

  const handleLootSlotChange = (
    index: 0 | 1 | 2,
    updated: MysteryBoxLootItem,
  ) => {
    setHasCustomizedLoot(true);
    setLootItems((prev) => {
      const next: LootTuple = [{ ...prev[0] }, { ...prev[1] }, { ...prev[2] }];
      next[index] = updated;
      return next;
    });
  };

  const handleApplyLootPreset = (
    presetItems: readonly MysteryBoxLootItem[],
  ) => {
    setHasCustomizedLoot(true);
    setLootItems([
      { ...presetItems[0] },
      { ...presetItems[1] },
      { ...presetItems[2] },
    ]);
  };

  const handleTitleChange = (newTitle: string) => {
    hasManuallyEditedTitleRef.current = true;
    setTitle(newTitle);
    if (!hasManuallyChangedIcon && type !== "MysteryBox") {
      const suggested = suggestRewardIconFromTitle(newTitle, isPremium);
      if (suggested) {
        setSelectedIcon(suggested);
      }
    }
  };

  const handlePriceChange = (newPrice: string) => {
    setPrice(newPrice);
    setHasManuallyEditedPrice(true);
  };

  const applySuggestedPrice = (suggested: number) => {
    setPrice(String(suggested));
    setHasManuallyEditedPrice(false);
  };

  const syncDurationAndPrefillTitle = (newDuration: string) => {
    setBaseDurationMinutes(newDuration);
    if (
      !isEditing &&
      prefillDraft &&
      !hasManuallyEditedTitleRef.current &&
      type === "TimeBased"
    ) {
      const parsed = Number.parseInt(newDuration, 10);
      setTitle(
        resolvePrefillPackageTitle(
          prefillDraft.title,
          Number.isFinite(parsed) && parsed >= 5 ? parsed : null,
        ),
      );
    }
  };

  const handleBaseDurationChange = (newDuration: string) => {
    syncDurationAndPrefillTitle(newDuration);
    if (type === "TimeBased" && !isEditing && !hasManuallyEditedPrice) {
      const parsed = Number.parseInt(newDuration, 10);
      if (Number.isFinite(parsed) && parsed >= 5) {
        setPrice(String(calculateSuggestedCouponPrice(parsed, category)));
      }
    }
  };

  const handleCategoryChange = (nextCategory: RewardCategory) => {
    setCategory(nextCategory);
    const isDebt = toCategoryMessageKey(nextCategory) === "DEBT";
    wasSingleUseDebtRef.current = isDebt;
    if (!isDebt) {
      lastRegularCategoryRef.current = nextCategory;
      if (!isEditing && !hasManuallyEditedPrice) {
        if (type === "TimeBased") {
          const parsedDuration = Number.parseInt(baseDurationMinutes, 10) || 30;
          setPrice(
            String(calculateSuggestedCouponPrice(parsedDuration, nextCategory)),
          );
        } else if (type === "SingleUse") {
          const suggestedSingle = calculateSuggestedSingleUsePrice(
            packageLevel,
            nextCategory,
          );
          if (suggestedSingle !== null) {
            setPrice(String(suggestedSingle));
          }
        }
      }
    }
  };

  const handleDebtToggleChange = (isDebt: boolean) => {
    if (restrictToDebtOnly && !isDebt) {
      return;
    }
    wasSingleUseDebtRef.current = isDebt;
    if (isDebt) {
      if (toCategoryMessageKey(category) !== "DEBT") {
        lastRegularCategoryRef.current = category;
      }
      setCategory("Dívida");
      setPackageLevel("Nenhum");
      if (!isEditing && !hasManuallyEditedPrice) {
        setPrice(String(DEBT_DEFAULT_UNIT_PRICE));
      }
    } else {
      setCategory(lastRegularCategoryRef.current || "Nenhum");
      if (!isEditing && !hasManuallyEditedPrice && type === "SingleUse") {
        setPrice("4");
      }
    }
  };

  const handleIconSelect = (iconId: string) => {
    setSelectedIcon(iconId);
    setHasManuallyChangedIcon(true);
  };

  const handleAddGroupVariant = () => {
    if (groupVariants.length >= MAX_REWARD_PACKAGES_PER_CARD) return;
    const isTimeBasedGroup = toRewardTypeMessageKey(type) === "TimeBased";
    const usedPackages = new Set(
      groupVariants.map((v) => toPackageMessageKey(v.packageLevel)),
    );

    if (isTimeBasedGroup) {
      const candidate =
        COUPON_PACKAGE_OPTIONS.find(
          (opt) =>
            opt.id !== "Nenhum" &&
            !usedPackages.has(toPackageMessageKey(opt.id)),
        ) ?? COUPON_PACKAGE_OPTIONS[2];
      setGroupVariants((prev) => [
        ...prev,
        {
          localKey: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          packageLevel: candidate.id,
          durationMinutes: String(candidate.suggestedMinutes ?? 60),
          price: String(
            calculateSuggestedCouponPrice(
              candidate.suggestedMinutes ?? 60,
              category,
            ),
          ),
          originalSuffix: "",
          originalPackageLevel: candidate.id,
          isOriginallySelected: false,
        },
      ]);
      return;
    }

    const candidateSingle =
      SINGLE_USE_TIER_OPTIONS.find((opt) => !usedPackages.has(opt.id)) ??
      SINGLE_USE_TIER_OPTIONS[0];
    setGroupVariants((prev) => [
      ...prev,
      {
        localKey: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        packageLevel: candidateSingle.packageLevel,
        durationMinutes: "30",
        price: String(
          adjustSuggestedPriceForCategory(
            candidateSingle.suggestedPrice,
            category,
          ),
        ),
        originalSuffix: "",
        originalPackageLevel: candidateSingle.packageLevel,
        isOriginallySelected: false,
      },
    ]);
  };

  const handleUpdateGroupVariant = (
    localKey: string,
    patch: Partial<EditableGroupVariant>,
  ) => {
    setGroupVariants((prev) =>
      prev.map((item) =>
        item.localKey === localKey ? { ...item, ...patch } : item,
      ),
    );
  };

  const handleRemoveGroupVariant = (localKey: string) => {
    setGroupVariants((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.localKey !== localKey);
    });
  };

  const removedGroupVariantsCount = groupToEdit
    ? groupToEdit.variants.filter(
        (orig) => !groupVariants.some((current) => current.id === orig.id),
      ).length
    : 0;

  const currentSnapshot = useMemo<RewardFormSnapshot>(
    () => ({
      title,
      description,
      price,
      type,
      category,
      packageLevel,
      baseDurationMinutes,
      selectedIcon,
      lootItems,
      createMultiplePackages,
      selectedBatchPackages,
      groupVariants,
    }),
    [
      title,
      description,
      price,
      type,
      category,
      packageLevel,
      baseDurationMinutes,
      selectedIcon,
      lootItems,
      createMultiplePackages,
      selectedBatchPackages,
      groupVariants,
    ],
  );

  useEffect(() => {
    if (!isOpen) {
      needsSnapshotCaptureRef.current = false;
      setInitialSnapshot(null);
      return;
    }
    if (
      needsSnapshotCaptureRef.current &&
      hydrationTick === targetHydrationTickRef.current
    ) {
      needsSnapshotCaptureRef.current = false;
      setInitialSnapshot(currentSnapshot);
    }
  }, [isOpen, hydrationTick, currentSnapshot]);

  const isDirty =
    isOpen &&
    initialSnapshot !== null &&
    !areRewardFormSnapshotsEqual(initialSnapshot, currentSnapshot);

  const handleCreateMultiplePackagesChange = (checked: boolean) => {
    if (checked && !canCreateMultiplePackages) {
      return;
    }
    setCreateMultiplePackages(checked);
  };

  return {
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
    setBaseDurationMinutes: syncDurationAndPrefillTitle,
    handleBaseDurationChange,
    createMultiplePackages,
    setCreateMultiplePackages: handleCreateMultiplePackagesChange,
    selectedBatchPackages,
    toggleBatchPackage,
    selectedIcon,
    handleIconSelect,
    lootItems,
    handleLootSlotChange,
    handleApplyLootPreset,
    handleSubmit,
  };
}
