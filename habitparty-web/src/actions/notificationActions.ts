"use server";

import { cookies } from "next/headers";
import { serverApi } from "@/api/server";
import { ALL_WEEK_DAYS } from "@/constants/task";

export interface SidebarNotification {
  id: string;
  type: "overdue" | "today" | "streak" | "focus_item";
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
 * - Alerta de manutenção de streak/ofensiva
 * - Itens da mochila ativos na área de foco
 */
export async function getSidebarNotificationsAction(
  clientDateStr?: string,
  clientDayIndex?: number,
): Promise<SidebarNotificationsResponse> {
  try {
    const cookieStore = await cookies();
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

    const tasksRes = workspaceId
      ? await serverApi
          .GET("/tasks/workspace/{workspaceId}/dashboard", {
            params: {
              path: { workspaceId },
              query: { filter: "ALL", size: 100 },
            },
            next: { tags: ["dashboard-tasks"] },
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

    const tasks = tasksRes.data?.content || [];
    let overdueCount = 0;
    let todayTasksCount = 0;

    for (const t of tasks) {
      const type = (t.taskType || "").toLowerCase();
      const isDaily = type === "daily";
      const isHabit = type === "habit";

      if (t.dueDate) {
        const datePart = t.dueDate.split("T")[0];
        if (datePart < todayStr) {
          overdueCount++;
        } else if (datePart === todayStr) {
          todayTasksCount++;
        }
      } else {
        if (isHabit) {
          todayTasksCount++;
        } else if (isDaily) {
          if (
            !t.daysOfWeek ||
            t.daysOfWeek.length === 0 ||
            t.daysOfWeek.includes(
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
        title: `${overdueCount} ${overdueCount === 1 ? "tarefa atrasada" : "tarefas atrasadas"}!`,
        description: "Você tem pendências vencidas aguardando conclusão.",
        timestamp: "Atenção necessária",
        severity: "danger",
        href: "/dashboard?filter=overdue",
      });
    }

    // 2. Tarefas e Rotinas de Hoje
    if (todayTasksCount > 0) {
      notifications.push({
        id: "alert-today",
        type: "today",
        title: `${todayTasksCount} ${todayTasksCount === 1 ? "tarefa/hábito" : "tarefas/hábitos"} para hoje`,
        description: "Mantenha o ritmo para conquistar XP e moedas.",
        timestamp: "Meta do dia",
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
        title: `Ofensiva de ${streak} ${streak === 1 ? "dia" : "dias"} ativa! 🔥`,
        description:
          "Complete suas metas diárias hoje para manter sua sequência viva.",
        timestamp: "Ofensiva",
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
        title: `Recompensa pronta: "${firstItem.rewardName || "Item de Foco"}"`,
        description: "Item em foco pronto para ser desfrutado ou concluído.",
        timestamp: "Mochila / Foco",
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
