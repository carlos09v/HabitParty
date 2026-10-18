"use client";

import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import {
  checkLevelUp,
  getCurrentLevel,
  getNextLevel,
  getXpToNextLevel,
} from "@/utils/levels";
import { soundEffects } from "@/utils/soundEffects";

export interface AwardRewardsResult {
  didLevelUp: boolean;
  oldLevelTitle: string;
  newLevelTitle: string;
  totalXp: number;
  coinsEarned: number;
  xpEarned: number;
}

/**
 * Concede XP e Moedas ao perfil do usuário conectado no store Zustand.
 * Atualiza o XP total, saldo de moedas, título do nível e XP restante para o próximo nível.
 * Caso o novo XP alcance um novo patamar, aciona automaticamente:
 * 1. A fanfarra triunfal (playLevelUpSound).
 * 2. A explosão de partículas de comemoração (triggerCelebrationConfetti).
 * 3. O toast sonner gamificado de celebração da nova classificação.
 */
export function awardUserRewards(
  xpToAdd: number,
  coinsToAdd: number,
): AwardRewardsResult {
  const store = useUserStore.getState();
  const user = store.user;

  const xp = Math.max(0, xpToAdd);
  const coins = Math.max(0, coinsToAdd);

  if (!user) {
    return {
      didLevelUp: false,
      oldLevelTitle: "Novato",
      newLevelTitle: "Novato",
      totalXp: 0,
      coinsEarned: coins,
      xpEarned: xp,
    };
  }

  const oldTotalXp = user.totalXp ?? 0;
  const newTotalXp = oldTotalXp + xp;
  const currentCoins = user.currentCoins ?? 0;
  const newCoins = Math.round((currentCoins + coins) * 100) / 100;

  const { didLevelUp, oldLevel, newLevel } = checkLevelUp(
    oldTotalXp,
    newTotalXp,
  );
  const nextLevel = getNextLevel(newTotalXp);
  const xpToNextLevel = getXpToNextLevel(newTotalXp);

  store.updateUserPartial({
    totalXp: newTotalXp,
    currentCoins: newCoins,
    currentLevelTitle: newLevel.title,
    nextLevelTitle: nextLevel.title,
    xpToNextLevel,
  });

  if (didLevelUp) {
    soundEffects.playLevelUpSound();
    triggerCelebrationConfetti();

    toast.success(
      <div className="flex flex-col gap-1 py-0.5">
        <div className="flex items-center gap-1.5 font-bold text-gold">
          <span className="text-base leading-none">👑</span>
          <span className="tracking-wide uppercase text-xs">
            Subiu de Nível!
          </span>
        </div>
        <p className="text-body-s text-neutral-100">
          Parabéns! Sua nova classificação é{" "}
          <strong className="text-gold font-bold">{newLevel.title}</strong>.
        </p>
      </div>,
      {
        duration: 6000,
        className:
          "border-gold/50 bg-surface/95 backdrop-blur-md shadow-xl shadow-gold/10",
      },
    );
  }

  return {
    didLevelUp,
    oldLevelTitle: oldLevel.title,
    newLevelTitle: newLevel.title,
    totalXp: newTotalXp,
    coinsEarned: coins,
    xpEarned: xp,
  };
}

export interface DeductPenaltyResult {
  totalXp: number;
  currentCoins: number;
  xpDeducted: number;
  coinsDeducted: number;
}

/**
 * Deduz XP e Moedas do perfil do usuário conectado no store Zustand (Modo Hardcore / Hábito Negativo).
 * Respeita a regra de anti-rebaixamento de nível (o XP nunca cai abaixo do piso do nível atual).
 * O saldo de moedas nunca fica negativo.
 */
export function deductUserPenalty(
  xpToDeduct: number,
  coinsToDeduct: number,
): DeductPenaltyResult {
  const store = useUserStore.getState();
  const user = store.user;

  const xpPenalty = Math.max(0, xpToDeduct);
  const coinsPenalty = Math.max(0, coinsToDeduct);

  if (!user) {
    return {
      totalXp: 0,
      currentCoins: 0,
      xpDeducted: xpPenalty,
      coinsDeducted: coinsPenalty,
    };
  }

  const oldTotalXp = user.totalXp ?? 0;
  const currentLevel = getCurrentLevel(oldTotalXp);
  // Trava anti-rebaixamento idêntica à do backend (User.java)
  const minXpForLevel = currentLevel.minXpRequired;
  const newTotalXp = Math.max(minXpForLevel, oldTotalXp - xpPenalty);

  const currentCoins = user.currentCoins ?? 0;
  const newCoins = Math.max(
    0,
    Math.round((currentCoins - coinsPenalty) * 100) / 100,
  );

  const nextLevel = getNextLevel(newTotalXp);
  const xpToNextLevel = getXpToNextLevel(newTotalXp);

  store.updateUserPartial({
    totalXp: newTotalXp,
    currentCoins: newCoins,
    currentLevelTitle: currentLevel.title,
    nextLevelTitle: nextLevel.title,
    xpToNextLevel,
  });

  return {
    totalXp: newTotalXp,
    currentCoins: newCoins,
    xpDeducted: oldTotalXp - newTotalXp,
    coinsDeducted: Math.round((currentCoins - newCoins) * 100) / 100,
  };
}
