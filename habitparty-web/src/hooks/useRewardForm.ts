"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createReward, updateReward } from "@/actions/rewardActions";
import {
  calculateSuggestedCouponPrice,
  DEFAULT_MYSTERY_BOX_LOOT,
} from "@/constants/reward";
import type {
  MysteryBoxLootItem,
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";
import {
  getMysteryBoxTier,
  mapRewardFormToCreatePayload,
  mapRewardFormToUpdatePayload,
  suggestRewardIconFromTitle,
  toPackageMessageKey,
} from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

interface UseRewardFormProps {
  isOpen: boolean;
  rewardToEdit?: Reward | null;
  onSuccess?: (reward: Reward) => void;
  onClose: () => void;
}

export function useRewardForm({
  isOpen,
  rewardToEdit,
  onSuccess,
  onClose,
}: UseRewardFormProps) {
  const t = useTranslations("rewards.hook");
  const tMystery = useTranslations("rewards.mysteryBox");
  const isEditing = Boolean(rewardToEdit);
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("10");
  const [type, setType] = useState<RewardType>("SingleUse");
  const [category, setCategory] = useState<RewardCategory>("Nenhum");
  const [packageLevel, setPackageLevel] = useState<PackageLevel>("Nenhum");
  const [baseDurationMinutes, setBaseDurationMinutes] = useState("30");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [hasManuallyChangedIcon, setHasManuallyChangedIcon] = useState(false);
  const [lootItems, setLootItems] = useState<
    [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem]
  >(() => [
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[0] },
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[1] },
    { ...DEFAULT_MYSTERY_BOX_LOOT.Básico[2] },
  ]);
  const [hasCustomizedLoot, setHasCustomizedLoot] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasManuallyChangedIcon(false);
      if (rewardToEdit) {
        setTitle(rewardToEdit.title || "");
        setDescription(rewardToEdit.description || "");
        setPrice(
          rewardToEdit.price !== undefined ? String(rewardToEdit.price) : "10",
        );
        setType((rewardToEdit.type as RewardType) || "SingleUse");
        setCategory((rewardToEdit.category as RewardCategory) || "Nenhum");
        const initialPkg =
          (rewardToEdit.packageLevel as PackageLevel) || "Nenhum";
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
      } else {
        setTitle("");
        setDescription("");
        setPrice("10");
        setType("SingleUse");
        setCategory("Nenhum");
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
  }, [isOpen, rewardToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("titleRequired"));
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
      toast.error(t("mysteryBoxPackageRequired"));
      return;
    }

    startTransition(async () => {
      const parsedDuration =
        type === "TimeBased"
          ? Math.max(5, parseInt(baseDurationMinutes, 10) || 30)
          : undefined;

      const normalizedLootItems =
        type === "MysteryBox"
          ? lootItems.map((slot, idx) => {
              const tierCap =
                getMysteryBoxTier(packageLevel).slotMaxMinutes[
                  idx as 0 | 1 | 2
                ];
              return {
                name:
                  slot.name.trim() ||
                  DEFAULT_MYSTERY_BOX_LOOT.Básico[idx as 0 | 1 | 2].name,
                icon: slot.icon || "gift",
                minutes:
                  slot.minutes && slot.minutes > 0
                    ? Math.min(Math.max(5, slot.minutes), tierCap)
                    : null,
              };
            })
          : undefined;

      const formInput = {
        title: title.trim(),
        description: description.trim(),
        price: numericPrice,
        type,
        category,
        packageLevel: type === "SingleUse" ? undefined : packageLevel,
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
    return (
      !trimmed ||
      trimmed.startsWith("Caixa") ||
      trimmed.endsWith("Box") ||
      trimmed === t("defaultMysteryBoxTitle")
    );
  };

  const handleTypeChange = (newType: RewardType) => {
    setType(newType);
    if (newType === "MysteryBox") {
      if (packageLevel === "Nenhum" || packageLevel === "NONE") {
        setPackageLevel("Básico");
      }
      if (price === "10" || price === "" || price === "0") {
        setPrice("5");
      }
      setSelectedIcon("mystery_box");
      if (isDefaultBoxTitle(title)) {
        setTitle(t("defaultMysteryBoxTitle"));
      }
    } else if (newType === "SingleUse") {
      setPackageLevel("Nenhum");
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

  const handleMysteryBoxTierSelect = (
    tierId: PackageLevel,
    recommendedPrice: number,
    tierName?: string,
  ) => {
    setPackageLevel(tierId);
    setPrice(String(recommendedPrice));
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
    type,
    setType,
    handleTypeChange,
    category,
    setCategory,
    packageLevel,
    setPackageLevel,
    handleMysteryBoxTierSelect,
    baseDurationMinutes,
    setBaseDurationMinutes,
    selectedIcon,
    setSelectedIcon,
    handleIconSelect,
    lootItems,
    handleLootSlotChange,
    handleApplyLootPreset,
    handleSubmit,
  };
}
