"use client";

import { toast } from "sonner";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getTodayDateString } from "@/utils/date";
import {
  checkLevelUp,
  getCurrentLevel,
  getNextLevel,
  getXpToNextLevel,
  localizeLevelTitle,
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

export interface AwardRewardsOptions {
  locale?: AppLocale;
  levelUpTitle?: string;
  congratsPrefix?: string;
  congratsSuffix?: string;
  isTaskCompletion?: boolean;
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
  options?: AwardRewardsOptions,
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

  if (options?.isTaskCompletion) {
    store.markStreakSecuredToday(getTodayDateString());
  }

  if (didLevelUp) {
    soundEffects.playLevelUpSound();
    triggerCelebrationConfetti();

    const detectedLocale: AppLocale =
      options?.locale ||
      (typeof document !== "undefined" &&
      document.documentElement.lang?.startsWith("en")
        ? "en"
        : "pt-BR");

    const isGamified = user.experienceMode === "GAMIFIED";
    const localizedNewTitle = localizeLevelTitle(
      newLevel.title,
      detectedLocale,
      isGamified,
    );
    const titleText =
      options?.levelUpTitle ||
      (detectedLocale === "en" ? "Level Up!" : "Subiu de Nível!");
    const prefixText =
      options?.congratsPrefix ||
      (detectedLocale === "en"
        ? "Congratulations! Your new rank is"
        : "Parabéns! Sua nova classificação é");
    const suffixText = options?.congratsSuffix ?? ".";

    toast.success(
      <div className="flex flex-col gap-1 py-0.5">
        <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-gold">
          <span className="text-base leading-none">👑</span>
          <span className="tracking-wide uppercase text-xs">{titleText}</span>
        </div>
        <p className="text-body-s text-neutral-100">
          {prefixText}{" "}
          <strong className="text-amber-700 dark:text-gold font-bold">
            {localizedNewTitle}
          </strong>
          {suffixText}
        </p>
      </div>,
      {
        duration: 6000,
        className:
          "border-amber-500/45 dark:border-gold/50 !bg-card dark:!bg-surface shadow-card-active dark:shadow-xl",
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
