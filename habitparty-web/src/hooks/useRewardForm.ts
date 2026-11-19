"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createReward, updateReward } from "@/actions/rewardActions";
import {
  COUPON_PACKAGE_OPTIONS,
  calculateSuggestedCouponPrice,
  DEBT_DEFAULT_UNIT_PRICE,
  DEFAULT_MYSTERY_BOX_LOOT,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RewardPrefillDraft } from "@/hooks/useRewardCatalogActions";
import type {
  MysteryBoxLootItem,
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import {
  getMysteryBoxTier,
  mapRewardFormToCreatePayload,
  mapRewardFormToUpdatePayload,
  suggestRewardIconFromTitle,
  toCategoryMessageKey,
  toPackageMessageKey,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

const DEFAULT_BATCH_PACKAGES: readonly PackageLevel[] = [
  "Básico",
  "Premium",
  "Épico",
];

interface UseRewardFormProps {
  isOpen: boolean;
  rewardToEdit?: Reward | null;
  prefillDraft?: RewardPrefillDraft | null;
  onSuccess?: (reward: Reward | Reward[]) => void;
  onClose: () => void;
}

export function useRewardForm({
  isOpen,
  rewardToEdit,
  prefillDraft,
  onSuccess,
  onClose,
}: UseRewardFormProps) {
  const t = useTranslations("rewards.hook");
  const tMystery = useTranslations("rewards.mysteryBox");
  const { isGamified } = useExperienceMode();
  const isEditing = Boolean(rewardToEdit);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("4");
  const [type, setType] = useState<RewardType>("SingleUse");
  const [category, setCategory] = useState<RewardCategory>("Nenhum");
  const lastRegularCategoryRef = useRef<RewardCategory>("Nenhum");
  const wasSingleUseDebtRef = useRef<boolean>(false);
  const [packageLevel, setPackageLevel] = useState<PackageLevel>("Nenhum");
  const [baseDurationMinutes, setBaseDurationMinutes] = useState("30");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [hasManuallyEditedPrice, setHasManuallyEditedPrice] = useState(false);
  const [lootItems, setLootItems] = useState<
    [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem]
  >(() => [
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[0] },
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[1] },
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[2] },
  ]);
  const [hasCustomizedLoot, setHasCustomizedLoot] = useState(false);
  const [createMultiplePackages, setCreateMultiplePackages] = useState(false);
  const [selectedBatchPackages, setSelectedBatchPackages] = useState<
    PackageLevel[]
  >([...DEFAULT_BATCH_PACKAGES]);

  useEffect(() => {
    if (isOpen) {
      setHasManuallyChangedIcon(false);
      setHasManuallyEditedPrice(false);
      setCreateMultiplePackages(false);
      setSelectedBatchPackages([...DEFAULT_BATCH_PACKAGES]);
      if (rewardToEdit) {
        setTitle(rewardToEdit.title || "");
        setDescription(rewardToEdit.description || "");
        setPrice(
          rewardToEdit.price !== undefined ? String(rewardToEdit.price) : "4",
        );
        const resolvedInitialType =
          (rewardToEdit.type as RewardType) || "SingleUse";
        setType(resolvedInitialType);
        const initialCat =
          (rewardToEdit.category as RewardCategory) || "Nenhum";
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
            (rewardToEdit.iconName as string) ||
            (rewardToEdit.type === "MysteryBox" ? "mystery_box" : "gamepad"),
        );
        const tierObj = getMysteryBoxTier(initialPkg);
        const defaultTierLoot =
          DEFAULT_MYSTERY_BOX_LOOT[tierObj.id] ||
          DEFAULT_MYSTERY_BOX_LOOT.Básico;
        if (rewardToEdit.lootItems && rewardToEdit.lootItems.length === 3) {
          setLootItems([
            { ...rewardToEdit.lootItems[0] },
            { ...rewardToEdit.lootItems[1] },
            { ...rewardToEdit.lootItems[2] },
          ]);
          setHasCustomizedLoot(true);
        } else {
          setLootItems([
            { ...defaultTierLoot[0] },
            { ...defaultTierLoot[1] },
            { ...defaultTierLoot[2] },
          ]);
          setHasCustomizedLoot(false);
        }
      } else if (prefillDraft) {
        const draftPkg =
          COUPON_PACKAGE_OPTIONS.find(
            (opt) =>
              opt.id === (prefillDraft.suggestedPackageLevel || "Premium"),
          ) ?? COUPON_PACKAGE_OPTIONS[2];
        const draftCat = prefillDraft.category || "Nenhum";
        const draftIsDebt = toCategoryMessageKey(draftCat) === "DEBT";
        setTitle(prefillDraft.title || "");
        setDescription(prefillDraft.description || "");
        setType(prefillDraft.type || "TimeBased");
        setCategory(draftIsDebt ? "Nenhum" : draftCat);
        lastRegularCategoryRef.current = draftIsDebt ? "Nenhum" : draftCat;
        wasSingleUseDebtRef.current = false;
        setPackageLevel(draftPkg.id);
        setBaseDurationMinutes(String(draftPkg.suggestedMinutes ?? 60));
        setPrice(String(draftPkg.suggestedPrice ?? 15));
        setSelectedIcon(prefillDraft.iconName || "gamepad");
        setLootItems([
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[0] },
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[1] },
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[2] },
        ]);
        setHasCustomizedLoot(false);
      } else {
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
        setLootItems([
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[0] },
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[1] },
          { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[2] },
        ]);
        setHasCustomizedLoot(false);
      }
    }
  }, [isOpen, rewardToEdit, prefillDraft]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    const isBatchCouponCreation =
      !isEditing && type === "TimeBased" && createMultiplePackages;

    if (isBatchCouponCreation) {
      const selectedOptions = COUPON_PACKAGE_OPTIONS.filter(
        (opt) =>
          opt.id !== "Nenhum" &&
          selectedBatchPackages.some(
            (selected) =>
              toPackageMessageKey(selected) === toPackageMessageKey(opt.id),
          ),
      );
      if (selectedOptions.length === 0) {
        toast.error(t("batchPackagesRequired"));
        return;
      }

      startTransition(async () => {
        const createdRewards: Reward[] = [];
        const baseName = title.trim();
        const optionVariants = selectedOptions.map((opt) => ({
          opt,
          suffix: opt.suggestedMinutes
            ? ` (${formatFocusMinutes(opt.suggestedMinutes)})`
            : ` - ${opt.id}`,
        }));
        // Truncar a base pelo maior sufixo selecionado garante que todo o lote compartilhe o mesmo prefixo ao agrupar na vitrine
        const maxSuffixLength = optionVariants.reduce(
          (max, item) => Math.max(max, item.suffix.length),
          0,
        );
        const safeBase = baseName
          .slice(0, Math.max(1, 30 - maxSuffixLength))
          .trim();

        // Criação sequencial garante orderIndex previsível no backend (getMaxOrderIndex + 1)
        for (const { opt, suffix } of optionVariants) {
          const variantTitle = `${safeBase}${suffix}`;
          const variantInput = {
            title: variantTitle,
            description: description.trim(),
            price: opt.suggestedPrice ?? 8,
            type: "TimeBased" as RewardType,
            category,
            packageLevel: opt.id,
            baseDurationMinutes: opt.suggestedMinutes ?? 30,
            icon: selectedIcon,
            lootItems: undefined,
          };

          const payload = mapRewardFormToCreatePayload(variantInput);
          const result = await createReward(payload);
          if (!result.success) {
            if (createdRewards.length > 0) {
              onSuccess?.(createdRewards);
            }
            toast.error(result.error || t("createError"));
            return;
          }

          const createdId =
            result.data &&
            typeof result.data === "object" &&
            "id" in result.data
              ? String((result.data as { id: string }).id)
              : `rew-${Date.now()}-${opt.id}`;

          createdRewards.push({
            id: createdId,
            ...variantInput,
            iconName: selectedIcon,
            orderIndex: 0,
          });
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

    const numericPrice = parseFloat(price.replace(",", "."));
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      toast.error(t("invalidPrice"));
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
      const isDebtSubmission = toCategoryMessageKey(category) === "DEBT";
      const parsedDuration =
        type === "TimeBased"
          ? Math.max(5, parseInt(baseDurationMinutes, 10) || 30)
          : undefined;

      const tier = getMysteryBoxTier(packageLevel);
      const tierDefaultLoot =
        DEFAULT_MYSTERY_BOX_LOOT[tier.id] ?? DEFAULT_MYSTERY_BOX_LOOT.Básico;

      const normalizedLootItems =
        type === "MysteryBox"
          ? lootItems.map((slot, idx) => {
              const slotIdx = idx as 0 | 1 | 2;
              const tierCap = tier.slotMaxMinutes[slotIdx];
              const normalizedCategory = slot.category?.trim() || undefined;
              const normalizedDescription =
                slot.description?.trim() || undefined;
              return {
                name: slot.name.trim() || tierDefaultLoot[slotIdx].name,
                icon: slot.icon || "gift",
                minutes:
                  slot.minutes && slot.minutes > 0
                    ? Math.min(Math.max(5, slot.minutes), tierCap)
                    : null,
                ...(normalizedCategory ? { category: normalizedCategory } : {}),
                ...(normalizedDescription
                  ? { description: normalizedDescription }
                  : {}),
              };
            })
          : undefined;

      const formInput = {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        type,
        category,
        packageLevel: isDebtSubmission
          ? ("Nenhum" as PackageLevel)
          : packageLevel,
        baseDurationMinutes: parsedDuration,
        icon: selectedIcon,
        lootItems: normalizedLootItems,
      };

      if (isEditing && rewardToEdit) {
        const payload = mapRewardFormToUpdatePayload(formInput);
        const result = await updateReward(rewardToEdit.id, payload);

        if (!result.success) {
          toast.error(result.error || t("updateError"));
          return;
        }

        const updatedReward: Reward = {
          ...rewardToEdit,
          ...formInput,
          iconName: selectedIcon,
        };

        toast.success(t("updateSuccess"));
        onSuccess?.(updatedReward);
        onClose();
      } else {
        const payload = mapRewardFormToCreatePayload(formInput);
        const result = await createReward(payload);

        if (!result.success) {
          toast.error(result.error || t("createError"));
          return;
        }

        const createdId =
          result.data && typeof result.data === "object" && "id" in result.data
            ? String((result.data as { id: string }).id)
            : `rew-${Date.now()}`;

        const newReward: Reward = {
          id: createdId,
          ...formInput,
          iconName: selectedIcon,
          orderIndex: 0,
        };

        soundEffects.playCreateSound();
        toast.success(t("createSuccess", { title: formInput.title }), {
          description: t("createSuccessDescription"),
        });
        onSuccess?.(newReward);
        onClose();
      }
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
    if (newType !== "SingleUse" && type === "SingleUse") {
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
      setPackageLevel(targetLevel);
      if (!isEditing) {
        const tierObj = getMysteryBoxTier(targetLevel);
        setPrice(String(tierObj.recommendedPrice));
      } else if (price === "" || price === "0") {
        setPrice("5");
      }
      setSelectedIcon("mystery_box");
      if (isDefaultBoxTitle(title)) {
        setTitle(
          t(
            isGamified
              ? "defaultMysteryBoxTitle"
              : "defaultMysteryBoxTitleProductivity",
          ),
        );
      }
    } else if (newType === "SingleUse") {
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
      if (selectedIcon === "mystery_box") {
        setSelectedIcon("gamepad");
      }
    } else if (newType === "TimeBased") {
      if (selectedIcon === "mystery_box") {
        setSelectedIcon("gamepad");
      }
      if (!isEditing) {
        if (packageLevel === "Nenhum" || packageLevel === "NONE") {
          setPackageLevel("Básico");
          setBaseDurationMinutes("30");
          setPrice("8");
        } else {
          const suggested = calculateSuggestedCouponPrice(
            Number(baseDurationMinutes) || 30,
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
        Number.parseFloat(price.replace(",", ".")) === suggestedPrice);

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
        if (prev.length <= 1) return prev;
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
    setSelectedIcon("mystery_box");
    const tierObj = getMysteryBoxTier(tierId);
    const defaultTierLoot =
      DEFAULT_MYSTERY_BOX_LOOT[tierObj.id] || DEFAULT_MYSTERY_BOX_LOOT.Básico;
    if (!hasCustomizedLoot) {
      setLootItems([
        { ...defaultTierLoot[0] },
        { ...defaultTierLoot[1] },
        { ...defaultTierLoot[2] },
      ]);
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
      const fallbackTierName =
        key !== "NONE" ? tMystery(`tiers.${key}.name`) : `Caixa ${tierId}`;
      setTitle(tierName || fallbackTierName);
    }
  };

  const handleLootSlotChange = (
    index: 0 | 1 | 2,
    updated: MysteryBoxLootItem,
  ) => {
    setHasCustomizedLoot(true);
    setLootItems((prev) => {
      const next: [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem] =
        [{ ...prev[0] }, { ...prev[1] }, { ...prev[2] }];
      next[index] = updated;
      return next;
    });
  };

  const handleApplyLootPreset = (
    presetItems: readonly [
      MysteryBoxLootItem,
      MysteryBoxLootItem,
      MysteryBoxLootItem,
    ],
  ) => {
    setHasCustomizedLoot(true);
    setLootItems([
      { ...presetItems[0] },
      { ...presetItems[1] },
      { ...presetItems[2] },
    ]);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!hasManuallyChangedIcon && type !== "MysteryBox") {
      const suggested = suggestRewardIconFromTitle(newTitle);
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

  const handleBaseDurationChange = (newDuration: string) => {
    setBaseDurationMinutes(newDuration);
    if (type === "TimeBased" && !isEditing && !hasManuallyEditedPrice) {
      const parsed = Number.parseInt(newDuration, 10);
      if (Number.isFinite(parsed) && parsed >= 5) {
        setPrice(String(calculateSuggestedCouponPrice(parsed)));
      }
    }
  };

  const handleCategoryChange = (nextCategory: RewardCategory) => {
    setCategory(nextCategory);
    const isDebt = toCategoryMessageKey(nextCategory) === "DEBT";
    wasSingleUseDebtRef.current = isDebt;
    if (!isDebt) {
      lastRegularCategoryRef.current = nextCategory;
    }
  };

  const handleDebtToggleChange = (isDebt: boolean) => {
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

  return {
    isEditing,
    isPending,
    title,
    setTitle,
    handleTitleChange,
    description,
    setDescription,
    price,
    setPrice,
    handlePriceChange,
    applySuggestedPrice,
    type,
    setType,
    handleTypeChange,
    category,
    setCategory,
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
    setSelectedIcon,
    handleIconSelect,
    lootItems,
    handleLootSlotChange,
    handleApplyLootPreset,
    handleSubmit,
  };
}
