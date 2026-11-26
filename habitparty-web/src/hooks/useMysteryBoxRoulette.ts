"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  openMysteryBox,
  revalidateInventoryAfterRoulette,
} from "@/actions/inventoryActions";
import {
  MYSTERY_BOX_ROULETTE_POOLS,
  ROULETTE_CARD_WIDTH,
  ROULETTE_TOTAL_CARD_WIDTH,
  ROULETTE_TRACK_LENGTH,
  ROULETTE_WINNING_INDEX,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useUserStore } from "@/store/userStore";
import type { InventoryItem, MysteryBoxOpenResult } from "@/types/inventory";
import type { PackageLevel, RouletteItem } from "@/types/reward";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getMysteryBoxTier } from "@/utils/rewardMapper";
import { soundEffects } from "@/utils/soundEffects";

export type { RouletteItem };

type PoolItemId =
  | "b1"
  | "b2"
  | "b3"
  | "p1"
  | "p2"
  | "p3"
  | "e1"
  | "e2"
  | "e3"
  | "l1"
  | "l2"
  | "l3";

const ROULETTE_TRACK_LEFT_PADDING = 16; // pl-4 em MysteryBoxRouletteModal

interface UseMysteryBoxRouletteProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onSuccess?: (result: MysteryBoxOpenResult) => void;
}

export function useMysteryBoxRoulette({
  isOpen,
  item,
  onSuccess,
}: UseMysteryBoxRouletteProps) {
  const t = useTranslations("inventory.rouletteHook");
  const { isGamified } = useExperienceMode();

  const [phase, setPhase] = useState<"idle" | "spinning" | "won">("idle");
  const [wonResult, setWonResult] = useState<MysteryBoxOpenResult | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [trackItems, setTrackItems] = useState<RouletteItem[]>([]);
  const [isOpeningServer, setIsOpeningServer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const soundIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf1Ref = useRef<number | null>(null);
  const raf2Ref = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const initializedItemKeyRef = useRef<string | null>(null);
  const pendingRevalidationRef = useRef(false);
  const pendingAchievementCheckRef = useRef(false);

  const tierId: PackageLevel =
    (item?.reward.packageLevel as PackageLevel) || "Básico";
  const tierConfig = getMysteryBoxTier(tierId);

  const poolItems = useMemo<RouletteItem[]>(() => {
    if (!item) return [];
    const customLoot = item.reward.lootItems;
    const hasCustomLoot = Boolean(customLoot && customLoot.length === 3);
    const chanceKey = isGamified ? "dropBadge" : "chanceBadge";

    if (hasCustomLoot) {
      return (customLoot ?? []).map((slot, idx) => {
        const dropRate = tierConfig.dropRates[idx] || tierConfig.dropRates[0];
        return {
          id: `custom-${idx}`,
          name: slot.name,
          icon: slot.icon || "gift",
          minutes:
            slot.minutes !== undefined &&
            slot.minutes !== null &&
            slot.minutes > 0
              ? slot.minutes
              : null,
          badgeVariant: dropRate.badgeVariant,
          badgeLabel: t(chanceKey, {
            percent: String(dropRate.percentage),
          }),
        };
      });
    }

    const basePool =
      MYSTERY_BOX_ROULETTE_POOLS[tierConfig.id] ||
      MYSTERY_BOX_ROULETTE_POOLS.Básico;

    return basePool.map((poolItem) => {
      const poolKey = `poolItems.${poolItem.id as PoolItemId}` as const;
      const localizedName = t.has(poolKey) ? t(poolKey) : poolItem.name;
      const percentMatch = poolItem.badgeLabel.match(/^(\d+)%/);
      const localizedBadge = percentMatch
        ? t(chanceKey, { percent: percentMatch[1] })
        : poolItem.badgeLabel;
      return {
        ...poolItem,
        name: localizedName,
        badgeLabel: localizedBadge,
      };
    });
  }, [item, tierConfig.id, tierConfig.dropRates, isGamified, t]);

  // Monta a fita aleatória apenas quando o item aberto ou estado de abertura muda
  useEffect(() => {
    if (!isOpen || !item || poolItems.length === 0) {
      initializedItemKeyRef.current = null;
      return;
    }

    const primaryId = item.itemIds?.[0] || item.inventoryItemId || item.id;
    const currentKey = `${primaryId}-${tierConfig.id}`;
    if (initializedItemKeyRef.current === currentKey) {
      return;
    }
    initializedItemKeyRef.current = currentKey;

    if (soundIntervalRef.current) clearTimeout(soundIntervalRef.current);
    if (winTimeoutRef.current) clearTimeout(winTimeoutRef.current);
    if (raf1Ref.current !== null) cancelAnimationFrame(raf1Ref.current);
    if (raf2Ref.current !== null) cancelAnimationFrame(raf2Ref.current);

    setPhase("idle");
    setWonResult(null);
    setTranslateX(0);

    const generated: RouletteItem[] = [];
    for (let i = 0; i < ROULETTE_TRACK_LENGTH; i++) {
      const randomItem =
        poolItems[Math.floor(Math.random() * poolItems.length)];
      generated.push({
        ...randomItem,
        id: `${randomItem.id}-${i}`,
      });
    }
    setTrackItems(generated);
  }, [isOpen, item, poolItems, tierConfig.id]);

  // Limpeza completa de timers, rAFs e garantias de revalidação ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (soundIntervalRef.current) {
        clearTimeout(soundIntervalRef.current);
      }
      if (winTimeoutRef.current) {
        clearTimeout(winTimeoutRef.current);
      }
      if (raf1Ref.current !== null) {
        cancelAnimationFrame(raf1Ref.current);
      }
      if (raf2Ref.current !== null) {
        cancelAnimationFrame(raf2Ref.current);
      }
      if (pendingRevalidationRef.current) {
        pendingRevalidationRef.current = false;
        void revalidateInventoryAfterRoulette();
      }
      if (pendingAchievementCheckRef.current) {
        pendingAchievementCheckRef.current = false;
        useUserStore.getState().triggerAchievementCheck();
      }
    };
  }, []);

  // Dispara checagem de conquistas somente após fechar a modal
  useEffect(() => {
    if (!isOpen && pendingAchievementCheckRef.current) {
      pendingAchievementCheckRef.current = false;
      useUserStore.getState().triggerAchievementCheck();
    }
  }, [isOpen]);

  const handleSpin = async () => {
    if (phase !== "idle" || !item || isOpeningServer) return;

    // Retoma AudioContext sincronamente durante o clique do usuário
    soundEffects.unlockAudio();

    setIsOpeningServer(true);
    const targetItemId = item.itemIds?.[0] || item.inventoryItemId || item.id;

    try {
      const res = await openMysteryBox(targetItemId, true);

      // Se a modal foi desmontada durante o round-trip e a caixa já foi aberta no servidor,
      // garante a revalidação de cache e checagem de conquistas sem atualizar estado desmontado.
      if (!isMountedRef.current) {
        if (res.success) {
          void revalidateInventoryAfterRoulette();
          useUserStore.getState().triggerAchievementCheck();
        }
        return;
      }

      if (!res.success || !res.data) {
        setIsOpeningServer(false);
        const errorMsg = !res.success
          ? res.error
          : isGamified
            ? t("openErrorGamified")
            : t("openErrorProductivity");
        toast.error(errorMsg);
        return;
      }

      pendingRevalidationRef.current = true;
      pendingAchievementCheckRef.current = true;
      const winData = res.data;
      setWonResult(winData);

      const winningItem: RouletteItem = {
        id: `won-${winData.rewardName}-${ROULETTE_WINNING_INDEX}`,
        name: winData.rewardName || t("defaultWinName"),
        icon: winData.rewardIcon || "gem",
        minutes: winData.remainingMinutes || null,
        badgeVariant:
          tierConfig.id === "Lendário"
            ? "gold"
            : tierConfig.id === "Épico"
              ? "purple"
              : tierConfig.id === "Premium"
                ? "amber"
                : "emerald",
        badgeLabel: isGamified
          ? t("wonBadgeLabel")
          : t("wonBadgeLabelProductivity"),
      };

      setTrackItems((prev) => {
        const copy = [...prev];
        copy[ROULETTE_WINNING_INDEX] = winningItem;
        return copy;
      });

      // Centralização exata compensando o padding esquerdo (`pl-4` = 16px) e `clientWidth` interno
      const containerWidth = containerRef.current?.clientWidth || 560;
      const centerViewport = containerWidth / 2;
      const targetCardCenter =
        ROULETTE_TRACK_LEFT_PADDING +
        ROULETTE_WINNING_INDEX * ROULETTE_TOTAL_CARD_WIDTH +
        ROULETTE_CARD_WIDTH / 2;

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      const randomJitter = prefersReducedMotion
        ? 0
        : Math.floor(Math.random() * 36) - 18;
      const finalTranslate = -(
        targetCardCenter -
        centerViewport +
        randomJitter
      );

      setIsOpeningServer(false);

      const finishReveal = () => {
        if (!isMountedRef.current) return;
        if (soundIntervalRef.current) {
          clearTimeout(soundIntervalRef.current);
        }
        setPhase("won");
        soundEffects.playRouletteWinSound();
        triggerCelebrationConfetti();
        onSuccess?.(winData);
        if (pendingRevalidationRef.current) {
          pendingRevalidationRef.current = false;
          void revalidateInventoryAfterRoulette();
        }
      };

      if (prefersReducedMotion) {
        setTranslateX(finalTranslate);
        winTimeoutRef.current = setTimeout(finishReveal, 120);
        return;
      }

      setTranslateX(0);
      setPhase("spinning");

      // Duplo rAF + leitura de layout garante commit do frame inicial antes da transição de 4.5s
      raf1Ref.current = requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        void containerRef.current?.clientWidth;
        raf2Ref.current = requestAnimationFrame(() => {
          if (!isMountedRef.current) return;
          setTranslateX(finalTranslate);
        });
      });

      let elapsed = 0;
      let tickDelay = 60;
      const totalDuration = 4500;

      const runTicks = () => {
        if (!isMountedRef.current) return;
        soundEffects.playRouletteTickSound();
        elapsed += tickDelay;
        tickDelay = Math.min(420, tickDelay * 1.07);

        if (elapsed < totalDuration) {
          soundIntervalRef.current = setTimeout(runTicks, tickDelay);
        }
      };
      runTicks();

      winTimeoutRef.current = setTimeout(finishReveal, 4600);
    } catch (_err) {
      if (!isMountedRef.current) return;
      setIsOpeningServer(false);
      toast.error(
        t(isGamified ? "openErrorGamified" : "openErrorProductivity"),
      );
    }
  };

  return {
    phase,
    wonResult,
    translateX,
    trackItems,
    isOpeningServer,
    containerRef,
    handleSpin,
    poolItems,
    tierConfig,
    winningIndex: ROULETTE_WINNING_INDEX,
  };
}
