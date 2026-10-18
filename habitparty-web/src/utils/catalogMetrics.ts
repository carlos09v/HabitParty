import {
  Backpack,
  CheckCircle2,
  CheckSquare,
  Coins,
  Flame,
  Gift,
  History,
  Sparkles,
  Store,
} from "lucide-react";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { InventoryItem } from "@/types/inventory";
import type { Reward } from "@/types/reward";
import type { BoardColumn, Task } from "@/types/task";
import type { WelcomeCardStat } from "@/types/ui";
import { formatCoins } from "@/utils";

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Recompensas (Loja).
 */
export function calculateRewardWelcomeStats(
  rewards: Reward[],
  currentCoins: number,
): {
  stats: WelcomeCardStat[];
  redeemableCount: number;
} {
  const redeemableCount = rewards.filter((r) => r.price <= currentCoins).length;

  const timeBasedCount = rewards.filter(
    (r) => r.type === "TIME_BASED" || r.type === "TimeBased",
  ).length;
  const singleUseCount = rewards.filter(
    (r) => r.type === "SINGLE_USE" || r.type === "SingleUse",
  ).length;
  const mysteryCount = rewards.filter(
    (r) => r.type === "MISTERY_BOX" || r.type === "MysteryBox",
  ).length;

  const breakdownParts: string[] = [];
  if (timeBasedCount > 0) breakdownParts.push(`${timeBasedCount} cupons`);
  if (singleUseCount > 0) breakdownParts.push(`${singleUseCount} únicos`);
  if (mysteryCount > 0) breakdownParts.push(`${mysteryCount} caixas`);
  const hint =
    breakdownParts.length > 0
      ? breakdownParts.join(" • ")
      : "nenhuma opção cadastrada";

  const stats: WelcomeCardStat[] = [
    {
      label: "Saldo Atual",
      value: `${formatCoins(currentCoins)} Moedas`,
      icon: Coins,
      variant: "gold",
      hint: "disponíveis para troca",
    },
    {
      label: "Pode Resgatar",
      value: `${redeemableCount} ${redeemableCount === 1 ? "item" : "itens"}`,
      icon: Gift,
      variant: redeemableCount > 0 ? "success" : "default",
      hint: redeemableCount > 0 ? "ao seu alcance hoje" : "junte mais moedas",
    },
    {
      label: "Na Vitrine",
      value: `${rewards.length} ${rewards.length === 1 ? "opção" : "opções"}`,
      icon: Store,
      variant: "primary",
      hint,
    },
  ];

  return { stats, redeemableCount };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Inventário (Mochila).
 */
export function calculateInventoryWelcomeStats(items: InventoryItem[]): {
  stats: WelcomeCardStat[];
  totalQuantity: number;
  inFocusCount: number;
} {
  const totalQuantity = items.reduce(
    (acc, item) => acc + (item.quantity || 1),
    0,
  );
  const inFocusCount = items.filter(
    (item) => item.status === "IN_FOCUS",
  ).length;

  const singleUseCount = items.filter(
    (item) =>
      item.reward?.type === "SINGLE_USE" || item.reward?.type === "SingleUse",
  ).length;

  const couponCount = items.filter(
    (item) =>
      item.reward?.type === "TIME_BASED" || item.reward?.type === "TimeBased",
  ).length;

  const stats: WelcomeCardStat[] = [
    {
      label: "Total na Mochila",
      value: `${totalQuantity} ${totalQuantity === 1 ? "item" : "itens"}`,
      icon: Backpack,
      variant: "primary",
      hint: `${items.length} ${items.length === 1 ? "tipo guardado" : "tipos guardados"}`,
    },
    {
      label: "Ativos no Foco",
      value: `${inFocusCount} ${inFocusCount === 1 ? "item" : "itens"}`,
      icon: Flame,
      variant: inFocusCount > 0 ? "gold" : "default",
      hint: inFocusCount > 0 ? "no palco de foco" : "nenhum item no foco",
    },
    {
      label: "Tipos de Itens",
      value: `${singleUseCount} Uso Único`,
      icon: Sparkles,
      variant: "success",
      hint: `${couponCount} ${couponCount === 1 ? "cupom guardado" : "cupons guardados"}`,
    },
  ];

  return { stats, totalQuantity, inFocusCount };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Tarefas (Quadro Kanban).
 * Suporta diretamente a lista de colunas para agregação em passagem única sem alocar arrays intermediários.
 */
export function calculateTasksWelcomeStats(
  columnsOrTasks: BoardColumn[] | Task[],
  columnsCount?: number,
): {
  stats: WelcomeCardStat[];
  completedCount: number;
  habitsCount: number;
  percent: number;
} {
  let totalTasks = 0;
  let completedCount = 0;
  let habitsCount = 0;
  let resolvedColumnsCount = columnsCount ?? 0;

  if (columnsOrTasks.length > 0 && "tasks" in columnsOrTasks[0]) {
    const cols = columnsOrTasks as BoardColumn[];
    resolvedColumnsCount = cols.length;
    for (const col of cols) {
      for (const t of col.tasks) {
        totalTasks++;
        if (t.completed) completedCount++;
        if ((t.type || "").toLowerCase() === "habit") habitsCount++;
      }
    }
  } else {
    const tasks = columnsOrTasks as Task[];
    totalTasks = tasks.length;
    for (const t of tasks) {
      if (t.completed) completedCount++;
      if ((t.type || "").toLowerCase() === "habit") habitsCount++;
    }
  }

  const percent =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const stats: WelcomeCardStat[] = [
    {
      label: "Tarefas no Quadro",
      value: `${totalTasks} ${totalTasks === 1 ? "tarefa" : "tarefas"}`,
      icon: CheckSquare,
      variant: "info",
      hint: `${resolvedColumnsCount} ${resolvedColumnsCount === 1 ? "coluna" : "colunas"}`,
    },
    {
      label: "Concluídas",
      value: `${completedCount} ${completedCount === 1 ? "feita" : "feitas"}`,
      icon: CheckCircle2,
      variant: completedCount > 0 ? "success" : "default",
      hint: totalTasks > 0 ? `${percent}% de conclusão` : "nenhuma tarefa",
    },
    {
      label: "Hábitos Ativos",
      value: `${habitsCount} ${habitsCount === 1 ? "hábito" : "hábitos"}`,
      icon: Flame,
      variant: "gold",
      hint: "constância diária",
    },
  ];

  return { stats, completedCount, habitsCount, percent };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Histórico (Extrato de Transações).
 */
export function calculateHistoryWelcomeStats(
  transactions: TransactionHistoryResponseDTO[],
  totalElements?: number,
): {
  stats: WelcomeCardStat[];
  totalGoldEarned: number;
  totalGoldSpent: number;
  totalXpEarned: number;
} {
  let totalGoldEarned = 0;
  let totalGoldSpent = 0;
  let totalXpEarned = 0;

  for (const tx of transactions) {
    const gold = tx.goldAmount ?? 0;
    if (gold > 0) {
      totalGoldEarned += gold;
    } else if (gold < 0) {
      totalGoldSpent += Math.abs(gold);
    }

    const xp = tx.xpAmount ?? 0;
    if (xp > 0) {
      totalXpEarned += xp;
    }
  }

  const resolvedCount = totalElements ?? transactions.length;

  const stats: WelcomeCardStat[] = [
    {
      label: "Moedas",
      value: `+${formatCoins(totalGoldEarned)} 🪙`,
      icon: Coins,
      variant: "gold",
      hint:
        totalGoldSpent > 0
          ? `-${formatCoins(totalGoldSpent)} gastas`
          : "saldo obtido",
    },
    {
      label: "XP Acumulado",
      value: `+${formatCoins(totalXpEarned)} XP`,
      icon: Sparkles,
      variant: "info",
      hint: "ganhos totais",
    },
    {
      label: "Registros",
      value: `${resolvedCount} no total`,
      icon: History,
      variant: "default",
      hint: "movimentações",
    },
  ];

  return { stats, totalGoldEarned, totalGoldSpent, totalXpEarned };
}
