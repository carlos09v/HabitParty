"use client";

import { useRef } from "react";
import type { components } from "@/api/schema";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];

interface StoreInitializerProps {
  compactMode: boolean;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
}

export function StoreInitializer({
  compactMode,
  workspaces = [],
  activeWorkspaceId = null,
}: StoreInitializerProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useUIStore.setState({ compactMode });
    if (workspaces.length > 0) {
      useWorkspaceStore.setState({
        workspaces,
        activeWorkspaceId: activeWorkspaceId || workspaces[0]?.id || null,
      });
    }
    initialized.current = true;
  }
  return null;
}
