import type { components } from "@/api/schema";
import type { Reward } from "@/types/reward";
import type { ArtifactItemResponseDTO } from "@/types/showcase";

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
  droppedArtifact?: ArtifactItemResponseDTO | null;
}

export type InventoryItemType = NonNullable<
  InventoryItemResponseDTO["rewardType"]
>;

// 2. Model UI (Entidade estendida)
export interface InventoryItem
  extends Omit<InventoryItemResponseDTO, "rewardType"> {
  id: string; // ID principal da pilha (primeiro item físico)
  stackKey?: string; // Chave estável da pilha (evita unmount/remount ao consumir 1 unidade)
  itemIds?: string[]; // Todos os inventoryItemIds agrupados nesta pilha
  itemOrderIndexes?: number[]; // orderIndex correspondente a cada item físico em itemIds
  quantity: number;
  remainingSeconds?: number;
  reward: Reward;
}

// 3. Props de Componentes
export interface InventoryCardProps {
  item: InventoryItem;
  isGamified?: boolean;
  isReorderDisabled?: boolean;
  onOpenFocus?: (itemId: string) => void;
  onUse?: (item: InventoryItem) => void;
  onSendToFocus?: (item: InventoryItem) => void;
  onOpenMysteryBox?: (item: InventoryItem) => void;
  onContextMenu?: (e: React.MouseEvent, item: InventoryItem) => void;
  isUsing?: boolean;
  isSendingToFocus?: boolean;
  isReturning?: boolean;
}

export type { ItemCatalogFilterState } from "@/types/ui";
