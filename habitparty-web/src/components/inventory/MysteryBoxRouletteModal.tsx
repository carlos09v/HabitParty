"use client";

import { Check, Dices, Sparkles } from "lucide-react";
import type { MysteryBoxOpenResult } from "@/actions/inventoryActions";
import { BaseModal } from "@/components/ui/BaseModal";
import { getRewardIcon } from "@/constants/reward";
import { useMysteryBoxRoulette } from "@/hooks/useMysteryBoxRoulette";
import type { InventoryItem } from "@/types/inventory";
import { cn } from "@/utils";

interface MysteryBoxRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  onSuccess?: (result: MysteryBoxOpenResult) => void;
}

export function MysteryBoxRouletteModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}: MysteryBoxRouletteModalProps) {
  const {
    phase,
    wonResult,
    translateX,
    trackItems,
    isOpeningServer,
    containerRef,
    handleSpin,
    tierConfig,
    winningIndex,
  } = useMysteryBoxRoulette({
    isOpen,
    item,
    onSuccess,
  });

  if (!isOpen || !item) return null;

  const TierIcon = tierConfig.icon;
  const isSpinning = phase === "spinning";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-2xl"
      preventClose={isSpinning || isOpeningServer}
      showCloseButton={!isSpinning}
      className="relative flex flex-col items-center gap-5 overflow-hidden"
    >
      {/* Aura de fundo temática da raridade */}
      <div
        className="absolute -top-24 inset-x-0 h-48 opacity-30 pointer-events-none blur-3xl"
        style={{ background: tierConfig.accentGlow }}
      />

      {/* Header do Sorteio */}
      <div className="flex flex-col items-center text-center gap-1 relative z-10">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border",
              tierConfig.borderClass,
              tierConfig.bgClass,
            )}
          >
            <TierIcon size={18} className={tierConfig.textClass} />
          </div>
          <h2 className="text-body-l font-black text-neutral-50 uppercase tracking-wide">
            {item.reward.title}
          </h2>
        </div>
        <p className="text-label-g text-neutral-300">
          {phase === "won"
            ? "Parabéns! Veja o prêmio que você tirou nesta rodada:"
            : "Role os dados da sorte e descubra qual prêmio sairá da sua caixa!"}
        </p>
      </div>

      {/* Roleta Horizontal CS:GO / Lootbox Style */}
      <div className="w-full flex flex-col items-center relative my-2">
        {/* Indicador Central Dourado Superior */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <span className="text-gold text-xs leading-none drop-shadow-[0_0_8px_rgba(255,184,0,0.8)] animate-pulse">
            ▼
          </span>
        </div>

        {/* Linha Laser Guia Central */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-gold via-gold/60 to-gold z-20 pointer-events-none shadow-[0_0_12px_rgba(255,184,0,0.8)]" />

        {/* Viewport com overflow oculto e bordas degradê */}
        <div
          ref={containerRef}
          className="relative w-full h-[164px] bg-neutral-950/80 border-2 border-primary/40 rounded-2xl overflow-hidden shadow-inner flex items-center"
        >
          {/* Sombras de vinheta esquerda e direita */}
          <div className="absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-neutral-950 via-neutral-950/70 to-transparent z-10 pointer-events-none" />

          {/* Fita deslizante com os cards */}
          <div
            className="flex items-center gap-3 absolute left-0 pl-4 select-none will-change-transform"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: isSpinning
                ? "transform 4.5s cubic-bezier(0.12, 0.8, 0.2, 1)"
                : "none",
            }}
          >
            {trackItems.map((trackItem, index) => {
              const ItemIcon = getRewardIcon(trackItem.icon);
              const isSelectedWinningCard =
                phase === "won" && index === winningIndex;

              return (
                <div
                  key={trackItem.id}
                  className={cn(
                    "w-[132px] h-[138px] rounded-xl border flex flex-col items-center justify-between p-2.5 transition-all duration-300 shrink-0 relative overflow-hidden",
                    isSelectedWinningCard
                      ? "bg-gold/20 border-gold ring-4 ring-gold/40 shadow-[0_0_24px_rgba(255,184,0,0.6)] scale-105"
                      : "bg-surface/60 border-white/10 hover:border-white/20",
                  )}
                >
                  {/* Badge da porcentagem / raridade */}
                  <span
                    className={cn(
                      "text-label-m font-bold px-1.5 py-0.5 rounded border leading-none self-end",
                      trackItem.badgeVariant === "emerald"
                        ? "text-success-400 bg-success-500/15 border-success-500/30"
                        : trackItem.badgeVariant === "amber"
                          ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
                          : trackItem.badgeVariant === "purple"
                            ? "text-magenta bg-magenta/15 border-magenta/30"
                            : "text-gold bg-gold/15 border-gold/30",
                    )}
                  >
                    {trackItem.badgeLabel}
                  </span>

                  {/* Ícone do Item */}
                  <div
                    className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center border my-auto transition-transform",
                      isSelectedWinningCard
                        ? "bg-gold/25 border-gold text-gold scale-110"
                        : "bg-white/5 border-white/10 text-neutral-200",
                    )}
                  >
                    <ItemIcon size={22} />
                  </div>

                  {/* Título do Prêmio */}
                  <div className="flex flex-col items-center text-center w-full">
                    <span className="text-tiny font-bold text-neutral-100 truncate w-full">
                      {trackItem.name}
                    </span>
                    <span className="text-tiny text-neutral-400 truncate w-full">
                      {trackItem.minutes
                        ? `Cupom ${trackItem.minutes}m`
                        : "Uso Único"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicador Central Dourado Inferior */}
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <span className="text-gold text-xs leading-none drop-shadow-[0_0_8px_rgba(255,184,0,0.8)] animate-pulse">
            ▲
          </span>
        </div>
      </div>

      {/* Revelação do Prêmio Conquistado */}
      {phase === "won" && wonResult && (
        <div className="w-full flex flex-col items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/40 shadow-glow-gold-xs animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-gold font-bold text-body-m">
            <Sparkles size={18} className="animate-spin text-gold" />
            <span>Prêmio Desbloqueado com Sucesso!</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shadow-md">
              {(() => {
                const WinIcon = getRewardIcon(wonResult.rewardIcon);
                return <WinIcon size={24} />;
              })()}
            </div>
            <div className="flex flex-col">
              <span className="text-body-m font-black text-neutral-50">
                {wonResult.rewardName}
              </span>
              <span className="text-label-g text-neutral-300">
                {wonResult.remainingMinutes
                  ? `Item de Foco (${wonResult.remainingMinutes} minutos)`
                  : "Item de Uso Único direto da Mochila"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center justify-center gap-3 w-full pt-2">
        {phase === "idle" && (
          <button
            type="button"
            disabled={isOpeningServer}
            onClick={handleSpin}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 via-gold to-orange-500 rounded-xl text-neutral-950 font-black text-body-m hover:brightness-110 active:scale-95 transition-all shadow-glow-gold-sm cursor-pointer disabled:opacity-50"
          >
            <Dices size={20} className="text-neutral-950" />
            <span>{isOpeningServer ? "Sorteando..." : "Girar Roleta!"}</span>
          </button>
        )}

        {isSpinning && (
          <div className="flex items-center gap-2 text-gold font-bold py-2 animate-pulse">
            <Sparkles size={18} />
            <span>Girando a sorte...</span>
          </div>
        )}

        {phase === "won" && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark border border-primary-light/40 rounded-xl text-neutral-50 font-bold text-body-s hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Check size={18} />
            <span>Guardar na Mochila</span>
          </button>
        )}
      </div>
    </BaseModal>
  );
}
