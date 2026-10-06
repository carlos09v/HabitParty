"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addChecklistItemAction } from "@/actions/checklistActions";
import { createTask, updateTask } from "@/actions/taskActions";
import { normalizeTaskDifficulty } from "@/constants/task";
import type {
  CreateTaskDTO,
  DailyDaysOfWeek,
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

export interface UseCreateTaskFormOptions {
  isOpen: boolean;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
  onClose: () => void;
}

export function useCreateTaskForm({
  isOpen,
  columns,
  defaultColumnId,
  taskToEdit,
  onSuccess,
  onClose,
}: UseCreateTaskFormOptions) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!taskToEdit;

  // Tipo de tarefa ativo
  const [taskType, setTaskType] = useState<TaskTypeOption>("TODO");

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

  // Campos específicos de Daily
  const [startDate, setStartDate] = useState("");
  const [repeatType, setRepeatType] = useState<DailyRepeatTypeOption>("DAILY");
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [selectedDays, setSelectedDays] = useState<DailyDaysOfWeek[]>([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ]);

  // Checklist de subtarefas rascunhadas
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset e inicialização ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        const rawType = (taskToEdit.type || "todo").toString().toUpperCase();
        const mappedType: TaskTypeOption =
          rawType === "HABIT"
            ? "HABIT"
            : rawType === "DAILY"
              ? "DAILY"
              : "TODO";

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
        setIsHardcore(taskToEdit.isHardcoreModeEnabled ?? false);
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
        setStartDate(
          taskToEdit.startDate || new Date().toISOString().split("T")[0],
        );
        setRepeatType(taskToEdit.repeatType || "DAILY");
        setRepeatEvery(taskToEdit.repeatEvery || 1);
        setSelectedDays(
          taskToEdit.daysOfWeek || [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
          ],
        );
        setChecklist([]);
        setNewChecklistText("");
      } else {
        setColumnId(defaultColumnId || columns[0]?.id || "");
        setName("");
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
        setStartDate(new Date().toISOString().split("T")[0]);
        setRepeatType("DAILY");
        setRepeatEvery(1);
        setSelectedDays([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
        ]);
        setChecklist([]);
        setNewChecklistText("");
      }

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultColumnId, columns, taskToEdit]);

  const handleAddChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (trimmed) {
      setChecklist((prev) => [...prev, trimmed]);
      setNewChecklistText("");
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
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

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const effectiveRepeatType: DailyRepeatTypeOption =
      taskType === "DAILY"
        ? selectedDays.length > 0 &&
          (repeatType === "WEEKLY" || selectedDays.length < 7)
          ? "WEEKLY"
          : repeatType
        : repeatType;

    startTransition(async () => {
      if (isEditing && taskToEdit) {
        // MODO EDIÇÃO
        const updatePayload: UpdateTaskDTO = {
          name: trimmedName,
          description: description.trim() || undefined,
          isHardcoreModeEnabled: isHardcore,
          tags: tags.length > 0 ? tags : undefined,
          ...(taskType === "HABIT" && {
            habitType,
            resetCounter,
            importanceType,
            difficulty,
          }),
          ...(taskType === "DAILY" && {
            difficulty,
            startDate: startDate || undefined,
            repeatType: effectiveRepeatType,
            repeatEvery,
            daysOfWeek: selectedDays,
          }),
          ...(taskType === "TODO" && {
            difficulty,
            priority,
            dueDate: dueDate || undefined,
            reminderType,
          }),
        };

        const response = await updateTask(taskToEdit.id, updatePayload);

        if (!response.success) {
          toast.error(response.error || "Erro ao atualizar tarefa.");
          return;
        }

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
          habitType,
          resetCounter,
          dueDate: dueDate || undefined,
          columnId: columnId,
          daysOfWeek: taskType === "DAILY" ? selectedDays : undefined,
          repeatType: taskType === "DAILY" ? effectiveRepeatType : undefined,
          repeatEvery: taskType === "DAILY" ? repeatEvery : undefined,
          startDate: taskType === "DAILY" ? startDate : undefined,
          isHardcoreModeEnabled: isHardcore,
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
        ...(taskType === "HABIT" && {
          habitType,
          resetCounter,
          importanceType,
          difficulty,
        }),
        ...(taskType === "DAILY" && {
          difficulty,
          startDate: startDate || undefined,
          repeatType: effectiveRepeatType,
          repeatEvery,
          daysOfWeek: selectedDays,
        }),
        ...(taskType === "TODO" && {
          difficulty,
          priority,
          dueDate: dueDate || undefined,
          reminderType,
        }),
      };

      const response = await createTask(columnId, payload);

      if (!response.success) {
        toast.error(response.error || "Erro ao criar tarefa.");
        return;
      }

      const createdTaskData = response.data;
      const createdTaskId = createdTaskData?.id;

      // Se houver itens de checklist, adiciona-os sequencialmente
      if (createdTaskId && checklist.length > 0) {
        for (const itemText of checklist) {
          await addChecklistItemAction(createdTaskId, { name: itemText });
        }
      }

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
        habitType,
        resetCounter,
        rewardXp: 10,
        rewardGold: 1.5,
        completed: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        dueDate: dueDate || undefined,
        columnId: columnId,
        order: 0,
        daysOfWeek: taskType === "DAILY" ? selectedDays : undefined,
        repeatType: taskType === "DAILY" ? effectiveRepeatType : undefined,
        repeatEvery: taskType === "DAILY" ? repeatEvery : undefined,
        startDate: taskType === "DAILY" ? startDate : undefined,
        isHardcoreModeEnabled: isHardcore,
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
    setTaskType,
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
    startDate,
    setStartDate,
    repeatType,
    setRepeatType,
    repeatEvery,
    setRepeatEvery,
    selectedDays,
    toggleDayOfWeek,
    checklist,
    newChecklistText,
    setNewChecklistText,
    nameInputRef,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    handleSubmit,
  };
}

export type CreateTaskFormReturn = ReturnType<typeof useCreateTaskForm>;
