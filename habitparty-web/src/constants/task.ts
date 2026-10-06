import type {
  BoardFilterState,
  DailyDaysOfWeek,
  DailyRepeatTypeOption,
  HabitImportanceOption,
  HabitTypeOption,
  ReminderTypeOption,
  ResetCounterOption,
  TaskDifficultyOption,
  TaskPriorityOption,
} from "@/types/task";

/** Borda esquerda dos Hábitos baseada na Importância. */
export const HABIT_IMPORTANCE_BORDER: Record<string, string> = {
  LOW: "border-l-info hover:border-l-info-hover", // Azul claro
  NORMAL: "border-l-success-500 hover:border-l-success-hover", // Verde
  HIGH: "border-l-danger-500 hover:border-l-danger-hover", // Vermelho
  // Aliases minúsculos para compatibilidade
  low: "border-l-info hover:border-l-info-hover",
  normal: "border-l-success-500 hover:border-l-success-hover",
  high: "border-l-danger-500 hover:border-l-danger-hover",
};

/** Borda esquerda de Diárias e Afazeres baseada na Dificuldade. */
export const DIFFICULTY_BORDER: Record<string, string> = {
  TRIVIAL: "border-l-info hover:border-l-info-hover", // Azul claro
  EASY: "border-l-success-500 hover:border-l-success-hover", // Verde
  MEDIUM: "border-l-warning-500 hover:border-l-warning-hover", // Laranja / Amarelo
  HARD: "border-l-danger-500 hover:border-l-danger-hover", // Vermelho
  // Aliases minúsculos e antigos para compatibilidade com Dashboard e forms
  trivial: "border-l-info hover:border-l-info-hover",
  low: "border-l-success-500 hover:border-l-success-hover",
  easy: "border-l-success-500 hover:border-l-success-hover",
  normal: "border-l-warning-500 hover:border-l-warning-hover",
  medium: "border-l-warning-500 hover:border-l-warning-hover",
  high: "border-l-danger-500 hover:border-l-danger-hover",
  hard: "border-l-danger-500 hover:border-l-danger-hover",
};

/** Rótulo e cor (alto contraste no fundo roxo) de cada tipo de tarefa. */
export const TASK_TYPE_META: Record<string, { label: string; color: string }> =
  {
    HABIT: { label: "Hábito", color: "text-info bg-info/15 border-info/40" },
    DAILY: {
      label: "Diária",
      color: "text-magenta bg-magenta/15 border-magenta/40",
    },
    TODO: { label: "Afazer", color: "text-gold bg-gold/15 border-gold/40" },
    habit: { label: "Hábito", color: "text-info bg-info/15 border-info/40" },
    daily: {
      label: "Diária",
      color: "text-magenta bg-magenta/15 border-magenta/40",
    },
    todo: { label: "Afazer", color: "text-gold bg-gold/15 border-gold/40" },
  };

/** Normaliza com segurança o tipo da tarefa para "habit" | "daily" | "todo". */
export function normalizeTaskType(
  typeOrTask?:
    | string
    | {
        type?: string;
        taskType?: string;
        habitType?: string;
        resetCounter?: string;
        repeatType?: string;
        daysOfWeek?: unknown[];
      }
    | null,
): "habit" | "daily" | "todo" {
  if (!typeOrTask) return "todo";

  if (typeof typeOrTask === "object") {
    const raw = (typeOrTask.type || typeOrTask.taskType || "")
      .trim()
      .toLowerCase();
    if (raw === "habit") return "habit";
    if (raw === "daily") return "daily";
    if (raw === "todo") return "todo";

    if (Boolean(typeOrTask.habitType) || Boolean(typeOrTask.resetCounter)) {
      return "habit";
    }
    if (
      Boolean(typeOrTask.repeatType) ||
      (Array.isArray(typeOrTask.daysOfWeek) && typeOrTask.daysOfWeek.length > 0)
    ) {
      return "daily";
    }
    return "todo";
  }

  const normalized = typeOrTask.trim().toLowerCase();
  if (normalized === "habit") return "habit";
  if (normalized === "daily") return "daily";
  return "todo";
}

/** Iniciais dos dias da semana (índice 0 = Domingo). */
export const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

/** Lista ordenada de dias da semana para exibição consistente em cards e tabelas. */
export const WEEK_DAYS: readonly {
  enumValue: DailyDaysOfWeek;
  shortLabel: string;
  fullName: string;
}[] = [
  { enumValue: "SUNDAY", shortLabel: "D", fullName: "Domingo" },
  { enumValue: "MONDAY", shortLabel: "S", fullName: "Segunda" },
  { enumValue: "TUESDAY", shortLabel: "T", fullName: "Terça" },
  { enumValue: "WEDNESDAY", shortLabel: "Q", fullName: "Quarta" },
  { enumValue: "THURSDAY", shortLabel: "Q", fullName: "Quinta" },
  { enumValue: "FRIDAY", shortLabel: "S", fullName: "Sexta" },
  { enumValue: "SATURDAY", shortLabel: "S", fullName: "Sábado" },
] as const;

/**
 * Retorna a classe de borda lateral esquerda (cor da dificuldade/importância).
 * Hábito usa `importance`; Diária e Afazer usam `difficulty`.
 */
export function getTaskBorderClass(task: {
  type?: string;
  taskType?: string;
  importance?: string;
  importanceType?: string;
  difficulty?: string;
  habitType?: string;
  resetCounter?: string;
}): string {
  const isHabit = normalizeTaskType(task) === "habit";
  if (isHabit) {
    const imp = (
      task.importanceType ||
      task.importance ||
      "NORMAL"
    ).toUpperCase();
    return (
      HABIT_IMPORTANCE_BORDER[imp] ||
      HABIT_IMPORTANCE_BORDER[imp.toLowerCase()] ||
      HABIT_IMPORTANCE_BORDER.NORMAL
    );
  }
  const diff = (task.difficulty || "MEDIUM").toUpperCase();
  return (
    DIFFICULTY_BORDER[diff] ||
    DIFFICULTY_BORDER[diff.toLowerCase()] ||
    DIFFICULTY_BORDER.MEDIUM
  );
}

/** Opções de dias da semana para tarefas Diárias (Daily). */
export const DAYS_OF_WEEK_OPTIONS: readonly {
  id: DailyDaysOfWeek;
  label: string;
}[] = [
  { id: "MONDAY", label: "Seg" },
  { id: "TUESDAY", label: "Ter" },
  { id: "WEDNESDAY", label: "Qua" },
  { id: "THURSDAY", label: "Qui" },
  { id: "FRIDAY", label: "Sex" },
  { id: "SATURDAY", label: "Sab" },
  { id: "SUNDAY", label: "Dom" },
] as const;

/** Opções de importância para Hábitos. */
export const HABIT_IMPORTANCE_OPTIONS: readonly {
  id: HabitImportanceOption;
  label: string;
}[] = [
  { id: "LOW", label: "Baixa" },
  { id: "NORMAL", label: "Normal" },
  { id: "HIGH", label: "Alta" },
] as const;

/** Opções de dificuldade para Tarefas e Diárias. */
export const TASK_DIFFICULTY_OPTIONS: readonly {
  id: TaskDifficultyOption;
  label: string;
}[] = [
  { id: "TRIVIAL", label: "Trivial" },
  { id: "EASY", label: "Fácil" },
  { id: "MEDIUM", label: "Médio" },
  { id: "HARD", label: "Difícil" },
] as const;

/** Opções de prioridade para Afazeres (ToDo). */
export const TODO_PRIORITY_OPTIONS: readonly {
  id: TaskPriorityOption;
  label: string;
}[] = [
  { id: "NONE", label: "Nenhuma" },
  { id: "Low", label: "Baixa" },
  { id: "MEDIUM", label: "Média" },
  { id: "HIGH", label: "Alta" },
] as const;

/** Metadados e cores de prioridade de tarefas. */
export const TASK_PRIORITY_META: Record<
  string,
  { label: string; color: string; badgeColor: string }
> = {
  HIGH: {
    label: "Alta",
    color: "text-danger-500 fill-danger-500",
    badgeColor:
      "text-danger-500 bg-danger-500/20 border-danger-500/40 fill-danger-500",
  },
  high: {
    label: "Alta",
    color: "text-danger-500 fill-danger-500",
    badgeColor:
      "text-danger-500 bg-danger-500/20 border-danger-500/40 fill-danger-500",
  },
  MEDIUM: {
    label: "Média",
    color: "text-warning-500 fill-warning-500",
    badgeColor:
      "text-warning-500 bg-warning-500/20 border-warning-500/40 fill-warning-500",
  },
  medium: {
    label: "Média",
    color: "text-warning-500 fill-warning-500",
    badgeColor:
      "text-warning-500 bg-warning-500/20 border-warning-500/40 fill-warning-500",
  },
  Low: {
    label: "Baixa",
    color: "text-success-500 fill-success-500",
    badgeColor:
      "text-success-500 bg-success-500/20 border-success-500/40 fill-success-500",
  },
  LOW: {
    label: "Baixa",
    color: "text-success-500 fill-success-500",
    badgeColor:
      "text-success-500 bg-success-500/20 border-success-500/40 fill-success-500",
  },
  low: {
    label: "Baixa",
    color: "text-success-500 fill-success-500",
    badgeColor:
      "text-success-500 bg-success-500/20 border-success-500/40 fill-success-500",
  },
  NONE: {
    label: "Nenhuma",
    color: "text-neutral-400 fill-transparent",
    badgeColor: "text-neutral-400 bg-white/5 border-white/10",
  },
  none: {
    label: "Nenhuma",
    color: "text-neutral-400 fill-transparent",
    badgeColor: "text-neutral-400 bg-white/5 border-white/10",
  },
};

/** Normaliza de forma segura valores de dificuldade de tarefas para o enum padrão. */
export function normalizeTaskDifficulty(
  diff?: string | null,
): TaskDifficultyOption {
  const upper = (diff || "MEDIUM").trim().toUpperCase();
  if (upper === "TRIVIAL") return "TRIVIAL";
  if (upper === "EASY" || upper === "LOW") return "EASY";
  if (upper === "MEDIUM" || upper === "NORMAL") return "MEDIUM";
  if (upper === "HARD" || upper === "HIGH") return "HARD";
  return "MEDIUM";
}

/** Estado de filtros padrão do quadro Kanban. */
export const DEFAULT_BOARD_FILTERS: BoardFilterState = {
  taskType: "all",
  difficulty: "all",
  status: "all",
  tag: null,
};

/** Opções de periodicidade de reset para Hábitos. */
export const HABIT_RESET_OPTIONS: readonly {
  id: ResetCounterOption;
  label: string;
}[] = [
  { id: "DAILY", label: "Diariamente" },
  { id: "WEEKLY", label: "Semanalmente" },
  { id: "MONTHLY", label: "Mensalmente" },
] as const;

/** Opções de repetição para Diárias (Daily). */
export const DAILY_REPEAT_OPTIONS: readonly {
  id: DailyRepeatTypeOption;
  label: string;
}[] = [
  { id: "DAILY", label: "Diariamente" },
  { id: "WEEKLY", label: "Semanalmente" },
  { id: "MONTHLY", label: "Mensalmente" },
  { id: "YEARLY", label: "Anualmente" },
] as const;

/** Opções de lembrete para Afazeres (ToDo). */
export const TODO_REMINDER_OPTIONS: readonly {
  id: ReminderTypeOption;
  label: string;
}[] = [
  { id: "NONE", label: "Nenhum" },
  { id: "ONE_DAY_EARLY", label: "1 dia antes" },
  { id: "TWO_DAYS_EARLY", label: "2 dias antes" },
  { id: "THREE_DAYS_EARLY", label: "3 dias antes" },
  { id: "ONE_WEEK_EARLY", label: "1 semana antes" },
] as const;

/** Opções de direção para Hábitos (Positivo / Negativo / Ambos). */
export const HABIT_DIRECTION_OPTIONS: readonly {
  id: HabitTypeOption;
  label: string;
}[] = [
  { id: "POSITIVE", label: "Positivo" },
  { id: "NEGATIVE", label: "Negativo" },
  { id: "BOTH", label: "+/- Ambos" },
] as const;

export {
  COLUMN_ICONS,
  type ColumnIconOption,
  getColumnIcon,
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  STATUS_FILTER_OPTIONS,
  TASK_TYPE_FILTER_OPTIONS,
} from "./routine";
