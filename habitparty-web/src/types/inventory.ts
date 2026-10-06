import type { components } from "@/api/schema";
import type { Reward } from "@/types/reward";

// 1. DTOs Base (Direto do backend)
export type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];

export type InventoryItemType =
  | NonNullable<InventoryItemResponseDTO["rewardType"]>
  | "Potion"
  | "Equipment"
  | "Consumable"
  | "Card";
export type InventoryItemRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";

// 2. Model UI (Entidade estendida)
export interface InventoryItem
  extends Omit<InventoryItemResponseDTO, "rewardType"> {
  id: string; // Add id for UI
  name: string;
  description: string;
  quantity: number;
  itemType: InventoryItemType; // Keeping itemType as it might be used in UI
  rarity?: InventoryItemRarity;
  imageUrl?: string;
  iconName?: string;
  isEquipped?: boolean;
  acquiredAt?: string;
  reward: Reward;
}

// 3. Props de Componentes
export interface InventoryCardProps {
  item: InventoryItem;
  onUse?: (item: InventoryItem) => void;
  onEquip?: (item: InventoryItem) => void;
}

export interface InventoryFilterState {
  search: string;
  type: string;
  category: string;
  tag: string;
  packageLevel: string;
  viewMode: "grid" | "list" | "card";
}
