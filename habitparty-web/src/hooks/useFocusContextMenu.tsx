"use client";

import { Pencil, Play, PlusCircle, Trash2, Undo2 } from "lucide-react";
import { useCallback, useState } from "react";
import type { FocusActivity } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  targetType: "activity" | "item" | null;
  activityTarget: FocusActivity | null;
  itemTarget: InventoryItemResponseDTO | null;
}

interface UseFocusContextMenuParams {
  onStartFocusActivity: (act: FocusActivity) => void;
  onStartFocusItem: (item: InventoryItemResponseDTO) => void;
  onEditActivity: (act: FocusActivity) => void;
  onAddManualRecord: (params: { activityId?: string; itemId?: string }) => void;
  onRequestReturnToBackpack?: (item: InventoryItemResponseDTO) => void;
  onRequestDeleteActivity?: (act: FocusActivity) => void;
}

export function useFocusContextMenu({
  onStartFocusActivity,
  onStartFocusItem,
  onEditActivity,
  onAddManualRecord,
  onRequestReturnToBackpack,
  onRequestDeleteActivity,
}: UseFocusContextMenuParams) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    targetType: null,
    activityTarget: null,
    itemTarget: null,
  });

  const openActivityMenu = useCallback(
    (e: React.MouseEvent, activity: FocusActivity) => {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        targetType: "activity",
        activityTarget: activity,
        itemTarget: null,
      });
    },
    [],
  );

  const openItemMenu = useCallback(
    (e: React.MouseEvent, item: InventoryItemResponseDTO) => {
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        targetType: "item",
        activityTarget: null,
        itemTarget: item,
      });
    },
    [],
  );

  const closeMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const activityMenuItems = contextMenu.activityTarget
    ? [
        {
          label: "Iniciar Foco",
          icon: <Play size={15} />,
          onClick: () => {
            if (contextMenu.activityTarget) {
              onStartFocusActivity(contextMenu.activityTarget);
            }
          },
        },
        {
          label: "Adicionar Registro",
          icon: <PlusCircle size={15} />,
          onClick: () => {
            onAddManualRecord({
              activityId: contextMenu.activityTarget?.id,
            });
          },
        },
        {
          label: "Editar Atividade",
          icon: <Pencil size={15} />,
          onClick: () => {
            if (contextMenu.activityTarget) {
              onEditActivity(contextMenu.activityTarget);
            }
          },
        },
        {
          label: "Excluir Atividade",
          icon: <Trash2 size={15} />,
          variant: "destructive" as const,
          onClick: () => {
            if (contextMenu.activityTarget && onRequestDeleteActivity) {
              onRequestDeleteActivity(contextMenu.activityTarget);
            }
          },
        },
      ]
    : [];

  const itemMenuItems = contextMenu.itemTarget
    ? [
        {
          label: "Iniciar Foco com Item",
          icon: <Play size={15} />,
          onClick: () => {
            if (contextMenu.itemTarget) {
              onStartFocusItem(contextMenu.itemTarget);
            }
          },
        },
        {
          label: "Adicionar Registro",
          icon: <PlusCircle size={15} />,
          onClick: () => {
            onAddManualRecord({
              itemId: contextMenu.itemTarget?.inventoryItemId,
            });
          },
        },
        {
          label: "Devolver para Mochila",
          icon: <Undo2 size={15} />,
          variant: "warning" as const,
          onClick: () => {
            if (contextMenu.itemTarget && onRequestReturnToBackpack) {
              onRequestReturnToBackpack(contextMenu.itemTarget);
            }
          },
        },
      ]
    : [];

  const menuItems =
    contextMenu.targetType === "activity" ? activityMenuItems : itemMenuItems;

  return {
    contextMenu,
    openActivityMenu,
    openItemMenu,
    closeMenu,
    menuItems,
  };
}
