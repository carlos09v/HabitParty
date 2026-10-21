"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import { createTask, moveTasks, updateTask } from "@/actions/taskActions";
import {
  ALL_WEEK_DAYS,
  MAX_TASK_TAGS,
  normalizeTaskDifficulty,
} from "@/constants/task";
import { useChecklist } from "@/hooks/useChecklist";
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

export interface UseCreateTaskFormOptions {
  isOpen: boolean;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
  onClose: () => void;
}

export function useCreateTaskForm({
  isOpen,
  columns,
  defaultColumnId,
  defaultTaskType,
  initialTitle,
  taskToEdit,
  onSuccess,
  onClose,
}: UseCreateTaskFormOptions) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!taskToEdit;

  // Tipo de tarefa ativo
  const [taskType, setTaskType] = useState<TaskTypeOption>(
    defaultTaskType || "TODO",
  );

  // Campos Comuns
  const [columnId, setColumnId] = useState(defaultColumnId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isHardcore, setIsHardcore] = useState(false);

  // Campos de Hábito
  const [habitType, setHabitType] = useState<HabitTypeOption>("POSITIVE");
  const [resetCounter, setResetCounter] = useState<ResetCounterOption>("DAILY");
  const [importanceType, setImportanceType] =
    useState<HabitImportanceOption>("NORMAL");

  // Campos de Diária (Daily) & ToDo
  const [difficulty, setDifficulty] = useState<TaskDifficultyOption>("MEDIUM");
  const [priority, setPriority] = useState<TaskPriorityOption>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [reminderType, setReminderType] = useState<ReminderTypeOption>("NONE");
  const [sendEmailReminder, setSendEmailReminder] = useState(false);

  // Campos específicos de Daily
  const [startDate, setStartDate] = useState("");
  const [repeatType, setRepeatType] = useState<DailyRepeatTypeOption>("DAILY");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [selectedDays, setSelectedDays] =
    useState<DailyDaysOfWeek[]>(ALL_WEEK_DAYS);
  const [monthlyOption, setMonthlyOption] =
    useState<DailyRepeatMonthlyOption>("DAY_OF_THE_MONTH");

  // Checklist de subtarefas gerenciado pelo hook central useChecklist
  const {
    checklist,
    resetChecklist,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    deleteItem: deleteChecklistItem,
  } = useChecklist({
    initialItems: taskToEdit?.checklist,
    taskId: taskToEdit?.id,
  });
  const [newChecklistText, setNewChecklistText] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleTaskTypeChange = (type: TaskTypeOption) => {
    setTaskType(type);
  };

  const isInitializedRef = useRef(false);

  // Reset e inicialização ao abrir o modal
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      return;
    }

    // Se já inicializou para esta sessão do modal com esta tarefa, preserva as alterações locais
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    if (taskToEdit) {
      const rawType = (taskToEdit.type || "todo").toString().toUpperCase();
      const mappedType: TaskTypeOption =
        rawType === "HABIT" ? "HABIT" : rawType === "DAILY" ? "DAILY" : "TODO";

      setTaskType(mappedType);
      setColumnId(
        taskToEdit.columnId || defaultColumnId || columns[0]?.id || "",
      );
      setName(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setTagsInput(
        Array.isArray(taskToEdit.tags) && taskToEdit.tags.length > 0
          ? taskToEdit.tags.join(", ")
          : taskToEdit.category && taskToEdit.category !== "Geral"
            ? taskToEdit.category
            : "",
      );
      setIsHardcore(Boolean(taskToEdit.isHardcoreModeEnabled));
      setHabitType(taskToEdit.habitType || "POSITIVE");
      setResetCounter(taskToEdit.resetCounter || "DAILY");
      setImportanceType(
        taskToEdit.importanceType ||
          (taskToEdit.importance?.toUpperCase() as HabitImportanceOption) ||
          "NORMAL",
      );
      setDifficulty(normalizeTaskDifficulty(taskToEdit.difficulty));
      setPriority((taskToEdit.priority as TaskPriorityOption) || "MEDIUM");

      setDueDate(taskToEdit.dueDate || "");
      setReminderType(taskToEdit.reminderType || "NONE");
      setSendEmailReminder(Boolean(taskToEdit.sendEmailReminder));
      setStartDate(taskToEdit.startDate || getTodayDateString());
      setRepeatType(taskToEdit.repeatType || "DAILY");
      setRepeatEvery(taskToEdit.repeatEvery || 1);
      setSelectedDays(
        taskToEdit.daysOfWeek && taskToEdit.daysOfWeek.length > 0
          ? taskToEdit.daysOfWeek
          : ALL_WEEK_DAYS,
      );
      setMonthlyOption(taskToEdit.monthlyOption || "DAY_OF_THE_MONTH");
      resetChecklist(
        taskToEdit.checklist
          ? taskToEdit.checklist.map((item) => ({ ...item }))
          : [],
      );
      setNewChecklistText("");
    } else {
      setTaskType(defaultTaskType || "TODO");
      setColumnId(defaultColumnId || columns[0]?.id || "");
      setName(initialTitle || "");
      setDescription("");
      setTagsInput("");
      setIsHardcore(false);
      setHabitType("POSITIVE");
      setResetCounter("DAILY");
      setImportanceType("NORMAL");
      setDifficulty("MEDIUM");
      setPriority("MEDIUM");
      setDueDate("");
      setReminderType("NONE");
      setSendEmailReminder(false);
      setStartDate(getTodayDateString());
      setRepeatType("DAILY");
      setRepeatEvery(1);
      setSelectedDays(ALL_WEEK_DAYS);
      setMonthlyOption("DAY_OF_THE_MONTH");
      resetChecklist([]);
      setNewChecklistText("");
    }

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  }, [
    isOpen,
    taskToEdit,
    defaultColumnId,
    defaultTaskType,
    initialTitle,
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
      toast.error("O título da tarefa é obrigatório.");
      return;
    }

    if (!columnId) {
      toast.error("Selecione uma lista/coluna para a tarefa.");
      return;
    }

    const tags = parseTaskTags(tagsInput);

    if (tags.length > MAX_TASK_TAGS) {
      toast.error(`Uma tarefa pode ter no máximo ${MAX_TASK_TAGS} tags.`);
      return;
    }

    // Regras de validação do Modo Hardcore para To-dos
    if (taskType === "TODO") {
      const hardcoreError = validateHardcoreTodo({
        isHardcore,
        dueDate,
        isEditing,
        taskToEdit,
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
        dueDate: dueDate || undefined,
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
          toast.error(response.error || "Erro ao atualizar tarefa.");
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
            toast.error(
              moveRes.error ||
                "Erro ao mover tarefa para a nova coluna no servidor.",
            );
          }
        }

        toast.success("Tarefa atualizada com sucesso!");
        onSuccess?.(draftTask, columnId);
        onClose();
        return;
      }

      // MODO CRIAÇÃO
      const payload = buildCreateTaskPayloadFromTask(draftTask);
      const response = await createTask(columnId, payload);

      if (!response.success) {
        toast.error(response.error || "Erro ao criar tarefa.");
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

      const typeLabel =
        taskType === "HABIT"
          ? "Hábito"
          : taskType === "DAILY"
            ? "Diária"
            : "Tarefa";
      soundEffects.playCreateSound();
      toast.success(`${typeLabel} "${trimmedName}" criada!`, {
        description: `Recompensa estimada: +${calculatedRewards.xp} XP • +${calculatedRewards.gold.toFixed(2)} 🪙`,
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
    setDueDate,
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
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    handleToggleChecklistItem,
    taskToEdit,
    handleSubmit,
  };
}

export type CreateTaskFormReturn = ReturnType<typeof useCreateTaskForm>;
