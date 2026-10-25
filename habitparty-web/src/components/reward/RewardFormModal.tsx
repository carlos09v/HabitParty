"use client";

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { BaseModal } from "@/components/ui/BaseModal";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { IconPickerPopover } from "@/components/ui/IconPickerPopover";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  COUPON_PACKAGE_OPTIONS,
  REWARD_FORM_CATEGORY_OPTIONS,
  REWARD_FORM_TYPE_KEYS,
  REWARD_ICONS,
  REWARD_TYPE_META,
} from "@/constants/reward";
import { useRewardForm } from "@/hooks/useRewardForm";
import type { Reward, RewardCategory, RewardType } from "@/types/reward";
import { cn } from "@/utils";
import { MysteryBoxSelector } from "./MysteryBoxSelector";

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardToEdit?: Reward | null;
  onSuccess?: (reward: Reward) => void;
}

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
    handleSubmit,
  } = useRewardForm({
    isOpen,
    rewardToEdit,
    onSuccess,
    onClose,
  });

  const rewardTypeOptions = useMemo(
    () =>
      REWARD_FORM_TYPE_KEYS.map((t) => {
        const meta = REWARD_TYPE_META[t];
        const Icon = meta?.icon;
        return {
          value: t,
          label: meta?.label || t,
          icon: Icon ? (
            <Icon size={15} className="text-gold shrink-0" />
          ) : undefined,
        };
      }),
    [],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Recompensa" : "Nova Recompensa"}
      maxWidth="max-w-lg"
      preventClose={isPending}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Nome da Recompensa e Ícone Integrados */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="rewardTitle"
            className="text-body-s text-neutral-100 font-medium select-none"
          >
            Nome da Recompensa <span className="text-gold">*</span>
          </label>
          <div className="flex items-center gap-2">
            <IconPickerPopover
              options={REWARD_ICONS}
              value={selectedIcon}
              onChange={handleIconSelect}
              disabled={isPending}
              title="Ícone da Recompensa"
            />
            <Input
              id="rewardTitle"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Ex: 1h de videogame, Café especial, Assistir filme..."
              compact
              className="h-[42px]"
              required
              maxLength={40}
              disabled={isPending}
            />
          </div>
          <span className="text-label-g text-neutral-400">
            Clique no ícone para personalizar ou digite o nome para sugestão
            automática.
          </span>
        </div>

        {/* Descrição */}
        <Textarea
          id="rewardDescription"
          label="Descrição (opcional)"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes ou regras para desfrutar da sua recompensa..."
          compact
          maxLength={120}
          disabled={isPending}
        />

        {/* Linha dupla: Tipo de Recompensa e Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="rewardType"
            label={
              <span>
                Tipo de Recompensa <span className="text-gold">*</span>
              </span>
            }
            value={type}
            onChange={(val) => handleTypeChange(val as RewardType)}
            options={rewardTypeOptions}
            disabled={isPending}
            triggerClassName="py-2 px-3 text-body-s h-[42px]"
          />

          <Select
            id="rewardCategory"
            label="Categoria"
            value={category}
            onChange={(val) => setCategory(val as RewardCategory)}
            options={REWARD_FORM_CATEGORY_OPTIONS}
            disabled={isPending}
            triggerClassName="py-2 px-3 text-body-s h-[42px]"
          />
        </div>

        {/* 4 Caixas Gamificadas Exibidas Imediatamente Abaixo do Tipo de Recompensa */}
        {type === "MysteryBox" && (
          <MysteryBoxSelector
            selectedLevel={packageLevel}
            onSelect={(tier) =>
              handleMysteryBoxTierSelect(
                tier.id,
                tier.recommendedPrice,
                tier.name,
              )
            }
            disabled={isPending}
          />
        )}

        {/* Seção Condicional se for TimeBased (Cupom - Opção C) */}
        {type === "TimeBased" && (
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-surface/30 border border-white/10 animate-in fade-in duration-150">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rewardDuration"
                  className="text-body-s text-neutral-100 font-medium"
                >
                  Duração da Atividade (minutos){" "}
                  <span className="text-gold">*</span>
                </label>
                <span className="text-label-m text-neutral-400">
                  (tempo que será consumido no Foco)
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
                placeholder="Ex: 30, 60, 120"
                compact
                className="font-semibold h-[42px]"
                disabled={isPending}
              />
            </div>

            {/* Chips de Pacote / Atalhos de Tempo */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-body-s text-neutral-100 font-medium">
                  Nível do Pacote
                </span>
                <span className="text-label-m text-neutral-400">
                  (opcional • clique para aplicar tempo sugerido)
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
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-label-g font-semibold transition-all cursor-pointer select-none active:scale-95",
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
                      <span>{pkg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custo em Moedas/Pontos */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="rewardPrice"
              className="text-body-s text-neutral-100 font-medium"
            >
              Custo em Moedas <span className="text-gold">*</span>
            </label>
            {type === "MysteryBox" && (
              <span className="text-label-m text-gold font-medium">
                (Preço sugerido por raridade)
              </span>
            )}
          </div>
          <Input
            id="rewardPrice"
            type="number"
            step="any"
            min="0.01"
            max={99999}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 5, 15, 35 ou 80"
            compact
            icon={<CoinIcon size={16} withGlow />}
            className="font-bold h-[42px]"
            required
            disabled={isPending}
          />
          {type === "MysteryBox" && (
            <span className="text-label-m text-neutral-400">
              Você pode manter o preço calibrado para o pacote ou personalizá-lo
              livremente.
            </span>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-white/10 flex-wrap">
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
