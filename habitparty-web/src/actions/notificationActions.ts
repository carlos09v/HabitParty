"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { serverApi } from "@/api/server";
import { ALL_WEEK_DAYS, REMINDER_OFFSET_DAYS } from "@/constants/task";
import { parseIsoDateUtcMs } from "@/utils/date";

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
  clientDayIndex?: number,
): Promise<SidebarNotificationsResponse> {
  try {
    const [cookieStore, t] = await Promise.all([
      cookies(),
      getTranslations("notifications"),
    ]);
    let workspaceId = cookieStore.get("activeWorkspaceId")?.value;

    const [workspacesRes, userRes, inventoryRes] = await Promise.all([
      serverApi
        .GET("/workspaces", { next: { tags: ["workspaces"] } })
        .catch(() => ({ data: null })),
      serverApi
        .GET("/users/me", { next: { tags: ["user"] } })
        .catch(() => ({ data: null })),
      serverApi
        .GET("/inventory", {
          params: { query: { status: "IN_FOCUS" } },
          next: { tags: ["inventory"] },
        })
        .catch(() => ({ data: null })),
    ]);

    if (!workspaceId && workspacesRes?.data && workspacesRes.data.length > 0) {
      workspaceId = workspacesRes.data[0].id;
    }

    const kanbanRes = workspaceId
      ? await serverApi
          .GET("/workspaces/{workspaceId}/kanban", {
            params: { path: { workspaceId } },
            next: { tags: ["kanban", "tasks"] },
          })
          .catch(() => ({ data: null }))
      : { data: null };

    const notifications: SidebarNotification[] = [];
    const now = new Date();
    const todayStr =
      clientDateStr ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDayName =
      ALL_WEEK_DAYS[
        typeof clientDayIndex === "number" ? clientDayIndex : now.getDay()
      ];

    const todayUtcMs = parseIsoDateUtcMs(todayStr);
    let overdueCount = 0;
    let todayTasksCount = 0;
    const activeReminderNames: string[] = [];

    for (const col of kanbanRes?.data?.columns || []) {
      for (const task of col.tasks || []) {
        if (task.status === "COMPLETED") continue;

        const type = (task.taskType || "").toLowerCase();
        const isDaily = type === "daily";
        const isHabit = type === "habit";

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
              if (diffDays >= 0 && diffDays <= windowDays && task.name) {
                activeReminderNames.push(task.name);
              }
            }
          }
        } else if (isHabit) {
          todayTasksCount++;
        } else if (isDaily) {
          if (
            !task.daysOfWeek ||
            task.daysOfWeek.length === 0 ||
            task.daysOfWeek.includes(
              todayDayName as (typeof ALL_WEEK_DAYS)[number],
            )
          ) {
            todayTasksCount++;
          }
        }
      }
    }

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

    // 3. Ofensiva / Streak em risco
    const streak = userRes?.data?.currentStreak ?? 0;
    if (streak > 0) {
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
    const inFocusItems = inventoryRes?.data || [];
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
