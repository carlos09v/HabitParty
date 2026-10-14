import type { components } from "@/api/schema";

// 1. DTOs Base (Direto do backend)
export type RewardResponseDTO = components["schemas"]["RewardResponseDTO"];
export type CreateRewardDTO = components["schemas"]["CreateRewardDTO"];
export type UpdateRewardDTO = components["schemas"]["UpdateRewardDTO"];

export type RewardType =
  | NonNullable<RewardResponseDTO["type"]>
  | "SingleUse"
  | "TimeBased"
  | "MysteryBox"; // Union com tipos antigos para compatibilidade
export type RewardCategory =
  | NonNullable<RewardResponseDTO["category"]>
  | "Nenhum"
  | "Entretenimento"
  | "Bem-estar"
  | "Compras"
  | "Desenvolvimento"
  | "Sorte"
  | "Hobbies";
export type PackageLevel =
  | NonNullable<RewardResponseDTO["packageLevel"]>
  | "Nenhum"
  | "Básico"
  | "Premium"
  | "Épico"
  | "Lendário"
  | "NONE"
  | "BASIC"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY";

// 2. Model UI (Entidade estendida)
export interface Reward
  extends Omit<RewardResponseDTO, "type" | "category" | "packageLevel"> {
  id: string;
  title: string;
  description: string;
  price: number;
  type: RewardType;
  category: RewardCategory;
  packageLevel?: PackageLevel;
  duration?: string;
  baseDurationMinutes?: number;
  iconName?:
    | "joystick"
    | "mystery_box"
    | "coffee"
    | "book"
    | "clapperboard"
    | string;
}

// 3. Props e Outros Tipos
export interface RewardCardProps {
  reward: Reward;
  onBuy?: (reward: Reward) => void;
  onContextMenu?: (e: React.MouseEvent, reward: Reward) => void;
  isCompact?: boolean;
}

export interface AddRewardCardProps {
  onClick?: () => void;
  viewMode?: "card" | "list";
}

export interface RewardFilterState {
  search: string;
  type: string;
  category: string;
  tag: string;
  packageLevel: string;
  viewMode: "card" | "list";
}

export interface RewardFiltersProps {
  filters: RewardFilterState;
  onChange: (newFilters: Partial<RewardFilterState>) => void;
  onClear: () => void;
}

export type { SelectOption } from "@/types/ui";
