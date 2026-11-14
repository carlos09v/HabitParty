import {
  ALL_WEEK_DAYS,
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
import {
  getDatePartsInTimeZone,
  getTodayDateString,
  parseServerDate,
} from "./date";
import { calculateTaskReward } from "./economy";
import { normalizeTagPath } from "./tags";

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
  timeZone?: string | null,
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
    isPenaltyApplied: taskDto.isPenaltyApplied,
    timeZone,
  });

  const isCompleted = taskDto.status === "COMPLETED";

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
    completed: isCompleted,
    hasClaimedReward: Boolean(taskDto.isRewardClaimed || isCompleted),
    lastCompletedAt: taskDto.lastCompletedAt,
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
    dueTime: taskDto.dueTime ? taskDto.dueTime.slice(0, 5) : undefined,
    startTime: taskDto.startTime ? taskDto.startTime.slice(0, 5) : undefined,
    dueEndTime: taskDto.dueEndTime ? taskDto.dueEndTime.slice(0, 5) : undefined,
    isAllDay: Boolean(taskDto.isAllDay),
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
    sendEmailReminder: taskDto.sendEmailReminder,
    emailReminderSent: taskDto.emailReminderSent,
    isHardcoreModeEnabled: taskDto.isHardcoreModeEnabled,
    isPenaltyApplied: taskDto.isPenaltyApplied,
    totalFocusMinutes: taskDto.totalFocusMinutes ?? 0,
    focusCyclesCount: taskDto.focusCyclesCount ?? 0,
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
  timeZone?: string | null,
): BoardColumn[] {
  if (!workspace.columns) return [];

  return workspace.columns.map((col: BoardColumnResponseDTO) => ({
    id: col.id || "",
    title: col.name || "",
    order: col.orderIndex || 0,
    icon: col.icon || "sun",
    tasks: (col.tasks || []).map((t) =>
      mapTaskResponseToTask(t, col.id || "", timeZone),
    ),
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
  timeZone?: string | null,
): UpdateTaskDTO {
  const merged: Task = { ...task, ...overrides };
  const taskType = normalizeTaskType(merged);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";

  const priority = (merged.priority as TaskPriorityOption) || "NONE";
  const difficulty = normalizeTaskDifficulty(merged.difficulty);
  const isTodo = !isHabit && !isDaily;
  const resolvedIsAllDay = isTodo && Boolean(merged.isAllDay);
  const resolvedStartTime =
    isTodo && !resolvedIsAllDay && merged.startTime
      ? merged.startTime.slice(0, 5)
      : undefined;
  const rawDueEndTime =
    isTodo && !resolvedIsAllDay && merged.dueEndTime
      ? merged.dueEndTime.slice(0, 5)
      : undefined;
  const resolvedDueTime =
    isTodo && !resolvedIsAllDay && !resolvedStartTime && merged.dueTime
      ? merged.dueTime.slice(0, 5)
      : undefined;
  const effectiveStartForEnd = resolvedStartTime || resolvedDueTime;
  const resolvedDueEndTime =
    effectiveStartForEnd &&
    rawDueEndTime &&
    rawDueEndTime > effectiveStartForEnd
      ? rawDueEndTime
      : undefined;
  const hasAnyTimeOrEvent = Boolean(
    resolvedDueTime || resolvedStartTime || resolvedIsAllDay,
  );
  const resolvedDueDate = isTodo
    ? merged.dueDate ||
      (hasAnyTimeOrEvent ? getTodayDateString(new Date(), timeZone) : undefined)
    : undefined;

  const payload: UpdateTaskDTO = {
    name: merged.title,
    description: merged.description?.trim() || undefined,
    isHardcoreModeEnabled: Boolean(merged.isHardcoreModeEnabled),
    priority,
    difficulty,
    tags: merged.tags && merged.tags.length > 0 ? merged.tags : undefined,
    dueDate: resolvedDueDate,
    dueTime: resolvedDueDate ? resolvedDueTime : undefined,
    startTime: resolvedDueDate ? resolvedStartTime : undefined,
    dueEndTime: resolvedDueDate ? resolvedDueEndTime : undefined,
    isAllDay: resolvedDueDate ? resolvedIsAllDay : false,
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
export function buildCreateTaskPayloadFromTask(
  task: Task,
  timeZone?: string | null,
): CreateTaskDTO {
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
      priority: (task.priority as TaskPriorityOption) || "NONE",
      dueDate:
        task.dueDate ||
        (task.dueTime || task.startTime || task.isAllDay
          ? getTodayDateString(new Date(), timeZone)
          : undefined),
      dueTime:
        !task.isAllDay && !task.startTime && task.dueTime
          ? task.dueTime.slice(0, 5)
          : undefined,
      startTime:
        !task.isAllDay && task.startTime
          ? task.startTime.slice(0, 5)
          : undefined,
      dueEndTime:
        !task.isAllDay &&
        (task.startTime || task.dueTime) &&
        task.dueEndTime &&
        task.dueEndTime.slice(0, 5) >
          (task.startTime || task.dueTime || "").slice(0, 5)
          ? task.dueEndTime.slice(0, 5)
          : undefined,
      isAllDay: Boolean(task.isAllDay),
      reminderType: task.reminderType || "NONE",
      sendEmailReminder: Boolean(task.sendEmailReminder),
    }),
  };
}

function getIsoWeekInfo(
  date: Date,
  timeZone?: string | null,
): { year: number; week: number } {
  const parts = getDatePartsInTimeZone(date, timeZone);
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return { year: utc.getUTCFullYear(), week };
}

function isHabitStreakActiveForDelta(
  task: Task,
  now: Date,
  timeZone?: string | null,
): boolean {
  if (!(task.streak && task.streak > 0)) {
    return false;
  }
  if (!task.lastCompletedAt) {
    return true;
  }
  const lastDate = parseServerDate(task.lastCompletedAt);
  if (!lastDate) {
    return true;
  }

  const counter = (task.resetCounter || "DAILY").toUpperCase();
  if (counter === "WEEKLY") {
    const last = getIsoWeekInfo(lastDate, timeZone);
    const curr = getIsoWeekInfo(now, timeZone);
    if (
      last.year > curr.year ||
      (last.year === curr.year && last.week >= curr.week)
    ) {
      return true;
    }
    const nextWeekDate = new Date(lastDate.getTime() + 7 * 86_400_000);
    const nextWeek = getIsoWeekInfo(nextWeekDate, timeZone);
    return nextWeek.year === curr.year && nextWeek.week === curr.week;
  }
  if (counter === "MONTHLY") {
    const nowParts = getDatePartsInTimeZone(now, timeZone);
    const lastParts = getDatePartsInTimeZone(lastDate, timeZone);
    const monthsDiff =
      (nowParts.year - lastParts.year) * 12 +
      (nowParts.month - lastParts.month);
    return monthsDiff <= 1;
  }

  const lastParts = getDatePartsInTimeZone(lastDate, timeZone);
  const nowParts = getDatePartsInTimeZone(now, timeZone);
  const lastUtc = Date.UTC(lastParts.year, lastParts.month - 1, lastParts.day);
  const todayUtc = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const diffDays = Math.round((todayUtc - lastUtc) / 86_400_000);
  return diffDays <= 1;
}

/**
 * Calcula o próximo estado de contadores e ofensiva de um hábito ao receber um incremento ou decremento.
 */
export function computeOptimisticHabitDelta(
  task: Task,
  delta: number,
  timeZone?: string | null,
): Pick<
  Task,
  "positiveCount" | "negativeCount" | "streak" | "completed" | "lastCompletedAt"
> {
  const currentPositive = task.positiveCount ?? 0;
  const nextPositive = delta > 0 ? currentPositive + delta : currentPositive;
  const nextNegative =
    delta < 0
      ? (task.negativeCount ?? 0) + Math.abs(delta)
      : (task.negativeCount ?? 0);

  const now = new Date();
  const todayIso = getTodayDateString(now, timeZone);
  const parsedLast = task.lastCompletedAt
    ? parseServerDate(task.lastCompletedAt)
    : null;
  const lastIso = parsedLast ? getTodayDateString(parsedLast, timeZone) : null;

  let nextStreak = task.streak ?? 0;
  if (delta > 0 && currentPositive === 0) {
    if (lastIso === todayIso && nextStreak > 0) {
      nextStreak = task.streak ?? 1;
    } else if (isHabitStreakActiveForDelta(task, now, timeZone)) {
      nextStreak = (task.streak ?? 0) + 1;
    } else {
      nextStreak = 1;
    }
  }

  return {
    positiveCount: nextPositive,
    negativeCount: nextNegative,
    streak: nextStreak,
    completed: delta > 0 ? true : Boolean(task.completed),
    lastCompletedAt: delta > 0 ? now.toISOString() : task.lastCompletedAt,
  };
}

/**
 * Reconcilia uma Task local com o DTO autorizado retornado pelo backend após uma mutação.
 */
export function mergeTaskWithResponseDTO(
  task: Task,
  dto: TaskResponseDTO,
): Task {
  const isCompleted = dto.status === "COMPLETED";
  return {
    ...task,
    completed: isCompleted,
    hasClaimedReward: Boolean(dto.isRewardClaimed || isCompleted),
    positiveCount: dto.positiveCount ?? task.positiveCount,
    negativeCount: dto.negativeCount ?? task.negativeCount,
    streak: dto.currentStreak !== undefined ? dto.currentStreak : task.streak,
    currentStreak:
      dto.currentStreak !== undefined ? dto.currentStreak : task.currentStreak,
    lastCompletedAt: dto.lastCompletedAt ?? task.lastCompletedAt,
    isPenaltyApplied: dto.isPenaltyApplied ?? task.isPenaltyApplied,
  };
}

/**
 * Realiza o parsing e sanitização de tags separadas por vírgula (,) ou ponto e vírgula (;),
 * limitando o tamanho individual e deduplicando sem distinção entre maiúsculas e minúsculas.
 */
export function parseTaskTags(tagsInput: string): string[] {
  if (!tagsInput || !tagsInput.trim()) return [];

  const rawTags = tagsInput
    .split(/[,;]+/)
    .map((t) => normalizeTagPath(t))
    .filter(Boolean);

  return Array.from(new Map(rawTags.map((t) => [t.toLowerCase(), t])).values());
}

/**
 * Resolve de forma unificada o título da coluna/lista de uma tarefa,
 * compatível tanto com `BoardColumn` (`title`) quanto com `ColumnSummaryDTO` (`name`).
 */
export function resolveTaskColumnTitle(
  task: Pick<Task, "columnId" | "category"> | null | undefined,
  columns: ReadonlyArray<{ id?: string; name?: string; title?: string }>,
  fallbackTitle = "",
  explicitColumnId?: string,
): string {
  const targetColumnId = explicitColumnId || task?.columnId;
  if (targetColumnId) {
    const matched = columns.find((col) => col.id === targetColumnId);
    const resolvedName = matched?.title || matched?.name;
    if (resolvedName) return resolvedName;
  }
  return task?.category || fallbackTitle;
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
  timeZone?: string | null,
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
        priority: extraPayload?.priority || "NONE",
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
        priority: extraPayload?.priority || "NONE",
        difficulty: "EASY",
        isHardcoreModeEnabled: false,
        order: 0,
      },
    };
  }

  if (effectiveType === "DAILY") {
    const startDate =
      extraPayload?.startDate || getTodayDateString(new Date(), timeZone);
    const repeatType = extraPayload?.repeatType || "DAILY";
    const repeatEvery = extraPayload?.repeatEvery || 1;
    const daysOfWeek = extraPayload?.daysOfWeek || ALL_WEEK_DAYS;
    const monthlyOption = extraPayload?.monthlyOption || "DAY_OF_THE_MONTH";
    const difficulty = extraPayload?.difficulty || "MEDIUM";
    const priority = extraPayload?.priority || "NONE";

    return {
      payload: {
        name: title,
        taskType: "DAILY",
        startDate,
        repeatType,
        repeatEvery,
        ...(repeatType === "WEEKLY" && { daysOfWeek }),
        ...(repeatType === "MONTHLY" && { monthlyOption }),
        priority,
        difficulty,
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
        priority,
        difficulty,
        isHardcoreModeEnabled: false,
        order: 0,
      },
    };
  }

  const difficulty = extraPayload?.difficulty || "MEDIUM";
  const priority = extraPayload?.priority || "NONE";
  const dueTime = extraPayload?.dueTime
    ? extraPayload.dueTime.slice(0, 5)
    : undefined;
  const dueDate =
    extraPayload?.dueDate ||
    (dueTime ? getTodayDateString(new Date(), timeZone) : undefined);

  return {
    payload: {
      name: title,
      taskType: "TODO",
      priority,
      difficulty,
      ...(dueDate && { dueDate }),
      ...(dueTime && { dueTime }),
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
      priority,
      difficulty,
      dueDate,
      dueTime,
      isHardcoreModeEnabled: false,
      reminderType: "NONE",
      order: 0,
    },
  };
}
