import type { components } from "@/api/schema";
import type {
  PackageLevel,
  Reward,
  RewardCategory,
  RewardType,
} from "@/types/reward";

type RewardResponseDTO = components["schemas"]["RewardResponseDTO"];
type CreateRewardDTO = components["schemas"]["CreateRewardDTO"];
type UpdateRewardDTO = components["schemas"]["UpdateRewardDTO"];

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
