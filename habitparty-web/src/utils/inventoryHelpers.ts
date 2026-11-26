import type { InventoryItem } from "@/types/inventory";
import { isBackpackItemTimeDepleted } from "@/utils/focusFormatters";
import { isMysteryBoxReward } from "@/utils/rewardMapper";

export interface InventoryItemActionMeta {
  isMystery: boolean;
  isCoupon: boolean;
  isInFocus: boolean;
  isDepletedCoupon: boolean;
  actionLabel: string;
}

export interface InventoryItemActionLabels {
  openInFocus: string;
  completeCoupon: string;
  openBox: string;
  sendToFocus: string;
  use: string;
}

/**
 * Normaliza e resolve as propriedades de apresentação e ações de um item do inventário.
 * Centraliza a regra de negócio para evitar duplicações entre InventoryCard, InventoryItemRow e InventoryContainer.
 */
export function getInventoryItemActionMeta(
  item: InventoryItem,
  labels?: Partial<InventoryItemActionLabels>,
): InventoryItemActionMeta {
  const reward = item.reward;
  const isInFocus = item.status === "IN_FOCUS";

  const rawType = reward?.type;
  const isMystery = isMysteryBoxReward(rawType);

  const isCoupon =
    !isMystery &&
    (rawType === "TimeBased" ||
      rawType === "TIME_BASED" ||
      Boolean(reward?.baseDurationMinutes));

  const isDepletedCoupon =
    isCoupon && isBackpackItemTimeDepleted(item.remainingSeconds);

  const openInFocusLabel = labels?.openInFocus ?? "Abrir no Foco";
  const completeCouponLabel = labels?.completeCoupon ?? "Concluir";
  const openBoxLabel = labels?.openBox ?? "Abrir Caixa";
  const sendToFocusLabel = labels?.sendToFocus ?? "Enviar ao Foco";
  const useLabel = labels?.use ?? "Usar";

  const actionLabel = isDepletedCoupon
    ? completeCouponLabel
    : isInFocus
      ? openInFocusLabel
      : isMystery
        ? openBoxLabel
        : isCoupon
          ? sendToFocusLabel
          : useLabel;

  return {
    isMystery,
    isCoupon,
    isInFocus,
    isDepletedCoupon,
    actionLabel,
  };
}

/**
 * Resolve o estado de carregamento da ação principal do card/linha de inventário.
 */
export function resolveInventoryItemLoadingState(
  meta: Pick<
    InventoryItemActionMeta,
    "isInFocus" | "isMystery" | "isCoupon" | "isDepletedCoupon"
  >,
  loading?: {
    isUsing?: boolean;
    isSendingToFocus?: boolean;
    isReturning?: boolean;
  },
): { isPrimaryLoading: boolean } {
  const isUsing = Boolean(loading?.isUsing);
  const isSendingToFocus = Boolean(loading?.isSendingToFocus);
  const isReturning = Boolean(loading?.isReturning);
  const isPrimaryLoading = meta.isDepletedCoupon
    ? isUsing || isReturning
    : meta.isInFocus
      ? isReturning
      : meta.isMystery
        ? false
        : meta.isCoupon
          ? isSendingToFocus || isUsing
          : isUsing;
  return { isPrimaryLoading };
}

export interface InventoryActionDispatchers {
  onOpenFocus: (itemId: string) => void;
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
  const { isInFocus, isDepletedCoupon, isMystery, isCoupon } =
    getInventoryItemActionMeta(item);

  if (isDepletedCoupon) {
    dispatchers.onUse?.(item);
  } else if (isInFocus) {
    const primaryPhysicalId =
      item.itemIds?.[0] || item.inventoryItemId || item.id;
    dispatchers.onOpenFocus(primaryPhysicalId);
  } else if (isMystery && dispatchers.onOpenMysteryBox) {
    dispatchers.onOpenMysteryBox(item);
  } else if (isCoupon && dispatchers.onSendToFocus) {
    dispatchers.onSendToFocus(item);
  } else {
    dispatchers.onUse?.(item);
  }
}
