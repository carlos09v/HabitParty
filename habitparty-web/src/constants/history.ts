import {
  AlertOctagon,
  CalendarCheck,
  CheckCircle2,
  Coins,
  Flame,
  HelpCircle,
  Receipt,
  ShoppingBag,
  Sparkles,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import type {
  HistoryDirectionFilter,
  HistoryPeriodFilter,
  HistorySortOption,
  HistoryTab,
  TransactionTypeStyle,
} from "@/types/history";

export const HISTORY_TABS: readonly HistoryTab[] = [
  { id: "ALL" },
  { id: "TASKS" },
  { id: "SHOPPING" },
  { id: "BACKPACK" },
  { id: "FOCUS" },
] as const;

export const PERIOD_OPTIONS: readonly {
  value: HistoryPeriodFilter;
}[] = [
  { value: "ALL" },
  { value: "TODAY" },
  { value: "7DAYS" },
  { value: "30DAYS" },
  { value: "THIS_MONTH" },
  { value: "LAST_MONTH" },
  { value: "CUSTOM" },
] as const;

export const DIRECTION_OPTIONS: readonly {
  value: HistoryDirectionFilter;
}[] = [{ value: "ALL" }, { value: "IN" }, { value: "OUT" }] as const;

export const SORT_OPTIONS: readonly {
  value: HistorySortOption;
}[] = [
  { value: "NEWEST" },
  { value: "OLDEST" },
  { value: "HIGHEST_GOLD" },
  { value: "LOWEST_GOLD" },
] as const;

export const HISTORY_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_HISTORY_PAGE_SIZE = 20;

/**
 * Grid de colunas responsivo e alinhado entre cabeçalho e linhas da tabela de histórico.
 * Coluna de horário compacta (`84px`) para evitar rolagem horizontal em viewports de 1024px.
 */
export const HISTORY_GRID_COLS =
  "md:grid-cols-[minmax(0,2fr)_minmax(0,1.15fr)_minmax(0,1.35fr)_90px_76px_84px_36px]";

/** Variante do grid com coluna inicial de seleção (checkbox) para exclusão em lote. */
export const HISTORY_GRID_COLS_SELECTABLE =
  "md:grid-cols-[24px_minmax(0,2fr)_minmax(0,1.15fr)_minmax(0,1.35fr)_90px_76px_84px_36px]";

/** Transações negativas: a borda lateral sempre usa o vermelho do tipo (não a cor da dificuldade). */
export const NEGATIVE_TRANSACTION_TYPES: ReadonlySet<string> = new Set([
  "TASK_FAILED",
  "BAD_HABIT_PENALTY",
]);

export const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeStyle> = {
  REWARD_BOUGHT: {
    borderClass: "border-l-indigo-500",
    badgeClass:
      "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/35",
    icon: ShoppingBag,
  },
  DEBT_PAID: {
    borderClass: "border-l-rose-500",
    badgeClass:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35",
    icon: Receipt,
  },
  HABIT_COMPLETED: {
    borderClass: "border-l-amber-500",
    badgeClass:
      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/35",
    icon: Flame,
  },
  DAILY_COMPLETED: {
    borderClass: "border-l-sky-500",
    badgeClass:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35",
    icon: CalendarCheck,
  },
  TODO_COMPLETED: {
    borderClass: "border-l-emerald-500",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35",
    icon: CheckCircle2,
  },
  TASK_COMPLETED: {
    borderClass: "border-l-emerald-500",
    badgeClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35",
    icon: CheckCircle2,
  },
  TASK_FAILED: {
    borderClass: "border-l-red-500",
    badgeClass:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35",
    icon: XCircle,
  },
  BAD_HABIT_PENALTY: {
    borderClass: "border-l-red-500",
    badgeClass:
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/35",
    icon: AlertOctagon,
  },
  ITEM_CONSUMED: {
    borderClass: "border-l-cyan-500",
    badgeClass:
      "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/35",
    icon: Sparkles,
  },
  ITEM_DISCARDED: {
    borderClass: "border-l-neutral-500",
    badgeClass:
      "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/35",
    icon: Trash2,
  },
  MANUAL_ADJUSTMENT: {
    borderClass: "border-l-gold",
    badgeClass:
      "bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold border-amber-500/35 dark:border-gold/30",
    icon: Coins,
  },
  FOCUS_COMPLETED: {
    borderClass: "border-l-gold",
    badgeClass:
      "bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold border-amber-500/35 dark:border-gold/30",
    icon: Timer,
  },
};

export const DEFAULT_TRANSACTION_STYLE: TransactionTypeStyle = {
  borderClass: "border-l-primary",
  badgeClass:
    "bg-surface dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border-neutral-600/40 dark:border-white/20",
  icon: HelpCircle,
};

export type TransactionContextRouteKey =
  | "tasks"
  | "inventory"
  | "rewards"
  | "focus";

/**
 * Rotas de origem de cada tipo de transação (resolvido), usadas no atalho
 * contextual do painel de detalhes. Tipos cuja origem deixa de existir (ex.: DEBT_PAID, ITEM_DISCARDED)
 * ficam deliberadamente sem atalho.
 */
export const TRANSACTION_CONTEXT_ROUTE_MAP: Partial<
  Record<string, { href: string; routeKey: TransactionContextRouteKey }>
> = {
  REWARD_BOUGHT: { href: "/rewards", routeKey: "rewards" },
  ITEM_CONSUMED: { href: "/inventory", routeKey: "inventory" },
  FOCUS_COMPLETED: { href: "/focus", routeKey: "focus" },
  TASK_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  HABIT_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  DAILY_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  TODO_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  TASK_FAILED: { href: "/tasks", routeKey: "tasks" },
  BAD_HABIT_PENALTY: { href: "/tasks", routeKey: "tasks" },
};
