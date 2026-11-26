import type { components } from "@/api/schema";
import {
  DEFAULT_MYSTERY_BOX_LOOT,
  DEFAULT_MYSTERY_BOX_LOOT_EN,
  getLocalizedMysteryBoxPresetSlots,
  MYSTERY_BOX_PRESETS,
  MYSTERY_BOX_TIERS,
} from "@/constants/mysteryBox";
import type { InventoryItem } from "@/types/inventory";
import type { Reward, RewardCategory } from "@/types/reward";
import {
  BACKEND_TO_UI_CATEGORY,
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
} from "./rewardMapper";

type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];
export type MysteryTierKey = "BASIC" | "PREMIUM" | "EPIC" | "LEGENDARY";
export type MysterySlotKey = "0" | "1" | "2";

export type BuiltInDropDescriptionResolver = (
  tierKey: MysteryTierKey,
  slotIndex: MysterySlotKey,
) => string | undefined;

export type MysteryTierDropTranslationKey =
  `${MysteryTierKey}.drops.${MysterySlotKey}.description`;

export interface MysteryTierDropTranslator {
  (key: MysteryTierDropTranslationKey): string;
  has: (key: MysteryTierDropTranslationKey) => boolean;
}

/**
 * Adapta um tradutor `next-intl` no namespace `rewards.mysteryBox.tiers`
 * (client `useTranslations` ou server `getTranslations`) para `BuiltInDropDescriptionResolver`.
 */
export function createBuiltInDropDescriptionResolver(
  tMysteryTiers: MysteryTierDropTranslator,
): BuiltInDropDescriptionResolver {
  return (tierKey, slotIndex) => {
    const key: MysteryTierDropTranslationKey = `${tierKey}.drops.${slotIndex}.description`;
    return tMysteryTiers.has(key) ? tMysteryTiers(key) : undefined;
  };
}

const DEFAULT_TIER_SLOT_CATEGORIES: Record<
  "Básico" | "Premium" | "Épico" | "Lendário",
  readonly [RewardCategory, RewardCategory, RewardCategory]
> = {
  Básico: ["Bem-estar", "Entretenimento", "Hobbies"],
  Premium: ["Entretenimento", "Entretenimento", "Entretenimento"],
  Épico: ["Entretenimento", "Entretenimento", "Bem-estar"],
  Lendário: ["Hobbies", "Bem-estar", "Sorte"],
};

interface BuiltInLootMeta {
  category: RewardCategory;
  tierKey?: MysteryTierKey;
  slotIndex?: MysterySlotKey;
}

const DEFAULT_LOOT_META_BY_NAME = new Map<string, BuiltInLootMeta>();

for (const tier of MYSTERY_BOX_TIERS) {
  const tierId = tier.id as "Básico" | "Premium" | "Épico" | "Lendário";
  const categories = DEFAULT_TIER_SLOT_CATEGORIES[tierId];
  for (const table of [DEFAULT_MYSTERY_BOX_LOOT, DEFAULT_MYSTERY_BOX_LOOT_EN]) {
    const slots = table[tierId];
    slots?.forEach((slot, idx) => {
      const key = slot.name.trim().toLowerCase();
      if (!DEFAULT_LOOT_META_BY_NAME.has(key)) {
        DEFAULT_LOOT_META_BY_NAME.set(key, {
          category: categories[idx] ?? "Sorte",
          tierKey: tier.backendPackageLevel,
          slotIndex: String(idx) as MysterySlotKey,
        });
      }
    });
  }
}

// Compatibilidade com nomes históricos no backend/presets anteriores
for (const [legacyName, meta] of [
  [
    "day-off estendido",
    { category: "Bem-estar", tierKey: "LEGENDARY", slotIndex: "1" },
  ],
  [
    "lazer padrão",
    { category: "Entretenimento", tierKey: "PREMIUM", slotIndex: "0" },
  ],
] as const) {
  if (!DEFAULT_LOOT_META_BY_NAME.has(legacyName)) {
    DEFAULT_LOOT_META_BY_NAME.set(legacyName, meta);
  }
}

for (const preset of MYSTERY_BOX_PRESETS) {
  for (const tier of MYSTERY_BOX_TIERS) {
    const tierId = tier.id as "Básico" | "Premium" | "Épico" | "Lendário";
    const ptSlots = preset.tiers[tierId] ?? [];
    const enSlots =
      getLocalizedMysteryBoxPresetSlots(preset.id, tierId, "en") ?? [];
    for (const slot of [...ptSlots, ...enSlots]) {
      const key = slot.name.trim().toLowerCase();
      if (!DEFAULT_LOOT_META_BY_NAME.has(key)) {
        DEFAULT_LOOT_META_BY_NAME.set(key, { category: preset.category });
      }
    }
  }
}

function normalizeUiCategory(
  rawCategory: string | null | undefined,
): RewardCategory | undefined {
  if (!rawCategory) return undefined;
  return (
    BACKEND_TO_UI_CATEGORY[rawCategory] ||
    (Object.values(BACKEND_TO_UI_CATEGORY).includes(
      rawCategory as RewardCategory,
    )
      ? (rawCategory as RewardCategory)
      : undefined)
  );
}

/**
 * Resolve categoria e descrição significativas para um prêmio físico obtido de uma Caixa Misteriosa,
 * consultando slots salvos na caixa, catálogo da loja, presets/padrões e a própria caixa de origem.
 */
export function resolveOpenedMysteryBoxMetadata({
  prizeName,
  sourceBoxReward,
  storeRewards = [],
  getDropDescription,
}: {
  prizeName?: string;
  sourceBoxReward?: Reward;
  storeRewards?: Reward[];
  getDropDescription?: BuiltInDropDescriptionResolver;
}): { category: RewardCategory; description: string } {
  const normalizedName = (prizeName || "").trim().toLowerCase();

  const matchingSlot = normalizedName
    ? sourceBoxReward?.lootItems?.find(
        (slot) => slot.name.trim().toLowerCase() === normalizedName,
      )
    : undefined;

  const matchingStoreReward = normalizedName
    ? storeRewards.find(
        (reward) =>
          reward.type !== "MysteryBox" &&
          reward.title.trim().toLowerCase() === normalizedName,
      )
    : undefined;

  const builtInMeta = normalizedName
    ? DEFAULT_LOOT_META_BY_NAME.get(normalizedName)
    : undefined;
  const builtInDescription =
    builtInMeta?.tierKey && builtInMeta?.slotIndex && getDropDescription
      ? getDropDescription(builtInMeta.tierKey, builtInMeta.slotIndex)
      : undefined;

  const boxCustomCategory =
    sourceBoxReward?.category &&
    sourceBoxReward.category !== "Nenhum" &&
    sourceBoxReward.category !== "Sorte"
      ? sourceBoxReward.category
      : undefined;

  const resolvedCategory: RewardCategory =
    normalizeUiCategory(matchingSlot?.category) ||
    (matchingStoreReward?.category && matchingStoreReward.category !== "Nenhum"
      ? matchingStoreReward.category
      : undefined) ||
    builtInMeta?.category ||
    boxCustomCategory ||
    (sourceBoxReward?.category && sourceBoxReward.category !== "Nenhum"
      ? sourceBoxReward.category
      : "Sorte");

  const resolvedDescription =
    matchingSlot?.description?.trim() ||
    matchingStoreReward?.description?.trim() ||
    builtInDescription ||
    sourceBoxReward?.description?.trim() ||
    "";

  return {
    category: resolvedCategory,
    description: resolvedDescription,
  };
}

/**
 * Constrói uma chave estável para uma pilha de inventário (preserva identidade DOM/foco quando 1 unidade é consumida).
 */
export function buildInventoryStackKey(params: {
  rewardId: string;
  rawType: string;
  packageKey: string;
  title: string;
  status: string;
  remainingSeconds?: number | null;
}): string {
  const isCoupon =
    params.rawType === "TIME_BASED" ||
    params.rawType === "TimeBased" ||
    (params.remainingSeconds !== undefined && params.remainingSeconds !== null);

  const normalizedName = params.title.trim().toLowerCase();
  const remKey =
    isCoupon &&
    params.remainingSeconds !== undefined &&
    params.remainingSeconds !== null
      ? `_rem_${params.remainingSeconds}`
      : isCoupon
        ? "_rem_full"
        : "";

  return `${params.rewardId}_${params.rawType}_${params.packageKey}_${normalizedName}_${params.status}${remKey}`;
}

/**
 * Agrupa itens do inventário disponíveis por rewardId, preservando a ordenação por `orderIndex`,
 * rastreando todos os IDs individuais (`itemIds`) da pilha e enriquecendo categoria/descrição
 * a partir do catálogo de recompensas da loja quando disponível.
 */
export function mapAndGroupInventory(
  items: InventoryItemResponseDTO[],
  rewards: Reward[] = [],
  getDropDescription?: BuiltInDropDescriptionResolver,
): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();
  const rewardById = new Map<string, Reward>(
    rewards.map((reward) => [reward.id, reward]),
  );

  const sortedItems = [...items].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  for (const dto of sortedItems) {
    if (dto.status !== "AVAILABLE" && dto.status !== "IN_FOCUS") continue;

    const rewardId = dto.rewardId || dto.inventoryItemId || "unknown";
    const statusKey = dto.status || "AVAILABLE";
    const rawType = dto.rewardType || "SINGLE_USE";
    const pkgKey = dto.rewardPackageLevel || "NONE";

    const groupKey = buildInventoryStackKey({
      rewardId,
      rawType,
      packageKey: pkgKey,
      title: dto.rewardName || "",
      status: statusKey,
      remainingSeconds: dto.remainingSeconds,
    });

    if (grouped.has(groupKey)) {
      const existing = grouped.get(groupKey);
      if (existing) {
        existing.quantity += 1;
        if (dto.inventoryItemId) {
          existing.itemIds = [
            ...(existing.itemIds ?? [existing.id]),
            dto.inventoryItemId,
          ];
          existing.itemOrderIndexes = [
            ...(existing.itemOrderIndexes ?? [existing.orderIndex ?? 0]),
            dto.orderIndex ?? 0,
          ];
        }
      }
    } else {
      const mappedType = BACKEND_TO_UI_REWARD_TYPE[rawType] || "SingleUse";
      const packageLevel = dto.rewardPackageLevel
        ? BACKEND_TO_UI_PACKAGE[dto.rewardPackageLevel]
        : undefined;

      const storeReward = dto.rewardId
        ? rewardById.get(dto.rewardId)
        : undefined;
      const isFromOpenedMysteryBox = Boolean(
        storeReward &&
          storeReward.type === "MysteryBox" &&
          mappedType !== "MysteryBox",
      );

      const iconName =
        dto.rewardIcon ||
        (!isFromOpenedMysteryBox ? storeReward?.icon : undefined) ||
        (rawType === "MISTERY_BOX" ? "mystery_box" : "gamepad");

      const prizeName = dto.rewardName || storeReward?.title || "";
      const fallbackCategory: RewardCategory =
        rawType === "MISTERY_BOX" ? "Sorte" : "Nenhum";
      const openedMysteryBoxMeta = isFromOpenedMysteryBox
        ? resolveOpenedMysteryBoxMetadata({
            prizeName,
            sourceBoxReward: storeReward,
            storeRewards: rewards,
            getDropDescription,
          })
        : null;

      const resolvedDescription = openedMysteryBoxMeta
        ? openedMysteryBoxMeta.description
        : storeReward?.description || "";
      const resolvedCategory: RewardCategory = openedMysteryBoxMeta
        ? openedMysteryBoxMeta.category
        : storeReward?.category || fallbackCategory;
      const primaryItemId = dto.inventoryItemId || rewardId;

      grouped.set(groupKey, {
        id: primaryItemId,
        stackKey: groupKey,
        itemIds: [primaryItemId],
        itemOrderIndexes: [dto.orderIndex ?? 0],
        inventoryItemId: dto.inventoryItemId,
        orderIndex: dto.orderIndex,
        status: dto.status,
        quantity: 1,
        remainingSeconds:
          mappedType === "TimeBased" ? dto.remainingSeconds : undefined,
        reward: {
          id: rewardId,
          title: dto.rewardName || storeReward?.title || "",
          description: resolvedDescription,
          type: mappedType,
          category: resolvedCategory,
          price: dto.rewardPrice ?? storeReward?.price ?? 0,
          baseDurationMinutes:
            mappedType !== "TimeBased"
              ? undefined
              : dto.remainingSeconds !== undefined &&
                  dto.remainingSeconds !== null
                ? Math.max(1, Math.ceil(dto.remainingSeconds / 60))
                : isFromOpenedMysteryBox
                  ? undefined
                  : storeReward?.baseDurationMinutes,
          icon: iconName,
          packageLevel,
          lootItems: dto.lootItems ?? storeReward?.lootItems,
        },
      });
    }
  }

  return Array.from(grouped.values());
}
