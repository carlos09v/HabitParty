"use client";

import { ArrowRight, Check, Dices, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { BaseModal } from "@/components/ui/BaseModal";
import { getRarityTheme } from "@/constants/achievements";
import { getMysteryBadgeVariantClass } from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useMysteryBoxRoulette } from "@/hooks/useMysteryBoxRoulette";
import type { InventoryItem, MysteryBoxOpenResult } from "@/types/inventory";
import { cn, resolveArtifactCopy } from "@/utils";
import { getRewardIcon } from "@/utils/rewardMapper";

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
  const router = useRouter();
  const t = useTranslations("inventory.rouletteModal");
  const tArtifacts = useTranslations("showcase.artifacts");
  const { isGamified } = useExperienceMode();
  const {
    phase,
    wonResult,
    translateX,
    trackItems,
    poolItems,
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
      {/* Aura de fundo temática da raridade (gradiente radial pré-composto, zero blur-3xl) */}
      <div
        className="absolute -top-24 inset-x-0 h-56 opacity-25 dark:opacity-35 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 75% 85% at 50% 0%, ${tierConfig.accentGlow}, transparent 72%)`,
        }}
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
            ? isGamified
              ? t("subtitleWon")
              : t("subtitleWonProductivity")
            : isGamified
              ? t("subtitleIdle")
              : t("subtitleIdleProductivity")}
        </p>
      </div>

      {/* Roleta Horizontal CS:GO / Lootbox Style */}
      <div className="w-full flex flex-col items-center relative my-2">
        {/* Indicador Central Dourado Superior */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <span className="text-amber-600 dark:text-gold text-xs leading-none dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)] animate-pulse">
            ▼
          </span>
        </div>

        {/* Linha Laser Guia Central */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-linear-to-b from-amber-500 via-amber-500/60 to-amber-500 dark:from-gold dark:via-gold/60 dark:to-gold z-20 pointer-events-none shadow-xs dark:shadow-[0_0_12px_rgba(255,184,0,0.8)]" />

        {/* Viewport com overflow oculto e bordas degradê */}
        <div
          ref={containerRef}
          className="relative w-full h-[164px] bg-surface/80 dark:bg-neutral-950/80 border-2 border-neutral-700 dark:border-primary/40 rounded-2xl overflow-hidden shadow-inner flex items-center"
        >
          {/* Sombras de vinheta esquerda e direita */}
          <div className="absolute left-0 inset-y-0 w-7 sm:w-16 bg-linear-to-r from-card via-card/70 dark:from-neutral-950 dark:via-neutral-950/70 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-7 sm:w-16 bg-linear-to-l from-card via-card/70 dark:from-neutral-950 dark:via-neutral-950/70 to-transparent z-10 pointer-events-none" />

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
                    "w-[132px] h-[138px] rounded-xl border flex flex-col items-center justify-between p-2.5 transition-[transform,scale,border-color,background-color,box-shadow] duration-300 shrink-0 relative overflow-hidden",
                    isSelectedWinningCard
                      ? "bg-amber-500/15 border-amber-500 ring-4 ring-amber-500/25 shadow-md dark:bg-gold/20 dark:border-gold dark:ring-gold/40 dark:shadow-[0_0_24px_rgba(255,184,0,0.6)] scale-105"
                      : "bg-card dark:bg-surface/60 border-neutral-700 dark:border-white/10 hover:border-neutral-600 dark:hover:border-white/20 shadow-2xs dark:shadow-none",
                  )}
                >
                  {/* Badge da porcentagem / raridade */}
                  <span
                    className={cn(
                      "text-label-m font-bold px-1.5 py-0.5 rounded border leading-none self-end",
                      getMysteryBadgeVariantClass(trackItem.badgeVariant),
                    )}
                  >
                    {trackItem.badgeLabel}
                  </span>

                  {/* Ícone do Item */}
                  <div
                    className={cn(
                      "w-11 h-11 rounded-lg flex items-center justify-center border my-auto transition-transform",
                      isSelectedWinningCard
                        ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:bg-gold/25 dark:border-gold dark:text-gold scale-110"
                        : "bg-surface dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-300 dark:text-neutral-200",
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
                        ? t("trackCouponMinutes", {
                            minutes: trackItem.minutes,
                          })
                        : t("trackSingleUse")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicador Central Dourado Inferior */}
        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
          <span className="text-amber-600 dark:text-gold text-xs leading-none dark:drop-shadow-[0_0_8px_rgba(255,184,0,0.8)] animate-pulse">
            ▲
          </span>
        </div>
      </div>

      {/* Grade de 3 Prêmios Possíveis e suas Probabilidades */}
      {phase === "idle" && poolItems.length > 0 && (
        <div className="w-full flex flex-col gap-2">
          <span className="text-label-m text-neutral-400 font-medium">
            {isGamified
              ? t("possiblePrizesTitle")
              : t("possiblePrizesTitleProductivity")}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
            {poolItems.map((poolItem) => {
              const ItemIcon = getRewardIcon(poolItem.icon);
              return (
                <div
                  key={poolItem.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-card dark:bg-surface/50 border border-neutral-700 dark:border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface dark:bg-white/5 border border-neutral-700 dark:border-white/10 flex items-center justify-center text-neutral-200 shrink-0">
                    <ItemIcon size={16} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-tiny font-bold text-neutral-100 truncate">
                        {poolItem.name}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1 py-0.5 rounded border leading-none shrink-0",
                          getMysteryBadgeVariantClass(poolItem.badgeVariant),
                        )}
                      >
                        {poolItem.badgeLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 truncate">
                      {poolItem.minutes
                        ? t("trackCouponMinutes", { minutes: poolItem.minutes })
                        : t("trackSingleUse")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revelação do Prêmio Conquistado */}
      {phase === "won" && wonResult && (
        <div className="w-full flex flex-col items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 dark:bg-gold/10 dark:border-gold/40 shadow-glow-gold-xs animate-in zoom-in-95 duration-200 motion-reduce:animate-none">
          <div className="flex flex-wrap items-center justify-center gap-2 text-amber-700 dark:text-gold font-bold text-body-m text-center">
            <Sparkles
              size={18}
              className="animate-spin motion-reduce:animate-none text-amber-600 dark:text-gold shrink-0"
              aria-hidden="true"
            />
            <span>
              {isGamified
                ? t("prizeUnlockedTitle")
                : t("prizeUnlockedTitleProductivity")}
            </span>
          </div>
          <div className="flex items-center gap-3 w-full justify-center min-w-0">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:bg-gold/20 dark:border-gold/40 flex items-center justify-center dark:text-gold shadow-sm dark:shadow-md">
              {(() => {
                const WinIcon = getRewardIcon(wonResult.rewardIcon);
                return <WinIcon size={24} aria-hidden="true" />;
              })()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-body-m font-black text-neutral-50 break-words">
                {wonResult.rewardName}
              </span>
              <span className="text-label-g text-neutral-300 break-words">
                {wonResult.remainingMinutes
                  ? t("wonFocusItemMinutes", {
                      minutes: wonResult.remainingMinutes,
                    })
                  : isGamified
                    ? t("wonSingleUseItem")
                    : t("wonSingleUseItemProductivity")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Relíquia Bônus de Artefato obtida na Caixa Misteriosa */}
      {phase === "won" &&
        wonResult?.droppedArtifact &&
        (() => {
          const artifact = wonResult.droppedArtifact;
          const theme = getRarityTheme(artifact.rarity);
          const { name, lore } = resolveArtifactCopy(
            artifact,
            isGamified,
            tArtifacts,
          );
          const rarityBadge = t(
            `artifactDrop.badgeByRarity.${artifact.rarity}`,
          );

          return (
            <article
              aria-label={t("artifactDrop.headline")}
              className={cn(
                "w-full flex flex-col gap-3 p-4 rounded-xl border transition-colors animate-in zoom-in-95 duration-300 motion-reduce:animate-none",
                "bg-card dark:bg-neutral-900/90",
                theme.cardBorder,
                theme.cardGlow,
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-label-g font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                  <Sparkles
                    size={15}
                    className="animate-pulse motion-reduce:animate-none shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {isGamified
                      ? t("artifactDrop.headline")
                      : t("artifactDrop.headlineProductivity")}
                  </span>
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border",
                    theme.badgeBg,
                    theme.badgeText,
                    theme.badgeBorder,
                  )}
                >
                  {rarityBadge}
                </span>
              </div>

              <p className="text-tiny text-neutral-300 break-words">
                {isGamified
                  ? t("artifactDrop.subtext")
                  : t("artifactDrop.subtextProductivity")}
              </p>

              <div className="flex items-start gap-3 w-full min-w-0">
                <div
                  className={cn(
                    "w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center shadow-sm",
                    theme.iconBg,
                    theme.iconText,
                  )}
                >
                  <AchievementIcon
                    iconKey={artifact.iconName}
                    size={24}
                    fallback="sparkles"
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-body-s font-black text-neutral-50 break-words">
                    {name}
                  </span>
                  {lore && (
                    <span className="text-tiny text-neutral-300 break-words">
                      {lore}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-neutral-400 mt-0.5 break-words">
                    {isGamified
                      ? t("artifactDrop.collectionTag")
                      : t("artifactDrop.collectionTagProductivity")}
                  </span>
                </div>
              </div>
            </article>
          );
        })()}

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full pt-2">
        {phase === "idle" && (
          <button
            type="button"
            disabled={isOpeningServer}
            onClick={handleSpin}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover active:bg-gold-pressed border border-gold rounded-xl text-on-gold font-bold text-body-m active:scale-95 transition-[transform,background-color,border-color,box-shadow] shadow-glow-gold-xs cursor-pointer disabled:opacity-50"
          >
            <Dices size={20} className="text-on-gold shrink-0" />
            <span>
              {isOpeningServer
                ? t("drawingButton")
                : isGamified
                  ? t("spinButton")
                  : t("spinButtonProductivity")}
            </span>
          </button>
        )}

        {isSpinning && (
          <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-gold font-bold py-2 animate-pulse motion-reduce:animate-none">
            <Sparkles size={18} aria-hidden="true" />
            <span>
              {isGamified
                ? t("spinningStatus")
                : t("spinningStatusProductivity")}
            </span>
          </div>
        )}

        {phase === "won" && (
          <>
            {wonResult?.droppedArtifact && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/profile");
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 dark:border-primary/25 rounded-xl text-neutral-50 font-bold text-body-s active:scale-95 transition-[transform,background-color,border-color] cursor-pointer"
              >
                <span>{t("artifactDrop.viewShowcaseButton")}</span>
                <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gold hover:bg-gold-hover active:bg-gold-pressed border border-gold rounded-xl text-on-gold font-bold text-body-s active:scale-95 transition-[transform,background-color,border-color,box-shadow] shadow-glow-gold-xs cursor-pointer"
            >
              <Check
                size={18}
                className="text-on-gold shrink-0"
                aria-hidden="true"
              />
              <span>
                {isGamified
                  ? t("storeInBackpackButton")
                  : t("storeInBackpackButtonProductivity")}
              </span>
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}
