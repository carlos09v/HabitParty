import type { components } from "@/api/schema";
import type { Reward } from "@/types/reward";

// 1. DTOs Base (Direto do backend)
export type InventoryItemResponseDTO =
  components["schemas"]["InventoryItemResponseDTO"];
export type UpdateInventoryOrderDTO =
  components["schemas"]["UpdateInventoryOrderDTO"];

export interface MysteryBoxOpenResult {
  inventoryItemId?: string;
  rewardId?: string;
  rewardName?: string;
  rewardIcon?: string;
  rewardPrice?: number;
  rewardType?: string;
  rewardPackageLevel?: string;
  status?: string;
  remainingMinutes?: number;
  remainingSeconds?: number;
}

export type InventoryItemType =
  | NonNullable<InventoryItemResponseDTO["rewardType"]>
  | "Consumable";

// 2. Model UI (Entidade estendida)
export interface InventoryItem
  extends Omit<InventoryItemResponseDTO, "rewardType"> {
  id: string; // Add id for UI
  itemIds?: string[]; // Todos os inventoryItemIds agrupados nesta pilha
  name: string;
  description: string;
  quantity: number;
  itemType: InventoryItemType;
  imageUrl?: string;
  iconName?: string;
  acquiredAt?: string;
  remainingSeconds?: number;
  reward: Reward;
}

// 3. Props de Componentes
export interface InventoryCardProps {
  item: InventoryItem;
  onUse?: (item: InventoryItem) => void;
  onSendToFocus?: (item: InventoryItem) => void;
  onOpenMysteryBox?: (item: InventoryItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: InventoryItem) => void;
  isCompact?: boolean;
}

export type {
  ItemCatalogFilterState as InventoryFilterState,
  ItemCatalogFilterState,
} from "@/types/ui";
