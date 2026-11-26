import { useSortable } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import {
  type CatalogSortableBindings,
  IDLE_SORTABLE_BINDINGS,
} from "@/hooks/useCatalogItemInteraction";
import {
  type MysteryPopoverBridge,
  useMysteryBoxItemPopover,
} from "@/hooks/useMysteryBoxItemPopover";
import type { MysteryBoxLootItem, MysteryBoxTier } from "@/types/reward";
import {
  type CatalogItemVisuals,
  resolveCatalogItemVisuals,
} from "@/utils/catalogItemVisuals";

export interface CatalogItemRenderContext {
  visuals: CatalogItemVisuals;
  sortable: CatalogSortableBindings;
  isDragDisabled: boolean;
  mysteryPopover?: MysteryPopoverBridge;
}

interface CatalogItemWrapperProps {
  id: string;
  sortableId?: string;
  type: string;
  iconName?: string;
  packageLevel?: string | null;
  category?: string | null;
  price?: number;
  showMysteryPriceFooter?: boolean;
  isGamified?: boolean;
  isActiveFocusSession?: boolean;
  isDragDisabled?: boolean;
  dragData?: Record<string, unknown>;
  lootItems?: MysteryBoxLootItem[];
  render: (context: CatalogItemRenderContext) => ReactNode;
}

interface CatalogItemBranchProps {
  visuals: CatalogItemVisuals;
  sortable: CatalogSortableBindings;
  isDragDisabled: boolean;
  price?: number;
  showMysteryPriceFooter?: boolean;
  isGamified?: boolean;
  lootItems?: MysteryBoxLootItem[];
  render: (context: CatalogItemRenderContext) => ReactNode;
}

function MysteryPopoverBranch({
  mysteryTier,
  price,
  showMysteryPriceFooter,
  isGamified,
  lootItems,
  visuals,
  sortable,
  isDragDisabled,
  render,
}: CatalogItemBranchProps & {
  mysteryTier: MysteryBoxTier;
}) {
  const mysteryPopover = useMysteryBoxItemPopover({
    mysteryTier,
    isDragging: sortable.isDragging,
    price,
    showPriceFooter: showMysteryPriceFooter,
    isGamified,
    lootItems,
  });

  return (
    <>
      {render({
        visuals,
        sortable,
        isDragDisabled,
        mysteryPopover,
      })}
    </>
  );
}

function CatalogItemBranch(props: CatalogItemBranchProps) {
  const { visuals, sortable, isDragDisabled, render } = props;
  if (visuals.isMystery && visuals.mysteryTier) {
    return (
      <MysteryPopoverBranch {...props} mysteryTier={visuals.mysteryTier} />
    );
  }

  return (
    <>
      {render({
        visuals,
        sortable,
        isDragDisabled,
      })}
    </>
  );
}

/**
 * Wrapper compartilhado de catálogo que resolve metadados visuais, controla `useSortable`
 * de forma estável via `disabled` (sem trocar o tipo do componente raiz nem desmontar o card)
 * e isola o popover flutuante apenas em Caixas Misteriosas.
 * Elimina a duplicação de 4 camadas entre `GamifiedItemCard` e `ItemRow`.
 */
export function CatalogItemWrapper({
  id,
  sortableId,
  type,
  iconName,
  packageLevel,
  category,
  price,
  showMysteryPriceFooter = true,
  isGamified,
  isActiveFocusSession,
  isDragDisabled,
  dragData,
  lootItems,
  render,
}: CatalogItemWrapperProps) {
  const visuals = resolveCatalogItemVisuals({
    type,
    iconName,
    packageLevel,
    category,
    isActiveFocusSession,
    includeMysteryTier: true,
  });

  const effectiveDragDisabled = Boolean(isDragDisabled || visuals.isDebt);

  const sortable = useSortable({
    id: sortableId ?? id,
    data: dragData || { id },
    disabled: effectiveDragDisabled,
  });

  return (
    <CatalogItemBranch
      visuals={visuals}
      sortable={effectiveDragDisabled ? IDLE_SORTABLE_BINDINGS : sortable}
      isDragDisabled={effectiveDragDisabled}
      price={price}
      showMysteryPriceFooter={showMysteryPriceFooter}
      isGamified={isGamified}
      lootItems={lootItems}
      render={render}
    />
  );
}
