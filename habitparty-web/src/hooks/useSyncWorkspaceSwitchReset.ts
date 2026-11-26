"use client";

import { useEffect, useRef } from "react";
import { useProgressStore } from "@/store/progressStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

/**
 * Sincroniza o fim da transição visual de troca de workspace assim que o servidor
 * confirma a renderização do workspace solicitado (ou aplica fallback válido).
 */
export function useSyncWorkspaceSwitchReset(
  renderedWorkspaceId?: string | null,
): boolean {
  const isSwitchingWorkspace = useWorkspaceStore((s) => s.isSwitchingWorkspace);
  const storeActiveWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const renderedAtSwitchStartRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isSwitchingWorkspace) {
      renderedAtSwitchStartRef.current = renderedWorkspaceId;
      return;
    }

    const storeWorkspaceExists = Boolean(
      storeActiveWorkspaceId &&
        (workspaces.length === 0 ||
          workspaces.some((w) => w.id === storeActiveWorkspaceId)),
    );
    const serverRenderedFallback =
      Boolean(renderedWorkspaceId) &&
      renderedAtSwitchStartRef.current !== undefined &&
      renderedWorkspaceId !== renderedAtSwitchStartRef.current;

    if (
      !storeActiveWorkspaceId ||
      renderedWorkspaceId === storeActiveWorkspaceId ||
      !storeWorkspaceExists ||
      serverRenderedFallback
    ) {
      const shouldAlignActiveId =
        Boolean(renderedWorkspaceId) &&
        renderedWorkspaceId !== storeActiveWorkspaceId &&
        (!storeWorkspaceExists || serverRenderedFallback);

      useWorkspaceStore.setState({
        isSwitchingWorkspace: false,
        ...(shouldAlignActiveId
          ? { activeWorkspaceId: renderedWorkspaceId ?? null }
          : {}),
      });
      useProgressStore.getState().done("workspace-switch");
    }
  }, [
    renderedWorkspaceId,
    storeActiveWorkspaceId,
    workspaces,
    isSwitchingWorkspace,
  ]);

  return isSwitchingWorkspace;
}
