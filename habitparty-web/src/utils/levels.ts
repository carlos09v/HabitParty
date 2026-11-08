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

export const LEVEL_TITLES_PRODUCTIVITY_PT: Record<LevelInfo["tier"], string> = {
  NOVICE: "Iniciante",
  APPRENTICE: "Praticante",
  ADVENTURER: "Consistente",
  CHALLENGER: "Focado",
  AMATEUR: "Organizado",
  PROFESSIONAL: "Produtivo",
  EXPERT: "Especialista",
  VETERAN: "Sênior",
  MASTER: "Executivo",
  LEGEND: "Alta Performance",
};

export const LEVEL_TITLES_PRODUCTIVITY_EN: Record<LevelInfo["tier"], string> = {
  NOVICE: "Beginner",
  APPRENTICE: "Practitioner",
  ADVENTURER: "Consistent",
  CHALLENGER: "Focused",
  AMATEUR: "Organized",
  PROFESSIONAL: "Productive",
  EXPERT: "Specialist",
  VETERAN: "Senior",
  MASTER: "Executive",
  LEGEND: "High Performance",
};

const NORMALIZED_TIER_LOOKUP: Record<string, LevelInfo["tier"]> = {};
for (const lvl of USER_LEVELS) {
  NORMALIZED_TIER_LOOKUP[lvl.tier.toLowerCase()] = lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_PT[lvl.tier].toLowerCase()] = lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_EN[lvl.tier].toLowerCase()] = lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_PRODUCTIVITY_PT[lvl.tier].toLowerCase()] =
    lvl.tier;
  NORMALIZED_TIER_LOOKUP[LEVEL_TITLES_PRODUCTIVITY_EN[lvl.tier].toLowerCase()] =
    lvl.tier;
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
  isGamified = true,
): string {
  const isEn = locale === "en";
  if (!titleOrTier) {
    if (!isGamified) return isEn ? "Beginner" : "Iniciante";
    return isEn ? "Novice" : "Novato";
  }

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
    if (!isGamified) {
      return isEn
        ? LEVEL_TITLES_PRODUCTIVITY_EN[tier]
        : LEVEL_TITLES_PRODUCTIVITY_PT[tier];
    }
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

export interface ResolvedUserLevelState {
  currentXp: number;
  currentLevelNumber: number;
  progress: LevelProgress;
  levelTitle: string;
  nextLevelTitle: string;
  remainingXp: number;
}

/**
 * Centraliza a resolução de nível, barra de progresso e títulos localizados do usuário.
 */
export function resolveUserLevelState(
  user?: {
    totalXp?: number | null;
    currentLevel?: number | null;
    currentLevelTitle?: string | null;
    nextLevelTitle?: string | null;
    xpToNextLevel?: number | null;
  } | null,
  locale: AppLocale = "pt-BR",
  isGamified = true,
  fallbackXp = 0,
): ResolvedUserLevelState {
  const currentXp = user?.totalXp ?? fallbackXp;
  const progress = getLevelProgress(currentXp);
  const currentLevelIdx = USER_LEVELS.findIndex(
    (l) => l.tier === progress.currentLevel.tier,
  );
  const currentLevelNumber =
    user?.currentLevel ?? (currentLevelIdx >= 0 ? currentLevelIdx + 1 : 1);
  const rawLevelTitle =
    user?.currentLevelTitle ||
    USER_LEVELS[currentLevelNumber - 1]?.title ||
    progress.currentLevel.title;
  const rawNextLevelTitle = user?.nextLevelTitle || progress.nextLevel.title;
  const remainingXp =
    user?.xpToNextLevel !== undefined && user?.xpToNextLevel !== null
      ? user.xpToNextLevel
      : progress.remainingXp;

  return {
    currentXp,
    currentLevelNumber,
    progress,
    levelTitle: localizeLevelTitle(rawLevelTitle, locale, isGamified),
    nextLevelTitle: localizeLevelTitle(rawNextLevelTitle, locale, isGamified),
    remainingXp,
  };
}
