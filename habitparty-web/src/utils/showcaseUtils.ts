import {
  ACCOUNT_BADGES_BY_ID,
  DEFAULT_MAX_ACHIEVEMENT_POINTS,
  DEFAULT_TOTAL_ACHIEVEMENTS_COUNT,
} from "@/constants/achievements";
import { DEFAULT_TOTAL_ARTIFACTS_COUNT } from "@/constants/artifacts";
import type {
  AccountBadgeId,
  AchievementItemResponseDTO,
  AchievementRarity,
  ArtifactItemResponseDTO,
  ArtifactSummaryDTO,
  HighlightSlotInputDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
  UserShowcaseResponseDTO,
} from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";

export type ShowcaseTabId =
  | "overview"
  | "progression"
  | "friends"
  | "retrospective";

/**
 * Normaliza o parâmetro de query `tab` da vitrine pública/pessoal.
 */
export function resolveShowcaseTab(val?: string | null): ShowcaseTabId {
  if (val === "progression" || val === "friends" || val === "retrospective") {
    return val;
  }
  return "overview";
}

/**
 * Navegação por teclado seguindo o padrão WAI-ARIA para abas (`tablist` / `tab`).
 */
export function handleTabListKeyDown(e: {
  key: string;
  preventDefault: () => void;
  currentTarget: HTMLButtonElement;
}): void {
  const tabs = Array.from(
    e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]:not([disabled])',
    ) ?? [],
  );
  if (tabs.length <= 1) return;

  const currentIndex = tabs.indexOf(e.currentTarget);
  if (currentIndex === -1) return;

  let nextIndex = -1;
  if (e.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (e.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (e.key === "Home") {
    nextIndex = 0;
  } else if (e.key === "End") {
    nextIndex = tabs.length - 1;
  }

  if (nextIndex !== -1) {
    e.preventDefault();
    const targetTab = tabs[nextIndex];
    targetTab.focus();
    targetTab.click();
  }
}

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
 * Resolve o título localizado da conquista mais rara exibida na retrospectiva.
 */
export function resolveRetrospectiveAchievementTitle(
  retro:
    | {
        rarestAchievementCode?: string | null;
        rarestAchievementTitle?: string | null;
      }
    | null
    | undefined,
  isGamified: boolean,
  tCatalog: CatalogTranslator,
): string | null {
  if (!retro) return null;
  if (!retro.rarestAchievementCode) {
    return retro.rarestAchievementTitle ?? null;
  }
  const { title } = resolveAchievementCopy(
    {
      code: retro.rarestAchievementCode,
      title: retro.rarestAchievementTitle ?? retro.rarestAchievementCode,
      description: "",
    },
    isGamified,
    tCatalog,
  );
  return title || null;
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
 * Resolve o nome, lore e dica de obtenção de um artefato respeitando o modo Gamificado vs Produtividade.
 */
export function resolveArtifactCopy(
  artifact: Pick<ArtifactSummaryDTO, "code">,
  isGamified: boolean,
  tArtifacts: CatalogTranslator,
): { name: string; lore: string; sourceHint: string } {
  const nameKey = isGamified
    ? `items.${artifact.code}.name`
    : `items.${artifact.code}.essentialName`;
  const loreKey = isGamified
    ? `items.${artifact.code}.lore`
    : `items.${artifact.code}.essentialLore`;
  const hintKey = `items.${artifact.code}.sourceHint`;

  const name = tArtifacts.has(nameKey as never)
    ? tArtifacts(nameKey as never)
    : artifact.code;
  const lore = tArtifacts.has(loreKey as never)
    ? tArtifacts(loreKey as never)
    : "";
  const sourceHint = tArtifacts.has(hintKey as never)
    ? tArtifacts(hintKey as never)
    : "";

  return { name, lore, sourceHint };
}

const STAT_METRIC_META: Record<
  string,
  {
    rarity: AchievementRarity;
    iconKey: string;
    extractValue: (stats?: ShowcaseStatsResponseDTO | null) => number;
  }
> = {
  HIGHEST_STREAK: {
    rarity: "EPIC",
    iconKey: "flamegold",
    extractValue: (stats) => stats?.highestStreak ?? 0,
  },
  CURRENT_STREAK: {
    rarity: "RARE",
    iconKey: "flame",
    extractValue: (stats) => stats?.currentStreak ?? 0,
  },
  TOTAL_TASKS: {
    rarity: "RARE",
    iconKey: "checkcircle2",
    extractValue: (stats) => stats?.totalTasksCompleted ?? 0,
  },
  FOCUS_HOURS: {
    rarity: "EPIC",
    iconKey: "hourglassgold",
    extractValue: (stats) => Math.floor((stats?.totalFocusMinutes ?? 0) / 60),
  },
  TOTAL_XP: {
    rarity: "LEGENDARY",
    iconKey: "sparklesgold",
    extractValue: (stats) => stats?.totalXp ?? 0,
  },
  ACHIEVEMENT_POINTS: {
    rarity: "LEGENDARY",
    iconKey: "trophygold",
    extractValue: (stats) => stats?.achievementPoints ?? 0,
  },
};

/**
 * Resolve os metadados completos de exibição de um slot de destaque (Conquista, Insígnia, Métrica ou Artefato).
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
    artifacts?: ArtifactItemResponseDTO[];
    stats?: ShowcaseStatsResponseDTO | null;
    isGamified: boolean;
    levelTitle: string;
    currentXp: number;
    tCatalog: CatalogTranslator;
    tBadges: ParametricTranslator;
    tArtifacts?: CatalogTranslator;
    tHighlights?: ParametricTranslator;
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

  if (
    item.highlightType === "ARTIFACT" &&
    (item.referenceId || item.highlightKey)
  ) {
    const art = context.artifacts?.find(
      (a) =>
        (Boolean(item.referenceId) && a.id === item.referenceId) ||
        (Boolean(item.highlightKey) && a.code === item.highlightKey),
    );
    if (!art) return null;
    const copy = context.tArtifacts
      ? resolveArtifactCopy(art, context.isGamified, context.tArtifacts)
      : { name: art.code, lore: "", sourceHint: "" };
    return {
      rarity: art.rarity,
      iconKey: art.iconName,
      title: copy.name,
      subtitle: copy.lore || copy.sourceHint,
    };
  }

  if (item.highlightType === "STAT_METRIC" && item.highlightKey) {
    const normalizedKey = item.highlightKey.trim().toUpperCase();
    const meta = STAT_METRIC_META[normalizedKey];
    if (!meta) return null;
    const value = meta.extractValue(context.stats);
    const title = context.tHighlights
      ? context.tHighlights(`statMetrics.${normalizedKey}.title` as never)
      : normalizedKey;
    const subtitle = context.tHighlights
      ? context.tHighlights(
          `statMetrics.${normalizedKey}.subtitle` as never,
          { value } as never,
        )
      : String(value);

    return {
      rarity: meta.rarity,
      iconKey: meta.iconKey,
      title,
      subtitle,
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
      unlockedArtifactsCount: 0,
      totalArtifactsCount: DEFAULT_TOTAL_ARTIFACTS_COUNT,
    },
    highlights: [],
    achievements: [],
    artifacts: [],
  };
}

export interface ResolvedRetrospectiveViewMeta {
  focusHours: number;
  bestMonthName: string | null;
  archetypeTitle: string;
  archetypeDesc: string;
  rarestTitle: string | null;
  rarestRarityLabel: string | null;
}

/**
 * Resolve rótulos e métricas derivadas de uma retrospectiva para o painel e o cartão de compartilhamento.
 */
export function resolveRetrospectiveViewMeta(
  retro: UserRetrospectiveData | null | undefined,
  locale: string,
  isGamified: boolean,
  translators: {
    tRetro: CatalogTranslator;
    tCatalog: CatalogTranslator;
    tRarities: CatalogTranslator;
  },
): ResolvedRetrospectiveViewMeta {
  const focusHours = retro
    ? Math.round((retro.focusMinutes / 60) * 10) / 10
    : 0;
  const bestMonthName =
    retro?.bestMonth && retro.bestMonth >= 1 && retro.bestMonth <= 12
      ? new Intl.DateTimeFormat(locale, {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2024, retro.bestMonth - 1, 1)))
      : null;

  const archetypeKey = retro?.archetype ?? "RISING_SPARK";
  const archetypeTitle = isGamified
    ? translators.tRetro(`archetypes.${archetypeKey}.title` as never)
    : translators.tRetro(`archetypes.${archetypeKey}.essentialTitle` as never);
  const archetypeDesc = translators.tRetro(
    `archetypes.${archetypeKey}.desc` as never,
  );

  const rarestTitle = resolveRetrospectiveAchievementTitle(
    retro,
    isGamified,
    translators.tCatalog,
  );
  const rawRarity = retro?.rarestAchievementRarity;
  const rarestRarityLabel =
    rawRarity && translators.tRarities.has(rawRarity as never)
      ? translators.tRarities(rawRarity as never)
      : (rawRarity ?? null);

  return {
    focusHours,
    bestMonthName,
    archetypeTitle,
    archetypeDesc,
    rarestTitle,
    rarestRarityLabel,
  };
}
