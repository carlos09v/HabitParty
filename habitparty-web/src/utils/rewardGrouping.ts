import type {
  PackageMessageKey,
  Reward,
  RewardCategory,
  RewardDisplayEntry,
  RewardType,
} from "@/types/reward";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "./rewardMapper";

const PACKAGE_SORT_ORDER: Record<string, number> = {
  NONE: 0,
  BASIC: 1,
  PREMIUM: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

const PAREN_SUFFIX_PATTERN =
  /\s*[([](?:pacote\s+|package\s+|pack\s+|tier\s+)?(?:n[íi]vel\s+)?(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary|di[áa]rio|semanal|mimo|marco|\d+\s*h(?:ora)?s?\s*\d+\s*m(?:in(?:uto)?s?)?|\d+\s*(?:min(?:uto)?s?|m|h(?:ora)?s?))[)\]]\s*$/i;

const TRAILING_TIER_PATTERN =
  /\s*(?:[-–—:|•]\s*|\s+)(?:pacote\s+|package\s+|pack\s+)?(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary)\s*$/i;

const TRAILING_DURATION_PATTERN =
  /\s*(?:[-–—:|•]\s*|\s+)(?:\d+\s*h(?:ora)?s?\s*\d+\s*m(?:in(?:uto)?s?)?|\d+\s*(?:min(?:uto)?s?|m|h(?:ora)?s?))\s*$/i;

/**
 * Remove sufixos de tier/duração (ex.: "- Básico (30m)", "1h 30m", "Épico") do título
 * para agrupar pacotes da mesma recompensa em um card único na vitrine.
 */
export function extractRewardGroupBaseTitle(title: string): string {
  const trimmed = title.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";

  let current = trimmed;
  for (let i = 0; i < 4; i += 1) {
    const next = current
      .replace(PAREN_SUFFIX_PATTERN, "")
      .replace(TRAILING_DURATION_PATTERN, "")
      .replace(TRAILING_TIER_PATTERN, "")
      .replace(/[-–—:|•]\s*$/, "")
      .trim();

    if (!next || next === current) break;
    current = next;
  }

  return current || trimmed;
}

/**
 * Extrai apenas o sufixo que diferencia uma variante dentro de um card agrupado.
 */
export function extractRewardVariantSuffix(title: string): string {
  const normalized = title.trim().replace(/\s+/g, " ");
  const baseTitle = extractRewardGroupBaseTitle(normalized);
  if (!normalized || !baseTitle || normalized.length <= baseTitle.length) {
    return "";
  }
  if (normalized.toLowerCase().startsWith(baseTitle.toLowerCase())) {
    return normalized.slice(baseTitle.length);
  }
  return "";
}

/**
 * Monta o título completo de uma variante preservando o sufixo e respeitando o limite de caracteres.
 */
export function buildRewardVariantTitle(
  baseTitle: string,
  suffix: string,
  maxLength = 30,
): string {
  const trimmedBase = baseTitle.trim().replace(/\s+/g, " ");
  if (!trimmedBase) return "";
  if (!suffix) return trimmedBase.slice(0, maxLength).trim();
  const availableBase = Math.max(1, maxLength - suffix.length);
  const safeBase = trimmedBase.slice(0, availableBase).trim();
  return `${safeBase}${suffix}`.slice(0, maxLength).trim();
}

/**
 * Rótulo curto para identificar um pacote específico em menus e confirmações.
 */
export function formatRewardVariantBadge(
  reward: Reward,
  formatPackageLabel?: (packageKey: PackageMessageKey) => string,
): string {
  const typeKey = toRewardTypeMessageKey(reward.type);
  const pkgKey = toPackageMessageKey(reward.packageLevel);
  if (typeKey === "TimeBased" && reward.baseDurationMinutes) {
    return formatFocusMinutes(reward.baseDurationMinutes);
  }
  if (pkgKey !== "NONE") {
    return formatPackageLabel
      ? formatPackageLabel(pkgKey)
      : String(reward.packageLevel);
  }
  return reward.title;
}

export function normalizeRewardTitleKey(baseTitle: string): string {
  return baseTitle
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Encontra os pacotes existentes do mesmo card na vitrine e quais níveis nomeados
 * (Básico, Premium, Épico, Lendário) já estão em uso nele.
 */
export function findMatchingGroupTierUsage(
  rewards: Reward[],
  params: {
    title: string;
    type: RewardType;
    category: RewardCategory;
    excludeRewardId?: string;
  },
): {
  matchingCount: number;
  usedPackageKeys: Set<PackageMessageKey>;
} {
  const usedPackageKeys = new Set<PackageMessageKey>();
  const targetTypeKey = toRewardTypeMessageKey(params.type);
  const targetCatKey = toCategoryMessageKey(params.category);
  if (
    targetCatKey === "DEBT" ||
    (targetTypeKey !== "TimeBased" && targetTypeKey !== "SingleUse")
  ) {
    return { matchingCount: 0, usedPackageKeys };
  }

  const targetTitleKey = normalizeRewardTitleKey(
    extractRewardGroupBaseTitle(params.title),
  );
  if (!targetTitleKey) {
    return { matchingCount: 0, usedPackageKeys };
  }

  let matchingCount = 0;
  for (const r of rewards) {
    if (params.excludeRewardId && r.id === params.excludeRewardId) continue;
    if (toRewardTypeMessageKey(r.type) !== targetTypeKey) continue;
    if (toCategoryMessageKey(r.category) !== targetCatKey) continue;
    const itemTitleKey = normalizeRewardTitleKey(
      extractRewardGroupBaseTitle(r.title),
    );
    if (itemTitleKey !== targetTitleKey) continue;

    matchingCount += 1;
    const pkgKey = toPackageMessageKey(r.packageLevel);
    if (pkgKey !== "NONE") {
      usedPackageKeys.add(pkgKey);
    }
  }

  return { matchingCount, usedPackageKeys };
}

function compareRewardVariants(a: Reward, b: Reward): number {
  const typeA = toRewardTypeMessageKey(a.type);
  if (typeA === "TimeBased") {
    const durA = a.baseDurationMinutes ?? Number.MAX_SAFE_INTEGER;
    const durB = b.baseDurationMinutes ?? Number.MAX_SAFE_INTEGER;
    if (durA !== durB) return durA - durB;
  }

  const rankA = PACKAGE_SORT_ORDER[toPackageMessageKey(a.packageLevel)] ?? 99;
  const rankB = PACKAGE_SORT_ORDER[toPackageMessageKey(b.packageLevel)] ?? 99;
  if (rankA !== rankB) return rankA - rankB;

  return a.price - b.price;
}

export function isDebtReward(
  reward: Pick<Reward, "category"> | null | undefined,
): boolean {
  return Boolean(reward && toCategoryMessageKey(reward.category) === "DEBT");
}

/**
 * Ordena uma lista de recompensas colocando Dívidas sempre primeiro no topo,
 * preservando a ordem relativa de cada segmento (Dívidas e Recompensas regulares).
 */
export function sortRewardsWithDebtsFirst<T extends Pick<Reward, "category">>(
  rewards: readonly T[],
): T[] {
  if (rewards.length <= 1) {
    return [...rewards];
  }
  const debts: T[] = [];
  const regulars: T[] = [];
  for (const reward of rewards) {
    if (isDebtReward(reward)) {
      debts.push(reward);
    } else {
      regulars.push(reward);
    }
  }
  return [...debts, ...regulars];
}

/**
 * Verifica se dois ou mais itens formam um grupo legítimo de pacotes
 * (mesmo tipo/categoria/nome-base para TimeBased ou SingleUse comum, nunca Dívida ou Caixa).
 */
function canGroupReward(reward: Reward): boolean {
  const typeKey = toRewardTypeMessageKey(reward.type);
  const categoryKey = toCategoryMessageKey(reward.category);
  if (categoryKey === "DEBT") return false;
  return typeKey === "TimeBased" || typeKey === "SingleUse";
}

export function groupRewardsForShowcase(
  rewards: Reward[],
): RewardDisplayEntry[] {
  const bucketMap = new Map<
    string,
    {
      groupId: string;
      displayTitle: string;
      firstIndex: number;
      items: Reward[];
    }
  >();

  const entries: Array<{ firstIndex: number; entry: RewardDisplayEntry }> = [];

  rewards.forEach((reward, index) => {
    if (!canGroupReward(reward)) {
      entries.push({
        firstIndex: index,
        entry: {
          groupId: reward.id,
          displayTitle: reward.title,
          primaryReward: reward,
          variants: [reward],
        },
      });
      return;
    }

    const typeKey = toRewardTypeMessageKey(reward.type);
    const categoryKey = toCategoryMessageKey(reward.category);
    const displayTitle = extractRewardGroupBaseTitle(reward.title);
    const titleKey = normalizeRewardTitleKey(displayTitle);
    const bucketKey = `${typeKey}::${categoryKey}::${titleKey}`;

    const existing = bucketMap.get(bucketKey);
    if (existing) {
      existing.items.push(reward);
      if (displayTitle.length < existing.displayTitle.length) {
        existing.displayTitle = displayTitle;
      }
    } else {
      bucketMap.set(bucketKey, {
        groupId: `group:${bucketKey}`,
        displayTitle,
        firstIndex: index,
        items: [reward],
      });
    }
  });

  for (const bucket of bucketMap.values()) {
    if (bucket.items.length === 1) {
      const solo = bucket.items[0];
      entries.push({
        firstIndex: bucket.firstIndex,
        entry: {
          groupId: solo.id,
          displayTitle: solo.title,
          primaryReward: solo,
          variants: [solo],
        },
      });
      continue;
    }

    const sortedVariants = [...bucket.items].sort(compareRewardVariants);
    const primaryReward = sortedVariants[0];

    entries.push({
      firstIndex: bucket.firstIndex,
      entry: {
        groupId: bucket.groupId,
        displayTitle: bucket.displayTitle,
        primaryReward,
        variants: sortedVariants,
      },
    });
  }

  return entries
    .sort((a, b) => a.firstIndex - b.firstIndex)
    .map((item) => item.entry);
}
