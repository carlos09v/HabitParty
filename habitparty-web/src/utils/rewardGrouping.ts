import type { Reward, RewardDisplayEntry } from "@/types/reward";
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
  /\s*[([](?:pacote\s+|package\s+|pack\s+|tier\s+)?(?:n[íi]vel\s+)?(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary|di[áa]rio|semanal|mimo|marco|\d+\s*(?:min(?:uto)?s?|m|h(?:ora)?s?))[)\]]\s*$/i;

const TRAILING_TIER_PATTERN =
  /\s*(?:[-–—:|•]\s*|\s+)(?:pacote\s+|package\s+|pack\s+)?(?:b[áa]sico|basic|premium|padr[ãa]o|standard|[ée]pico?|epic|lend[áa]rio|legendary)\s*$/i;

const TRAILING_DURATION_PATTERN =
  /\s*(?:[-–—:|•]\s*|\s+)\d+\s*(?:min(?:uto)?s?|m|h(?:ora)?s?)\s*$/i;

/**
 * Remove sufixos de tier/duração (ex.: "- Básico (30m)", "1h", "Épico") do título
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

function normalizeTitleKey(baseTitle: string): string {
  return baseTitle
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
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
  selectedVariantByGroup: Record<string, string> = {},
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
          hasGroupDescription: Boolean(reward.description?.trim()),
        },
      });
      return;
    }

    const typeKey = toRewardTypeMessageKey(reward.type);
    const categoryKey = toCategoryMessageKey(reward.category);
    const displayTitle = extractRewardGroupBaseTitle(reward.title);
    const titleKey = normalizeTitleKey(displayTitle);
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
          hasGroupDescription: Boolean(solo.description?.trim()),
        },
      });
      continue;
    }

    const sortedVariants = [...bucket.items].sort(compareRewardVariants);
    const preferredId = selectedVariantByGroup[bucket.groupId];
    const primaryReward =
      sortedVariants.find((v) => v.id === preferredId) ?? sortedVariants[0];
    const hasGroupDescription = sortedVariants.some((v) =>
      Boolean(v.description?.trim()),
    );

    entries.push({
      firstIndex: bucket.firstIndex,
      entry: {
        groupId: bucket.groupId,
        displayTitle: bucket.displayTitle,
        primaryReward,
        variants: sortedVariants,
        hasGroupDescription,
      },
    });
  }

  return entries
    .sort((a, b) => a.firstIndex - b.firstIndex)
    .map((item) => item.entry);
}
