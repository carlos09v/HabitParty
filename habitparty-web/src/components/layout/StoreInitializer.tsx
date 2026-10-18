"use client";

import { useRef } from "react";
import type { components } from "@/api/schema";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { ThemeMode } from "@/types/ui";
import { getLevelProgress } from "@/utils/levels";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type User = components["schemas"]["UserResponseDTO"];

interface StoreInitializerProps {
  compactMode: boolean;
  theme?: ThemeMode;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  user?: User | null;
}

export function StoreInitializer({
  compactMode,
  theme = "dark",
  workspaces = [],
  activeWorkspaceId = null,
  user = null,
}: StoreInitializerProps) {
  const initialized = useRef(false);
  if (!initialized.current) {
    useUIStore.setState({ compactMode, theme });

    if (user) {
      const progress = getLevelProgress(user.totalXp ?? 0);
      useUserStore.setState({
        user: {
          ...user,
          currentLevelTitle:
            user.currentLevelTitle || progress.currentLevel.title,
          nextLevelTitle: user.nextLevelTitle || progress.nextLevel.title,
          xpToNextLevel:
            user.xpToNextLevel !== undefined
              ? user.xpToNextLevel
              : progress.remainingXp,
        },
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
