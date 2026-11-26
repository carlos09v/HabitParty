"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTask, saveTaskWithDetails } from "@/actions/taskActions";
import {
  ALL_WEEK_DAYS,
  countRewardedChecklistItems,
  MAX_REWARDED_SUBTASKS,
  MAX_TASK_TAGS,
  normalizeTaskDifficulty,
  supportsRewardedChecklistSteps,
} from "@/constants/task";
import { useChecklist } from "@/hooks/useChecklist";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DailyDaysOfWeek,
  DailyRepeatMonthlyOption,
  DailyRepeatTypeOption,
  HabitImportance,
  HabitImportanceOption,
  HabitTypeOption,
  ReminderTypeOption,
  ResetCounterOption,
  Task,
  TaskDifficultyOption,
  TaskPriorityOption,
  TaskType,
  TaskTypeOption,
} from "@/types/task";
import type { UseCreateTaskFormOptions } from "@/types/task-ui";
import type { DatePickerEventSchedulePatch } from "@/types/ui";
import { formatCoins } from "@/utils";
import { getTodayDateString, normalizeEventSchedulePatch } from "@/utils/date";
import { calculateTaskReward } from "@/utils/economy";
import { soundEffects } from "@/utils/soundEffects";
import {
  buildCreateTaskPayloadFromTask,
  buildUpdateTaskPayload,
  mapTaskResponseToTask,
  parseTaskTags,
} from "@/utils/taskMapper";
import { validateHardcoreTodo } from "@/utils/validators";

export type { UseCreateTaskFormOptions };

function buildInitialTaskFormValues({
  columns,
  defaultColumnId,
  defaultTaskType,
  initialTitle,
  initialValues,
  taskToEdit,
}: Pick<
  UseCreateTaskFormOptions,
  | "columns"
  | "defaultColumnId"
  | "defaultTaskType"
  | "initialTitle"
  | "initialValues"
  | "taskToEdit"
>) {
  if (taskToEdit) {
    const rawType = (taskToEdit.type || "todo").toString().toUpperCase();
    const mappedType: TaskTypeOption =
      rawType === "HABIT" ? "HABIT" : rawType === "DAILY" ? "DAILY" : "TODO";

    return {
      taskType: mappedType,
      columnId: taskToEdit.columnId || defaultColumnId || columns[0]?.id || "",
      name: taskToEdit.title || "",
      description: taskToEdit.description || "",
      tagsInput:
        Array.isArray(taskToEdit.tags) && taskToEdit.tags.length > 0
          ? taskToEdit.tags.join(", ")
          : taskToEdit.category && taskToEdit.category !== "Geral"
            ? taskToEdit.category
            : "",
      isHardcore: Boolean(taskToEdit.isHardcoreModeEnabled),
      habitType: (taskToEdit.habitType || "POSITIVE") as HabitTypeOption,
      resetCounter: (taskToEdit.resetCounter || "DAILY") as ResetCounterOption,
      importanceType:
        taskToEdit.importanceType ||
        (taskToEdit.importance?.toUpperCase() as HabitImportanceOption) ||
        "NORMAL",
      difficulty: normalizeTaskDifficulty(taskToEdit.difficulty),
      priority: ((taskToEdit.priority as TaskPriorityOption) ||
        "NONE") as TaskPriorityOption,
      dueDate: taskToEdit.dueDate || "",
      dueTime: taskToEdit.dueTime ? taskToEdit.dueTime.slice(0, 5) : "",
      startTime: taskToEdit.startTime ? taskToEdit.startTime.slice(0, 5) : "",
      dueEndTime: taskToEdit.dueEndTime
        ? taskToEdit.dueEndTime.slice(0, 5)
        : "",
      isAllDay: Boolean(taskToEdit.isAllDay),
      reminderType: (taskToEdit.reminderType || "NONE") as ReminderTypeOption,
      sendEmailReminder: Boolean(taskToEdit.sendEmailReminder),
      startDate:
        taskToEdit.startDate ||
        getTodayDateString(new Date(), useUserStore.getState().user?.timezone),
      repeatType: (taskToEdit.repeatType || "DAILY") as DailyRepeatTypeOption,
      repeatEvery: taskToEdit.repeatEvery || 1,
      selectedDays:
        taskToEdit.daysOfWeek && taskToEdit.daysOfWeek.length > 0
          ? taskToEdit.daysOfWeek
          : ALL_WEEK_DAYS,
      monthlyOption: (taskToEdit.monthlyOption ||
        "DAY_OF_THE_MONTH") as DailyRepeatMonthlyOption,
      checklist: taskToEdit.checklist
        ? taskToEdit.checklist.map((item) => ({ ...item }))
        : [],
    };
  }

  return {
    taskType: (initialValues?.taskType ||
      defaultTaskType ||
      "TODO") as TaskTypeOption,
    columnId: defaultColumnId || columns[0]?.id || "",
    name: initialValues?.title || initialTitle || "",
    description: "",
    tagsInput: "",
    isHardcore: false,
    habitType: (initialValues?.habitType || "POSITIVE") as HabitTypeOption,
    resetCounter: (initialValues?.resetCounter ||
      "DAILY") as ResetCounterOption,
    importanceType: (initialValues?.importanceType ||
      "NORMAL") as HabitImportanceOption,
    difficulty: (initialValues?.difficulty || "MEDIUM") as TaskDifficultyOption,
    priority: (initialValues?.priority || "NONE") as TaskPriorityOption,
    dueDate:
      initialValues?.dueDate ||
      (initialValues?.dueTime
        ? getTodayDateString(new Date(), useUserStore.getState().user?.timezone)
        : ""),
    dueTime: initialValues?.dueTime ? initialValues.dueTime.slice(0, 5) : "",
    startTime: "",
    dueEndTime: "",
    isAllDay: false,
    reminderType: "NONE" as ReminderTypeOption,
    sendEmailReminder: false,
    startDate:
      initialValues?.startDate ||
      getTodayDateString(new Date(), useUserStore.getState().user?.timezone),
    repeatType: (initialValues?.repeatType || "DAILY") as DailyRepeatTypeOption,
    repeatEvery: initialValues?.repeatEvery ?? 1,
    selectedDays: initialValues?.daysOfWeek || ALL_WEEK_DAYS,
    monthlyOption: "DAY_OF_THE_MONTH" as DailyRepeatMonthlyOption,
    checklist: [],
  };
}

export function useCreateTaskForm({
  columns,
  defaultColumnId,
  defaultTaskType,
  initialTitle,
  initialValues,
  taskToEdit,
  onSuccess,
  onClose,
}: UseCreateTaskFormOptions) {
  const t = useTranslations("tasks.hooks");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!taskToEdit;

  const [initialForm] = useState(() =>
    buildInitialTaskFormValues({
      columns,
      defaultColumnId,
      defaultTaskType,
      initialTitle,
      initialValues,
      taskToEdit,
    }),
  );

  // Tipo de tarefa ativo
  const [taskType, setTaskType] = useState<TaskTypeOption>(
    initialForm.taskType,
  );

  // Campos Comuns
  const [columnId, setColumnId] = useState(initialForm.columnId);
  const [name, setName] = useState(initialForm.name);
  const [description, setDescription] = useState(initialForm.description);
  const descriptionFlushRef = useRef<(() => string) | null>(null);
  const [tagsInput, setTagsInput] = useState(initialForm.tagsInput);
  const [isHardcore, setIsHardcore] = useState(initialForm.isHardcore);

  // Campos de Hábito
  const [habitType, setHabitType] = useState<HabitTypeOption>(
    initialForm.habitType,
  );
  const [resetCounter, setResetCounter] = useState<ResetCounterOption>(
    initialForm.resetCounter,
  );
  const [importanceType, setImportanceType] = useState<HabitImportanceOption>(
    initialForm.importanceType,
  );

  // Campos de Diária (Daily) & ToDo
  const [difficulty, setDifficulty] = useState<TaskDifficultyOption>(
    initialForm.difficulty,
  );
  const [priority, setPriority] = useState<TaskPriorityOption>(
    initialForm.priority,
  );
  const [dueDate, setDueDate] = useState(initialForm.dueDate);
  const [dueTime, setDueTime] = useState(initialForm.dueTime);
  const [startTime, setStartTime] = useState(initialForm.startTime);
  const [dueEndTime, setDueEndTime] = useState(initialForm.dueEndTime);
  const [isAllDay, setIsAllDay] = useState(initialForm.isAllDay);
  const [reminderType, setReminderType] = useState<ReminderTypeOption>(
    initialForm.reminderType,
  );
  const [sendEmailReminder, setSendEmailReminder] = useState(
    initialForm.sendEmailReminder,
  );

  const handleDueDateChange = (nextDate: string) => {
    setDueDate(nextDate);
    if (!nextDate) {
      setDueTime("");
      setStartTime("");
      setDueEndTime("");
      setIsAllDay(false);
      setReminderType("NONE");
      setSendEmailReminder(false);
      if (taskType === "TODO") {
        setIsHardcore(false);
      }
    }
  };

  const handleEventScheduleChange = (patch: DatePickerEventSchedulePatch) => {
    const normalized = normalizeEventSchedulePatch(
      { dueDate, dueTime, startTime, dueEndTime, isAllDay },
      patch,
      useUserStore.getState().user?.timezone,
    );

    if (normalized.dueDate !== undefined) {
      setDueDate(normalized.dueDate);
      if (!normalized.dueDate) {
        setReminderType("NONE");
        setSendEmailReminder(false);
        if (taskType === "TODO") {
          setIsHardcore(false);
        }
      }
    }
    if (normalized.dueTime !== undefined) setDueTime(normalized.dueTime);
    if (normalized.startTime !== undefined) setStartTime(normalized.startTime);
    if (normalized.dueEndTime !== undefined) {
      setDueEndTime(normalized.dueEndTime);
    }
    if (normalized.isAllDay !== undefined) setIsAllDay(normalized.isAllDay);
  };

  // Campos específicos de Daily
  const [startDate, setStartDate] = useState(initialForm.startDate);
  const [repeatType, setRepeatType] = useState<DailyRepeatTypeOption>(
    initialForm.repeatType,
  );
  const [repeatEvery, setRepeatEvery] = useState(initialForm.repeatEvery);
  const [selectedDays, setSelectedDays] = useState<DailyDaysOfWeek[]>(
    initialForm.selectedDays,
  );
  const [monthlyOption, setMonthlyOption] = useState<DailyRepeatMonthlyOption>(
    initialForm.monthlyOption,
  );

  const canRewardChecklistItems = supportsRewardedChecklistSteps(
    taskType,
    difficulty,
  );
  const isTaskCompleted = Boolean(taskToEdit?.completed);
  const isSubmittingRef = useRef(false);

  // Checklist de subtarefas gerenciado pelo hook central useChecklist
  const {
    checklist,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    toggleItemReward: toggleChecklistItemReward,
    clearRewardedItems,
    updateItem: updateChecklistItem,
    deleteItem: deleteChecklistItem,
  } = useChecklist({
    initialItems: initialForm.checklist,
    taskId: taskToEdit?.id,
    // Subtarefas só são persistidas ao clicar em Salvar (cancelar descarta as alterações)
    deferPersistence: true,
    canRewardItems: canRewardChecklistItems,
    isRewardLocked: isTaskCompleted,
  });
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isNewChecklistRewarded, setIsNewChecklistRewarded] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleDifficultyChange = (nextDifficulty: TaskDifficultyOption) => {
    setDifficulty(nextDifficulty);
    if (nextDifficulty !== "HARD") {
      clearRewardedItems();
      setIsNewChecklistRewarded(false);
    }
  };

  const handleTaskTypeChange = (type: TaskTypeOption) => {
    setTaskType(type);
    if (type === "HABIT") {
      clearRewardedItems();
      setIsNewChecklistRewarded(false);
    }
    if (type === "TODO" && !dueDate) {
      setIsHardcore(false);
    } else if (type === "HABIT" && habitType === "NEGATIVE") {
      setIsHardcore(false);
    }
  };

  const handleHabitTypeChange = (type: HabitTypeOption) => {
    setHabitType(type);
    if (type === "NEGATIVE" && taskType === "HABIT") {
      setIsHardcore(false);
    }
  };

  // Foco diferido para o término da animação CSS de entrada (150ms), evitando layout thrash no meio do zoom-in
  const handleModalAnimationEnd = useCallback(() => {
    nameInputRef.current?.focus({ preventScroll: true });
  }, []);

  const handleAddChecklistItem = async () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    const shouldReward =
      canRewardChecklistItems &&
      !isTaskCompleted &&
      isNewChecklistRewarded &&
      countRewardedChecklistItems(checklist) < MAX_REWARDED_SUBTASKS;
    await addChecklistItem(trimmed, shouldReward);
    setNewChecklistText("");
    setIsNewChecklistRewarded(false);
  };

  const toggleDayOfWeek = (day: DailyDaysOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.length > 1
          ? prev.filter((d) => d !== day)
          : prev
        : [...prev, day],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error(t("titleRequired"));
      return;
    }

    if (!columnId) {
      toast.error(t("columnRequired"));
      return;
    }

    const tags = parseTaskTags(tagsInput);

    if (tags.length > MAX_TASK_TAGS) {
      toast.error(t("maxTagsError", { max: MAX_TASK_TAGS }));
      return;
    }

    // Regras de validação do Modo Hardcore e horário de término para To-dos
    if (taskType === "TODO") {
      const effectiveStart = startTime || dueTime;
      if (
        !isAllDay &&
        dueEndTime &&
        (!effectiveStart || dueEndTime <= effectiveStart)
      ) {
        toast.error(t("dueEndTimeAfterStartError"));
        return;
      }

      const hardcoreError = validateHardcoreTodo({
        isHardcore,
        dueDate,
        isEditing,
        taskToEdit,
        locale,
        timeZone: useUserStore.getState().user?.timezone,
        isGamified,
      });
      if (hardcoreError) {
        toast.error(hardcoreError);
        return;
      }
    }

    isSubmittingRef.current = true;
    const pendingChecklistName = newChecklistText.trim();
    const effectiveChecklist = pendingChecklistName
      ? [
          ...checklist,
          {
            id: `temp-chk-${Date.now()}`,
            name: pendingChecklistName,
            isCompleted: false,
            isRewarded:
              canRewardChecklistItems &&
              !isTaskCompleted &&
              isNewChecklistRewarded &&
              countRewardedChecklistItems(checklist) < MAX_REWARDED_SUBTASKS,
          },
        ]
      : checklist;
    if (pendingChecklistName) {
      setNewChecklistText("");
      setIsNewChecklistRewarded(false);
    }

    startTransition(async () => {
      try {
        const currentStreakForReward = isEditing
          ? (taskToEdit?.currentStreak ??
            taskToEdit?.streak ??
            taskToEdit?.positiveCount ??
            0)
          : 0;
        const calculatedRewards = calculateTaskReward({
          taskType,
          difficulty,
          importanceType,
          resetCounter,
          repeatType,
          currentStreak: currentStreakForReward,
          isHardcoreModeEnabled: isHardcore,
          dueDate: dueDate || undefined,
          isPenaltyApplied: taskToEdit?.isPenaltyApplied,
          checklist: effectiveChecklist,
          locale,
          timeZone: useUserStore.getState().user?.timezone,
          isGamified,
        });

        const latestDescription =
          descriptionFlushRef.current?.() ?? description;

        const resolvedReminderType =
          taskType === "TODO" && !dueDate ? "NONE" : reminderType;

        const draftTask: Task = {
          ...(taskToEdit || {}),
          id: taskToEdit?.id || `tsk-${Date.now()}`,
          title: trimmedName,
          description: latestDescription.trim() || undefined,
          category:
            tags[0] ||
            (taskToEdit?.category !== "Geral"
              ? taskToEdit?.category
              : undefined),
          tags,
          type: (taskType.toLowerCase() as TaskType) || "todo",
          difficulty,
          importance: importanceType.toLowerCase() as HabitImportance,
          importanceType,
          priority,
          habitType,
          resetCounter,
          rewardXp: calculatedRewards.xp,
          rewardGold: calculatedRewards.gold,
          completed: taskToEdit?.completed ?? false,
          streak: taskToEdit?.streak ?? 0,
          positiveCount: taskToEdit?.positiveCount ?? 0,
          negativeCount: taskToEdit?.negativeCount ?? 0,
          dueDate:
            dueDate ||
            (dueTime || startTime || isAllDay
              ? getTodayDateString(
                  new Date(),
                  useUserStore.getState().user?.timezone,
                )
              : undefined) ||
            undefined,
          dueTime: !isAllDay && !startTime && dueTime ? dueTime : undefined,
          startTime: !isAllDay && startTime ? startTime : undefined,
          dueEndTime:
            !isAllDay && (startTime || dueTime) && dueEndTime
              ? dueEndTime
              : undefined,
          isAllDay: Boolean(isAllDay),
          columnId,
          order: taskToEdit?.order ?? 0,
          daysOfWeek:
            taskType === "DAILY" && repeatType === "WEEKLY"
              ? selectedDays
              : undefined,
          monthlyOption:
            taskType === "DAILY" && repeatType === "MONTHLY"
              ? monthlyOption
              : undefined,
          repeatType: taskType === "DAILY" ? repeatType : undefined,
          repeatEvery: taskType === "DAILY" ? repeatEvery : undefined,
          startDate: taskType === "DAILY" ? startDate : undefined,
          isHardcoreModeEnabled: isHardcore,
          reminderType: resolvedReminderType,
          sendEmailReminder:
            resolvedReminderType !== "NONE" ? sendEmailReminder : false,
          checklist: effectiveChecklist,
        };

        if (isEditing && taskToEdit) {
          const updatePayload = buildUpdateTaskPayload(
            draftTask,
            undefined,
            useUserStore.getState().user?.timezone,
          );
          const originalColumnId = taskToEdit.columnId || defaultColumnId;
          const response = await saveTaskWithDetails({
            taskId: taskToEdit.id,
            payload: updatePayload,
            initialChecklist: taskToEdit.checklist || [],
            currentChecklist: effectiveChecklist,
            originalColumnId,
            targetColumnId: columnId,
          });

          if (!response.success) {
            toast.error(response.error || t("updateTaskError"));
            return;
          }

          const {
            task: serverTaskDto,
            checklist: finalChecklist,
            checklistFailedCount,
            moveError,
          } = response.data;
          const userTimeZone = useUserStore.getState().user?.timezone;
          const resolvedColumnId = moveError
            ? originalColumnId || columnId
            : columnId;
          const workspaceMeta =
            taskToEdit.workspaceId || taskToEdit.workspaceName
              ? { id: taskToEdit.workspaceId, name: taskToEdit.workspaceName }
              : undefined;
          const mappedServerTask = serverTaskDto
            ? mapTaskResponseToTask(
                serverTaskDto,
                resolvedColumnId,
                userTimeZone,
                workspaceMeta,
              )
            : draftTask;
          const syncedRewards = calculateTaskReward({
            ...mappedServerTask,
            taskType,
            difficulty,
            importanceType,
            resetCounter,
            repeatType,
            currentStreak:
              mappedServerTask.currentStreak ??
              mappedServerTask.streak ??
              currentStreakForReward,
            isHardcoreModeEnabled: isHardcore,
            dueDate: mappedServerTask.dueDate ?? (dueDate || undefined),
            isPenaltyApplied:
              mappedServerTask.isPenaltyApplied ?? taskToEdit.isPenaltyApplied,
            checklist: finalChecklist,
            locale,
            timeZone: userTimeZone,
            isGamified,
          });
          const syncedTask: Task = {
            ...mappedServerTask,
            columnId: resolvedColumnId,
            checklist: finalChecklist,
            rewardXp: syncedRewards.xp,
            rewardGold: syncedRewards.gold,
            totalFocusMinutes:
              mappedServerTask.totalFocusMinutes ??
              taskToEdit.totalFocusMinutes,
            focusCyclesCount:
              mappedServerTask.focusCyclesCount ?? taskToEdit.focusCyclesCount,
          };
          if (checklistFailedCount > 0) {
            toast.error(t("checklistSyncError"));
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("habitparty:tasks-changed"));
          }
          if (moveError) {
            toast.error(moveError || t("moveTaskColumnError"));
            onSuccess?.(syncedTask, resolvedColumnId);
            onClose();
            return;
          }

          toast.success(t("updateTaskSuccess"));
          onSuccess?.(syncedTask, resolvedColumnId);
          onClose();
          return;
        }

        // MODO CRIAÇÃO
        const userTimeZone = useUserStore.getState().user?.timezone;
        const payload = buildCreateTaskPayloadFromTask(draftTask, userTimeZone);
        const response = await createTask(
          columnId,
          payload,
          effectiveChecklist,
        );

        if (!response.success) {
          toast.error(response.error || t("createTaskError"));
          return;
        }

        const createdTaskData = response.data;
        const createdTaskId = createdTaskData?.id;
        const hasRequestedChecklist = effectiveChecklist.some((item) =>
          Boolean(item.name?.trim()),
        );
        const serverChecklist = createdTaskData?.checklist ?? [];
        if (hasRequestedChecklist && serverChecklist.length === 0) {
          toast.error(t("checklistSyncError"));
        }
        const finalChecklist = serverChecklist;

        const { activeWorkspaceId, workspaces } = useWorkspaceStore.getState();
        const activeWorkspace = activeWorkspaceId
          ? workspaces.find((ws) => ws.id === activeWorkspaceId)
          : undefined;
        const createWorkspaceMeta = activeWorkspace?.id
          ? { id: activeWorkspace.id, name: activeWorkspace.name }
          : undefined;

        const mappedTask: Task = createdTaskData
          ? {
              ...mapTaskResponseToTask(
                createdTaskData,
                columnId,
                userTimeZone,
                createWorkspaceMeta,
              ),
              checklist: finalChecklist,
            }
          : {
              ...draftTask,
              id: createdTaskId || draftTask.id,
              workspaceId: createWorkspaceMeta?.id ?? draftTask.workspaceId,
              workspaceName:
                createWorkspaceMeta?.name ?? draftTask.workspaceName,
              checklist: finalChecklist,
            };

        const typeLabel = t(`typeLabels.${taskType}`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("habitparty:tasks-changed"));
        }
        soundEffects.playCreateSound();
        toast.success(
          t("createTaskSuccess", { typeLabel, title: trimmedName }),
          {
            description: t(
              isGamified
                ? "createTaskRewardDesc"
                : "createTaskRewardDescProductivity",
              {
                xp: calculatedRewards.xp,
                gold: formatCoins(calculatedRewards.gold, { locale }),
              },
            ),
          },
        );
        onSuccess?.(mappedTask, columnId);
        onClose();
      } finally {
        isSubmittingRef.current = false;
      }
    });
  };

  return {
    isPending,
    isEditing,
    isTaskCompleted,
    taskType,
    setTaskType: handleTaskTypeChange,
    columnId,
    setColumnId,
    name,
    setName,
    description,
    setDescription,
    descriptionFlushRef,
    tagsInput,
    setTagsInput,
    isHardcore,
    setIsHardcore,
    habitType,
    setHabitType: handleHabitTypeChange,
    resetCounter,
    setResetCounter,
    importanceType,
    setImportanceType,
    difficulty,
    setDifficulty: handleDifficultyChange,
    canRewardChecklistItems,
    priority,
    setPriority,
    dueDate,
    setDueDate: handleDueDateChange,
    dueTime,
    startTime,
    dueEndTime,
    isAllDay,
    onEventScheduleChange: handleEventScheduleChange,
    reminderType,
    setReminderType,
    sendEmailReminder,
    setSendEmailReminder,
    startDate,
    setStartDate,
    repeatType,
    setRepeatType,
    repeatEvery,
    setRepeatEvery,
    selectedDays,
    toggleDayOfWeek,
    monthlyOption,
    setMonthlyOption,
    checklist,
    newChecklistText,
    setNewChecklistText,
    isNewChecklistRewarded,
    setIsNewChecklistRewarded,
    nameInputRef,
    handleModalAnimationEnd,
    handleAddChecklistItem,
    handleRemoveChecklistItem: deleteChecklistItem,
    handleToggleChecklistItem: toggleChecklistItem,
    handleToggleChecklistItemReward: toggleChecklistItemReward,
    handleUpdateChecklistItem: updateChecklistItem,
    taskToEdit,
    handleSubmit,
  };
}

export type CreateTaskFormReturn = ReturnType<typeof useCreateTaskForm>;
