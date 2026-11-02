import type { InventoryItem } from "@/types/inventory";

export interface InventoryItemActionMeta {
  isMystery: boolean;
  isCoupon: boolean;
  isInFocus: boolean;
  actionLabel: string;
  secondaryActionLabel?: string;
}

export interface InventoryItemActionLabels {
  openInFocus: string;
  openBox: string;
  sendToFocus: string;
  use: string;
}

/**
 * Normaliza e resolve as propriedades de apresentação e ações de um item do inventário.
 * Centraliza a regra de negócio para evitar duplicações entre InventoryCard e ItemRow/InventoryContainer.
 */
export function getInventoryItemActionMeta(
  item: InventoryItem,
  labels?: Partial<InventoryItemActionLabels>,
): InventoryItemActionMeta {
  const reward = item.reward;
  const isInFocus = item.status === "IN_FOCUS";

  const rawType = reward?.type || item.itemType;
  const isMystery =
    rawType === "MysteryBox" ||
    rawType === "MISTERY_BOX" ||
    reward?.icon === "mystery_box" ||
    reward?.iconName === "mystery_box" ||
    item.iconName === "mystery_box";

  const isCoupon =
    !isMystery &&
    (rawType === "TimeBased" ||
      rawType === "TIME_BASED" ||
      Boolean(reward?.baseDurationMinutes));

  const openInFocusLabel = labels?.openInFocus ?? "Abrir no Foco";
  const openBoxLabel = labels?.openBox ?? "Abrir Caixa";
  const sendToFocusLabel = labels?.sendToFocus ?? "Enviar ao Foco";
  const useLabel = labels?.use ?? "Usar";

  const actionLabel = isInFocus
    ? openInFocusLabel
    : isMystery
      ? openBoxLabel
      : isCoupon
        ? sendToFocusLabel
        : useLabel;

  const secondaryActionLabel = !isInFocus && isCoupon ? useLabel : undefined;

  return {
    isMystery,
    isCoupon,
    isInFocus,
    actionLabel,
    secondaryActionLabel,
  };
}

export interface InventoryActionDispatchers {
  onOpenFocus: () => void;
  onOpenMysteryBox?: (item: InventoryItem) => void;
  onSendToFocus?: (item: InventoryItem) => void;
  onUse?: (item: InventoryItem) => void;
}

/**
 * Executa a ação apropriada para o item com base em seu estado atual.
 */
export function executeInventoryItemAction(
  item: InventoryItem,
  dispatchers: InventoryActionDispatchers,
) {
  const { isInFocus, isMystery, isCoupon } = getInventoryItemActionMeta(item);

  if (isInFocus) {
    dispatchers.onOpenFocus();
  } else if (isMystery && dispatchers.onOpenMysteryBox) {
    dispatchers.onOpenMysteryBox(item);
  } else if (isCoupon && dispatchers.onSendToFocus) {
    dispatchers.onSendToFocus(item);
  } else {
    dispatchers.onUse?.(item);
  }
}
