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
  { id: "ALL", label: "Todas" },
  { id: "TASKS", label: "Tarefas & Hábitos" },
  { id: "SHOPPING", label: "Loja" },
  { id: "BACKPACK", label: "Mochila" },
  { id: "FOCUS", label: "Foco" },
] as const;

export const PERIOD_OPTIONS: readonly {
  value: HistoryPeriodFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Todo o período" },
  { value: "TODAY", label: "Hoje" },
  { value: "7DAYS", label: "Últimos 7 dias" },
  { value: "30DAYS", label: "Últimos 30 dias" },
] as const;

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

export const DEFAULT_TRANSACTION_STYLE: TransactionTypeStyle = {
  label: "Transação",
  borderClass: "border-l-primary",
  badgeClass: "bg-white/10 text-neutral-300 border-white/20",
  icon: HelpCircle,
};

/**
 * Rotas de origem de cada tipo de transação (resolvido), usadas no atalho
 * contextual do popover de detalhes. Tipos sem rota não exibem o atalho.
 */
const TASKS_ROUTE = { href: "/tasks", label: "Ver em Tarefas" } as const;
const INVENTORY_ROUTE = {
  href: "/inventory",
  label: "Ver na Mochila",
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

export const DIFFICULTY_LABELS: Record<string, string> = {
  TRIVIAL: "Trivial",
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
};

export const PACKAGE_LABELS: Record<string, string> = {
  NONE: "Comum",
  BASIC: "Básico",
  PREMIUM: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Lendário",
};
