import {
  AlertOctagon,
  CalendarCheck,
  CheckCircle2,
  Coins,
  Flame,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  Timer,
  Trash2,
  XCircle,
} from "lucide-react";
import type {
  HistoryPeriodFilter,
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
] as const;

/**
 * Grid de colunas responsivo e perfeitamente alinhado entre o cabeçalho e as linhas da tabela de histórico.
 * Nota: O prefixo `md:` deve estar explícito na string literal para que o scanner do Tailwind CSS v4
 * não descarte a classe utilitária durante o build de produção.
 */
export const HISTORY_GRID_COLS =
  "md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_90px_80px_125px_36px]";

/** Variante do grid com coluna inicial de seleção (checkbox) para exclusão em lote. */
export const HISTORY_GRID_COLS_SELECTABLE =
  "md:grid-cols-[24px_minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_90px_80px_125px_36px]";

/** Transações negativas: a borda lateral sempre usa o vermelho do tipo (não a cor da dificuldade). */
export const NEGATIVE_TRANSACTION_TYPES: ReadonlySet<string> = new Set([
  "TASK_FAILED",
  "BAD_HABIT_PENALTY",
]);

export const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeStyle> = {
  REWARD_BOUGHT: {
    borderClass: "border-l-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    icon: ShoppingBag,
  },
  HABIT_COMPLETED: {
    borderClass: "border-l-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Flame,
  },
  DAILY_COMPLETED: {
    borderClass: "border-l-sky-500",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: CalendarCheck,
  },
  TODO_COMPLETED: {
    borderClass: "border-l-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  TASK_COMPLETED: {
    borderClass: "border-l-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  TASK_FAILED: {
    borderClass: "border-l-red-500",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: XCircle,
  },
  BAD_HABIT_PENALTY: {
    borderClass: "border-l-red-500",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: AlertOctagon,
  },
  ITEM_CONSUMED: {
    borderClass: "border-l-cyan-500",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    icon: Sparkles,
  },
  ITEM_DISCARDED: {
    borderClass: "border-l-neutral-500",
    badgeClass: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
    icon: Trash2,
  },
  MANUAL_ADJUSTMENT: {
    borderClass: "border-l-gold",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
    icon: Coins,
  },
  FOCUS_COMPLETED: {
    borderClass: "border-l-gold",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
    icon: Timer,
  },
};

export const DEFAULT_TRANSACTION_STYLE: TransactionTypeStyle = {
  borderClass: "border-l-primary",
  badgeClass: "bg-white/10 text-neutral-300 border-white/20",
  icon: HelpCircle,
};

export type TransactionContextRouteKey =
  | "tasks"
  | "inventory"
  | "rewards"
  | "focus";

/**
 * Rotas de origem de cada tipo de transação (resolvido), usadas no atalho
 * contextual do popover de detalhes. Tipos sem rota não exibem o atalho.
 */
export const TRANSACTION_CONTEXT_ROUTE_MAP: Partial<
  Record<string, { href: string; routeKey: TransactionContextRouteKey }>
> = {
  REWARD_BOUGHT: { href: "/rewards", routeKey: "rewards" },
  ITEM_CONSUMED: { href: "/inventory", routeKey: "inventory" },
  ITEM_DISCARDED: { href: "/inventory", routeKey: "inventory" },
  FOCUS_COMPLETED: { href: "/focus", routeKey: "focus" },
  TASK_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  HABIT_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  DAILY_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  TODO_COMPLETED: { href: "/tasks", routeKey: "tasks" },
  TASK_FAILED: { href: "/tasks", routeKey: "tasks" },
  BAD_HABIT_PENALTY: { href: "/tasks", routeKey: "tasks" },
};
