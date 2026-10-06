"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createReward, updateReward } from "@/actions/rewardActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPicker } from "@/components/ui/IconPicker";
import {
  CATEGORY_LABELS,
  PACKAGE_LEVEL_COLOR,
  REWARD_ICONS,
  REWARD_TYPE_META,
} from "@/constants/reward";
import { useRewardStore } from "@/store/rewardStore";
import type {
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: Reward | null;
  onSuccess?: (reward: Reward) => void;
}

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS) as RewardCategory[];
const TYPE_KEYS = Object.keys(REWARD_TYPE_META) as RewardType[];
const PACKAGE_LEVEL_KEYS = Object.keys(PACKAGE_LEVEL_COLOR) as PackageLevel[];

export function RewardFormModal({
  isOpen,
  onClose,
  rewardToEdit,
  onSuccess,
}: RewardFormModalProps) {
  const isEditing = !!rewardToEdit;
  const [isPending, startTransition] = useTransition();

  const { addReward, updateRewardItem } = useRewardStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("10");
  const [type, setType] = useState<RewardType>("SingleUse");
  const [category, setCategory] = useState<RewardCategory>("Nenhum");
  const [packageLevel, setPackageLevel] = useState<PackageLevel>("Nenhum");
  const [baseDurationMinutes, setBaseDurationMinutes] = useState<number>(30);
  const [selectedIcon, setSelectedIcon] = useState<string>("gamepad");

  // Sync form state when opening or when rewardToEdit changes
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
        setBaseDurationMinutes(rewardToEdit.baseDurationMinutes ?? 30);
        setSelectedIcon(
          rewardToEdit.icon ||
            (rewardToEdit.iconName as string) ||
            (rewardToEdit.type === "MysteryBox" ? "mystery_box" : "gamepad"),
        );
      } else {
        // Reset defaults for creation
        setTitle("");
        setDescription("");
        setPrice("10");
        setType("SingleUse");
        setCategory("Nenhum");
        setPackageLevel("Nenhum");
        setBaseDurationMinutes(30);
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
      // Map frontend enum to backend schema
      const backendType =
        type === "SingleUse"
          ? "SINGLE_USE"
          : type === "TimeBased"
            ? "TIME_BASED"
            : "MISTERY_BOX";

      const backendCategory =
        category === "Nenhum" || category === "NONE"
          ? "NONE"
          : category === "Entretenimento"
            ? "ENTERTAINMENT"
            : category === "Bem-estar"
              ? "WELLNESS"
              : category === "Compras"
                ? "SHOPPING"
                : category === "Desenvolvimento"
                  ? "DEVELOPMENT"
                  : category === "Sorte"
                    ? "LUCK"
                    : "HOBBIES";

      const backendPackageLevel =
        type === "SingleUse"
          ? undefined
          : packageLevel === "Nenhum" || packageLevel === "NONE"
            ? "NONE"
            : packageLevel === "Básico"
              ? "BASIC"
              : packageLevel === "Premium"
                ? "PREMIUM"
                : packageLevel === "Épico"
                  ? "EPIC"
                  : "LEGENDARY";

      if (isEditing && rewardToEdit) {
        // Modo Edição
        const result = await updateReward(rewardToEdit.id, {
          name: title.trim(),
          description: description.trim(),
          price: numericPrice,
          type: backendType,
          category: backendCategory,
          packageLevel: backendPackageLevel,
          icon: selectedIcon,
          baseDurationMinutes:
            type === "TimeBased" ? Number(baseDurationMinutes) : undefined,
        });

        if (result.success) {
          const updatedReward: Reward = {
            ...rewardToEdit,
            title: title.trim(),
            description: description.trim(),
            price: numericPrice,
            type,
            category,
            packageLevel: type === "SingleUse" ? undefined : packageLevel,
            icon: selectedIcon,
            iconName: selectedIcon,
            baseDurationMinutes:
              type === "TimeBased" ? Number(baseDurationMinutes) : undefined,
          };
          updateRewardItem(rewardToEdit.id, updatedReward);
          toast.success("Recompensa atualizada com sucesso!");
          onSuccess?.(updatedReward);
          onClose();
        } else {
          // Fallback gracioso para a store local se o backend falhar/offline
          const updatedReward: Reward = {
            ...rewardToEdit,
            title: title.trim(),
            description: description.trim(),
            price: numericPrice,
            type,
            category,
            packageLevel: type === "SingleUse" ? undefined : packageLevel,
            icon: selectedIcon,
            iconName: selectedIcon,
            baseDurationMinutes:
              type === "TimeBased" ? Number(baseDurationMinutes) : undefined,
          };
          updateRewardItem(rewardToEdit.id, updatedReward);
          toast.success("Recompensa atualizada localmente!");
          onSuccess?.(updatedReward);
          onClose();
        }
      } else {
        // Modo Criação
        const result = await createReward({
          name: title.trim(),
          description: description.trim(),
          price: numericPrice,
          type: backendType,
          category: backendCategory,
          packageLevel: backendPackageLevel,
          icon: selectedIcon,
          baseDurationMinutes:
            type === "TimeBased" ? Number(baseDurationMinutes) : undefined,
        });

        const createdId =
          result.success &&
          result.data &&
          typeof result.data === "object" &&
          "id" in result.data
            ? String((result.data as { id: string }).id)
            : `rew-${Date.now()}`;

        const newReward: Reward = {
          id: createdId,
          title: title.trim(),
          description: description.trim(),
          price: numericPrice,
          type,
          category,
          packageLevel: type === "SingleUse" ? undefined : packageLevel,
          duration:
            type === "TimeBased" ? `${baseDurationMinutes}min` : undefined,
          baseDurationMinutes:
            type === "TimeBased" ? Number(baseDurationMinutes) : undefined,
          icon: selectedIcon,
          iconName: selectedIcon,
        };

        addReward(newReward);

        if (result.success) {
          toast.success("Recompensa criada com sucesso!");
        } else {
          toast.success("Recompensa criada localmente!");
        }

        onSuccess?.(newReward);
        onClose();
      }
    });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Recompensa" : "Nova Recompensa"}
      maxWidth="max-w-lg"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Título / Nome */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rewardTitle"
            className="text-body-s text-neutral-300 font-medium"
          >
            Nome da Recompensa <span className="text-gold">*</span>
          </label>
          <input
            id="rewardTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: 1h de videogame, Café especial..."
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
            required
            maxLength={40}
            disabled={isPending}
          />
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rewardDescription"
            className="text-body-s text-neutral-300 font-medium"
          >
            Descrição{" "}
            <span className="text-neutral-500 text-xs">(opcional)</span>
          </label>
          <textarea
            id="rewardDescription"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes ou regras para desfrutar da sua recompensa..."
            className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s resize-none"
            maxLength={120}
            disabled={isPending}
          />
        </div>

        {/* Linha dupla: Custo (Moedas) e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Custo em Moedas/Pontos */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rewardPrice"
              className="text-body-s text-neutral-300 font-medium"
            >
              Custo em Moedas <span className="text-gold">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 w-4 h-4 rounded-full bg-gold border border-orange-500 flex items-center justify-center shrink-0">
                <span className="text-label-m text-neutral-900 font-bold leading-none">
                  H
                </span>
              </div>
              <input
                id="rewardPrice"
                type="number"
                step="any"
                min="0.01"
                max={99999}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 10 ou 10.5"
                className="w-full bg-background/50 border border-primary/40 rounded-lg pl-9 pr-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s font-bold"
                required
                disabled={isPending}
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rewardCategory"
              className="text-body-s text-neutral-300 font-medium"
            >
              Categoria
            </label>
            <select
              id="rewardCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value as RewardCategory)}
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
              disabled={isPending}
            >
              {CATEGORY_KEYS.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-[#1a0f35] text-neutral-100"
                >
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Linha dupla: Tipo e Nível do Pacote */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Tipo de Recompensa */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rewardType"
              className="text-body-s text-neutral-300 font-medium"
            >
              Tipo de Recompensa
            </label>
            <select
              id="rewardType"
              value={type}
              onChange={(e) => setType(e.target.value as RewardType)}
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer"
              disabled={isPending}
            >
              {TYPE_KEYS.map((t) => (
                <option
                  key={t}
                  value={t}
                  className="bg-[#1a0f35] text-neutral-100"
                >
                  {REWARD_TYPE_META[t]?.label || t}
                </option>
              ))}
            </select>
          </div>

          {/* Nível do Pacote */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rewardPackage"
              className="text-body-s text-neutral-300 font-medium"
            >
              Pacote / Raridade{" "}
              {type === "SingleUse" && (
                <span className="text-neutral-500 text-xs">
                  (não aplicável)
                </span>
              )}
            </label>
            <select
              id="rewardPackage"
              value={type === "SingleUse" ? "Nenhum" : packageLevel}
              onChange={(e) => setPackageLevel(e.target.value as PackageLevel)}
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending || type === "SingleUse"}
            >
              {PACKAGE_LEVEL_KEYS.map((level) => (
                <option
                  key={level}
                  value={level}
                  className="bg-[#1a0f35] text-neutral-100"
                >
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duração Condicional se for TimeBased */}
        {type === "TimeBased" && (
          <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            <label
              htmlFor="rewardDuration"
              className="text-body-s text-neutral-300 font-medium"
            >
              Duração da Atividade (minutos)
            </label>
            <input
              id="rewardDuration"
              type="number"
              min={5}
              max={1440}
              step={5}
              value={baseDurationMinutes}
              onChange={(e) =>
                setBaseDurationMinutes(Math.max(5, Number(e.target.value)))
              }
              className="w-full bg-background/50 border border-primary/40 rounded-lg px-3 py-2 text-neutral-50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
              disabled={isPending}
            />
          </div>
        )}

        {/* Escolha do Ícone */}
        <div className="flex flex-col gap-2">
          <span className="text-body-s text-neutral-300 font-medium">
            Ícone da Recompensa
          </span>
          <IconPicker
            options={REWARD_ICONS}
            value={selectedIcon}
            onChange={setSelectedIcon}
            disabled={isPending}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-body-s text-neutral-300 hover:text-neutral-50 transition-colors focus:outline-none rounded-lg disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-primary-dark border border-primary-light/30 rounded-lg text-neutral-50 text-body-s font-bold hover:brightness-110 transition-all focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <span>
                {isEditing ? "Salvar Alterações" : "Salvar Recompensa"}
              </span>
            )}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
