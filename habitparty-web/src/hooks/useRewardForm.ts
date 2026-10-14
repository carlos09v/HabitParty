"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createReward, updateReward } from "@/actions/rewardActions";
import type {
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";
import {
  mapRewardFormToCreatePayload,
  mapRewardFormToUpdatePayload,
} from "@/utils/rewardMapper";

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

  useEffect(() => {
    if (isOpen) {
      if (rewardToEdit) {
        setTitle(rewardToEdit.title || "");
        setDescription(rewardToEdit.description || "");
        setPrice(
          rewardToEdit.price !== undefined ? String(rewardToEdit.price) : "10",
        );
        setType((rewardToEdit.type as RewardType) || "SingleUse");
        setCategory((rewardToEdit.category as RewardCategory) || "Nenhum");
        setPackageLevel(
          (rewardToEdit.packageLevel as PackageLevel) || "Nenhum",
        );
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
      } else {
        setTitle("");
        setDescription("");
        setPrice("10");
        setType("SingleUse");
        setCategory("Nenhum");
        setPackageLevel("Nenhum");
        setBaseDurationMinutes("30");
        setSelectedIcon("gamepad");
      }
    }
  }, [isOpen, rewardToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("O título da recompensa é obrigatório.");
      return;
    }

    const numericPrice = parseFloat(price.replace(",", "."));
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      toast.error("O preço deve ser um valor válido maior que zero.");
      return;
    }

    if (
      type === "MysteryBox" &&
      (packageLevel === "Nenhum" || packageLevel === "NONE")
    ) {
      toast.error(
        "Caixa Misteriosa precisa de um nível de pacote selecionado.",
      );
      return;
    }

    startTransition(async () => {
      const parsedDuration =
        type === "TimeBased"
          ? Math.max(5, parseInt(baseDurationMinutes, 10) || 30)
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
      };

      if (isEditing && rewardToEdit) {
        const payload = mapRewardFormToUpdatePayload(formInput);
        const result = await updateReward(rewardToEdit.id, payload);

        const updatedReward: Reward = {
          ...rewardToEdit,
          ...formInput,
          iconName: selectedIcon,
        };

        if (result.success) {
          toast.success("Recompensa atualizada com sucesso!");
        } else {
          toast.error(
            result.error || "Erro ao atualizar recompensa no servidor.",
          );
        }

        onSuccess?.(updatedReward);
        onClose();
      } else {
        const payload = mapRewardFormToCreatePayload(formInput);
        const result = await createReward(payload);

        const createdId =
          result.success &&
          result.data &&
          typeof result.data === "object" &&
          "id" in result.data
            ? String((result.data as { id: string }).id)
            : `rew-${Date.now()}`;

        const newReward: Reward = {
          id: createdId,
          ...formInput,
          iconName: selectedIcon,
          orderIndex: 0,
        };

        if (result.success) {
          toast.success("Recompensa criada com sucesso!");
        } else {
          toast.error(result.error || "Erro ao criar recompensa no servidor.");
        }

        onSuccess?.(newReward);
        onClose();
      }
    });
  };

  return {
    isEditing,
    isPending,
    title,
    setTitle,
    description,
    setDescription,
    price,
    setPrice,
    type,
    setType,
    category,
    setCategory,
    packageLevel,
    setPackageLevel,
    baseDurationMinutes,
    setBaseDurationMinutes,
    selectedIcon,
    setSelectedIcon,
    handleSubmit,
  };
}
