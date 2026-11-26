import {
  ALL_WEEK_DAYS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import type { WeeklyCalendarTaskSummary } from "@/types/dashboard";
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
  LOW: "low",
  Low: "low",
  MEDIUM: "normal",
  HIGH: "high",
  NONE: "normal",
  low: "low",
  normal: "normal",
  high: "high",
};

export function computeArchivedColumnCountsFromTotals(
  loadedTotal: number,
  loadedCompleted: number,
  totalTasks?: number | null,
  completedTasks?: number | null,
): { archivedTotalCount: number; archivedCompletedCount: number } {
  const resolvedTotal = totalTasks ?? loadedTotal;
  const resolvedCompleted = completedTasks ?? loadedCompleted;
  return {
    archivedTotalCount: Math.max(0, resolvedTotal - loadedTotal),
    archivedCompletedCount: Math.max(0, resolvedCompleted - loadedCompleted),
  };
}

export function computeArchivedColumnCounts(
  tasks: Pick<Task, "completed">[],
  totalTasks?: number | null,
  completedTasks?: number | null,
): { archivedTotalCount: number; archivedCompletedCount: number } {
  const loadedCompleted = tasks.filter((t) => Boolean(t.completed)).length;
  return computeArchivedColumnCountsFromTotals(
    tasks.length,
    loadedCompleted,
    totalTasks,
    completedTasks,
  );
}

/**
 * Mapeia o DTO do backend para a entidade Task da UI no Kanban.
 */
export function mapTaskResponseToTask(
  taskDto: TaskResponseDTO,
  columnId: string,
  timeZone?: string | null,
  workspaceMeta?: { id?: string; name?: string },
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
    checklist: taskDto.checklist,
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
    highestStreak:
      (taskDto.taskType?.toLowerCase() as TaskType) === "todo"
        ? undefined
        : (taskDto.highestStreak ?? taskDto.currentStreak ?? 0),
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
    workspaceId: workspaceMeta?.id,
    workspaceName: workspaceMeta?.name,
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

  return workspace.columns
    .map((col: BoardColumnResponseDTO) => {
      const mappedTasks = (col.tasks || []).map((t) =>
        mapTaskResponseToTask(t, col.id || "", timeZone, {
          id: workspace.id,
          name: workspace.name,
        }),
      );
      const { archivedTotalCount, archivedCompletedCount } =
        computeArchivedColumnCounts(
          mappedTasks,
          col.totalTasks,
          col.completedTasks,
        );

      return {
        id: col.id || "",
        title: col.name || "",
        order: col.orderIndex || 0,
        icon: col.icon || "sun",
        tasks: mappedTasks,
        archivedTotalCount,
        archivedCompletedCount,
      };
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Normaliza os campos de agendamento de um Afazer (To-Do), garantindo consistência
 * entre `dueDate`, `dueTime`, `startTime`, `dueEndTime` e `isAllDay` em criação e edição.
 */
export function normalizeTaskScheduleFields(
  task: Pick<
    Task,
    "dueDate" | "dueTime" | "startTime" | "dueEndTime" | "isAllDay"
  >,
  isTodo: boolean,
  timeZone?: string | null,
): {
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay: boolean;
} {
  if (!isTodo) {
    return {
      dueDate: undefined,
      dueTime: undefined,
      startTime: undefined,
      dueEndTime: undefined,
      isAllDay: false,
    };
  }

  const resolvedIsAllDay = Boolean(task.isAllDay);
  const resolvedStartTime =
    !resolvedIsAllDay && task.startTime
      ? task.startTime.slice(0, 5)
      : undefined;
  const rawDueEndTime =
    !resolvedIsAllDay && task.dueEndTime
      ? task.dueEndTime.slice(0, 5)
      : undefined;
  const resolvedDueTime =
    !resolvedIsAllDay && !resolvedStartTime && task.dueTime
      ? task.dueTime.slice(0, 5)
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
  const resolvedDueDate =
    task.dueDate ||
    (hasAnyTimeOrEvent ? getTodayDateString(new Date(), timeZone) : undefined);

  return {
    dueDate: resolvedDueDate,
    dueTime: resolvedDueDate ? resolvedDueTime : undefined,
    startTime: resolvedDueDate ? resolvedStartTime : undefined,
    dueEndTime: resolvedDueDate ? resolvedDueEndTime : undefined,
    isAllDay: resolvedDueDate ? resolvedIsAllDay : false,
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
  timeZone?: string | null,
): UpdateTaskDTO {
  const merged: Task = { ...task, ...overrides };
  const taskType = normalizeTaskType(merged);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";

  const priority = (merged.priority as TaskPriorityOption) || "NONE";
  const difficulty = normalizeTaskDifficulty(merged.difficulty);
  const isTodo = !isHabit && !isDaily;
  const schedule = normalizeTaskScheduleFields(merged, isTodo, timeZone);

  const payload: UpdateTaskDTO = {
    name: merged.title,
    description: merged.description?.trim() || undefined,
    isHardcoreModeEnabled: Boolean(merged.isHardcoreModeEnabled),
    priority,
    difficulty,
    tags: merged.tags && merged.tags.length > 0 ? merged.tags : undefined,
    dueDate: schedule.dueDate,
    dueTime: schedule.dueTime,
    startTime: schedule.startTime,
    dueEndTime: schedule.dueEndTime,
    isAllDay: schedule.isAllDay,
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
    ...(isTodo && {
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
  const schedule = normalizeTaskScheduleFields(task, isTodo, timeZone);

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
      dueDate: schedule.dueDate,
      dueTime: schedule.dueTime,
      startTime: schedule.startTime,
      dueEndTime: schedule.dueEndTime,
      isAllDay: schedule.isAllDay,
      reminderType: task.reminderType || "NONE",
      sendEmailReminder: Boolean(task.sendEmailReminder),
    }),
  };
}

function getIsoWeekFromCalendarDate(
  year: number,
  monthOneBased: number,
  day: number,
): { year: number; week: number } {
  const utc = new Date(Date.UTC(year, monthOneBased - 1, day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return { year: utc.getUTCFullYear(), week };
}

function isSameHabitResetPeriod(
  lastDate: Date,
  now: Date,
  counter: string,
  timeZone?: string | null,
): boolean {
  const lastParts = getDatePartsInTimeZone(lastDate, timeZone);
  const nowParts = getDatePartsInTimeZone(now, timeZone);
  if (counter === "WEEKLY") {
    const lastWeek = getIsoWeekFromCalendarDate(
      lastParts.year,
      lastParts.month,
      lastParts.day,
    );
    const currWeek = getIsoWeekFromCalendarDate(
      nowParts.year,
      nowParts.month,
      nowParts.day,
    );
    return lastWeek.year === currWeek.year && lastWeek.week === currWeek.week;
  }
  if (counter === "MONTHLY") {
    return (
      lastParts.year === nowParts.year && lastParts.month === nowParts.month
    );
  }
  return (
    lastParts.year === nowParts.year &&
    lastParts.month === nowParts.month &&
    lastParts.day === nowParts.day
  );
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
  const lastParts = getDatePartsInTimeZone(lastDate, timeZone);
  const nowParts = getDatePartsInTimeZone(now, timeZone);

  if (counter === "WEEKLY") {
    const last = getIsoWeekFromCalendarDate(
      lastParts.year,
      lastParts.month,
      lastParts.day,
    );
    const curr = getIsoWeekFromCalendarDate(
      nowParts.year,
      nowParts.month,
      nowParts.day,
    );
    if (
      last.year > curr.year ||
      (last.year === curr.year && last.week >= curr.week)
    ) {
      return true;
    }
    // Soma 7 dias em calendário UTC para evitar desvios em semanas com transição de horário de verão (DST)
    const nextWeek = getIsoWeekFromCalendarDate(
      lastParts.year,
      lastParts.month,
      lastParts.day + 7,
    );
    return nextWeek.year === curr.year && nextWeek.week === curr.week;
  }
  if (counter === "MONTHLY") {
    const monthsDiff =
      (nowParts.year - lastParts.year) * 12 +
      (nowParts.month - lastParts.month);
    return monthsDiff <= 1;
  }

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
  | "positiveCount"
  | "negativeCount"
  | "streak"
  | "highestStreak"
  | "completed"
  | "lastCompletedAt"
> {
  const currentPositive = task.positiveCount ?? 0;
  const nextPositive = delta > 0 ? currentPositive + delta : currentPositive;
  const nextNegative =
    delta < 0
      ? (task.negativeCount ?? 0) + Math.abs(delta)
      : (task.negativeCount ?? 0);

  const now = new Date();
  const parsedLast = task.lastCompletedAt
    ? parseServerDate(task.lastCompletedAt)
    : null;
  const counter = (task.resetCounter || "DAILY").toUpperCase();
  const alreadyCompletedInCurrentPeriod = Boolean(
    parsedLast && isSameHabitResetPeriod(parsedLast, now, counter, timeZone),
  );

  let nextStreak = task.streak ?? 0;
  if (delta > 0 && currentPositive === 0) {
    if (alreadyCompletedInCurrentPeriod && nextStreak > 0) {
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
    highestStreak: Math.max(task.highestStreak ?? 0, nextStreak),
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
  timeZone?: string | null,
): Task {
  const isCompleted = dto.status === "COMPLETED";
  const nextChecklist = dto.checklist ?? task.checklist;
  const nextStreak =
    dto.currentStreak !== undefined ? dto.currentStreak : task.streak;
  const nextPenaltyApplied = dto.isPenaltyApplied ?? task.isPenaltyApplied;
  const reward = calculateTaskReward({
    ...task,
    streak: nextStreak,
    currentStreak: nextStreak,
    positiveCount: dto.positiveCount ?? task.positiveCount,
    isPenaltyApplied: nextPenaltyApplied,
    checklist: nextChecklist,
    timeZone,
  });
  return {
    ...task,
    checklist: nextChecklist,
    rewardXp: reward.xp,
    rewardGold: reward.gold,
    completed: isCompleted,
    hasClaimedReward: Boolean(dto.isRewardClaimed || isCompleted),
    positiveCount: dto.positiveCount ?? task.positiveCount,
    negativeCount: dto.negativeCount ?? task.negativeCount,
    streak: nextStreak,
    currentStreak:
      dto.currentStreak !== undefined ? dto.currentStreak : task.currentStreak,
    highestStreak:
      dto.highestStreak !== undefined ? dto.highestStreak : task.highestStreak,
    lastCompletedAt:
      dto.lastCompletedAt !== undefined
        ? dto.lastCompletedAt
        : isCompleted || dto.isRewardClaimed
          ? task.lastCompletedAt
          : undefined,
    isPenaltyApplied: nextPenaltyApplied,
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
    const reward = calculateTaskReward({
      taskType: "HABIT",
      difficulty: "EASY",
      importanceType,
      resetCounter,
      timeZone,
    });

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
        highestStreak: 0,
        positiveCount: 0,
        negativeCount: 0,
        type: "habit",
        habitType,
        resetCounter,
        importanceType,
        importance: IMPORTANCE_MAP[importanceType] ?? "normal",
        rewardXp: reward.xp,
        rewardGold: reward.gold,
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
    const reward = calculateTaskReward({
      taskType: "DAILY",
      difficulty,
      repeatType,
      timeZone,
    });

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
        highestStreak: 0,
        positiveCount: 0,
        negativeCount: 0,
        type: "daily",
        startDate,
        repeatType,
        repeatEvery,
        daysOfWeek: repeatType === "WEEKLY" ? daysOfWeek : undefined,
        monthlyOption: repeatType === "MONTHLY" ? monthlyOption : undefined,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
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
  const reward = calculateTaskReward({
    taskType: "TODO",
    difficulty,
    dueDate,
    timeZone,
  });

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
      streak: undefined,
      positiveCount: 0,
      negativeCount: 0,
      type: "todo",
      rewardXp: reward.xp,
      rewardGold: reward.gold,
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

/**
 * Reseta estados diários/hábitos locais durante a virada da meia-noite no cliente
 * respeitando {@code resetCounter} ({@code DAILY}, {@code WEEKLY} na segunda-feira e
 * {@code MONTHLY} no dia 1º) para manter paridade com {@code DailyResetUseCase}.
 */
export function resetTaskOnMidnightRollover(
  task: Task,
  timeZone?: string | null,
  referenceDate: Date = new Date(),
): Task {
  const type = normalizeTaskType(task);
  if (type === "daily") {
    const todayIso = getTodayDateString(referenceDate, timeZone);
    const dueDatePart = task.dueDate?.split("T")[0];
    const shouldResetChecklist =
      Boolean(task.completed) ||
      Boolean(task.hasClaimedReward) ||
      !dueDatePart ||
      dueDatePart < todayIso;

    return {
      ...task,
      completed: false,
      hasClaimedReward: false,
      checklist:
        shouldResetChecklist && task.checklist
          ? task.checklist.map((item) => ({ ...item, isCompleted: false }))
          : task.checklist,
    };
  }
  if (type === "habit") {
    const resetCounter = (task.resetCounter ?? "daily").toLowerCase();
    if (resetCounter === "daily") {
      return {
        ...task,
        completed: false,
        hasClaimedReward: false,
        positiveCount: 0,
        negativeCount: 0,
      };
    }
    const parts = getDatePartsInTimeZone(referenceDate, timeZone);
    const utcDayOfWeek = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day),
    ).getUTCDay();
    const shouldReset =
      (resetCounter === "weekly" && utcDayOfWeek === 1) ||
      (resetCounter === "monthly" && parts.day === 1);
    if (shouldReset) {
      return {
        ...task,
        completed: false,
        hasClaimedReward: false,
        positiveCount: 0,
        negativeCount: 0,
      };
    }
  }
  return task;
}

/**
 * Preenche `workspaceId` e `workspaceName` na tarefa a partir da coluna correspondente,
 * útil após criação/edição/duplicação otimista em visões multi-workspace como o Dashboard.
 */
export function enrichTaskWithColumnWorkspace(
  task: Task,
  columns?: ReadonlyArray<{
    id?: string;
    workspaceId?: string;
    workspaceName?: string;
  }>,
): Task {
  if (!task.columnId || !columns?.length) return task;
  const matchedCol = columns.find((c) => c.id === task.columnId);
  if (!matchedCol?.workspaceId) return task;
  if (
    task.workspaceId === matchedCol.workspaceId &&
    task.workspaceName === matchedCol.workspaceName
  ) {
    return task;
  }
  return {
    ...task,
    workspaceId: matchedCol.workspaceId,
    workspaceName: matchedCol.workspaceName,
  };
}

/**
 * Constrói os conjuntos de IDs somente-leitura para workspaces excedentes e suas colunas.
 */
export function buildReadOnlySets(
  workspaces: ReadonlyArray<{ id?: string; isReadOnly?: boolean }>,
  columns?: ReadonlyArray<{
    id?: string;
    workspaceId?: string;
    isReadOnly?: boolean;
  }>,
): {
  readOnlyWorkspaceIds: Set<string>;
  readOnlyColumnIds: Set<string>;
} {
  const readOnlyWorkspaceIds = new Set<string>();
  for (const ws of workspaces) {
    if (ws.id && ws.isReadOnly) {
      readOnlyWorkspaceIds.add(ws.id);
    }
  }

  const readOnlyColumnIds = new Set<string>();
  for (const col of columns ?? []) {
    if (
      col.id &&
      (col.isReadOnly ||
        (col.workspaceId && readOnlyWorkspaceIds.has(col.workspaceId)))
    ) {
      readOnlyColumnIds.add(col.id);
    }
  }

  return { readOnlyWorkspaceIds, readOnlyColumnIds };
}

/**
 * Verifica se uma tarefa pertence a um workspace ou coluna bloqueada para escrita.
 */
export function isTaskInReadOnlyScope(
  task: Pick<Task, "workspaceId" | "columnId">,
  readOnlyWorkspaceIds: ReadonlySet<string>,
  readOnlyColumnIds: ReadonlySet<string>,
  overrideColumnId?: string,
): boolean {
  const effectiveColumnId = overrideColumnId || task.columnId;
  return Boolean(
    (task.workspaceId && readOnlyWorkspaceIds.has(task.workspaceId)) ||
      (effectiveColumnId && readOnlyColumnIds.has(effectiveColumnId)),
  );
}

/**
 * Critério unificado de tarefa considerada cumprida para métricas de progresso
 * (Kanban, DashboardListSummary e WelcomeCard).
 */
export function isTaskConsideredDone(
  task: Pick<Task, "type" | "taskType" | "completed" | "positiveCount">,
): boolean {
  if (normalizeTaskType(task) === "habit") {
    return (task.positiveCount ?? 0) > 0 || Boolean(task.completed);
  }
  return Boolean(task.completed);
}

/**
 * Converte uma Task (ou resumo existente) no contrato enxuto usado pelo WeeklyCalendar
 * e pelo `optimisticDashboardStore`, evitando serialização desnecessária entre RSC e cliente.
 */
export function toWeeklyCalendarTaskSummary(
  task: Task | WeeklyCalendarTaskSummary,
): WeeklyCalendarTaskSummary {
  return {
    id: task.id,
    type: task.type,
    taskType: task.taskType,
    habitType: task.habitType,
    resetCounter: task.resetCounter,
    completed: task.completed,
    dueDate: task.dueDate,
    startDate: task.startDate,
    repeatType: task.repeatType,
    repeatEvery: task.repeatEvery,
    daysOfWeek: task.daysOfWeek,
    monthlyOption: task.monthlyOption,
    lastCompletedAt: task.lastCompletedAt,
  };
}

/**
 * Atualiza uma única tarefa dentro da lista de colunas preservando a referência de todas
 * as colunas intocadas (evitando re-renders em massa de `React.memo(RoutineColumn)`).
 */
export function mapTaskInColumns(
  columns: BoardColumn[],
  taskId: string,
  updater: (task: Task) => Task,
): BoardColumn[] {
  let changed = false;
  const nextColumns = columns.map((col) => {
    const taskIdx = col.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx === -1) return col;
    const prevTask = col.tasks[taskIdx];
    const nextTask = updater(prevTask);
    if (nextTask === prevTask) return col;
    changed = true;
    const nextTasks = col.tasks.slice();
    nextTasks[taskIdx] = nextTask;
    return { ...col, tasks: nextTasks };
  });
  return changed ? nextColumns : columns;
}

/**
 * Remove uma tarefa da lista de colunas preservando a referência de todas as colunas intocadas.
 */
export function removeTaskFromColumns(
  columns: BoardColumn[],
  taskId: string,
): BoardColumn[] {
  let changed = false;
  const nextColumns = columns.map((col) => {
    const hasTask = col.tasks.some((t) => t.id === taskId);
    if (!hasTask) return col;
    changed = true;
    return {
      ...col,
      tasks: col.tasks.filter((t) => t.id !== taskId),
    };
  });
  return changed ? nextColumns : columns;
}
