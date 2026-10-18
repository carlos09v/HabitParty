"use client";

import { useEffect, useRef, useState } from "react";
import {
  type MysteryBoxOpenResult,
  openMysteryBox,
} from "@/actions/inventoryActions";
import { MYSTERY_BOX_TIERS } from "@/constants/reward";
import type { InventoryItem } from "@/types/inventory";
import type { PackageLevel } from "@/types/reward";
import { soundEffects } from "@/utils/soundEffects";

export interface RouletteItem {
  id: string;
  name: string;
  icon: string;
  minutes: number | null;
  badgeVariant: "emerald" | "amber" | "purple" | "gold";
  badgeLabel: string;
}

const TIER_POOLS: Record<string, RouletteItem[]> = {
  Básico: [
    {
      id: "b1",
      name: "Pausa Curta",
      icon: "coffee",
      minutes: null,
      badgeVariant: "emerald",
      badgeLabel: "60% Drop",
    },
    {
      id: "b2",
      name: "Prática de Violão",
      icon: "music",
      minutes: 30,
      badgeVariant: "amber",
      badgeLabel: "30% Drop",
    },
    {
      id: "b3",
      name: "Leitura Produtiva",
      icon: "book",
      minutes: 45,
      badgeVariant: "purple",
      badgeLabel: "10% Drop",
    },
  ],
  Premium: [
    {
      id: "p1",
      name: "Tempo Livre",
      icon: "smile",
      minutes: null,
      badgeVariant: "emerald",
      badgeLabel: "40% Drop",
    },
    {
      id: "p2",
      name: "Sessão de Videogame",
      icon: "gamepad",
      minutes: 60,
      badgeVariant: "amber",
      badgeLabel: "40% Drop",
    },
    {
      id: "p3",
      name: "Capítulo de FNAF",
      icon: "book_open",
      minutes: null,
      badgeVariant: "purple",
      badgeLabel: "20% Drop",
    },
  ],
  Épico: [
    {
      id: "e1",
      name: "Tempo de Foco Flexível",
      icon: "timer",
      minutes: 60,
      badgeVariant: "emerald",
      badgeLabel: "50% Drop",
    },
    {
      id: "e2",
      name: "Passe Livre (Noite)",
      icon: "ticket",
      minutes: null,
      badgeVariant: "amber",
      badgeLabel: "40% Drop",
    },
    {
      id: "e3",
      name: "Tarde de Jogos",
      icon: "trophy",
      minutes: 120,
      badgeVariant: "gold",
      badgeLabel: "10% Drop",
    },
  ],
  Lendário: [
    {
      id: "l1",
      name: "Fim de Tarde Livre",
      icon: "star",
      minutes: 120,
      badgeVariant: "purple",
      badgeLabel: "70% Drop",
    },
    {
      id: "l2",
      name: "Day Off Absoluto",
      icon: "gem",
      minutes: 240,
      badgeVariant: "gold",
      badgeLabel: "30% Drop",
    },
  ],
};

const CARD_WIDTH = 132;
const CARD_GAP = 12;
const TOTAL_CARD_WIDTH = CARD_WIDTH + CARD_GAP;
const TRACK_LENGTH = 45;
const WINNING_INDEX = 32;

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
  const tierConfig =
    MYSTERY_BOX_TIERS.find((t) => t.id === tierId) || MYSTERY_BOX_TIERS[0];
  const pool = TIER_POOLS[tierId] || TIER_POOLS.Básico;

  // Monta a fita de itens aleatórios ao abrir a modal
  useEffect(() => {
    if (isOpen && item) {
      setPhase("idle");
      setWonResult(null);
      setTranslateX(0);

      const generated: RouletteItem[] = [];
      for (let i = 0; i < TRACK_LENGTH; i++) {
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
        clearInterval(soundIntervalRef.current);
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
          tierId === "Lendário"
            ? "gold"
            : tierId === "Épico"
              ? "purple"
              : tierId === "Premium"
                ? "amber"
                : "emerald",
        badgeLabel: "SORTEADO!",
      };

      setTrackItems((prev) => {
        const copy = [...prev];
        copy[WINNING_INDEX] = winningItem;
        return copy;
      });

      // Centralização do card premiado no viewport da roleta
      const containerWidth = containerRef.current?.offsetWidth || 560;
      const centerViewport = containerWidth / 2;
      const targetCardCenter =
        WINNING_INDEX * TOTAL_CARD_WIDTH + CARD_WIDTH / 2;

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
    tierId,
    tierConfig,
    winningIndex: WINNING_INDEX,
  };
}
