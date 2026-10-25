import { CalendarCheck, CheckCircle2, Sparkles } from "lucide-react";
import type {
  DashboardAdvancedFilters,
  EconomyBarData,
} from "@/types/dashboard";
import type { TaskFilterType } from "@/types/task";

/** Barras padrão para o gráfico de Economia do Dashboard. */
export const DEFAULT_ECONOMY_BARS: readonly EconomyBarData[] = [
  {
    label: "-3 sem",
    periodLabel: "3 semanas atrás",
    gold: 0,
    spent: 0,
    heightPercent: 10,
    spentHeightPercent: 10,
    isHighlight: false,
  },
  {
    label: "-2 sem",
    periodLabel: "2 semanas atrás",
    gold: 0,
    spent: 0,
    heightPercent: 10,
    spentHeightPercent: 10,
    isHighlight: false,
  },
  {
    label: "Passada",
    periodLabel: "Semana passada",
    gold: 0,
    spent: 0,
    heightPercent: 10,
    spentHeightPercent: 10,
    isHighlight: false,
  },
  {
    label: "Atual",
    periodLabel: "Esta semana",
    gold: 0,
    spent: 0,
    heightPercent: 10,
    spentHeightPercent: 10,
    isHighlight: true,
  },
] as const;

export const DEFAULT_DASHBOARD_ADVANCED_FILTERS: DashboardAdvancedFilters = {
  taskType: "all",
  columnId: "all",
  difficulty: "all",
  hideCompleted: false,
  sortBy: "default",
};

export const DASHBOARD_TASK_FILTERS: readonly {
  id: TaskFilterType;
  label: string;
}[] = [
  { id: "today", label: "Hoje" },
  { id: "next7days", label: "Próximos 7 dias..." },
  { id: "this_month", label: "Este mês" },
  { id: "nodate", label: "Sem prazo" },
  { id: "overdue", label: "Atrasado" },
] as const;

export const DASHBOARD_EMPTY_MESSAGES: Partial<
  Record<
    TaskFilterType,
    { title: string; description: string; icon: typeof CalendarCheck }
  >
> = {
  today: {
    title: "Tudo limpo por hoje! 🎉",
    description: "Você não possui nenhuma tarefa pendente para hoje.",
    icon: CalendarCheck,
  },
  next7days: {
    title: "Sem tarefas nos próximos 7 dias",
    description: "Sua semana está tranquila. Que tal planejar novas metas?",
    icon: Sparkles,
  },
  this_month: {
    title: "Mês tranquilo! 📅",
    description: "Você não possui nenhuma tarefa pendente para este mês.",
    icon: Sparkles,
  },
  overdue: {
    title: "Tudo em dia! ✨",
    description: "Parabéns, você não possui nenhuma tarefa atrasada.",
    icon: CheckCircle2,
  },
  nodate: {
    title: "Nenhuma tarefa sem prazo",
    description: "Todas as suas tarefas possuem uma data de entrega definida.",
    icon: CalendarCheck,
  },
};

export { TASK_TYPE_FILTER_OPTIONS } from "@/constants/task";

export const TASK_DIFFICULTY_FILTER_OPTIONS = [
  { value: "all", label: "Todas as dificuldades" },
  { value: "TRIVIAL", label: "Trivial" },
  { value: "EASY", label: "Fácil" },
  { value: "MEDIUM", label: "Médio" },
  { value: "HARD", label: "Difícil" },
] as const;

export const TASK_SORT_FILTER_OPTIONS = [
  { value: "default", label: "Padrão (Data / Prazo)" },
  { value: "difficulty", label: "Dificuldade (Maior primeiro)" },
  { value: "priority", label: "Prioridade (Alta primeiro)" },
  { value: "reward", label: "Maior Recompensa (XP/Gold)" },
] as const;

export type ActivityPeriodOption = "today" | "this_week" | "this_month";

export const ACTIVITY_PERIOD_OPTIONS: readonly {
  id: ActivityPeriodOption;
  label: string;
}[] = [
  { id: "today", label: "Hoje" },
  { id: "this_week", label: "Semana" },
  { id: "this_month", label: "Mês" },
] as const;

/** Quantidade padrão de tarefas exibidas por página na tabela do Dashboard */
export const DASHBOARD_ITEMS_PER_PAGE = 5;
