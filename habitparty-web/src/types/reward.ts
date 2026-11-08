import type { LucideIcon } from "lucide-react";
import type { components } from "@/api/schema";
import type { IconOption } from "@/types/ui";

// 1. DTOs Base (Direto do backend)
export type RewardResponseDTO = components["schemas"]["RewardResponseDTO"];
export type CreateRewardDTO = components["schemas"]["CreateRewardDTO"];
export type UpdateRewardDTO = components["schemas"]["UpdateRewardDTO"];
export type UpdateRewardOrderDTO =
  components["schemas"]["UpdateRewardOrderDTO"];
export type MysteryBoxLootItem = components["schemas"]["MysteryBoxLootItem"];

export type MysteryBoxPresetId = "gamer" | "relax" | "gastronomy" | "hobbies";

export interface MysteryBoxPreset {
  id: MysteryBoxPresetId;
  icon: LucideIcon;
  tiers: Record<
    "Básico" | "Premium" | "Épico" | "Lendário",
    readonly [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem]
  >;
}

export type PackageMessageKey =
  | "NONE"
  | "BASIC"
  | "PREMIUM"
  | "EPIC"
  | "LEGENDARY";

export type CategoryMessageKey =
  | "NONE"
  | "ENTERTAINMENT"
  | "WELLNESS"
  | "SHOPPING"
  | "DEVELOPMENT"
  | "LUCK"
  | "HOBBIES";

export type RewardTypeMessageKey = "SingleUse" | "TimeBased" | "MysteryBox";

export interface RewardTypeMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export type RewardIconOption = IconOption;

export interface MysteryBoxDropRate {
  percentage: number;
  label: string;
  description: string;
  badgeVariant: "emerald" | "amber" | "purple" | "gold";
}

export interface MysteryBoxTier {
  id: "Básico" | "Premium" | "Épico" | "Lendário";
  backendPackageLevel: "BASIC" | "PREMIUM" | "EPIC" | "LEGENDARY";
  name: string;
  recommendedPrice: number;
  subtitle: string;
  concept: string;
  colorName: string;
  icon: LucideIcon;
  badgeClass: string;
  borderClass: string;
  borderSelectedClass: string;
  bgClass: string;
  bgSelectedClass: string;
  textClass: string;
  glowClass: string;
  ringClass: string;
  accentGlow: string;
  slotMaxMinutes: readonly [number, number, number];
  dropRates: MysteryBoxDropRate[];
}

export interface CouponPackageOption {
  id: PackageLevel;
  label: string;
  suggestedMinutes?: number;
  suggestedPrice?: number;
  dotColor?: string;
  unselectedClass: string;
  selectedClass: string;
}

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
  lootItems?: MysteryBoxLootItem[];
}

// 3. Props e Outros Tipos
export interface RewardCardProps {
  reward: Reward;
  onBuy?: (reward: Reward) => void;
  onEdit?: (reward: Reward) => void;
  onContextMenu?: (e: React.MouseEvent, reward: Reward) => void;
  isCompact?: boolean;
  canAfford?: boolean;
}

export interface AddRewardCardProps {
  onClick?: () => void;
  viewMode?: "card" | "list";
  isCompact?: boolean;
}

export interface RouletteItem {
  id: string;
  name: string;
  icon: string;
  minutes: number | null;
  badgeVariant: "emerald" | "amber" | "purple" | "gold";
  badgeLabel: string;
}

export type {
  ItemCatalogFilterState as RewardFilterState,
  ItemCatalogFilterState,
} from "@/types/ui";

export interface RewardFiltersProps {
  filters: import("@/types/ui").ItemCatalogFilterState;
  onChange: (
    newFilters: Partial<import("@/types/ui").ItemCatalogFilterState>,
  ) => void;
  onClear: () => void;
}

export type { SelectOption } from "@/types/ui";

// 4. Contrato unificado de Estimativa de Recompensas (Foco + Tarefas)
export interface RewardEstimateNotice {
  tone: "info" | "warning";
  title: string;
  message: string;
}

export interface RewardEstimateBreakdownItem {
  label: string;
  value: string;
}

export interface RewardEstimate {
  gold: number;
  xp: number;
  status?: "full" | "reduced" | "none";
  zeroReason?: string;
  notices?: RewardEstimateNotice[];
  breakdown?: RewardEstimateBreakdownItem[];
  stageLabel?: string;
}
