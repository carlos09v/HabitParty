import {
  Bold,
  Code,
  Highlighter,
  Italic,
  List,
  type LucideIcon,
} from "lucide-react";
import type {
  BoardFilterState,
  DailyDaysOfWeek,
  DailyRepeatMonthlyOption,
  DailyRepeatTypeOption,
  HabitImportanceOption,
  HabitTypeOption,
  ReminderTypeOption,
  ResetCounterOption,
  TaskDifficultyOption,
  TaskPriorityOption,
} from "@/types/task";
import type { FormatSyntax } from "@/types/task-ui";

const HABIT_IMPORTANCE_BORDER_STYLES = {
  LOW: "border-l-info hover:border-l-info-hover", // Azul claro
  NORMAL: "border-l-success-500 hover:border-l-success-hover", // Verde
  HIGH: "border-l-purple-600 hover:border-l-purple-700 dark:border-l-purple-400 dark:hover:border-l-purple-300", // Roxo Épico (diferenciado de atraso)
} as const;

/** Borda esquerda dos Hábitos baseada na Importância. */
export const HABIT_IMPORTANCE_BORDER: Record<string, string> = {
  ...HABIT_IMPORTANCE_BORDER_STYLES,
  // Aliases minúsculos para compatibilidade
  low: HABIT_IMPORTANCE_BORDER_STYLES.LOW,
  normal: HABIT_IMPORTANCE_BORDER_STYLES.NORMAL,
  high: HABIT_IMPORTANCE_BORDER_STYLES.HIGH,
};

const DIFFICULTY_BORDER_STYLES = {
  TRIVIAL: "border-l-info hover:border-l-info-hover", // Azul claro
  EASY: "border-l-success-500 hover:border-l-success-hover", // Verde
  MEDIUM: "border-l-warning-500 hover:border-l-warning-hover", // Laranja / Amarelo
  HARD: "border-l-purple-600 hover:border-l-purple-700 dark:border-l-purple-400 dark:hover:border-l-purple-300", // Roxo Épico (diferenciado de atraso)
} as const;

/** Borda esquerda de Diárias e Afazeres baseada na Dificuldade. */
export const DIFFICULTY_BORDER: Record<string, string> = {
  ...DIFFICULTY_BORDER_STYLES,
  // Aliases minúsculos e antigos para compatibilidade com Dashboard e forms
  trivial: DIFFICULTY_BORDER_STYLES.TRIVIAL,
  low: DIFFICULTY_BORDER_STYLES.EASY,
  easy: DIFFICULTY_BORDER_STYLES.EASY,
  normal: DIFFICULTY_BORDER_STYLES.MEDIUM,
  medium: DIFFICULTY_BORDER_STYLES.MEDIUM,
  high: DIFFICULTY_BORDER_STYLES.HARD,
  hard: DIFFICULTY_BORDER_STYLES.HARD,
};

const TASK_TYPE_META_ENTRIES = {
  HABIT: { label: "Hábito", color: "text-info bg-info/15 border-info/40" },
  DAILY: {
    label: "Diária",
    color:
      "text-magenta dark:text-fuchsia-300 bg-magenta/12 dark:bg-magenta/15 border-magenta/35 dark:border-magenta/40",
  },
  TODO: { label: "Afazer", color: "text-gold bg-gold/15 border-gold/40" },
} as const;

/** Rótulo e cor (alto contraste no fundo roxo) de cada tipo de tarefa. */
export const TASK_TYPE_META: Record<string, { label: string; color: string }> =
  {
    ...TASK_TYPE_META_ENTRIES,
    habit: TASK_TYPE_META_ENTRIES.HABIT,
    daily: TASK_TYPE_META_ENTRIES.DAILY,
    todo: TASK_TYPE_META_ENTRIES.TODO,
  };

/** Opções de filtro por Tipo de Tarefa (compatíveis com id e value para Select e botões). */
export const TASK_TYPE_FILTER_OPTIONS = [
  { id: "all", value: "all", label: "Todos os tipos" },
  { id: "HABIT", value: "HABIT", label: "Hábitos" },
  { id: "DAILY", value: "DAILY", label: "Diárias" },
  { id: "TODO", value: "TODO", label: "Afazeres" },
] as const;

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

/** Lista completa dos 7 dias da semana no formato de enum do backend. */
export const ALL_WEEK_DAYS: DailyDaysOfWeek[] = WEEK_DAYS.map(
  (d) => d.enumValue,
);

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
  { id: "SUNDAY", label: "Dom" },
  { id: "MONDAY", label: "Seg" },
  { id: "TUESDAY", label: "Ter" },
  { id: "WEDNESDAY", label: "Qua" },
  { id: "THURSDAY", label: "Qui" },
  { id: "FRIDAY", label: "Sex" },
  { id: "SATURDAY", label: "Sab" },
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

/** Descrições explicativas de cada nível de dificuldade no formulário de criação/edição. */
export const DIFFICULTY_DESCRIPTIONS: Record<TaskDifficultyOption, string> = {
  TRIVIAL: "Quase automática (ex: beber água, remédio).",
  EASY: "Baixa fricção (ex: e-mails, 10 min leitura).",
  MEDIUM: "Padrão: 30 a 60 min de esforço (ex: treino).",
  HARD: "Intensa de 1 a 2 horas (ex: estudo pesado, projeto).",
};

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

/** Chaves de prioridade normalizadas usadas nos dicionários de i18n. */
export type PriorityMessageKey = "NONE" | "LOW" | "MEDIUM" | "HIGH";

/**
 * Normaliza o valor de prioridade (o enum do backend usa `Low` em vez de `LOW`)
 * para a chave usada nos dicionários de tradução.
 */
export function toPriorityMessageKey(
  priority: string | null | undefined,
): PriorityMessageKey {
  const key = (priority ?? "NONE").toUpperCase();
  return key === "LOW" || key === "MEDIUM" || key === "HIGH" ? key : "NONE";
}

const TASK_DIFFICULTY_META_ENTRIES = {
  TRIVIAL: {
    label: "Trivial",
    color: "text-info",
    badgeColor: "text-info bg-info/15 border-info/40",
  },
  EASY: {
    label: "Fácil",
    color: "text-success-300 dark:text-success-500",
    badgeColor:
      "text-emerald-800 dark:text-success-500 bg-success-500/20 border-success-500/40",
  },
  MEDIUM: {
    label: "Médio",
    color: "text-warning-400 dark:text-warning-500",
    badgeColor:
      "text-orange-800 dark:text-warning-500 bg-warning-500/20 border-warning-500/40",
  },
  HARD: {
    label: "Difícil",
    color: "text-purple-700 dark:text-purple-400",
    badgeColor:
      "text-purple-700 dark:text-purple-300 bg-purple-500/15 dark:bg-purple-500/20 border-purple-500/35 dark:border-purple-500/40",
  },
} as const;

/** Metadados e cores de dificuldade de tarefas (Diárias e Afazeres). */
export const TASK_DIFFICULTY_META: Record<
  string,
  { label: string; color: string; badgeColor: string }
> = {
  ...TASK_DIFFICULTY_META_ENTRIES,
  trivial: TASK_DIFFICULTY_META_ENTRIES.TRIVIAL,
  easy: TASK_DIFFICULTY_META_ENTRIES.EASY,
  medium: TASK_DIFFICULTY_META_ENTRIES.MEDIUM,
  hard: TASK_DIFFICULTY_META_ENTRIES.HARD,
};

/** Cores de indicador em ponto (dot) por dificuldade (Modo Produtividade). */
export const DIFFICULTY_DOT_COLORS: Record<TaskDifficultyOption, string> = {
  TRIVIAL: "bg-info shadow-[0_0_6px_rgba(56,189,248,0.5)]",
  EASY: "bg-success-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
  MEDIUM: "bg-warning-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
  HARD: "bg-purple-600 dark:bg-purple-400 shadow-[0_0_6px_rgba(147,51,234,0.4)] dark:shadow-[0_0_6px_rgba(192,132,252,0.5)]",
};

/** Cores de ícone de espada por dificuldade (Modo Gamificado). */
export const DIFFICULTY_SWORD_COLORS: Record<TaskDifficultyOption, string> = {
  TRIVIAL: "text-info",
  EASY: "text-success-300 dark:text-success-500",
  MEDIUM: "text-warning-400 dark:text-warning-500",
  HARD: "text-purple-700 dark:text-purple-400",
};

const TASK_PRIORITY_META_ENTRIES = {
  HIGH: {
    label: "Alta",
    color:
      "text-danger-400 dark:text-danger-300 fill-danger-400 dark:fill-danger-300",
    badgeColor:
      "text-danger-300 bg-danger-500/15 dark:bg-danger-500/20 border-danger-500/35 dark:border-danger-400/40 fill-danger-300",
  },
  MEDIUM: {
    label: "Média",
    color:
      "text-warning-400 dark:text-warning-500 fill-warning-400 dark:fill-warning-500",
    badgeColor:
      "text-orange-800 dark:text-warning-500 bg-warning-500/20 border-warning-500/40 fill-orange-800 dark:fill-warning-500",
  },
  LOW: {
    label: "Baixa",
    color:
      "text-success-300 dark:text-success-500 fill-success-300 dark:fill-success-500",
    badgeColor:
      "text-emerald-800 dark:text-success-500 bg-success-500/20 border-success-500/40 fill-emerald-800 dark:fill-success-500",
  },
  NONE: {
    label: "Nenhuma",
    color: "text-neutral-400 fill-transparent",
    badgeColor: "text-neutral-400 bg-white/5 border-white/10",
  },
} as const;

/** Metadados e cores de prioridade de tarefas. */
export const TASK_PRIORITY_META: Record<
  string,
  { label: string; color: string; badgeColor: string }
> = {
  ...TASK_PRIORITY_META_ENTRIES,
  high: TASK_PRIORITY_META_ENTRIES.HIGH,
  medium: TASK_PRIORITY_META_ENTRIES.MEDIUM,
  Low: TASK_PRIORITY_META_ENTRIES.LOW,
  low: TASK_PRIORITY_META_ENTRIES.LOW,
  none: TASK_PRIORITY_META_ENTRIES.NONE,
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

/** Recompensas base por Dificuldade (ToDo e Daily) alinhadas com o backend. */
export const DIFFICULTY_REWARDS = {
  TRIVIAL: { xp: 2, gold: 0.25 },
  EASY: { xp: 5, gold: 0.75 },
  MEDIUM: { xp: 15, gold: 2.5 },
  HARD: { xp: 30, gold: 5.0 },
} as const;

/** Recompensas base por Importância (Habit) alinhadas com o backend. */
export const HABIT_IMPORTANCE_REWARDS = {
  LOW: { xp: 5, gold: 0.75 },
  NORMAL: { xp: 10, gold: 1.75 },
  HIGH: { xp: 25, gold: 3.75 },
} as const;

/** Estado de filtros padrão do quadro Kanban. */
export const DEFAULT_BOARD_FILTERS: BoardFilterState = {
  taskType: "all",
  difficulty: "all",
  priority: "all",
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

/** Opções de regra de repetição mensal para Diárias (Daily). */
export const DAILY_MONTHLY_OPTIONS: readonly {
  id: DailyRepeatMonthlyOption;
  label: string;
}[] = [
  { id: "DAY_OF_THE_MONTH", label: "No dia do mês" },
  { id: "DAY_OF_THE_WEEK", label: "No dia da semana" },
] as const;

/** Opções de lembrete para Afazeres (ToDo). */
export type StandardReminderTypeOption = Exclude<ReminderTypeOption, "CUSTOM">;

export const TODO_REMINDER_OPTIONS: readonly {
  id: StandardReminderTypeOption;
  label: string;
}[] = [
  { id: "NONE", label: "Nenhum" },
  { id: "ONE_DAY_EARLY", label: "1 dia antes" },
  { id: "TWO_DAYS_EARLY", label: "2 dias antes" },
  { id: "THREE_DAYS_EARLY", label: "3 dias antes" },
  { id: "ONE_WEEK_EARLY", label: "1 semana antes" },
] as const;

/** Janela em dias de antecedência para cada tipo de lembrete de Afazer (ToDo). */
export const REMINDER_OFFSET_DAYS: Readonly<Record<string, number>> = {
  ONE_DAY_EARLY: 1,
  TWO_DAYS_EARLY: 2,
  THREE_DAYS_EARLY: 3,
  ONE_WEEK_EARLY: 7,
  CUSTOM: 1,
} as const;

/** Pesos numéricos de importância para Hábitos */
export const HABIT_IMPORTANCE_META: Record<
  HabitImportanceOption,
  { color: string; dotColor: string; activeClass: string }
> = {
  LOW: {
    color: "text-info",
    dotColor: "bg-info",
    activeClass:
      "bg-sky-500/10 border-sky-500/40 text-sky-700 dark:bg-info/15 dark:border-info/50 dark:text-info font-bold",
  },
  NORMAL: {
    color: "text-success-500",
    dotColor: "bg-success-500",
    activeClass:
      "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:bg-success-500/15 dark:border-success-500/50 dark:text-success-500 font-bold",
  },
  HIGH: {
    color: "text-purple-700 dark:text-purple-400",
    dotColor: "bg-purple-600 dark:bg-purple-400",
    activeClass:
      "bg-purple-500/10 border-purple-500/40 text-purple-700 dark:bg-purple-500/15 dark:border-purple-400/50 dark:text-purple-300 font-bold",
  },
};

export const HABIT_DIRECTION_OPTIONS: readonly {
  id: HabitTypeOption;
  label: string;
}[] = [
  { id: "POSITIVE", label: "Positivo" },
  { id: "NEGATIVE", label: "Negativo" },
  { id: "BOTH", label: "+/- Ambos" },
] as const;

/** Limite máximo de caracteres do título de uma tarefa (espelha o @Size do backend). */
export const TASK_TITLE_MAX_LENGTH = 50;

/** Limite máximo de tags permitidas por tarefa */
export const MAX_TASK_TAGS = 5;

/** Limite máximo de caracteres da descrição de uma tarefa (espelha o @Size do backend). */
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

/** Fração do limite a partir da qual o contador de caracteres da descrição passa a ser exibido. */
export const TASK_DESCRIPTION_COUNTER_THRESHOLD = 0.8;

/** Tamanho máximo em caracteres de um único nível de tag */
export const MAX_TAG_LENGTH = 25;

/** Tamanho máximo em caracteres de um único nível de tag (alias semântico) */
export const MAX_TAG_SEGMENT_LENGTH = MAX_TAG_LENGTH;

/** Tamanho máximo em caracteres do caminho completo de uma tag (incluindo " > ") */
export const MAX_TAG_PATH_LENGTH = 80;

/** Separador canônico para tags hierárquicas (estilo TickTick) */
export const TAG_HIERARCHY_SEPARATOR = " > ";

/** Dias úteis (Segunda a Sexta) para seletores rápidos de tarefas diárias */
export const WEEKDAYS_ONLY: readonly DailyDaysOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

/** Pesos numéricos de dificuldade para ordenação de tarefas */
export const DIFFICULTY_SORT_WEIGHTS: Readonly<Record<string, number>> = {
  HARD: 4,
  MEDIUM: 3,
  EASY: 2,
  TRIVIAL: 1,
  hard: 4,
  medium: 3,
  easy: 2,
  trivial: 1,
};

/** Pesos numéricos de prioridade para ordenação de tarefas */
export const PRIORITY_SORT_WEIGHTS: Readonly<Record<string, number>> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  Low: 1,
  NONE: 0,
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

/**
 * Template de colunas CSS Grid compartilhado entre TaskTable, RoutineTaskList e TaskRow.
 * Usa larguras fixas para Tipo, Prioridade e Ações para que cabeçalho e linhas com
 * diferentes controles/badges mantenham exatamente o mesmo alinhamento vertical.
 */
export const TASK_TABLE_GRID_COLS =
  "grid-cols-[minmax(0,1fr)_5.25rem_4.25rem] @lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_5.75rem_4.75rem_4.25rem] @2xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.1fr)_6.25rem_4.75rem_minmax(9rem,0.9fr)_4.25rem]";

/** Dimensões padrão de ancoragem para o TaskDetailsPopover */
export const TASK_DETAILS_POPOVER_OPTIONS = {
  popoverWidth: 390,
  popoverHeight: 420,
} as const;

/** Opções de formatação Markdown rápida para descrição da tarefa */
export const MARKDOWN_FORMAT_OPTIONS: ReadonlyArray<{
  syntax: FormatSyntax;
  label: string;
  hint: string;
  icon: LucideIcon;
  iconColorClass: string;
  labelClass?: string;
}> = [
  {
    syntax: "bold",
    label: "Negrito",
    hint: "**b**",
    icon: Bold,
    iconColorClass: "text-gold",
    labelClass: "font-semibold",
  },
  {
    syntax: "italic",
    label: "Itálico",
    hint: "*i*",
    icon: Italic,
    iconColorClass: "text-info",
    labelClass: "italic",
  },
  {
    syntax: "highlight",
    label: "Destacar",
    hint: "==txt==",
    icon: Highlighter,
    iconColorClass: "text-warning-500",
  },
  {
    syntax: "bullet",
    label: "Lista",
    hint: "•",
    icon: List,
    iconColorClass: "text-primary-light",
  },
  {
    syntax: "code",
    label: "Código",
    hint: "`code`",
    icon: Code,
    iconColorClass: "text-magenta dark:text-fuchsia-300",
    labelClass: "font-mono text-label-g",
  },
] as const;

/** Limite diário de registros positivos por hábito que concedem XP/Ouro (espelha Habit.MAX_DAILY_REWARDED_SCORES). */
export const MAX_DAILY_REWARDED_HABIT_SCORES = 8;

/** Cooldown mínimo no cliente para evitar cliques duplos / rajadas acidentais nos botões +/- de hábitos. */
export const HABIT_SCORE_COOLDOWN_MS = 450;
