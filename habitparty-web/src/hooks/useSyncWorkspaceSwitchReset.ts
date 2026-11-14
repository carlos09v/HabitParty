"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store/progressStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

/**
 * Sincroniza o fim da transição visual de troca de workspace assim que o servidor
 * confirma a renderização do workspace solicitado.
 */
export function useSyncWorkspaceSwitchReset(
  renderedWorkspaceId?: string | null,
): boolean {
  const isSwitchingWorkspace = useWorkspaceStore((s) => s.isSwitchingWorkspace);
  const storeActiveWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  useEffect(() => {
    if (
      isSwitchingWorkspace &&
      (!storeActiveWorkspaceId ||
        renderedWorkspaceId === storeActiveWorkspaceId)
    ) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: false });
      useProgressStore.getState().done("workspace-switch");
    }
  }, [renderedWorkspaceId, storeActiveWorkspaceId, isSwitchingWorkspace]);

  return isSwitchingWorkspace;
}
