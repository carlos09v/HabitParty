"use client";

import { useRef } from "react";
import type { components } from "@/api/schema";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type User = components["schemas"]["UserResponseDTO"];

interface StoreInitializerProps {
  compactMode: boolean;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  user?: User | null;
}

export function StoreInitializer({
  compactMode,
  workspaces = [],
  activeWorkspaceId = null,
  user = null,
}: StoreInitializerProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useUIStore.setState({ compactMode });
    if (user) {
      useUserStore.setState({
        user,
        is_Premium: user.isPremium ?? false,
      });
    }
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
