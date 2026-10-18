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
  CreateTaskDTO,
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
  UpdateTaskDTO,
} from "@/types/task";
import { calculateTaskReward } from "@/utils/economy";
import { parseTaskTags } from "@/utils/taskMapper";
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
      setStartDate(
        taskToEdit.startDate || new Date().toISOString().split("T")[0],
      );
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
      setStartDate(new Date().toISOString().split("T")[0]);
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
      if (isEditing && taskToEdit) {
        // MODO EDIÇÃO
        const updatePayload: UpdateTaskDTO = {
          name: trimmedName,
          description: description.trim() || undefined,
          isHardcoreModeEnabled: isHardcore,
          tags: tags.length > 0 ? tags : undefined,
          priority: priority || undefined,
          ...(taskType === "HABIT" && {
            habitType,
            resetCounter,
            importanceType,
            difficulty,
          }),
          ...(taskType === "DAILY" && {
            difficulty,
            startDate: startDate || undefined,
            repeatType,
            repeatEvery,
            ...(repeatType === "WEEKLY" && {
              daysOfWeek: selectedDays,
            }),
            ...(repeatType === "MONTHLY" && {
              monthlyOption,
            }),
          }),
          ...(taskType === "TODO" && {
            difficulty,
            dueDate: dueDate || undefined,
            reminderType,
            sendEmailReminder:
              reminderType !== "NONE" ? sendEmailReminder : false,
          }),
        };

        const response = await updateTask(taskToEdit.id, updatePayload);

        if (!response.success) {
          toast.error(response.error || "Erro ao atualizar tarefa.");
          return;
        }

        // Se a coluna foi alterada na edição, persiste a movimentação de coluna no backend
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

        const calculatedRewards = calculateTaskReward({
          taskType,
          difficulty,
          importanceType,
          resetCounter,
          repeatType,
          currentStreak: taskToEdit.streak ?? 0,
          isHardcoreModeEnabled: isHardcore,
          dueDate: dueDate || undefined,
          isPenaltyApplied: taskToEdit.isPenaltyApplied,
        });

        const updatedTask: Task = {
          ...taskToEdit,
          title: trimmedName,
          description: description.trim() || undefined,
          category:
            tags[0] ||
            (taskToEdit.category !== "Geral" ? taskToEdit.category : undefined),
          tags: tags.length > 0 ? tags : taskToEdit.tags,
          type: (taskType.toLowerCase() as TaskType) || taskToEdit.type,
          difficulty: difficulty,
          importance: importanceType.toLowerCase() as HabitImportance,
          importanceType,
          priority: priority,
          habitType,
          resetCounter,
          rewardXp: calculatedRewards.xp,
          rewardGold: calculatedRewards.gold,
          dueDate: dueDate || undefined,
          columnId: columnId,
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
          sendEmailReminder:
            reminderType !== "NONE" ? sendEmailReminder : false,
          checklist: checklist,
        };

        toast.success("Tarefa atualizada com sucesso!");
        onSuccess?.(updatedTask, columnId);
        onClose();
        return;
      }

      // MODO CRIAÇÃO
      const payload: CreateTaskDTO = {
        name: trimmedName,
        description: description.trim() || undefined,
        taskType: taskType,
        isHardcoreModeEnabled: isHardcore,
        tags: tags.length > 0 ? tags : undefined,
        priority: priority || undefined,
        ...(taskType === "HABIT" && {
          habitType,
          resetCounter,
          importanceType,
          difficulty,
        }),
        ...(taskType === "DAILY" && {
          difficulty,
          startDate: startDate || undefined,
          repeatType,
          repeatEvery,
          ...(repeatType === "WEEKLY" && {
            daysOfWeek: selectedDays,
          }),
          ...(repeatType === "MONTHLY" && {
            monthlyOption,
          }),
        }),
        ...(taskType === "TODO" && {
          difficulty,
          dueDate: dueDate || undefined,
          reminderType,
          sendEmailReminder:
            reminderType !== "NONE" ? sendEmailReminder : false,
        }),
      };

      const response = await createTask(columnId, payload);

      if (!response.success) {
        toast.error(response.error || "Erro ao criar tarefa.");
        return;
      }

      const createdTaskData = response.data;
      const createdTaskId = createdTaskData?.id;

      // Se houver itens de checklist, adiciona-os em paralelo
      if (createdTaskId && checklist.length > 0) {
        await cloneTaskChecklistItems(createdTaskId, checklist);
      }

      const calculatedRewards = calculateTaskReward({
        taskType,
        difficulty,
        importanceType,
        resetCounter,
        repeatType,
        currentStreak: 0,
        isHardcoreModeEnabled: isHardcore,
        dueDate: dueDate || undefined,
      });

      // Mapeia para a entidade local Task da UI
      const mappedTask: Task = {
        id: createdTaskId || `tsk-${Date.now()}`,
        title: trimmedName,
        description: description.trim() || undefined,
        category: tags[0] || undefined,
        tags,
        type: (taskType.toLowerCase() as TaskType) || "todo",
        difficulty: difficulty,
        importance: importanceType.toLowerCase() as HabitImportance,
        importanceType,
        priority: createdTaskData?.priority || priority,
        habitType,
        resetCounter,
        rewardXp: calculatedRewards.xp,
        rewardGold: calculatedRewards.gold,
        completed: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        dueDate: dueDate || undefined,
        columnId: columnId,
        order: 0,
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
        sendEmailReminder: reminderType !== "NONE" ? sendEmailReminder : false,
        checklist: checklist,
      };

      toast.success("Tarefa criada com sucesso!");
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
