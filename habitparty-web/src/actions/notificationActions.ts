"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { REMINDER_OFFSET_DAYS } from "@/constants/task";
import { getDashboardTransactions } from "@/services/dashboardService";
import { getRawInventoryItems } from "@/services/inventoryService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import { getWorkspaces } from "@/services/workspaceService";
import {
  isTaskScheduledForDate,
  TASK_COMPLETION_TRANSACTION_TYPES,
} from "@/utils/dashboardMetrics";
import { parseIsoDateUtcMs, parseServerDate } from "@/utils/date";

function isTimestampOnLocalDate(
  rawIso: string | undefined,
  targetDateStr: string,
  timezoneOffsetMinutes?: number,
): boolean {
  if (!rawIso) return false;
  const parsed = parseServerDate(rawIso);
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
  type: "overdue" | "today" | "streak" | "focus_item" | "reminder";
  title: string;
  description: string;
  timestamp: string;
  severity: "danger" | "warning" | "info" | "gold";
  href: string;
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
    const [cookieStore, t] = await Promise.all([
      cookies(),
      getTranslations("notifications"),
    ]);
    const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

    const [workspaces, user, inventoryItems, transactions, speculativeBoard] =
      await Promise.all([
        getWorkspaces(),
        getCurrentUser(),
        getRawInventoryItems(),
        getDashboardTransactions(),
        cookieWorkspaceId
          ? fetchWorkspaceBoardColumns(cookieWorkspaceId)
          : Promise.resolve(null),
      ]);

    const isCookieWorkspaceValid =
      Boolean(cookieWorkspaceId) &&
      workspaces.some((w) => w.id === cookieWorkspaceId);
    const activeWorkspaceId = isCookieWorkspaceValid
      ? cookieWorkspaceId
      : workspaces[0]?.id;

    const boardData =
      activeWorkspaceId && activeWorkspaceId === cookieWorkspaceId
        ? speculativeBoard
        : activeWorkspaceId
          ? await fetchWorkspaceBoardColumns(activeWorkspaceId)
          : null;

    const notifications: SidebarNotification[] = [];
    const now = new Date();
    const todayStr =
      clientDateStr ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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

    return {
      notifications,
      unreadCount: notifications.length,
    };
  } catch (err) {
    console.error("[getSidebarNotificationsAction]", err);
    return { notifications: [], unreadCount: 0 };
  }
}
