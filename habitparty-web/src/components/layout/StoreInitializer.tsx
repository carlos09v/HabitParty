"use client";

import { useEffect, useRef } from "react";
import type { components } from "@/api/schema";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { ExperienceMode, ThemeMode } from "@/types/ui";
import { getLevelProgress } from "@/utils/levels";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type User = components["schemas"]["UserResponseDTO"];

interface StoreInitializerProps {
  compactMode: boolean;
  theme?: ThemeMode;
  experienceMode?: ExperienceMode;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  user?: User | null;
}

export function StoreInitializer({
  compactMode,
  theme = "dark",
  experienceMode = "PRODUCTIVITY",
  workspaces = [],
  activeWorkspaceId = null,
  user = null,
}: StoreInitializerProps) {
  const initialized = useRef(false);

  const resolvedExperienceMode: ExperienceMode =
    user?.experienceMode === "PRODUCTIVITY" ||
    user?.experienceMode === "GAMIFIED"
      ? user.experienceMode
      : experienceMode;

  if (!initialized.current) {
    useUIStore.setState({
      hydrated: true,
      compactMode,
      theme,
      experienceMode: resolvedExperienceMode,
    });
    if (workspaces.length > 0) {
      useWorkspaceStore.setState({
        workspaces,
        activeWorkspaceId: activeWorkspaceId || workspaces[0]?.id || null,
      });
    }
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
    initialized.current = true;
  }

  useEffect(() => {
    if (workspaces.length > 0) {
      const currentState = useWorkspaceStore.getState();
      const resolvedActiveId =
        activeWorkspaceId ||
        currentState.activeWorkspaceId ||
        workspaces[0]?.id ||
        null;
      useWorkspaceStore.setState({
        workspaces,
        activeWorkspaceId: resolvedActiveId,
      });
    }
  }, [workspaces, activeWorkspaceId]);

  useEffect(() => {
    if (!user) return;

    const currentStoreUser = useUserStore.getState().user;
    const shouldSyncUser =
      currentStoreUser?.id !== user.id ||
      currentStoreUser?.emailVerified !== user.emailVerified ||
      currentStoreUser?.experienceMode !== user.experienceMode ||
      currentStoreUser?.isPremium !== user.isPremium ||
      currentStoreUser?.totalXp !== user.totalXp;

    if (shouldSyncUser) {
      const progress = getLevelProgress(user.totalXp ?? 0);
      if (
        user.experienceMode === "GAMIFIED" ||
        user.experienceMode === "PRODUCTIVITY"
      ) {
        useUIStore.setState({ experienceMode: user.experienceMode });
      }
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
  }, [user]);

  return null;
}
