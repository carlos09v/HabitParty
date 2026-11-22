"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { components } from "@/api/schema";
import { AVATAR_FRAMES, type AvatarFrameId } from "@/constants/avatarFrames";
import { FOCUS_REWARD_RULES } from "@/constants/focus";
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
  todayFocusMinutes?: number;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function hasTaskCompletionToday(
  lastTaskCompletionAt?: string | null,
  timeZone?: string | null,
): { todayStr: string; completed: boolean } {
  const todayStr = getTodayDateString(new Date(), timeZone);
  if (!lastTaskCompletionAt) return { todayStr, completed: false };
  const parsed = parseServerDate(lastTaskCompletionAt);
  if (!parsed) return { todayStr, completed: false };
  return {
    todayStr,
    completed: getDateKeyInTimeZone(parsed, timeZone) === todayStr,
  };
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

function resolveValidAvatarFrame(
  frame?: string | null,
  isPremium?: boolean,
): AvatarFrameId {
  if (frame && AVATAR_FRAMES.some((f) => f.id === frame)) {
    return frame as AvatarFrameId;
  }
  return isPremium ? "cosmic_gold" : "none";
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
  todayFocusMinutes = 0,
}: StoreInitializerProps) {
  const initializedUI = useRef(false);
  const initializedWorkspaces = useRef(false);
  const prevServerFocusMinutesRef = useRef<number | null>(null);

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
    const { todayStr, completed: taskCompletedToday } = hasTaskCompletionToday(
      lastTaskCompletionAt,
      user.timezone,
    );
    const normalizedFocusMinutes = Math.max(0, Math.round(todayFocusMinutes));
    const hasServerFocusUpdate =
      prevServerFocusMinutesRef.current === null ||
      prevServerFocusMinutesRef.current !== normalizedFocusMinutes;
    prevServerFocusMinutesRef.current = normalizedFocusMinutes;

    const mergedFocusMinutes =
      isDifferentUser ||
      currentState.todayMetricsDate !== todayStr ||
      hasServerFocusUpdate
        ? normalizedFocusMinutes
        : Math.max(currentState.todayFocusMinutes, normalizedFocusMinutes);
    const mergedTaskCompleted =
      !isDifferentUser && currentState.todayMetricsDate === todayStr
        ? currentState.todayTaskCompleted || taskCompletedToday
        : taskCompletedToday;
    const isEffectiveStreakSecuredToday =
      mergedTaskCompleted ||
      mergedFocusMinutes >= FOCUS_REWARD_RULES.MIN_DAILY_STREAK_FOCUS_MINUTES;
    const nextSecuredDate = isEffectiveStreakSecuredToday
      ? todayStr
      : isDifferentUser ||
          (user.currentStreak ?? 0) === 0 ||
          currentState.lastStreakSecuredDate === todayStr
        ? null
        : currentState.lastStreakSecuredDate;

    const shouldSyncUser =
      isDifferentUser ||
      currentStoreUser?.profilePhotoUrl !== user.profilePhotoUrl ||
      currentStoreUser?.fullName !== user.fullName ||
      currentStoreUser?.bio !== user.bio ||
      currentStoreUser?.birthDate !== user.birthDate ||
      currentStoreUser?.gender !== user.gender ||
      currentStoreUser?.avatarFrame !== user.avatarFrame ||
      currentStoreUser?.equippedTitle !== user.equippedTitle ||
      currentStoreUser?.avatarPreset !== user.avatarPreset ||
      currentStoreUser?.theme !== user.theme ||
      currentStoreUser?.emailVerified !== user.emailVerified ||
      currentStoreUser?.experienceMode !== user.experienceMode ||
      currentStoreUser?.isPremium !== user.isPremium ||
      currentStoreUser?.isFounder !== user.isFounder ||
      currentStoreUser?.subscriptionStatus !== user.subscriptionStatus ||
      currentStoreUser?.subscriptionEndsAt !== user.subscriptionEndsAt ||
      currentStoreUser?.hasActiveRecurringSubscription !==
        user.hasActiveRecurringSubscription ||
      currentStoreUser?.cancelAtPeriodEnd !== user.cancelAtPeriodEnd ||
      currentStoreUser?.totalXp !== user.totalXp ||
      currentStoreUser?.currentCoins !== user.currentCoins ||
      currentStoreUser?.currentStreak !== user.currentStreak ||
      currentStoreUser?.highestStreak !== user.highestStreak ||
      currentStoreUser?.achievementPoints !== user.achievementPoints ||
      currentStoreUser?.timezone !== user.timezone ||
      currentStoreUser?.timezoneUpdatedAt !== user.timezoneUpdatedAt ||
      currentStoreUser?.usageMode !== user.usageMode ||
      currentStoreUser?.mainObstacle !== user.mainObstacle ||
      currentStoreUser?.dailyFocusGoalMinutes !== user.dailyFocusGoalMinutes ||
      currentStoreUser?.peakPeriod !== user.peakPeriod ||
      currentStoreUser?.disciplineStyle !== user.disciplineStyle ||
      JSON.stringify(currentStoreUser?.primaryGoals ?? null) !==
        JSON.stringify(user.primaryGoals ?? null);

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
    } else if (
      document.documentElement.getAttribute("data-theme") !== allowedTheme
    ) {
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

    const shouldSyncMetrics =
      currentState.todayMetricsDate !== todayStr ||
      currentState.todayTaskCompleted !== mergedTaskCompleted ||
      currentState.todayFocusMinutes !== mergedFocusMinutes ||
      nextSecuredDate !== currentState.lastStreakSecuredDate;

    if (shouldSyncUser) {
      useAvatarFrameStore.setState({
        frameId: resolveValidAvatarFrame(user.avatarFrame, isPremium),
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
        ...(shouldSyncMetrics
          ? {
              todayMetricsDate: todayStr,
              todayTaskCompleted: mergedTaskCompleted,
              todayFocusMinutes: mergedFocusMinutes,
              lastStreakSecuredDate: nextSecuredDate,
            }
          : {}),
      });
    } else if (shouldSyncMetrics) {
      useUserStore.setState({
        todayMetricsDate: todayStr,
        todayTaskCompleted: mergedTaskCompleted,
        todayFocusMinutes: mergedFocusMinutes,
        lastStreakSecuredDate: nextSecuredDate,
      });
    }
  }, [
    theme,
    dateFormat,
    timeFormat,
    resolvedExperienceMode,
    user,
    lastTaskCompletionAt,
    todayFocusMinutes,
  ]);

  return null;
}
