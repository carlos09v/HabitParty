import type {
  HabitImportance,
  Task,
  TaskDifficulty,
  TaskType,
} from "@/types/task";

/** Borda esquerda dos Hábitos baseada na Importância. */
export const HABIT_IMPORTANCE_BORDER: Record<HabitImportance, string> = {
  low: "border-l-info hover:border-l-info-hover", // Azul claro
  normal: "border-l-success-500 hover:border-l-success-hover", // Verde
  high: "border-l-danger-500 hover:border-l-danger-hover", // Vermelho
};

/** Borda esquerda de Diárias e Afazeres baseada na Dificuldade. */
export const DIFFICULTY_BORDER: Record<TaskDifficulty, string> = {
  trivial: "border-l-info hover:border-l-info-hover", // Azul claro
  low: "border-l-success-500 hover:border-l-success-hover", // Verde
  normal: "border-l-warning-500 hover:border-l-warning-hover", // Laranja
  high: "border-l-danger-500 hover:border-l-danger-hover", // Vermelho
};

/** Rótulo e cor (alto contraste no fundo roxo) de cada tipo de tarefa. */
export const TASK_TYPE_META: Record<TaskType, { label: string; color: string }> =
  {
    habit: { label: "Hábito", color: "text-info bg-info/15 border-info/40" },
    daily: {
      label: "Diária",
      color: "text-magenta bg-magenta/15 border-magenta/40",
    },
    todo: { label: "Afazer", color: "text-gold bg-gold/15 border-gold/40" },
  };

/** Iniciais dos dias da semana (índice 0 = Domingo). */
export const DAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

/** Hábito usa `importance`; Diária e Afazer usam `difficulty`. */
export function getTaskBorderClass(task: Task): string {
  return task.type === "habit"
    ? HABIT_IMPORTANCE_BORDER[task.importance ?? "normal"]
    : DIFFICULTY_BORDER[task.difficulty ?? "normal"];
}
