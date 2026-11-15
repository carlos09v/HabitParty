"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { components } from "@/api/schema";
import { AVATAR_FRAMES, type AvatarFrameId } from "@/constants/avatarFrames";
import { resolveThemeSessionState } from "@/constants/themes";
import { useAvatarFrameStore } from "@/store/avatarFrameStore";
import {
  applyThemeToDocument,
  getThemePreferenceCookies,
  setClientCookie,
  useUIStore,
} from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DateFormat,
  ExperienceMode,
  ThemeMode,
  TimeFormat,
} from "@/types/ui";
import type { UserResponseDTO } from "@/types/user";
import {
  getDateKeyInTimeZone,
  getTodayDateString,
  parseServerDate,
  setClientTimeZoneCookie,
} from "@/utils/date";
import { getLevelProgress } from "@/utils/levels";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type User = UserResponseDTO;

interface StoreInitializerProps {
  theme?: ThemeMode | null;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  experienceMode?: ExperienceMode;
  workspaces?: Workspace[];
  activeWorkspaceId?: string | null;
  user?: User | null;
  lastTaskCompletionAt?: string | null;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  theme = null,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "24h",
  experienceMode = "PRODUCTIVITY",
  workspaces = [],
  activeWorkspaceId = null,
  user = null,
  lastTaskCompletionAt = null,
}: StoreInitializerProps) {
  const initializedUI = useRef(false);
  const initializedWorkspaces = useRef(false);

  const resolvedExperienceMode: ExperienceMode =
    user?.experienceMode === "PRODUCTIVITY" ||
    user?.experienceMode === "GAMIFIED"
      ? user.experienceMode
      : experienceMode;

  useIsomorphicLayoutEffect(() => {
    const currentState = useWorkspaceStore.getState();
    if (workspaces.length > 0) {
      const resolvedActiveId = initializedWorkspaces.current
        ? activeWorkspaceId ||
          currentState.activeWorkspaceId ||
          workspaces[0]?.id ||
          null
        : activeWorkspaceId || workspaces[0]?.id || null;
      useWorkspaceStore.setState({
        workspaces,
        activeWorkspaceId: resolvedActiveId,
      });
      initializedWorkspaces.current = true;
    } else if (
      initializedWorkspaces.current ||
      currentState.workspaces.length > 0
    ) {
      useWorkspaceStore.setState({
        workspaces: [],
        activeWorkspaceId: null,
      });
    }
  }, [workspaces, activeWorkspaceId]);

  useIsomorphicLayoutEffect(() => {
    const {
      theme: clientCookieTheme,
      lastDarkTheme: cookieLastDark,
      lastLightTheme: cookieLastLight,
    } = getThemePreferenceCookies();
    const effectiveCookieTheme = clientCookieTheme ?? theme ?? null;

    if (!user) {
      if (!initializedUI.current) {
        const initialSession = resolveThemeSessionState({
          cookieTheme: effectiveCookieTheme,
          cookieLastDark,
          cookieLastLight,
          userTheme: null,
          isPremium: false,
        });
        applyThemeToDocument(initialSession.theme, {
          persistCookie: false,
          updateLastPolarityCookie: false,
          allowCustomThemes: true,
        });
        useUIStore.setState({
          hydrated: true,
          allowCustomThemes: true,
          theme: initialSession.theme,
          lastDarkTheme: initialSession.lastDarkTheme,
          lastLightTheme: initialSession.lastLightTheme,
          dateFormat,
          timeFormat,
          experienceMode: resolvedExperienceMode,
        });
        initializedUI.current = true;
      }
      return;
    }

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
      currentStoreUser?.theme !== user.theme ||
      currentStoreUser?.emailVerified !== user.emailVerified ||
      currentStoreUser?.experienceMode !== user.experienceMode ||
      currentStoreUser?.isPremium !== user.isPremium ||
      currentStoreUser?.totalXp !== user.totalXp ||
      currentStoreUser?.currentCoins !== user.currentCoins ||
      currentStoreUser?.currentStreak !== user.currentStreak ||
      currentStoreUser?.achievementPoints !== user.achievementPoints ||
      currentStoreUser?.timezone !== user.timezone ||
      currentStoreUser?.timezoneUpdatedAt !== user.timezoneUpdatedAt;

    const isPremium = Boolean(user.isPremium);
    const {
      theme: allowedTheme,
      lastDarkTheme: allowedLastDark,
      lastLightTheme: allowedLastLight,
    } = resolveThemeSessionState({
      cookieTheme: effectiveCookieTheme,
      cookieLastDark,
      cookieLastLight,
      userTheme: user.theme,
      isPremium,
    });

    if (!clientCookieTheme || clientCookieTheme !== allowedTheme) {
      applyThemeToDocument(allowedTheme, {
        persistCookie: true,
        updateLastPolarityCookie: true,
        allowCustomThemes: true,
      });
    } else {
      applyThemeToDocument(allowedTheme, {
        persistCookie: false,
        updateLastPolarityCookie: false,
        allowCustomThemes: true,
      });
    }

    if (cookieLastDark !== allowedLastDark) {
      setClientCookie("lastDarkTheme", allowedLastDark);
    }
    if (cookieLastLight !== allowedLastLight) {
      setClientCookie("lastLightTheme", allowedLastLight);
    }

    const currentUiState = useUIStore.getState();
    if (!initializedUI.current) {
      useUIStore.setState({
        hydrated: true,
        allowCustomThemes: true,
        theme: allowedTheme,
        lastDarkTheme: allowedLastDark,
        lastLightTheme: allowedLastLight,
        dateFormat,
        timeFormat,
        experienceMode: resolvedExperienceMode,
      });
      initializedUI.current = true;
    } else if (
      currentUiState.theme !== allowedTheme ||
      currentUiState.lastDarkTheme !== allowedLastDark ||
      currentUiState.lastLightTheme !== allowedLastLight ||
      !currentUiState.allowCustomThemes ||
      !currentUiState.hydrated
    ) {
      currentUiState.hydrateThemeState(
        allowedTheme,
        allowedLastDark,
        allowedLastLight,
        true,
      );
    }

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
        is_Premium: isPremium,
        ...(shouldSyncSecuredDate
          ? { lastStreakSecuredDate: nextSecuredDate }
          : {}),
      });
    } else if (shouldSyncSecuredDate) {
      useUserStore.setState({ lastStreakSecuredDate: nextSecuredDate });
    }
  }, [
    theme,
    dateFormat,
    timeFormat,
    resolvedExperienceMode,
    user,
    lastTaskCompletionAt,
  ]);

  return null;
}
