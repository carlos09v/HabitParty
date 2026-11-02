/**
 * Sistema de Classificação e Níveis Gamificados (Alinhamento 100% com habitparty-api).
 */

export interface LevelInfo {
  tier:
    | "NOVICE"
    | "APPRENTICE"
    | "ADVENTURER"
    | "CHALLENGER"
    | "AMATEUR"
    | "PROFESSIONAL"
    | "EXPERT"
    | "VETERAN"
    | "MASTER"
    | "LEGEND";
  title: string;
  minXpRequired: number;
}

import type { AppLocale } from "@/types/ui";

export const USER_LEVELS: readonly LevelInfo[] = [
  { tier: "NOVICE", title: "Novato", minXpRequired: 0 },
  { tier: "APPRENTICE", title: "Aprendiz", minXpRequired: 100 },
  { tier: "ADVENTURER", title: "Aventureiro", minXpRequired: 300 },
  { tier: "CHALLENGER", title: "Desafiante", minXpRequired: 750 },
  { tier: "AMATEUR", title: "Amador", minXpRequired: 1500 },
  { tier: "PROFESSIONAL", title: "Profissional", minXpRequired: 3000 },
  { tier: "EXPERT", title: "Especialista", minXpRequired: 6000 },
  { tier: "VETERAN", title: "Veterano", minXpRequired: 12000 },
  { tier: "MASTER", title: "Mestre", minXpRequired: 25000 },
  { tier: "LEGEND", title: "Lenda", minXpRequired: 60000 },
] as const;

export const LEVEL_TITLES_PT: Record<LevelInfo["tier"], string> = {
  NOVICE: "Novato",
  APPRENTICE: "Aprendiz",
  ADVENTURER: "Aventureiro",
  CHALLENGER: "Desafiante",
  AMATEUR: "Amador",
  PROFESSIONAL: "Profissional",
  EXPERT: "Especialista",
  VETERAN: "Veterano",
  MASTER: "Mestre",
  LEGEND: "Lenda",
};

export const LEVEL_TITLES_EN: Record<LevelInfo["tier"], string> = {
  NOVICE: "Novice",
  APPRENTICE: "Apprentice",
  ADVENTURER: "Adventurer",
  CHALLENGER: "Challenger",
  AMATEUR: "Amateur",
  PROFESSIONAL: "Professional",
  EXPERT: "Expert",
  VETERAN: "Veteran",
  MASTER: "Master",
  LEGEND: "Legend",
};

const NORMALIZED_TIER_LOOKUP: Record<string, LevelInfo["tier"]> = {};
for (const lvl of USER_LEVELS) {
  NORMALIZED_TIER_LOOKUP[lvl.tier.toLowerCase()] = lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_PT[lvl.tier].toLowerCase()] = lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_EN[lvl.tier].toLowerCase()] = lvl.tier;
}

export function resolveLevelTier(
  titleOrTier: string | undefined | null,
): LevelInfo["tier"] | null {
  if (!titleOrTier) return null;
  return NORMALIZED_TIER_LOOKUP[titleOrTier.trim().toLowerCase()] ?? null;
}

export function localizeLevelTitle(
  titleOrTier: string | undefined | null,
  locale: AppLocale,
): string {
  const isEn = locale === "en";
  if (!titleOrTier) return isEn ? "Novice" : "Novato";

  const trimmed = titleOrTier.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower === "membro premium" ||
    lower === "premium member" ||
    lower === "premium_member"
  ) {
    return isEn ? "Premium Member" : "Membro Premium";
  }

  const tier = resolveLevelTier(trimmed);
  if (tier) {
    return isEn ? LEVEL_TITLES_EN[tier] : LEVEL_TITLES_PT[tier];
  }

  return trimmed;
}

/**
 * Retorna o nível correspondente ao total de XP acumulado.
 */
export function getCurrentLevel(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, totalXp);
  let currentLevel: LevelInfo = USER_LEVELS[0];

  for (const level of USER_LEVELS) {
    if (safeXp >= level.minXpRequired) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

/**
 * Retorna o próximo nível a ser alcançado.
 * Se já for o nível máximo (Lenda), retorna o próprio nível.
 */
export function getNextLevel(totalXp: number): LevelInfo {
  const current = getCurrentLevel(totalXp);
  const currentIndex = USER_LEVELS.findIndex(
    (lvl) => lvl.tier === current.tier,
  );

  if (currentIndex >= 0 && currentIndex < USER_LEVELS.length - 1) {
    return USER_LEVELS[currentIndex + 1];
  }

  return current;
}

/**
 * Retorna quanto XP falta para alcançar o próximo nível.
 * Se já for nível máximo, retorna 0.
 */
export function getXpToNextLevel(totalXp: number): number {
  const safeXp = Math.max(0, totalXp);
  const next = getNextLevel(safeXp);
  const current = getCurrentLevel(safeXp);

  if (current.tier === next.tier) {
    return 0;
  }

  return Math.max(0, next.minXpRequired - safeXp);
}

export interface LevelProgress {
  currentLevel: LevelInfo;
  nextLevel: LevelInfo;
  currentXp: number;
  targetXp: number;
  remainingXp: number;
  xpInCurrentTier: number;
  tierSpan: number;
  percent: number;
  isMaxLevel: boolean;
}

/**
 * Calcula detalhadamente o progresso do usuário no nível atual.
 * A barra de progresso percentual representa o avanço dentro da faixa do nível atual (0% a 100%).
 * A meta acumulada (targetXp) representa o total necessário para atingir o próximo nível.
 */
export function getLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const currentLevel = getCurrentLevel(safeXp);
  const nextLevel = getNextLevel(safeXp);
  const isMaxLevel = currentLevel.tier === nextLevel.tier;

  if (isMaxLevel) {
    return {
      currentLevel,
      nextLevel,
      currentXp: safeXp,
      targetXp: currentLevel.minXpRequired,
      remainingXp: 0,
      xpInCurrentTier: safeXp - currentLevel.minXpRequired,
      tierSpan: 0,
      percent: 100,
      isMaxLevel: true,
    };
  }

  const tierFloor = currentLevel.minXpRequired;
  const tierCeiling = nextLevel.minXpRequired;
  const tierSpan = tierCeiling - tierFloor;
  const xpInCurrentTier = safeXp - tierFloor;
  const remainingXp = Math.max(0, tierCeiling - safeXp);

  const percent =
    tierSpan > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((xpInCurrentTier / tierSpan) * 100)),
        )
      : 100;

  return {
    currentLevel,
    nextLevel,
    currentXp: safeXp,
    targetXp: tierCeiling,
    remainingXp,
    xpInCurrentTier,
    tierSpan,
    percent,
    isMaxLevel: false,
  };
}

export interface LevelUpCheckResult {
  didLevelUp: boolean;
  oldLevel: LevelInfo;
  newLevel: LevelInfo;
}

/**
 * Compara o XP anterior com o novo XP e identifica se houve subida de nível.
 */
export function checkLevelUp(
  oldTotalXp: number,
  newTotalXp: number,
): LevelUpCheckResult {
  const oldLevel = getCurrentLevel(oldTotalXp);
  const newLevel = getCurrentLevel(newTotalXp);

  const didLevelUp = newLevel.minXpRequired > oldLevel.minXpRequired;

  return {
    didLevelUp,
    oldLevel,
    newLevel,
  };
}
