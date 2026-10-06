import { normalizeTaskDifficulty, normalizeTaskType } from "@/constants/task";
import type {
  BoardColumn,
  BoardColumnResponseDTO,
  DashboardTaskDTO,
  HabitImportance,
  HabitImportanceOption,
  Task,
  TaskPriorityOption,
  TaskResponseDTO,
  TaskType,
  UpdateTaskDTO,
} from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";

const IMPORTANCE_MAP: Record<string, HabitImportance> = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  low: "low",
  normal: "normal",
  high: "high",
};

const PRIORITY_MAP: Record<string, HabitImportance> = {
  Low: "low",
  MEDIUM: "normal",
  HIGH: "high",
  NONE: "normal",
  low: "low",
  normal: "normal",
  high: "high",
};

/**
 * Mapeia o DTO do backend para a entidade Task da UI no Kanban.
 */
export function mapTaskResponseToTask(
  taskDto: TaskResponseDTO,
  columnId: string,
): Task {
  const normalizedDifficulty = taskDto.difficulty
    ? normalizeTaskDifficulty(taskDto.difficulty)
    : undefined;

  const normalizedImportance = taskDto.importanceType
    ? IMPORTANCE_MAP[taskDto.importanceType]
    : taskDto.priority
      ? PRIORITY_MAP[taskDto.priority]
      : undefined;

  const tags = taskDto.tags || [];

  return {
    id: taskDto.id || "",
    title: taskDto.name || "",
    description: taskDto.description || undefined,
    // Categoria só é preenchida se houver tag real - sem fallback 'Geral' fantasma
    category: tags.length > 0 ? tags[0] : undefined,
    tags,
    type: (taskDto.taskType?.toLowerCase() as TaskType) || "todo",
    difficulty: normalizedDifficulty,
    importance: normalizedImportance,
    rewardXp: 10,
    rewardGold: 1.5,
    completed: taskDto.status === "COMPLETED",
    streak:
      (taskDto.taskType?.toLowerCase() as TaskType) === "todo"
        ? undefined
        : (taskDto.currentStreak ?? 0),
    positiveCount: 0,
    negativeCount: 0,
    dueDate: taskDto.dueDate,
    habitType: taskDto.habitType,
    resetCounter: taskDto.resetCounter,
    importanceType: taskDto.importanceType,
    startDate: taskDto.startDate,
    repeatType: taskDto.repeatType,
    repeatEvery: taskDto.repeatEvery,
    daysOfWeek: taskDto.daysOfWeek,
    priority: taskDto.priority,
    reminderType: taskDto.reminderType,
    isHardcoreModeEnabled: taskDto.isHardcoreModeEnabled,
    columnId: columnId,
    order: taskDto.orderIndex || 0,
    checklist: taskDto.checklist || [],
  };
}

/**
 * Mapeia o Workspace retornado do backend para a lista de colunas do Kanban com tarefas.
 */
export function mapWorkspaceToBoardColumns(
  workspace: WorkspaceResponseDTO,
): BoardColumn[] {
  if (!workspace.columns) return [];

  return workspace.columns.map((col: BoardColumnResponseDTO) => ({
    id: col.id || "",
    title: col.name || "",
    order: col.orderIndex || 0,
    icon: col.icon || "sun",
    tasks: (col.tasks || []).map((t) => mapTaskResponseToTask(t, col.id || "")),
  }));
}

/**
 * Mapeia o DTO de tarefas do Dashboard para o modelo Task da UI.
 */
export function mapDashboardTaskToTask(dto: DashboardTaskDTO): Task {
  const taskType = (dto.taskType?.toLowerCase() as TaskType) || "todo";
  return {
    id: dto.id || "",
    title: dto.name || "",
    type: taskType,
    category: dto.columnName || undefined,
    tags: dto.columnName ? [dto.columnName] : [],
    dueDate: dto.dueDate,
    daysOfWeek: dto.daysOfWeek,
    isHardcoreModeEnabled: dto.isHardcoreModeEnabled,
    completed: false,
    rewardXp: 10,
    rewardGold: 1.5,
  };
}

/**
 * Constrói o payload completo de UpdateTaskDTO a partir da entidade Task,
 * garantindo que campos primitivos obrigatórios pelo Jackson (como isHardcoreModeEnabled)
 * e propriedades existentes da tarefa não sejam omitidos ou enviados como null.
 */
export function buildUpdateTaskPayload(
  task: Task,
  overrides?: Partial<Task>,
): UpdateTaskDTO {
  const merged: Task = { ...task, ...overrides };
  const taskType = normalizeTaskType(merged);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";

  const priority = (merged.priority as TaskPriorityOption) || "MEDIUM";
  const difficulty = normalizeTaskDifficulty(merged.difficulty);

  const payload: UpdateTaskDTO = {
    name: merged.title,
    description: merged.description?.trim() || undefined,
    isHardcoreModeEnabled: Boolean(merged.isHardcoreModeEnabled),
    priority,
    difficulty,
    tags: merged.tags && merged.tags.length > 0 ? merged.tags : undefined,
    dueDate: !isHabit && !isDaily ? merged.dueDate || undefined : undefined,
    ...(isHabit && {
      habitType: merged.habitType || "POSITIVE",
      resetCounter: merged.resetCounter || "DAILY",
      importanceType: (merged.importanceType ||
        (merged.importance
          ? merged.importance.toUpperCase()
          : "NORMAL")) as HabitImportanceOption,
    }),
    ...(isDaily && {
      startDate: merged.startDate || undefined,
      repeatType: merged.repeatType || "DAILY",
      repeatEvery: merged.repeatEvery || 1,
      daysOfWeek: merged.daysOfWeek || [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
      ],
    }),
    ...(!isHabit &&
      !isDaily && {
        reminderType: merged.reminderType || "NONE",
      }),
  };

  return payload;
}
