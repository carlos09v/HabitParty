"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import { createTask, moveTasks, updateTask } from "@/actions/taskActions";
import {
  ALL_WEEK_DAYS,
  MAX_TASK_TAGS,
  normalizeTaskDifficulty,
} from "@/constants/task";
import { useChecklist } from "@/hooks/useChecklist";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
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
import { formatCoins } from "@/utils";
import { getTodayDateString } from "@/utils/date";
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
      reminderType: (taskToEdit.reminderType || "NONE") as ReminderTypeOption,
      sendEmailReminder: Boolean(taskToEdit.sendEmailReminder),
      startDate: taskToEdit.startDate || getTodayDateString(),
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
      (initialValues?.dueTime ? getTodayDateString() : ""),
    dueTime: initialValues?.dueTime ? initialValues.dueTime.slice(0, 5) : "",
    reminderType: "NONE" as ReminderTypeOption,
    sendEmailReminder: false,
    startDate: initialValues?.startDate || getTodayDateString(),
    repeatType: (initialValues?.repeatType || "DAILY") as DailyRepeatTypeOption,
    repeatEvery: initialValues?.repeatEvery ?? 1,
    selectedDays: initialValues?.daysOfWeek || ALL_WEEK_DAYS,
    monthlyOption: "DAY_OF_THE_MONTH" as DailyRepeatMonthlyOption,
    checklist: [],
  };
}

export function useCreateTaskForm({
  isOpen,
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
    }
  };

  const handleDueTimeChange = (nextTime: string) => {
    const cleanTime = nextTime ? nextTime.slice(0, 5) : "";
    setDueTime(cleanTime);
    if (cleanTime && !dueDate) {
      setDueDate(getTodayDateString());
    }
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

  // Checklist de subtarefas gerenciado pelo hook central useChecklist
  const {
    checklist,
    resetChecklist,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    updateItem: updateChecklistItem,
    deleteItem: deleteChecklistItem,
  } = useChecklist({
    initialItems: initialForm.checklist,
    taskId: taskToEdit?.id,
  });
  const [newChecklistText, setNewChecklistText] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleTaskTypeChange = (type: TaskTypeOption) => {
    setTaskType(type);
  };

  const sessionKey = isOpen
    ? `${taskToEdit?.id ?? "new"}:${defaultColumnId ?? ""}:${defaultTaskType ?? ""}:${initialTitle ?? ""}`
    : "closed";
  const activeSessionKeyRef = useRef(sessionKey);

  // Foco diferido para o término da animação CSS de entrada (150ms), evitando layout thrash no meio do zoom-in
  const handleModalAnimationEnd = useCallback(() => {
    nameInputRef.current?.focus({ preventScroll: true });
  }, []);

  // Sincroniza apenas caso o modal permaneça montado e troque de sessão/tarefa (no mount inicial: zero setState)
  useEffect(() => {
    if (!isOpen) {
      activeSessionKeyRef.current = "closed";
      return;
    }

    if (activeSessionKeyRef.current === sessionKey) return;
    activeSessionKeyRef.current = sessionKey;

    const next = buildInitialTaskFormValues({
      columns,
      defaultColumnId,
      defaultTaskType,
      initialTitle,
      initialValues,
      taskToEdit,
    });

    setTaskType(next.taskType);
    setColumnId(next.columnId);
    setName(next.name);
    setDescription(next.description);
    setTagsInput(next.tagsInput);
    setIsHardcore(next.isHardcore);
    setHabitType(next.habitType);
    setResetCounter(next.resetCounter);
    setImportanceType(next.importanceType);
    setDifficulty(next.difficulty);
    setPriority(next.priority);
    setDueDate(next.dueDate);
    setDueTime(next.dueTime);
    setReminderType(next.reminderType);
    setSendEmailReminder(next.sendEmailReminder);
    setStartDate(next.startDate);
    setRepeatType(next.repeatType);
    setRepeatEvery(next.repeatEvery);
    setSelectedDays(next.selectedDays);
    setMonthlyOption(next.monthlyOption);
    resetChecklist(next.checklist);
    setNewChecklistText("");
  }, [
    isOpen,
    sessionKey,
    taskToEdit,
    defaultColumnId,
    defaultTaskType,
    initialTitle,
    initialValues,
    columns,
    resetChecklist,
  ]);

  const handleAddChecklistItem = async () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    await addChecklistItem(trimmed);
    setNewChecklistText("");
  };

  const handleRemoveChecklistItem = (index: number) => {
    const target = checklist[index];
    if (target?.id) {
      deleteChecklistItem(target.id);
    }
  };

  const handleToggleChecklistItem = (index: number) => {
    const target = checklist[index];
    if (target?.id) {
      toggleChecklistItem(target.id);
    }
  };

  const handleUpdateChecklistItem = (index: number, newName: string) => {
    const target = checklist[index];
    if (target?.id) {
      updateChecklistItem(target.id, newName);
    }
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

    // Regras de validação do Modo Hardcore para To-dos
    if (taskType === "TODO") {
      const hardcoreError = validateHardcoreTodo({
        isHardcore,
        dueDate,
        isEditing,
        taskToEdit,
        locale,
      });
      if (hardcoreError) {
        toast.error(hardcoreError);
        return;
      }
    }

    startTransition(async () => {
      const calculatedRewards = calculateTaskReward({
        taskType,
        difficulty,
        importanceType,
        resetCounter,
        repeatType,
        currentStreak: isEditing ? (taskToEdit?.streak ?? 0) : 0,
        isHardcoreModeEnabled: isHardcore,
        dueDate: dueDate || undefined,
        isPenaltyApplied: taskToEdit?.isPenaltyApplied,
      });

      const draftTask: Task = {
        ...(taskToEdit || {}),
        id: taskToEdit?.id || `tsk-${Date.now()}`,
        title: trimmedName,
        description: description.trim() || undefined,
        category:
          tags[0] ||
          (taskToEdit?.category !== "Geral" ? taskToEdit?.category : undefined),
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
          dueDate || (dueTime ? getTodayDateString() : undefined) || undefined,
        dueTime: dueTime || undefined,
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
        reminderType,
        sendEmailReminder: reminderType !== "NONE" ? sendEmailReminder : false,
        checklist,
      };

      if (isEditing && taskToEdit) {
        const updatePayload = buildUpdateTaskPayload(draftTask);
        const response = await updateTask(taskToEdit.id, updatePayload);

        if (!response.success) {
          toast.error(response.error || t("updateTaskError"));
          return;
        }

        const originalColumnId = taskToEdit.columnId || defaultColumnId;
        if (originalColumnId && columnId !== originalColumnId) {
          const moveRes = await moveTasks([
            {
              taskId: taskToEdit.id,
              boardColumnId: columnId,
              newOrderIndex: 0,
            },
          ]);
          if (!moveRes.success) {
            toast.error(moveRes.error || t("moveTaskColumnError"));
          }
        }

        toast.success(t("updateTaskSuccess"));
        onSuccess?.(draftTask, columnId);
        onClose();
        return;
      }

      // MODO CRIAÇÃO
      const payload = buildCreateTaskPayloadFromTask(draftTask);
      const response = await createTask(columnId, payload);

      if (!response.success) {
        toast.error(response.error || t("createTaskError"));
        return;
      }

      const createdTaskData = response.data;
      const createdTaskId = createdTaskData?.id;

      let finalChecklist = checklist;
      if (createdTaskId && checklist.length > 0) {
        const createdItems = await cloneTaskChecklistItems(
          createdTaskId,
          checklist,
        );
        if (createdItems.length > 0) {
          finalChecklist = createdItems;
        }
      }

      const mappedTask: Task = createdTaskData
        ? {
            ...mapTaskResponseToTask(createdTaskData, columnId),
            checklist: finalChecklist,
          }
        : {
            ...draftTask,
            id: createdTaskId || draftTask.id,
            checklist: finalChecklist,
          };

      const typeLabel = t(`typeLabels.${taskType}`);
      soundEffects.playCreateSound();
      toast.success(t("createTaskSuccess", { typeLabel, title: trimmedName }), {
        ...(isGamified
          ? {
              description: t("createTaskRewardDesc", {
                xp: calculatedRewards.xp,
                gold: formatCoins(calculatedRewards.gold, { locale }),
              }),
            }
          : {}),
      });
      onSuccess?.(mappedTask, columnId);
      onClose();
    });
  };

  return {
    isPending,
    isEditing,
    taskType,
    setTaskType: handleTaskTypeChange,
    columnId,
    setColumnId,
    name,
    setName,
    description,
    setDescription,
    tagsInput,
    setTagsInput,
    isHardcore,
    setIsHardcore,
    habitType,
    setHabitType,
    resetCounter,
    setResetCounter,
    importanceType,
    setImportanceType,
    difficulty,
    setDifficulty,
    priority,
    setPriority,
    dueDate,
    setDueDate: handleDueDateChange,
    dueTime,
    setDueTime: handleDueTimeChange,
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
    nameInputRef,
    handleModalAnimationEnd,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    handleToggleChecklistItem,
    handleUpdateChecklistItem,
    taskToEdit,
    handleSubmit,
  };
}

export type CreateTaskFormReturn = ReturnType<typeof useCreateTaskForm>;
