"use client";

import { Loader2 } from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
import { IconPicker } from "@/components/ui/IconPicker";
import {
  CATEGORY_LABELS,
  PACKAGE_LEVEL_COLOR,
  REWARD_ICONS,
  REWARD_TYPE_META,
} from "@/constants/reward";
import { useRewardForm } from "@/hooks/useRewardForm";
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
  const {
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
  } = useRewardForm({
    isOpen,
    rewardToEdit,
    onSuccess,
    onClose,
  });

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
                  className="bg-popover text-neutral-100"
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
                  className="bg-popover text-neutral-100"
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
                  className="bg-popover text-neutral-100"
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
              onChange={(e) => setBaseDurationMinutes(e.target.value)}
              onBlur={() => {
                if (!baseDurationMinutes || Number(baseDurationMinutes) < 5) {
                  setBaseDurationMinutes("5");
                }
              }}
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
