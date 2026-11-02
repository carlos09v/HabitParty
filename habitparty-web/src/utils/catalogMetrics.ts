import {
  Backpack,
  CheckCircle2,
  CheckSquare,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Store,
  Target,
  Timer,
} from "lucide-react";
import type { AppLocale } from "@/i18n/config";
import type { FocusActivity } from "@/types/focus";
import type {
  InventoryItem,
  InventoryItemResponseDTO,
} from "@/types/inventory";
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
  locale: AppLocale = "pt-BR",
): {
  stats: WelcomeCardStat[];
  redeemableCount: number;
} {
  const isEn = locale === "en";
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
  if (timeBasedCount > 0)
    breakdownParts.push(
      isEn
        ? `${timeBasedCount} ${timeBasedCount === 1 ? "voucher" : "vouchers"}`
        : `${timeBasedCount} ${timeBasedCount === 1 ? "cupom" : "cupons"}`,
    );
  if (singleUseCount > 0)
    breakdownParts.push(
      isEn
        ? `${singleUseCount} single-use`
        : `${singleUseCount} ${singleUseCount === 1 ? "único" : "únicos"}`,
    );
  if (mysteryCount > 0)
    breakdownParts.push(
      isEn
        ? `${mysteryCount} ${mysteryCount === 1 ? "box" : "boxes"}`
        : `${mysteryCount} ${mysteryCount === 1 ? "caixa" : "caixas"}`,
    );
  const hint =
    breakdownParts.length > 0
      ? breakdownParts.join(" • ")
      : isEn
        ? "no options registered"
        : "nenhuma opção cadastrada";

  const stats: WelcomeCardStat[] = [
    {
      label: isEn ? "Current Balance" : "Saldo Atual",
      value: `${formatCoins(currentCoins, { locale })} ${isEn ? "Coins" : "Moedas"}`,
      icon: Coins,
      variant: "gold",
      hint: isEn ? "available to redeem" : "disponíveis para troca",
    },
    {
      label: isEn ? "Redeemable" : "Pode Resgatar",
      value: `${redeemableCount} ${redeemableCount === 1 ? "item" : isEn ? "items" : "itens"}`,
      icon: Gift,
      variant: redeemableCount > 0 ? "success" : "default",
      hint:
        redeemableCount > 0
          ? isEn
            ? "within reach today"
            : "ao seu alcance hoje"
          : isEn
            ? "earn more coins"
            : "junte mais moedas",
    },
    {
      label: isEn ? "In Showcase" : "Na Vitrine",
      value: `${rewards.length} ${rewards.length === 1 ? (isEn ? "option" : "opção") : isEn ? "options" : "opções"}`,
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
export function calculateInventoryWelcomeStats(
  items: InventoryItem[],
  locale: AppLocale = "pt-BR",
): {
  stats: WelcomeCardStat[];
  totalQuantity: number;
  inFocusCount: number;
} {
  const isEn = locale === "en";
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
      label: isEn ? "Total in Backpack" : "Total na Mochila",
      value: `${totalQuantity} ${totalQuantity === 1 ? "item" : isEn ? "items" : "itens"}`,
      icon: Backpack,
      variant: "primary",
      hint: `${items.length} ${items.length === 1 ? (isEn ? "stored type" : "tipo guardado") : isEn ? "stored types" : "tipos guardados"}`,
    },
    {
      label: isEn ? "Active in Focus" : "Ativos no Foco",
      value: `${inFocusCount} ${inFocusCount === 1 ? "item" : isEn ? "items" : "itens"}`,
      icon: Flame,
      variant: inFocusCount > 0 ? "gold" : "default",
      hint:
        inFocusCount > 0
          ? isEn
            ? "on the focus stage"
            : "no palco de foco"
          : isEn
            ? "no items in focus"
            : "nenhum item no foco",
    },
    {
      label: isEn ? "Item Types" : "Tipos de Itens",
      value: isEn
        ? `${singleUseCount} Single-Use`
        : `${singleUseCount} Uso Único`,
      icon: Sparkles,
      variant: "success",
      hint: `${couponCount} ${couponCount === 1 ? (isEn ? "stored voucher" : "cupom guardado") : isEn ? "stored vouchers" : "cupons guardados"}`,
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
  locale: AppLocale = "pt-BR",
): {
  stats: WelcomeCardStat[];
  completedCount: number;
  habitsCount: number;
  percent: number;
} {
  const isEn = locale === "en";
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
      label: isEn ? "Tasks on Board" : "Tarefas no Quadro",
      value: `${totalTasks} ${totalTasks === 1 ? (isEn ? "task" : "tarefa") : isEn ? "tasks" : "tarefas"}`,
      icon: CheckSquare,
      variant: "info",
      hint: `${resolvedColumnsCount} ${resolvedColumnsCount === 1 ? (isEn ? "column" : "coluna") : isEn ? "columns" : "colunas"}`,
    },
    {
      label: isEn ? "Completed" : "Concluídas",
      value: `${completedCount} ${isEn ? "done" : completedCount === 1 ? "feita" : "feitas"}`,
      icon: CheckCircle2,
      variant: completedCount > 0 ? "success" : "default",
      hint:
        totalTasks > 0
          ? isEn
            ? `${percent}% completed`
            : `${percent}% de conclusão`
          : isEn
            ? "no tasks"
            : "nenhuma tarefa",
    },
    {
      label: isEn ? "Active Habits" : "Hábitos Ativos",
      value: `${habitsCount} ${habitsCount === 1 ? (isEn ? "habit" : "hábito") : isEn ? "habits" : "hábitos"}`,
      icon: Flame,
      variant: "gold",
      hint: isEn ? "daily consistency" : "constância diária",
    },
  ];

  return { stats, completedCount, habitsCount, percent };
}

/**
 * Calcula as estatísticas do WelcomeCard para a tela de Sessão de Foco.
 */
export function calculateFocusWelcomeStats(
  activities: FocusActivity[] = [],
  backpackItems: InventoryItemResponseDTO[] = [],
): WelcomeCardStat[] {
  const activitiesCount = activities.length;
  const backpackCount = backpackItems.length;

  return [
    {
      label: "Atividades de Foco",
      value: `${activitiesCount} ${activitiesCount === 1 ? "atividade" : "atividades"}`,
      icon: Target,
      variant: "info",
      hint:
        activitiesCount > 0
          ? "prontas para iniciar sessão"
          : "crie sua primeira atividade",
    },
    {
      label: "Itens no Palco",
      value: `${backpackCount} ${backpackCount === 1 ? "item" : "itens"}`,
      icon: Backpack,
      variant: backpackCount > 0 ? "gold" : "default",
      hint:
        backpackCount > 0
          ? "cupons/recompensas de foco"
          : "envie itens pela Mochila",
    },
    {
      label: "Modos de Sessão",
      value: "Pomodoro & Livre",
      icon: Timer,
      variant: "primary",
      hint: "ganhe XP e moedas por minuto",
    },
  ];
}
