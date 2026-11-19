"use server";

import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { REMINDER_OFFSET_DAYS } from "@/constants/task";
import { DEFAULT_LOCALE, isValidLocale, toIntlLocale } from "@/i18n/config";
import { getDashboardTransactions } from "@/services/dashboardService";
import { getRawInventoryItems } from "@/services/inventoryService";
import { getSocialNotifications } from "@/services/socialService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import {
  getWorkspaces,
  resolveActiveWorkspace,
} from "@/services/workspaceService";
import {
  isTaskScheduledForDate,
  TASK_COMPLETION_TRANSACTION_TYPES,
} from "@/utils/dashboardMetrics";
import {
  getDateKeyInTimeZone,
  getTodayDateString,
  isValidIanaTimeZone,
  parseIsoDateUtcMs,
  parseServerDate,
} from "@/utils/date";
import { localizeLevelTitle } from "@/utils/levels";
import { resolveAchievementCopy } from "@/utils/showcaseUtils";

const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeTimeFormatter(localeTag: string): Intl.RelativeTimeFormat {
  let formatter = rtfCache.get(localeTag);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(localeTag, {
      numeric: "auto",
      style: "short",
    });
    rtfCache.set(localeTag, formatter);
  }
  return formatter;
}

function formatRelativeSocialTimestamp(
  createdAt: string | undefined,
  locale: string,
  fallback: string,
): string {
  const parsed = parseServerDate(createdAt);
  if (!parsed) return fallback;

  const diffSeconds = Math.round((parsed.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = getRelativeTimeFormatter(toIntlLocale(locale));

  if (absSeconds < 60) {
    return rtf.format(0, "second");
  }
  if (absSeconds < 3600) {
    return rtf.format(Math.round(diffSeconds / 60), "minute");
  }
  if (absSeconds < 86400) {
    return rtf.format(Math.round(diffSeconds / 3600), "hour");
  }
  if (absSeconds < 2592000) {
    return rtf.format(Math.round(diffSeconds / 86400), "day");
  }
  return rtf.format(Math.round(diffSeconds / 2592000), "month");
}

function isTimestampOnLocalDate(
  rawIso: string | undefined,
  targetDateStr: string,
  timeZone?: string,
  timezoneOffsetMinutes?: number,
): boolean {
  if (!rawIso) return false;
  const parsed = parseServerDate(rawIso);
  if (parsed && timeZone) {
    return getDateKeyInTimeZone(parsed, timeZone) === targetDateStr;
  }
  if (
    parsed &&
    typeof timezoneOffsetMinutes === "number" &&
    Number.isFinite(timezoneOffsetMinutes)
  ) {
    const shifted = new Date(parsed.getTime() - timezoneOffsetMinutes * 60_000);
    return shifted.toISOString().slice(0, 10) === targetDateStr;
  }
  return rawIso.split("T")[0] === targetDateStr;
}

export interface SidebarNotification {
  id: string;
  type:
    | "overdue"
    | "today"
    | "streak"
    | "focus_item"
    | "reminder"
    | "social_request"
    | "social_accepted"
    | "social_milestone";
  title: string;
  description: string;
  timestamp: string;
  severity: "danger" | "warning" | "info" | "gold";
  href: string;
  socialNotificationId?: string;
  persistedSeen?: boolean;
}

export interface SidebarNotificationsResponse {
  notifications: SidebarNotification[];
  unreadCount: number;
}

/**
 * Coleta e agrega os alertas mais relevantes da rotina do usuário:
 * - Tarefas atrasadas
 * - Metas e afazeres programados para hoje
 * - Lembretes programados dentro da janela de antecedência
 * - Alerta de manutenção de streak/ofensiva
 * - Itens da mochila ativos na área de foco
 */
export async function getSidebarNotificationsAction(
  clientDateStr?: string,
  _clientDayIndex?: number,
  clientTimezoneOffsetMinutes?: number,
): Promise<SidebarNotificationsResponse> {
  try {
    const [cookieStore, t, tCatalog, rawLocale] = await Promise.all([
      cookies(),
      getTranslations("notifications"),
      getTranslations("showcase.catalog"),
      getLocale(),
    ]);
    const locale = isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
    const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

    const [
      workspaces,
      user,
      inventoryItems,
      transactions,
      speculativeBoard,
      socialFeed,
    ] = await Promise.all([
      getWorkspaces(),
      getCurrentUser(),
      getRawInventoryItems(),
      getDashboardTransactions(),
      cookieWorkspaceId
        ? fetchWorkspaceBoardColumns(cookieWorkspaceId)
        : Promise.resolve(null),
      getSocialNotifications(15),
    ]);

    const { activeWorkspaceId } = resolveActiveWorkspace(
      workspaces,
      cookieWorkspaceId,
    );

    const boardData =
      activeWorkspaceId && activeWorkspaceId === cookieWorkspaceId
        ? speculativeBoard
        : activeWorkspaceId
          ? await fetchWorkspaceBoardColumns(activeWorkspaceId)
          : null;

    const notifications: SidebarNotification[] = [];
    const now = new Date();
    const effectiveTimeZone = isValidIanaTimeZone(user?.timezone)
      ? user.timezone.trim()
      : undefined;
    const todayStr =
      clientDateStr || getTodayDateString(now, effectiveTimeZone);

    const todayUtcMs = parseIsoDateUtcMs(todayStr);
    let overdueCount = 0;
    let todayTasksCount = 0;
    let hasTaskCompletedToday = false;
    const activeReminderNames: string[] = [];
    const seenTaskIds = new Set<string>();

    for (const col of boardData?.columns || []) {
      for (const task of col.tasks) {
        if (task.id) {
          if (seenTaskIds.has(task.id)) continue;
          seenTaskIds.add(task.id);
        }

        if (
          isTimestampOnLocalDate(
            task.lastCompletedAt,
            todayStr,
            effectiveTimeZone,
            clientTimezoneOffsetMinutes,
          )
        ) {
          hasTaskCompletedToday = true;
        }

        if (task.completed) continue;

        if (task.type === "habit") {
          todayTasksCount++;
          continue;
        }

        if (task.type === "daily") {
          if (isTaskScheduledForDate(task, todayStr)) {
            todayTasksCount++;
          }
          continue;
        }

        if (task.dueDate) {
          const datePart = task.dueDate.split("T")[0];
          if (datePart < todayStr) {
            overdueCount++;
          } else if (datePart === todayStr) {
            todayTasksCount++;
          }

          if (
            todayUtcMs !== null &&
            task.reminderType &&
            task.reminderType !== "NONE"
          ) {
            const dueUtcMs = parseIsoDateUtcMs(task.dueDate);
            if (dueUtcMs !== null) {
              const diffDays = Math.round((dueUtcMs - todayUtcMs) / 86_400_000);
              const windowDays = REMINDER_OFFSET_DAYS[task.reminderType] ?? 1;
              if (diffDays >= 0 && diffDays <= windowDays && task.title) {
                activeReminderNames.push(task.title);
              }
            }
          }
        }
      }
    }

    const hasTransactionToday = transactions.some((tx) =>
      Boolean(
        tx.transactionType &&
          TASK_COMPLETION_TRANSACTION_TYPES.has(tx.transactionType) &&
          isTimestampOnLocalDate(
            tx.createdAt,
            todayStr,
            effectiveTimeZone,
            clientTimezoneOffsetMinutes,
          ),
      ),
    );
    const hasSecuredStreakToday = hasTaskCompletedToday || hasTransactionToday;

    // 1. Alertas de Tarefas Atrasadas
    if (overdueCount > 0) {
      notifications.push({
        id: "alert-overdue",
        type: "overdue",
        title: t("overdueTitle", { count: overdueCount }),
        description: t("overdueDesc"),
        timestamp: t("overdueTimestamp"),
        severity: "danger",
        href: "/dashboard?filter=overdue",
      });
    }

    // 1.5. Alertas de Lembretes Programados (To-dos dentro da janela do lembrete)
    if (activeReminderNames.length > 0) {
      notifications.push({
        id: "alert-reminders",
        type: "reminder",
        title:
          activeReminderNames.length === 1
            ? t("reminderSingleTitle", { name: activeReminderNames[0] })
            : t("reminderMultipleTitle", { count: activeReminderNames.length }),
        description: t("reminderDesc"),
        timestamp: t("reminderTimestamp"),
        severity: "warning",
        href: "/tasks",
      });
    }

    // 2. Tarefas e Rotinas de Hoje
    if (todayTasksCount > 0) {
      notifications.push({
        id: "alert-today",
        type: "today",
        title: t("todayTitle", { count: todayTasksCount }),
        description: t("todayDesc"),
        timestamp: t("todayTimestamp"),
        severity: "info",
        href: "/dashboard?filter=today",
      });
    }

    // 3. Ofensiva / Streak em risco (suprimida se o usuário já concluiu algo hoje)
    const streak = user?.currentStreak ?? 0;
    if (streak > 0 && !hasSecuredStreakToday) {
      notifications.push({
        id: "alert-streak",
        type: "streak",
        title: t("streakTitle", { count: streak }),
        description: t("streakDesc"),
        timestamp: t("streakTimestamp"),
        severity: "warning",
        href: "/dashboard?filter=today",
      });
    }

    // 4. Cupons ativos em foco na mochila
    const inFocusItems = inventoryItems.filter(
      (item) => item.status === "IN_FOCUS",
    );
    if (inFocusItems.length > 0) {
      const firstItem = inFocusItems[0];
      notifications.push({
        id: `alert-focus-item-${firstItem.inventoryItemId}`,
        type: "focus_item",
        title: t("focusItemTitle", {
          name: firstItem.rewardName || t("focusItemDefaultName"),
        }),
        description: t("focusItemDesc"),
        timestamp: t("focusItemTimestamp"),
        severity: "gold",
        href: "/focus",
      });
    }

    const isGamified = user?.experienceMode === "GAMIFIED";

    // 5. Notificações Sociais não lidas (pedidos, aceites, marcos de amigos)
    for (const item of socialFeed.notifications) {
      if (item.seen) continue;
      let parsedPayload: Record<string, string> = {};
      if (item.payload) {
        try {
          parsedPayload = JSON.parse(item.payload) as Record<string, string>;
        } catch {
          parsedPayload = {};
        }
      }
      const actorLabel =
        item.actorFullName ||
        (item.actorUsername ? `@${item.actorUsername}` : null) ||
        parsedPayload.actorUsername ||
        t("socialDefaultActor");
      const actorHandle = item.actorUsername || parsedPayload.actorUsername;
      const profileHref = actorHandle
        ? `/profile/${encodeURIComponent(actorHandle)}`
        : "/profile?tab=friends";
      const relativeTimestamp = formatRelativeSocialTimestamp(
        item.createdAt,
        locale,
        t("socialTimestamp"),
      );

      if (item.type === "FRIEND_REQUEST_RECEIVED") {
        notifications.push({
          id: `social-${item.id}`,
          type: "social_request",
          title: t("socialRequestTitle", { name: actorLabel }),
          description: t("socialRequestDesc"),
          timestamp: relativeTimestamp,
          severity: "gold",
          href: "/profile?tab=friends",
          socialNotificationId: item.id,
          persistedSeen: item.seen,
        });
      } else if (item.type === "FRIEND_REQUEST_ACCEPTED") {
        notifications.push({
          id: `social-${item.id}`,
          type: "social_accepted",
          title: t("socialAcceptedTitle", { name: actorLabel }),
          description: t("socialAcceptedDesc"),
          timestamp: relativeTimestamp,
          severity: "info",
          href: profileHref,
          socialNotificationId: item.id,
          persistedSeen: item.seen,
        });
      } else if (item.type === "FRIEND_MILESTONE_ACHIEVEMENT") {
        const fallbackTitle =
          parsedPayload.achievementTitle || t("socialDefaultAchievement");
        const localizedAchievement = parsedPayload.achievementCode
          ? resolveAchievementCopy(
              {
                code: parsedPayload.achievementCode,
                title: fallbackTitle,
                description: "",
              },
              isGamified,
              tCatalog,
            ).title
          : fallbackTitle;

        notifications.push({
          id: `social-${item.id}`,
          type: "social_milestone",
          title: t("socialAchievementTitle", {
            name: actorLabel,
            achievement: localizedAchievement,
          }),
          description: t("socialAchievementDesc"),
          timestamp: relativeTimestamp,
          severity: "gold",
          href: profileHref,
          socialNotificationId: item.id,
          persistedSeen: item.seen,
        });
      } else if (item.type === "FRIEND_MILESTONE_LEVEL") {
        const levelKey =
          parsedPayload.levelName || parsedPayload.levelTitle || "";
        const localizedLevel = localizeLevelTitle(levelKey, locale, isGamified);

        notifications.push({
          id: `social-${item.id}`,
          type: "social_milestone",
          title: t("socialLevelTitle", {
            name: actorLabel,
            level: localizedLevel,
          }),
          description: t("socialLevelDesc"),
          timestamp: relativeTimestamp,
          severity: "gold",
          href: profileHref,
          socialNotificationId: item.id,
          persistedSeen: item.seen,
        });
      }
    }

    const unreadCount = notifications.filter((n) => !n.persistedSeen).length;

    return {
      notifications,
      unreadCount,
    };
  } catch (err) {
    console.error("[getSidebarNotificationsAction]", err);
    return { notifications: [], unreadCount: 0 };
  }
}
