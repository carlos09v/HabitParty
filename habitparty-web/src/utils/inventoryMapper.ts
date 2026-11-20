import type { components } from "@/api/schema";
import {
  DEFAULT_MYSTERY_BOX_LOOT,
  MYSTERY_BOX_PRESETS,
  MYSTERY_BOX_TIERS,
} from "@/constants/mysteryBox";
import type { AppLocale } from "@/i18n/config";
import rewardsEn from "@/messages/en/rewards.json";
import rewardsPtBr from "@/messages/pt-BR/rewards.json";
import type { InventoryItem } from "@/types/inventory";
import type { PackageLevel, Reward, RewardCategory } from "@/types/reward";
import {
  BACKEND_TO_UI_CATEGORY,
  BACKEND_TO_UI_PACKAGE,
  BACKEND_TO_UI_REWARD_TYPE,
} from "./rewardMapper";

type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];
type MysteryTierKey = "BASIC" | "PREMIUM" | "EPIC" | "LEGENDARY";
type MysterySlotKey = "0" | "1" | "2";

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
  const slots = DEFAULT_MYSTERY_BOX_LOOT[tierId];
  const categories = DEFAULT_TIER_SLOT_CATEGORIES[tierId];
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

// Nome canônico usado no backend (`MysteryBoxLootTable.java`) para o slot 1 Lendário
if (!DEFAULT_LOOT_META_BY_NAME.has("day-off integral")) {
  DEFAULT_LOOT_META_BY_NAME.set("day-off integral", {
    category: "Bem-estar",
    tierKey: "LEGENDARY",
    slotIndex: "1",
  });
}

for (const preset of MYSTERY_BOX_PRESETS) {
  for (const tierSlots of Object.values(preset.tiers)) {
    for (const slot of tierSlots) {
      const key = slot.name.trim().toLowerCase();
      if (!DEFAULT_LOOT_META_BY_NAME.has(key)) {
        DEFAULT_LOOT_META_BY_NAME.set(key, { category: preset.category });
      }
    }
  }
}

function resolveBuiltInTierDropDescription(
  tierKey: MysteryTierKey,
  slotIndex: MysterySlotKey,
  locale: AppLocale = "pt-BR",
): string | undefined {
  const messages = locale === "en" ? rewardsEn : rewardsPtBr;
  return messages.mysteryBox.tiers[tierKey]?.drops[slotIndex]?.description;
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
  locale = "pt-BR",
}: {
  prizeName?: string;
  sourceBoxReward?: Reward;
  storeRewards?: Reward[];
  packageLevel?: PackageLevel;
  locale?: AppLocale;
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
    builtInMeta?.tierKey && builtInMeta?.slotIndex
      ? resolveBuiltInTierDropDescription(
          builtInMeta.tierKey,
          builtInMeta.slotIndex,
          locale,
        )
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
 * Agrupa itens do inventário disponíveis por rewardId, preservando a ordenação por `orderIndex`,
 * rastreando todos os IDs individuais (`itemIds`) da pilha e enriquecendo categoria/descrição
 * a partir do catálogo de recompensas da loja quando disponível.
 */
export function mapAndGroupInventory(
  items: InventoryItemResponseDTO[],
  rewards: Reward[] = [],
  locale: AppLocale = "pt-BR",
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

    const isCoupon =
      dto.rewardType === "TIME_BASED" ||
      (dto.remainingSeconds !== undefined && dto.remainingSeconds !== null);

    const rawType = dto.rewardType || "SINGLE_USE";
    const pkgKey = dto.rewardPackageLevel || "NONE";
    const normalizedName = (dto.rewardName || "").trim().toLowerCase();

    // Cupons com tempos restantes diferentes e Caixas Misteriosas lacradas vs itens abertos NÃO devem ser agrupados juntos
    const remKey =
      isCoupon &&
      dto.remainingSeconds !== undefined &&
      dto.remainingSeconds !== null
        ? `_rem_${dto.remainingSeconds}`
        : isCoupon
          ? "_rem_full"
          : "";

    const groupKey = `${rewardId}_${rawType}_${pkgKey}_${normalizedName}_${statusKey}${remKey}`;

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
            packageLevel,
            locale,
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
        itemIds: [primaryItemId],
        itemOrderIndexes: [dto.orderIndex ?? 0],
        inventoryItemId: dto.inventoryItemId,
        orderIndex: dto.orderIndex,
        status: dto.status,
        quantity: 1,
        remainingSeconds: dto.remainingSeconds,
        reward: {
          id: rewardId,
          title: dto.rewardName || storeReward?.title || "",
          description: resolvedDescription,
          type: mappedType,
          category: resolvedCategory,
          price: dto.rewardPrice ?? storeReward?.price ?? 0,
          baseDurationMinutes:
            dto.remainingSeconds !== undefined && dto.remainingSeconds !== null
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
