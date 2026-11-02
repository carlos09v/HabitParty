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
import type { AppLocale } from "@/i18n/config";
import type {
  HistoryPeriodFilter,
  HistoryTab,
  TransactionTypeStyle,
} from "@/types/history";

export const HISTORY_TABS: readonly HistoryTab[] = [
  { id: "ALL", label: "Todas" },
  { id: "TASKS", label: "Tarefas & Hábitos" },
  { id: "SHOPPING", label: "Loja" },
  { id: "BACKPACK", label: "Mochila" },
  { id: "FOCUS", label: "Foco" },
] as const;

export const HISTORY_TABS_EN: readonly HistoryTab[] = [
  { id: "ALL", label: "All" },
  { id: "TASKS", label: "Tasks & Habits" },
  { id: "SHOPPING", label: "Store" },
  { id: "BACKPACK", label: "Backpack" },
  { id: "FOCUS", label: "Focus" },
] as const;

export function getHistoryTabs(
  locale: AppLocale = "pt-BR",
): readonly HistoryTab[] {
  return locale === "en" ? HISTORY_TABS_EN : HISTORY_TABS;
}

export const PERIOD_OPTIONS: readonly {
  value: HistoryPeriodFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Todo o período" },
  { value: "TODAY", label: "Hoje" },
  { value: "7DAYS", label: "Últimos 7 dias" },
  { value: "30DAYS", label: "Últimos 30 dias" },
] as const;

export const PERIOD_OPTIONS_EN: readonly {
  value: HistoryPeriodFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All time" },
  { value: "TODAY", label: "Today" },
  { value: "7DAYS", label: "Last 7 days" },
  { value: "30DAYS", label: "Last 30 days" },
] as const;

export function getPeriodOptions(locale: AppLocale = "pt-BR"): readonly {
  value: HistoryPeriodFilter;
  label: string;
}[] {
  return locale === "en" ? PERIOD_OPTIONS_EN : PERIOD_OPTIONS;
}

/**
 * Grid de colunas responsivo e perfeitamente alinhado entre o cabeçalho e as linhas da tabela de histórico.
 * Nota: O prefixo `md:` deve estar explícito na string literal para que o scanner do Tailwind CSS v4
 * não descarte a classe utilitária durante o build de produção.
 */
export const HISTORY_GRID_COLS =
  "md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_90px_80px_125px_36px]";

export const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeStyle> = {
  REWARD_BOUGHT: {
    label: "Resgate na Loja",
    borderClass: "border-l-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    icon: ShoppingBag,
  },
  HABIT_COMPLETED: {
    label: "Hábito Praticado",
    borderClass: "border-l-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: Flame,
  },
  DAILY_COMPLETED: {
    label: "Diária Concluída",
    borderClass: "border-l-sky-500",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: CalendarCheck,
  },
  TODO_COMPLETED: {
    label: "Afazer Concluído",
    borderClass: "border-l-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  TASK_COMPLETED: {
    label: "Tarefa Concluída",
    borderClass: "border-l-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
  },
  TASK_FAILED: {
    label: "Tarefa Falhada",
    borderClass: "border-l-red-500",
    badgeClass: "bg-red-500/15 text-red-300 border-red-500/30",
    icon: XCircle,
  },
  BAD_HABIT_PENALTY: {
    label: "Penalidade Hábito",
    borderClass: "border-l-amber-500",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: AlertOctagon,
  },
  ITEM_CONSUMED: {
    label: "Item Consumido",
    borderClass: "border-l-cyan-500",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    icon: Sparkles,
  },
  ITEM_DISCARDED: {
    label: "Item Descartado",
    borderClass: "border-l-neutral-500",
    badgeClass: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
    icon: Trash2,
  },
  MANUAL_ADJUSTMENT: {
    label: "Ajuste Manual",
    borderClass: "border-l-gold",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
    icon: Coins,
  },
  FOCUS_COMPLETED: {
    label: "Sessão de Foco",
    borderClass: "border-l-gold",
    badgeClass: "bg-gold/15 text-gold border-gold/30",
    icon: Timer,
  },
};

export const TRANSACTION_TYPE_LABELS_EN: Record<string, string> = {
  REWARD_BOUGHT: "Store Redemption",
  HABIT_COMPLETED: "Habit Practiced",
  DAILY_COMPLETED: "Daily Completed",
  TODO_COMPLETED: "To-Do Completed",
  TASK_COMPLETED: "Task Completed",
  TASK_FAILED: "Task Failed",
  BAD_HABIT_PENALTY: "Habit Penalty",
  ITEM_CONSUMED: "Item Consumed",
  ITEM_DISCARDED: "Item Discarded",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  FOCUS_COMPLETED: "Focus Session",
};

export const DEFAULT_TRANSACTION_STYLE: TransactionTypeStyle = {
  label: "Transação",
  borderClass: "border-l-primary",
  badgeClass: "bg-white/10 text-neutral-300 border-white/20",
  icon: HelpCircle,
};

export function getTransactionTypeLabel(
  resolvedType: string,
  locale: AppLocale = "pt-BR",
): string {
  if (locale === "en") {
    return TRANSACTION_TYPE_LABELS_EN[resolvedType] || "Transaction";
  }
  return (
    TRANSACTION_TYPE_CONFIG[resolvedType]?.label ||
    DEFAULT_TRANSACTION_STYLE.label
  );
}

/**
 * Rotas de origem de cada tipo de transação (resolvido), usadas no atalho
 * contextual do popover de detalhes. Tipos sem rota não exibem o atalho.
 */
const TASKS_ROUTE = { href: "/tasks", label: "Ver em Tarefas" } as const;
const INVENTORY_ROUTE = {
  href: "/inventory",
  label: "Ver na Mochila",
} as const;

const TASKS_ROUTE_EN = { href: "/tasks", label: "View in Tasks" } as const;
const INVENTORY_ROUTE_EN = {
  href: "/inventory",
  label: "View in Backpack",
} as const;

export const TRANSACTION_CONTEXT_ROUTES: Partial<
  Record<string, { href: string; label: string }>
> = {
  REWARD_BOUGHT: { href: "/rewards", label: "Ver na Loja" },
  ITEM_CONSUMED: INVENTORY_ROUTE,
  ITEM_DISCARDED: INVENTORY_ROUTE,
  FOCUS_COMPLETED: { href: "/focus", label: "Ver no Foco" },
  TASK_COMPLETED: TASKS_ROUTE,
  HABIT_COMPLETED: TASKS_ROUTE,
  DAILY_COMPLETED: TASKS_ROUTE,
  TODO_COMPLETED: TASKS_ROUTE,
  TASK_FAILED: TASKS_ROUTE,
  BAD_HABIT_PENALTY: TASKS_ROUTE,
};

export const TRANSACTION_CONTEXT_ROUTES_EN: Partial<
  Record<string, { href: string; label: string }>
> = {
  REWARD_BOUGHT: { href: "/rewards", label: "View in Store" },
  ITEM_CONSUMED: INVENTORY_ROUTE_EN,
  ITEM_DISCARDED: INVENTORY_ROUTE_EN,
  FOCUS_COMPLETED: { href: "/focus", label: "View in Focus" },
  TASK_COMPLETED: TASKS_ROUTE_EN,
  HABIT_COMPLETED: TASKS_ROUTE_EN,
  DAILY_COMPLETED: TASKS_ROUTE_EN,
  TODO_COMPLETED: TASKS_ROUTE_EN,
  TASK_FAILED: TASKS_ROUTE_EN,
  BAD_HABIT_PENALTY: TASKS_ROUTE_EN,
};

export function getTransactionContextRoute(
  resolvedType: string,
  locale: AppLocale = "pt-BR",
): { href: string; label: string } | undefined {
  return locale === "en"
    ? TRANSACTION_CONTEXT_ROUTES_EN[resolvedType]
    : TRANSACTION_CONTEXT_ROUTES[resolvedType];
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  TRIVIAL: "Trivial",
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
};

export const DIFFICULTY_LABELS_EN: Record<string, string> = {
  TRIVIAL: "Trivial",
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export function getDifficultyLabel(
  difficulty: string,
  locale: AppLocale = "pt-BR",
): string {
  const map = locale === "en" ? DIFFICULTY_LABELS_EN : DIFFICULTY_LABELS;
  return map[difficulty] || difficulty;
}

export const PACKAGE_LABELS: Record<string, string> = {
  NONE: "Comum",
  BASIC: "Básico",
  PREMIUM: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Lendário",
};

export const PACKAGE_LABELS_EN: Record<string, string> = {
  NONE: "Common",
  BASIC: "Basic",
  PREMIUM: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
};

export function getPackageLabel(
  packageLevel: string,
  locale: AppLocale = "pt-BR",
): string {
  const map = locale === "en" ? PACKAGE_LABELS_EN : PACKAGE_LABELS;
  return map[packageLevel] || packageLevel;
}
