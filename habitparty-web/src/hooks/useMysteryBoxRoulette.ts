"use client";

import { useEffect, useRef, useState } from "react";
import {
  type MysteryBoxOpenResult,
  openMysteryBox,
} from "@/actions/inventoryActions";
import {
  getMysteryBoxTier,
  MYSTERY_BOX_ROULETTE_POOLS,
  ROULETTE_CARD_WIDTH,
  ROULETTE_TOTAL_CARD_WIDTH,
  ROULETTE_TRACK_LENGTH,
  ROULETTE_WINNING_INDEX,
} from "@/constants/reward";
import type { InventoryItem } from "@/types/inventory";
import type { PackageLevel, RouletteItem } from "@/types/reward";
import { soundEffects } from "@/utils/soundEffects";

export type { RouletteItem };

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
  const [phase, setPhase] = useState<"idle" | "spinning" | "won">("idle");
  const [wonResult, setWonResult] = useState<MysteryBoxOpenResult | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [trackItems, setTrackItems] = useState<RouletteItem[]>([]);
  const [isOpeningServer, setIsOpeningServer] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const tierId: PackageLevel =
    (item?.reward.packageLevel as PackageLevel) || "Básico";
  const tierConfig = getMysteryBoxTier(tierId);
  const pool =
    MYSTERY_BOX_ROULETTE_POOLS[tierConfig.id] ||
    MYSTERY_BOX_ROULETTE_POOLS.Básico;

  // Monta a fita de itens aleatórios ao abrir a modal
  useEffect(() => {
    if (isOpen && item) {
      setPhase("idle");
      setWonResult(null);
      setTranslateX(0);

      const generated: RouletteItem[] = [];
      for (let i = 0; i < ROULETTE_TRACK_LENGTH; i++) {
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        generated.push({
          ...randomItem,
          id: `${randomItem.id}-${i}`,
        });
      }
      setTrackItems(generated);
    }
  }, [isOpen, item, pool]);

  // Limpeza de intervalos sonoros ao desmontar ou fechar
  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) {
        clearTimeout(soundIntervalRef.current);
      }
    };
  }, []);

  const handleSpin = async () => {
    if (phase !== "idle" || !item || isOpeningServer) return;

    setIsOpeningServer(true);
    const targetItemId = item.inventoryItemId || item.id;

    try {
      const res = await openMysteryBox(targetItemId);
      if (!res.success || !res.data) {
        setIsOpeningServer(false);
        return;
      }

      const winData = res.data;
      setWonResult(winData);

      // Substitui o card no índice premiado pelo item sorteado
      const winningItem: RouletteItem = {
        id: `won-${winData.rewardName}`,
        name: winData.rewardName || "Recompensa Especial",
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
        badgeLabel: "SORTEADO!",
      };

      setTrackItems((prev) => {
        const copy = [...prev];
        copy[ROULETTE_WINNING_INDEX] = winningItem;
        return copy;
      });

      // Centralização do card premiado no viewport da roleta
      const containerWidth = containerRef.current?.offsetWidth || 560;
      const centerViewport = containerWidth / 2;
      const targetCardCenter =
        ROULETTE_WINNING_INDEX * ROULETTE_TOTAL_CARD_WIDTH +
        ROULETTE_CARD_WIDTH / 2;

      // Jitter orgânico (+-18px) simulando catraca física
      const randomJitter = Math.floor(Math.random() * 36) - 18;
      const finalTranslate = -(
        targetCardCenter -
        centerViewport +
        randomJitter
      );

      setPhase("spinning");
      setIsOpeningServer(false);

      requestAnimationFrame(() => {
        setTranslateX(finalTranslate);
      });

      // Efeito sonoro de catraca: acelerado no início e desacelerando gradualmente
      let elapsed = 0;
      let tickDelay = 60;
      const totalDuration = 4500;

      const runTicks = () => {
        soundEffects.playRouletteTickSound();
        elapsed += tickDelay;
        tickDelay = Math.min(420, tickDelay * 1.07);

        if (elapsed < totalDuration) {
          soundIntervalRef.current = setTimeout(runTicks, tickDelay);
        }
      };
      runTicks();

      setTimeout(() => {
        if (soundIntervalRef.current) {
          clearTimeout(soundIntervalRef.current);
        }
        setPhase("won");
        soundEffects.playRouletteWinSound();
        onSuccess?.(winData);
      }, 4600);
    } catch (_err) {
      setIsOpeningServer(false);
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
    tierId: tierConfig.id,
    tierConfig,
    winningIndex: ROULETTE_WINNING_INDEX,
  };
}
