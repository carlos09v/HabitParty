import {
  BookOpen,
  Gamepad2,
  type LucideIcon,
  Package,
  Smile,
  Star,
  Timer,
} from "lucide-react";
import { MYSTERY_BOX_TIERS, REWARD_ICON_MAP } from "@/constants/reward";
import type {
  CategoryMessageKey,
  CreateRewardDTO,
  MysteryBoxLootItem,
  MysteryBoxTier,
  PackageLevel,
  PackageMessageKey,
  Reward,
  RewardCategory,
  RewardResponseDTO,
  RewardType,
  RewardTypeMessageKey,
  UpdateRewardDTO,
} from "@/types/reward";

export { suggestRewardIconFromTitle } from "./iconSuggestion";

/**
 * Resolve o componente de ícone de uma recompensa em O(1) via REWARD_ICON_MAP.
 */
export function getRewardIcon(
  iconId?: string | null,
  rewardType?: string | null,
): LucideIcon {
  if (iconId) {
    const normalized = iconId.trim().toLowerCase();
    if (normalized === "joystick") return Gamepad2;
    if (normalized === "book_open") return BookOpen;
    if (normalized === "smile") return Smile;
    if (normalized === "timer") return Timer;
    if (normalized === "star") return Star;
    if (normalized === "mystery_box" || normalized === "package")
      return Package;
    const found = REWARD_ICON_MAP.get(normalized);
    if (found) return found;
  }
  if (rewardType === "MysteryBox" || rewardType === "MISTERY_BOX") {
    return Package;
  }
  return Gamepad2;
}

export function toPackageMessageKey(pkg?: string | null): PackageMessageKey {
  switch (pkg) {
    case "Básico":
    case "BASIC":
      return "BASIC";
    case "Premium":
    case "PREMIUM":
      return "PREMIUM";
    case "Épico":
    case "EPIC":
      return "EPIC";
    case "Lendário":
    case "LEGENDARY":
      return "LEGENDARY";
    default:
      return "NONE";
  }
}

export function toCategoryMessageKey(cat?: string | null): CategoryMessageKey {
  switch (cat) {
    case "Entretenimento":
    case "ENTERTAINMENT":
      return "ENTERTAINMENT";
    case "Bem-estar":
    case "WELLNESS":
      return "WELLNESS";
    case "Compras":
    case "SHOPPING":
      return "SHOPPING";
    case "Desenvolvimento":
    case "DEVELOPMENT":
      return "DEVELOPMENT";
    case "Sorte":
    case "LUCK":
      return "LUCK";
    case "Hobbies":
    case "HOBBIES":
      return "HOBBIES";
    default:
      return "NONE";
  }
}

export function toRewardTypeMessageKey(
  type?: string | null,
): RewardTypeMessageKey {
  switch (type) {
    case "TimeBased":
    case "TIME_BASED":
      return "TimeBased";
    case "MysteryBox":
    case "MISTERY_BOX":
      return "MysteryBox";
    default:
      return "SingleUse";
  }
}

export function isMysteryBoxReward(
  type?: string | null,
  iconName?: string | null,
): boolean {
  return (
    iconName === "mystery_box" ||
    type === "MysteryBox" ||
    type === "MISTERY_BOX"
  );
}

export function getMysteryBoxTier(
  packageLevel?: string | null,
): MysteryBoxTier {
  if (!packageLevel) return MYSTERY_BOX_TIERS[0];
  return (
    MYSTERY_BOX_TIERS.find(
      (t) =>
        t.id === packageLevel ||
        t.backendPackageLevel === packageLevel ||
        t.id.toLowerCase() === packageLevel.toLowerCase() ||
        t.backendPackageLevel === packageLevel.toUpperCase(),
    ) || MYSTERY_BOX_TIERS[0]
  );
}

export const BACKEND_TO_UI_REWARD_TYPE: Record<string, RewardType> = {
  SINGLE_USE: "SingleUse",
  TIME_BASED: "TimeBased",
  MISTERY_BOX: "MysteryBox",
};

export const UI_TO_BACKEND_REWARD_TYPE: Record<
  RewardType,
  CreateRewardDTO["type"]
> = {
  SingleUse: "SINGLE_USE",
  TimeBased: "TIME_BASED",
  MysteryBox: "MISTERY_BOX",
  SINGLE_USE: "SINGLE_USE",
  TIME_BASED: "TIME_BASED",
  MISTERY_BOX: "MISTERY_BOX",
};

export const BACKEND_TO_UI_CATEGORY: Record<string, RewardCategory> = {
  NONE: "Nenhum",
  ENTERTAINMENT: "Entretenimento",
  WELLNESS: "Bem-estar",
  SHOPPING: "Compras",
  DEVELOPMENT: "Desenvolvimento",
  LUCK: "Sorte",
  HOBBIES: "Hobbies",
};

export const UI_TO_BACKEND_CATEGORY: Record<
  string,
  CreateRewardDTO["category"]
> = {
  Nenhum: "NONE",
  NONE: "NONE",
  Entretenimento: "ENTERTAINMENT",
  ENTERTAINMENT: "ENTERTAINMENT",
  "Bem-estar": "WELLNESS",
  WELLNESS: "WELLNESS",
  Compras: "SHOPPING",
  SHOPPING: "SHOPPING",
  Desenvolvimento: "DEVELOPMENT",
  DEVELOPMENT: "DEVELOPMENT",
  Sorte: "LUCK",
  LUCK: "LUCK",
  Hobbies: "HOBBIES",
  HOBBIES: "HOBBIES",
};

export const BACKEND_TO_UI_PACKAGE: Record<string, PackageLevel> = {
  NONE: "Nenhum",
  BASIC: "Básico",
  PREMIUM: "Premium",
  EPIC: "Épico",
  LEGENDARY: "Lendário",
};

export const UI_TO_BACKEND_PACKAGE: Record<
  string,
  CreateRewardDTO["packageLevel"]
> = {
  Nenhum: "NONE",
  NONE: "NONE",
  Básico: "BASIC",
  BASIC: "BASIC",
  Premium: "PREMIUM",
  PREMIUM: "PREMIUM",
  Épico: "EPIC",
  EPIC: "EPIC",
  Lendário: "LEGENDARY",
  LEGENDARY: "LEGENDARY",
};

/**
 * Converte o DTO retornado do backend em entidade Reward consumida pela UI.
 */
export function mapRewardDtoToReward(dto: RewardResponseDTO): Reward {
  const type = dto.type
    ? BACKEND_TO_UI_REWARD_TYPE[dto.type] || "SingleUse"
    : "SingleUse";

  const category = dto.category
    ? BACKEND_TO_UI_CATEGORY[dto.category] || "Nenhum"
    : "Nenhum";

  const packageLevel = dto.packageLevel
    ? BACKEND_TO_UI_PACKAGE[dto.packageLevel] || "Nenhum"
    : undefined;

  const defaultIcon = type === "MysteryBox" ? "mystery_box" : "gamepad";
  const icon = dto.icon || defaultIcon;

  return {
    id: dto.id || "",
    title: dto.name || "",
    description: dto.description || "",
    type,
    category,
    packageLevel,
    price: dto.price || 0,
    baseDurationMinutes: dto.baseDurationMinutes,
    icon,
    iconName: icon,
    orderIndex: dto.orderIndex,
    lootItems: dto.lootItems,
  };
}

export interface RewardFormInput {
  title: string;
  description?: string;
  price: number;
  type: RewardType;
  category: RewardCategory;
  packageLevel?: PackageLevel;
  baseDurationMinutes?: number;
  icon?: string;
  lootItems?: MysteryBoxLootItem[];
}

/**
 * Converte dados do formulário de recompensa no payload de criação.
 */
export function mapRewardFormToCreatePayload(
  input: RewardFormInput,
): CreateRewardDTO {
  const backendType = UI_TO_BACKEND_REWARD_TYPE[input.type] || "SINGLE_USE";
  const backendCategory = UI_TO_BACKEND_CATEGORY[input.category] || "NONE";
  const backendPackageLevel =
    input.type === "SingleUse"
      ? undefined
      : UI_TO_BACKEND_PACKAGE[input.packageLevel || "Nenhum"] || "NONE";

  return {
    name: input.title.trim(),
    description: input.description?.trim() || undefined,
    price: input.price,
    type: backendType,
    category: backendCategory,
    packageLevel: backendPackageLevel,
    icon:
      input.icon || (input.type === "MysteryBox" ? "mystery_box" : "gamepad"),
    baseDurationMinutes:
      input.type === "TimeBased" ? input.baseDurationMinutes : undefined,
    lootItems: input.type === "MysteryBox" ? input.lootItems : undefined,
  };
}

/**
 * Converte dados do formulário de recompensa no payload de atualização.
 */
export function mapRewardFormToUpdatePayload(
  input: RewardFormInput,
): UpdateRewardDTO {
  return mapRewardFormToCreatePayload(input);
}
