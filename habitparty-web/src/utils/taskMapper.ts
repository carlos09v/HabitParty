import {
  ALL_WEEK_DAYS,
  MAX_TAG_LENGTH,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import type {
  BoardColumn,
  BoardColumnResponseDTO,
  CreateTaskDTO,
  HabitImportance,
  HabitImportanceOption,
  Task,
  TaskPriorityOption,
  TaskResponseDTO,
  TaskType,
  TaskTypeOption,
  UpdateTaskDTO,
} from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { getTodayDateString } from "./date";
import { calculateTaskReward } from "./economy";

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

  const reward = calculateTaskReward({
    taskType: taskDto.taskType,
    difficulty: taskDto.difficulty,
    importanceType: taskDto.importanceType,
    currentStreak: taskDto.currentStreak,
    repeatType: taskDto.repeatType,
    resetCounter: taskDto.resetCounter,
    isHardcoreModeEnabled: taskDto.isHardcoreModeEnabled,
    dueDate: taskDto.dueDate,
    isPenaltyApplied: (taskDto as { isPenaltyApplied?: boolean })
      .isPenaltyApplied,
  });

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
    rewardXp: reward.xp,
    rewardGold: reward.gold,
    completed: taskDto.status === "COMPLETED",
    streak:
      (taskDto.taskType?.toLowerCase() as TaskType) === "todo"
        ? undefined
        : (taskDto.currentStreak ?? 0),
    positiveCount:
      (taskDto.taskType?.toLowerCase() as TaskType) === "habit"
        ? (taskDto.positiveCount ?? 0)
        : 0,
    negativeCount:
      (taskDto.taskType?.toLowerCase() as TaskType) === "habit"
        ? (taskDto.negativeCount ?? 0)
        : 0,
    dueDate: taskDto.dueDate,
    habitType: taskDto.habitType,
    resetCounter: taskDto.resetCounter,
    importanceType: taskDto.importanceType,
    startDate: taskDto.startDate,
    repeatType: taskDto.repeatType,
    repeatEvery: taskDto.repeatEvery,
    daysOfWeek: taskDto.daysOfWeek,
    monthlyOption: taskDto.monthlyOption,
    priority: taskDto.priority,
    reminderType: taskDto.reminderType,
    sendEmailReminder: (taskDto as { sendEmailReminder?: boolean })
      .sendEmailReminder,
    emailReminderSent: (taskDto as { emailReminderSent?: boolean })
      .emailReminderSent,
    isHardcoreModeEnabled: taskDto.isHardcoreModeEnabled,
    isPenaltyApplied: (taskDto as { isPenaltyApplied?: boolean })
      .isPenaltyApplied,
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
      ...(merged.repeatType === "WEEKLY" && {
        daysOfWeek:
          merged.daysOfWeek && merged.daysOfWeek.length > 0
            ? merged.daysOfWeek
            : [...ALL_WEEK_DAYS],
      }),
      ...(merged.repeatType === "MONTHLY" && {
        monthlyOption: merged.monthlyOption || "DAY_OF_THE_MONTH",
      }),
    }),
    ...(!isHabit &&
      !isDaily && {
        reminderType: merged.reminderType || "NONE",
        sendEmailReminder: Boolean(merged.sendEmailReminder),
      }),
  };

  return payload;
}

/**
 * Constrói o CreateTaskDTO a partir de uma entidade Task existente (ex: para duplicação ou conversão).
 */
export function buildCreateTaskPayloadFromTask(task: Task): CreateTaskDTO {
  const resolvedType = normalizeTaskType(task);
  const isHabit = resolvedType === "habit";
  const isDaily = resolvedType === "daily";
  const isTodo = resolvedType === "todo";

  return {
    name: task.title,
    description: task.description?.trim() || undefined,
    taskType: (resolvedType.toUpperCase() as TaskTypeOption) || "TODO",
    isHardcoreModeEnabled: Boolean(task.isHardcoreModeEnabled),
    tags: task.tags && task.tags.length > 0 ? task.tags : undefined,
    difficulty: normalizeTaskDifficulty(task.difficulty),
    ...(isHabit && {
      habitType: task.habitType || "POSITIVE",
      resetCounter: task.resetCounter || "DAILY",
      importanceType: task.importanceType || "NORMAL",
    }),
    ...(isDaily && {
      startDate: task.startDate || undefined,
      repeatType: task.repeatType || "DAILY",
      repeatEvery: task.repeatEvery || 1,
      ...(task.repeatType === "WEEKLY" && {
        daysOfWeek:
          task.daysOfWeek && task.daysOfWeek.length > 0
            ? task.daysOfWeek
            : [...ALL_WEEK_DAYS],
      }),
      ...(task.repeatType === "MONTHLY" && {
        monthlyOption: task.monthlyOption || "DAY_OF_THE_MONTH",
      }),
    }),
    ...(isTodo && {
      priority: (task.priority as TaskPriorityOption) || "MEDIUM",
      dueDate: task.dueDate || undefined,
      reminderType: task.reminderType || "NONE",
      sendEmailReminder: Boolean(task.sendEmailReminder),
    }),
  };
}

/**
 * Calcula o próximo estado de contadores e ofensiva de um hábito ao receber um incremento ou decremento.
 */
export function computeOptimisticHabitDelta(
  task: Task,
  delta: number,
): Pick<Task, "positiveCount" | "negativeCount" | "streak" | "completed"> {
  const currentPositive = task.positiveCount ?? 0;
  const nextPositive = delta > 0 ? currentPositive + delta : currentPositive;
  const nextNegative =
    delta < 0
      ? (task.negativeCount ?? 0) + Math.abs(delta)
      : (task.negativeCount ?? 0);
  // Ofensiva (streak) só sobe 1 vez no primeiro clique positivo do dia
  const nextStreak =
    delta > 0 && currentPositive === 0
      ? (task.streak ?? 0) + 1
      : (task.streak ?? 0);

  return {
    positiveCount: nextPositive,
    negativeCount: nextNegative,
    streak: nextStreak,
    completed: true,
  };
}

/**
 * Realiza o parsing e sanitização de tags separadas por vírgula, limitando o tamanho
 * individual e deduplicando sem distinção entre maiúsculas e minúsculas.
 */
export function parseTaskTags(tagsInput: string): string[] {
  if (!tagsInput || !tagsInput.trim()) return [];

  const rawTags = tagsInput
    .split(",")
    .map((t) => t.trim().slice(0, MAX_TAG_LENGTH))
    .filter(Boolean);

  return Array.from(new Map(rawTags.map((t) => [t.toLowerCase(), t])).values());
}

/**
 * Constrói de forma unificada o payload de criação e a entidade otimista de Task
 * para o Quick Create (Kanban inline e atalhos rápidos).
 */
export function buildQuickCreateTaskPayload(
  title: string,
  targetColumnId: string,
  taskType: TaskTypeOption = "TODO",
  extraPayload?: Partial<CreateTaskDTO>,
  tempId = `temp-${Date.now()}`,
): { payload: CreateTaskDTO; optimisticTask: Task } {
  const effectiveType = (taskType.toUpperCase() as TaskTypeOption) || "TODO";

  if (effectiveType === "HABIT") {
    const habitType = extraPayload?.habitType || "POSITIVE";
    const resetCounter = extraPayload?.resetCounter || "DAILY";
    const importanceType = extraPayload?.importanceType || "NORMAL";

    return {
      payload: {
        name: title,
        taskType: "HABIT",
        habitType,
        resetCounter,
        importanceType,
        priority: "MEDIUM",
        difficulty: "EASY",
        isHardcoreModeEnabled: false,
      },
      optimisticTask: {
        id: tempId,
        title,
        columnId: targetColumnId,
        completed: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        type: "HABIT",
        habitType,
        resetCounter,
        importanceType,
        priority: "MEDIUM",
        difficulty: "EASY",
        isHardcoreModeEnabled: false,
        order: 0,
      },
    };
  }

  if (effectiveType === "DAILY") {
    const startDate = extraPayload?.startDate || getTodayDateString();
    const repeatType = extraPayload?.repeatType || "DAILY";
    const repeatEvery = extraPayload?.repeatEvery || 1;
    const daysOfWeek = extraPayload?.daysOfWeek || ALL_WEEK_DAYS;
    const monthlyOption = extraPayload?.monthlyOption || "DAY_OF_THE_MONTH";

    return {
      payload: {
        name: title,
        taskType: "DAILY",
        startDate,
        repeatType,
        repeatEvery,
        ...(repeatType === "WEEKLY" && { daysOfWeek }),
        ...(repeatType === "MONTHLY" && { monthlyOption }),
        priority: "MEDIUM",
        difficulty: "MEDIUM",
        isHardcoreModeEnabled: false,
      },
      optimisticTask: {
        id: tempId,
        title,
        columnId: targetColumnId,
        completed: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        type: "DAILY",
        startDate,
        repeatType,
        repeatEvery,
        daysOfWeek: repeatType === "WEEKLY" ? daysOfWeek : undefined,
        monthlyOption: repeatType === "MONTHLY" ? monthlyOption : undefined,
        priority: "MEDIUM",
        difficulty: "MEDIUM",
        isHardcoreModeEnabled: false,
        order: 0,
      },
    };
  }

  return {
    payload: {
      name: title,
      taskType: "TODO",
      priority: "MEDIUM",
      difficulty: "MEDIUM",
      isHardcoreModeEnabled: false,
      reminderType: "NONE",
    },
    optimisticTask: {
      id: tempId,
      title,
      columnId: targetColumnId,
      completed: false,
      streak: 0,
      positiveCount: 0,
      negativeCount: 0,
      type: "TODO",
      priority: "MEDIUM",
      difficulty: "MEDIUM",
      isHardcoreModeEnabled: false,
      reminderType: "NONE",
      order: 0,
    },
  };
}
