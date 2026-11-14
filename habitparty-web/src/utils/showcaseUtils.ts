import {
  ACCOUNT_BADGES_BY_ID,
  DEFAULT_MAX_ACHIEVEMENT_POINTS,
  DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
} from "@/constants/achievements";
import type {
  AccountBadgeId,
  AchievementItemResponseDTO,
  AchievementRarity,
  HighlightSlotInputDTO,
  ProfileHighlightResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";

export interface ResolvedHighlightCard {
  rarity: AchievementRarity;
  iconKey: string;
  title: string;
  subtitle: string;
  extraBadge?: string;
}

type CatalogTranslator = {
  (key: never): string;
  has: (key: never) => boolean;
};

type ParametricTranslator = (key: never, values?: never) => string;

/**
 * Resolve o título e descrição localizados de uma conquista respeitando o modo Gamificado vs Produtividade.
 */
export function resolveAchievementCopy(
  achievement: Pick<
    AchievementItemResponseDTO,
    "code" | "title" | "description"
  >,
  isGamified: boolean,
  tCatalog: CatalogTranslator,
): { title: string; description: string } {
  const titleKey = isGamified
    ? `${achievement.code}.title`
    : `${achievement.code}.essentialTitle`;
  const descKey = isGamified
    ? `${achievement.code}.description`
    : `${achievement.code}.essentialDescription`;

  const title = tCatalog.has(titleKey as never)
    ? tCatalog(titleKey as never)
    : achievement.title;
  const description = tCatalog.has(descKey as never)
    ? tCatalog(descKey as never)
    : achievement.description;

  return { title, description };
}

/**
 * Resolve o título e descrição de uma insígnia de conta.
 */
export function resolveAccountBadgeCopy(
  badgeId: AccountBadgeId,
  isGamified: boolean,
  levelTitle: string,
  currentXp: number,
  tBadges: ParametricTranslator,
): { title: string; description: string } {
  const titleKey = isGamified
    ? `${badgeId}.title`
    : `${badgeId}.essentialTitle`;
  const descKey = isGamified
    ? `${badgeId}.description`
    : `${badgeId}.essentialDescription`;

  return {
    title: tBadges(titleKey as never, { levelTitle } as never),
    description: tBadges(descKey as never, { xp: currentXp } as never),
  };
}

/**
 * Verifica se o usuário possui determinada insígnia de conta desbloqueada.
 */
export function isAccountBadgeUnlocked(
  badgeId: AccountBadgeId,
  user?: UserResponseDTO | null,
): boolean {
  switch (badgeId) {
    case "FOUNDER":
      return Boolean(user?.isFounder);
    case "PREMIUM_GUARDIAN":
      return Boolean(user?.isPremium);
    case "VERIFIED_ADVENTURER":
      return Boolean(user?.emailVerified);
    case "LEVEL_RANK":
      return true;
  }
}

/**
 * Resolve os metadados completos de exibição de um slot de destaque (Conquista ou Insígnia).
 */
export function resolveHighlightSlotCard(
  item:
    | Pick<
        ProfileHighlightResponseDTO,
        "highlightType" | "referenceId" | "highlightKey"
      >
    | HighlightSlotInputDTO
    | null
    | undefined,
  context: {
    achievements: AchievementItemResponseDTO[];
    isGamified: boolean;
    levelTitle: string;
    currentXp: number;
    tCatalog: CatalogTranslator;
    tBadges: ParametricTranslator;
  },
): ResolvedHighlightCard | null {
  if (!item) return null;

  if (item.highlightType === "ACHIEVEMENT") {
    const ach = context.achievements.find(
      (a) => a.id === item.referenceId || a.code === item.highlightKey,
    );
    if (!ach) return null;
    const { title, description } = resolveAchievementCopy(
      ach,
      context.isGamified,
      context.tCatalog,
    );
    return {
      rarity: ach.rarity,
      iconKey: ach.iconName,
      title,
      subtitle: description,
      extraBadge: `+${ach.points} pts`,
    };
  }

  if (item.highlightType === "ACCOUNT_BADGE" && item.highlightKey) {
    const def = ACCOUNT_BADGES_BY_ID[item.highlightKey as AccountBadgeId];
    if (!def) return null;
    const { title, description } = resolveAccountBadgeCopy(
      def.id,
      context.isGamified,
      context.levelTitle,
      context.currentXp,
      context.tBadges,
    );
    return {
      rarity: def.rarity,
      iconKey: def.iconKey,
      title,
      subtitle: description,
    };
  }

  return null;
}

/**
 * Cria o fallback de dados de vitrine quando a API de showcase ainda não retornou dados.
 */
export function createEmptyShowcaseData(
  user: UserResponseDTO,
): UserShowcaseResponseDTO {
  return {
    user,
    stats: {
      currentStreak: user.currentStreak ?? 0,
      highestStreak: user.highestStreak ?? 0,
      totalTasksCompleted: 0,
      totalHardTasksCompleted: 0,
      totalHardcoreTasksCompleted: 0,
      totalFocusMinutes: 0,
      totalFocusSessions: 0,
      longestFocusSessionMinutes: 0,
      totalPomodorosCompleted: 0,
      totalRewardsRedeemed: 0,
      totalMysteryBoxesOpened: 0,
      totalXp: user.totalXp ?? 0,
      totalGoldEarned: 0,
      achievementPoints: user.achievementPoints ?? 0,
      maxAchievementPoints: DEFAULT_MAX_ACHIEVEMENT_POINTS,
      unlockedAchievementsCount: 0,
      totalAchievementsCount: DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
    },
    highlights: [],
    achievements: [],
  };
}
