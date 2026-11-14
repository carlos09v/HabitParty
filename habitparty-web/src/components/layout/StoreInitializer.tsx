"use client";

import { useEffect, useRef } from "react";
import type { components } from "@/api/schema";
import { AVATAR_FRAMES, type AvatarFrameId } from "@/constants/avatarFrames";
import { useAvatarFrameStore } from "@/store/avatarFrameStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
  TimeFormat,
} from "@/types/ui";
import {
  getDateKeyInTimeZone,
  getTodayDateString,
  parseServerDate,
  setClientTimeZoneCookie,
} from "@/utils/date";
import { getLevelProgress } from "@/utils/levels";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type User = components["schemas"]["UserResponseDTO"];

interface StoreInitializerProps {
  theme?: ThemeMode;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  experienceMode?: ExperienceMode;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  user?: User | null;
  lastTaskCompletionAt?: string | null;
}

function resolveSecuredStreakDateToday(
  lastTaskCompletionAt?: string | null,
  timeZone?: string | null,
): string | null {
  if (!lastTaskCompletionAt) return null;
  const parsed = parseServerDate(lastTaskCompletionAt);
  if (!parsed) return null;
  const todayStr = getTodayDateString(new Date(), timeZone);
  return getDateKeyInTimeZone(parsed, timeZone) === todayStr ? todayStr : null;
}

function buildHydratedStoreUser(user: User): User {
  const progress = getLevelProgress(user.totalXp ?? 0);
  return {
    ...user,
    currentLevelTitle: user.currentLevelTitle || progress.currentLevel.title,
    nextLevelTitle: user.nextLevelTitle || progress.nextLevel.title,
    xpToNextLevel:
      user.xpToNextLevel !== undefined
        ? user.xpToNextLevel
        : progress.remainingXp,
  };
}

function resolveValidAvatarFrame(frame?: string | null): AvatarFrameId {
  if (frame && AVATAR_FRAMES.some((f) => f.id === frame)) {
    return frame as AvatarFrameId;
  }
  return "cosmic_gold";
}

export function StoreInitializer({
  theme = "dark",
  dateFormat = "DD/MM/YYYY",
  timeFormat = "24h",
  experienceMode = "PRODUCTIVITY",
  workspaces = [],
  activeWorkspaceId = null,
  user = null,
  lastTaskCompletionAt = null,
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
      theme,
      dateFormat,
      timeFormat,
      experienceMode: resolvedExperienceMode,
    });
    if (workspaces.length > 0) {
      useWorkspaceStore.setState({
        workspaces,
        activeWorkspaceId: activeWorkspaceId || workspaces[0]?.id || null,
      });
    }
    if (user) {
      useAvatarFrameStore.setState({
        frameId: resolveValidAvatarFrame(user.avatarFrame),
      });
      const securedToday =
        typeof window !== "undefined"
          ? resolveSecuredStreakDateToday(lastTaskCompletionAt, user.timezone)
          : null;
      useUserStore.setState({
        user: buildHydratedStoreUser(user),
        is_Premium: user.isPremium ?? false,
        ...(securedToday ? { lastStreakSecuredDate: securedToday } : {}),
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

    setClientTimeZoneCookie(user.timezone);

    const currentState = useUserStore.getState();
    const currentStoreUser = currentState.user;
    const isDifferentUser = currentStoreUser?.id !== user.id;
    const securedToday = resolveSecuredStreakDateToday(
      lastTaskCompletionAt,
      user.timezone,
    );

    const shouldSyncUser =
      isDifferentUser ||
      currentStoreUser?.avatarFrame !== user.avatarFrame ||
      currentStoreUser?.emailVerified !== user.emailVerified ||
      currentStoreUser?.experienceMode !== user.experienceMode ||
      currentStoreUser?.isPremium !== user.isPremium ||
      currentStoreUser?.totalXp !== user.totalXp ||
      currentStoreUser?.currentCoins !== user.currentCoins ||
      currentStoreUser?.currentStreak !== user.currentStreak ||
      currentStoreUser?.achievementPoints !== user.achievementPoints ||
      currentStoreUser?.timezone !== user.timezone ||
      currentStoreUser?.timezoneUpdatedAt !== user.timezoneUpdatedAt;

    const nextSecuredDate =
      securedToday !== null
        ? securedToday
        : isDifferentUser || (user.currentStreak ?? 0) === 0
          ? null
          : currentState.lastStreakSecuredDate;
    const shouldSyncSecuredDate =
      nextSecuredDate !== currentState.lastStreakSecuredDate;

    if (shouldSyncUser) {
      useAvatarFrameStore.setState({
        frameId: resolveValidAvatarFrame(user.avatarFrame),
      });
      if (
        user.experienceMode === "GAMIFIED" ||
        user.experienceMode === "PRODUCTIVITY"
      ) {
        useUIStore.setState({ experienceMode: user.experienceMode });
      }
      useUserStore.setState({
        user: buildHydratedStoreUser(user),
        is_Premium: user.isPremium ?? false,
        ...(shouldSyncSecuredDate
          ? { lastStreakSecuredDate: nextSecuredDate }
          : {}),
      });
    } else if (shouldSyncSecuredDate) {
      useUserStore.setState({ lastStreakSecuredDate: nextSecuredDate });
    }
  }, [user, lastTaskCompletionAt]);

  return null;
}
