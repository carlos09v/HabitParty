export type TaskType = "habit" | "daily" | "todo";

export type HabitImportance = "low" | "normal" | "high";
export type TaskDifficulty = "trivial" | "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: TaskType;
  difficulty?: TaskDifficulty; // Para diárias e afazeres
  importance?: HabitImportance; // Exclusivo para hábitos: low (azul claro), normal (verde), high (vermelho)
  rewardXp: number;
  rewardGold: number;
  completed: boolean;
  streak?: number; // Contagem de ofensiva em dias (Hábitos e Diárias apenas)
  positiveCount?: number; // Para hábitos: contagem de ações positivas (+)
  negativeCount?: number; // Para hábitos: contagem de ações negativas (-)
  daysOfWeek?: number[]; // [0, 1, 2, 3, 4, 5, 6] (D, S, T, Q, Q, S, S)
  dueDate?: string;
  columnId?: string; // ID da coluna do quadro
  order?: number; // Posição/ordem na coluna
}

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}
