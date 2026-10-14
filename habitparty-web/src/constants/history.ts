import {
  AlertOctagon,
  CheckCircle2,
  Coins,
  HelpCircle,
  ShoppingBag,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import type { HistoryTab, TransactionTypeStyle } from "@/types/history";

export const HISTORY_TABS: readonly HistoryTab[] = [
  { id: "ALL", label: "Todas" },
  { id: "TASKS", label: "Tarefas & Hábitos" },
  { id: "SHOPPING", label: "Loja" },
  { id: "BACKPACK", label: "Mochila" },
] as const;

export const TRANSACTION_TYPE_CONFIG: Record<string, TransactionTypeStyle> = {
  REWARD_BOUGHT: {
    label: "Resgate na Loja",
    borderClass: "border-l-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    icon: ShoppingBag,
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
};

export const DEFAULT_TRANSACTION_STYLE: TransactionTypeStyle = {
  label: "Transação",
  borderClass: "border-l-primary",
  badgeClass: "bg-white/10 text-neutral-300 border-white/20",
  icon: HelpCircle,
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
