import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getFirstName(
  fullName?: string | null,
  username?: string | null,
): string {
  return fullName?.trim().split(/\s+/)[0] || username || "Aventureiro";
}

export function getTodayDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayTasks(tasks: Task[], todayDateStr: string): Task[] {
  return tasks.filter((task) => {
    if (task.dueDate === todayDateStr) return true;
    const type = (task.type || "").toLowerCase();
    return type === "daily";
  });
}

export function getTodayXp(
  transactions: TransactionHistoryResponseDTO[] = [],
  now: Date = new Date(),
): number {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  return transactions.reduce((acc, tx) => {
    if (!tx.createdAt || (tx.xpAmount ?? 0) <= 0) return acc;
    const d = new Date(tx.createdAt);
    if (d >= todayStart) {
      return acc + (tx.xpAmount ?? 0);
    }
    return acc;
  }, 0);
}
