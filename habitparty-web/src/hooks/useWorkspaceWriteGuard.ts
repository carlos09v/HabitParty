"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { BoardColumn } from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";

export interface UseWorkspaceWriteGuardOptions {
  workspaces: WorkspaceResponseDTO[];
  activeWorkspaceId?: string | null;
  isPremium: boolean;
  onMoveColumnToWorkspace: (
    column: BoardColumn,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => Promise<boolean>;
  onColumnMoved?: (columnId: string) => void;
}

/**
 * Gerencia o estado de bloqueio somente-leitura para workspaces excedentes (≥ 3º workspace sem VIP),
 * provendo guards de escrita e validação de movimentação de listas entre workspaces.
 */
export function useWorkspaceWriteGuard({
  workspaces,
  activeWorkspaceId,
  isPremium,
  onMoveColumnToWorkspace,
  onColumnMoved,
}: UseWorkspaceWriteGuardOptions) {
  const t = useTranslations("tasks.container");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const activeWorkspaceIndex = useMemo(() => {
    if (!activeWorkspaceId) return 0;
    const idx = workspaces.findIndex((w) => w.id === activeWorkspaceId);
    return idx >= 0 ? idx : 0;
  }, [workspaces, activeWorkspaceId]);

  const isWorkspaceReadOnly = !isPremium && activeWorkspaceIndex >= 2;

  const ensureWriteAccess = useCallback(
    (errorMessage: string): boolean => {
      if (isWorkspaceReadOnly) {
        setIsUpgradeModalOpen(true);
        toast.error(errorMessage);
        return false;
      }
      return true;
    },
    [isWorkspaceReadOnly],
  );

  const handleMoveLockedWorkspace = useCallback(
    (reason: "source" | "target", workspaceName?: string) => {
      setIsUpgradeModalOpen(true);
      toast.error(
        reason === "source"
          ? t("readOnlyMoveSourceToast")
          : t("readOnlyMoveTargetToast", {
              workspace: workspaceName || t("defaultWorkspaceName"),
            }),
      );
    },
    [t],
  );

  const availableTargetWorkspaces = useMemo(
    () =>
      workspaces
        .map((ws, index) => ({
          id: ws.id || "",
          name: ws.name || t("defaultWorkspaceName"),
          isLocked: !isPremium && index >= 2,
        }))
        .filter((ws) => ws.id && ws.id !== activeWorkspaceId),
    [workspaces, activeWorkspaceId, isPremium, t],
  );

  const handleMoveColumnToWorkspaceSafe = useCallback(
    async (
      column: BoardColumn,
      targetWorkspaceId: string,
      targetWorkspaceName: string,
    ) => {
      const targetMeta = availableTargetWorkspaces.find(
        (ws) => ws.id === targetWorkspaceId,
      );
      if (isWorkspaceReadOnly) {
        handleMoveLockedWorkspace("source");
        return false;
      }
      if (targetMeta?.isLocked) {
        handleMoveLockedWorkspace("target", targetMeta.name);
        return false;
      }

      const moved = await onMoveColumnToWorkspace(
        column,
        targetWorkspaceId,
        targetWorkspaceName,
      );
      if (moved) {
        onColumnMoved?.(column.id);
      }
      return moved;
    },
    [
      availableTargetWorkspaces,
      isWorkspaceReadOnly,
      handleMoveLockedWorkspace,
      onMoveColumnToWorkspace,
      onColumnMoved,
    ],
  );

  return {
    isWorkspaceReadOnly,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    ensureWriteAccess,
    availableTargetWorkspaces,
    handleMoveLockedWorkspace,
    handleMoveColumnToWorkspaceSafe,
  };
}
