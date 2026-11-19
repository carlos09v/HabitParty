"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  MAX_TASK_TAGS,
  normalizeTaskType,
  TASK_DETAILS_POPOVER_OPTIONS,
  TASK_TITLE_MAX_LENGTH,
} from "@/constants/task";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useChecklist } from "@/hooks/useChecklist";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useIsClient } from "@/hooks/useIsClient";
import { useTaskOptimisticAutoSave } from "@/hooks/useTaskOptimisticAutoSave";
import { useUserStore } from "@/store/userStore";
import type { ChecklistItem, Task, TaskPriorityOption } from "@/types/task";
import type { TaskDetailsPopoverProps } from "@/types/task-ui";
import type { DatePickerEventSchedulePatch } from "@/types/ui";
import {
  isTaskHardcoreLocked,
  normalizeEventSchedulePatch,
} from "@/utils/date";
import { mergeTaskTagsWithLimit, replaceTaskTag } from "@/utils/tags";
import { computeOptimisticHabitDelta, parseTaskTags } from "@/utils/taskMapper";

export function useTaskDetailsPopover({
  isOpen,
  onClose,
  task,
  anchorRect,
  onTaskUpdate,
  onDelete,
  onToggleComplete,
  onHabitChange,
  onEdit,
  onDuplicate,
  onOpenFocusHistory,
}: Omit<TaskDetailsPopoverProps, "columnTitle">) {
  const t = useTranslations("tasks.hooks");
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Refs de sincronização imediata para flush ao fechar sem closures defasadas
  const titleRef = useRef(task?.title || "");
  const descRef = useRef(task?.description || "");
  const descriptionFlushRef = useRef<(() => string) | null>(null);
  const newItemRef = useRef("");
  const checklistRef = useRef<ChecklistItem[]>(task?.checklist || []);
  const syncChecklistRef = useRef<(nextList: ChecklistItem[]) => void>(
    () => {},
  );

  const mounted = useIsClient();
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [dueTime, setDueTime] = useState(
    task?.dueTime ? task.dueTime.slice(0, 5) : "",
  );
  const [startTime, setStartTime] = useState(
    task?.startTime ? task.startTime.slice(0, 5) : "",
  );
  const [dueEndTime, setDueEndTime] = useState(
    task?.dueEndTime ? task.dueEndTime.slice(0, 5) : "",
  );
  const [isAllDay, setIsAllDay] = useState(Boolean(task?.isAllDay));
  const [priority, setPriority] = useState<string>(task?.priority || "NONE");
  const [tags, setTags] = useState<string[]>(task?.tags || []);

  const handleChecklistChanged = useCallback((nextList: ChecklistItem[]) => {
    syncChecklistRef.current(nextList);
  }, []);

  const {
    checklist,
    resetChecklist,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    updateItem: updateChecklistItem,
    deleteItem: deleteChecklistItem,
  } = useChecklist({
    initialItems: task?.checklist,
    taskId: task?.id,
    onChecklistChanged: handleChecklistChanged,
  });

  // Estados de controle da interface
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isMobileScreen, setIsMobileScreen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const popoverPosition = useAnchoredPopoverPosition(
    isOpen,
    anchorRect,
    popoverRef,
    TASK_DETAILS_POPOVER_OPTIONS,
    mounted,
  );

  const applyFieldsToLocalState = useCallback(
    (sourceTask: Task, fieldsToSync?: Partial<Task>) => {
      const checkField = (key: keyof Task) =>
        !fieldsToSync || key in fieldsToSync;

      if (checkField("completed")) {
        setCompleted(Boolean(sourceTask.completed));
      }
      if (checkField("description")) {
        setDescription(sourceTask.description || "");
        descRef.current = sourceTask.description || "";
      }
      if (checkField("title")) {
        setTitle(sourceTask.title || "");
        titleRef.current = sourceTask.title || "";
      }
      if (checkField("dueDate")) {
        setDueDate(sourceTask.dueDate || "");
      }
      if (checkField("dueTime")) {
        setDueTime(sourceTask.dueTime ? sourceTask.dueTime.slice(0, 5) : "");
      }
      if (checkField("startTime")) {
        setStartTime(
          sourceTask.startTime ? sourceTask.startTime.slice(0, 5) : "",
        );
      }
      if (checkField("dueEndTime")) {
        setDueEndTime(
          sourceTask.dueEndTime ? sourceTask.dueEndTime.slice(0, 5) : "",
        );
      }
      if (checkField("isAllDay")) {
        setIsAllDay(Boolean(sourceTask.isAllDay));
      }
      if (checkField("priority")) {
        setPriority(sourceTask.priority || "NONE");
      }
      if (checkField("tags")) {
        setTags(sourceTask.tags || []);
      }
    },
    [],
  );

  const handleNewTaskSelected = useCallback(
    (newTask: Task) => {
      const initialChecklist = newTask.checklist || [];
      resetChecklist(initialChecklist);
      checklistRef.current = initialChecklist;
      setIsAddingTag(false);
      setNewTagText("");
      setIsAddingItem(false);
      setNewItemText("");
      newItemRef.current = "";
    },
    [resetChecklist],
  );

  const {
    getCurrentTask,
    setLatestTaskDraft,
    saveTaskField,
    syncChecklistIntoTask,
  } = useTaskOptimisticAutoSave({
    task,
    checklistRef,
    onTaskUpdate,
    applyFieldsToLocalState,
    onNewTaskSelected: handleNewTaskSelected,
  });

  useEffect(() => {
    syncChecklistRef.current = syncChecklistIntoTask;
  }, [syncChecklistIntoTask]);

  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  const taskType = task ? normalizeTaskType(task) : "todo";
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  const flushPendingChanges = useCallback(() => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;

    const flushedDesc = descriptionFlushRef.current?.();
    if (flushedDesc !== undefined) {
      descRef.current = flushedDesc;
    }

    const trimmedTitle = titleRef.current
      .trim()
      .slice(0, TASK_TITLE_MAX_LENGTH);
    const trimmedDesc = descRef.current.trim();
    const originalDesc = (currentTask.description || "").trim();

    const titleChanged =
      trimmedTitle !== "" && trimmedTitle !== currentTask.title;
    const descChanged = trimmedDesc !== originalDesc;

    if (titleChanged || descChanged) {
      saveTaskField({
        ...(titleChanged ? { title: trimmedTitle } : {}),
        ...(descChanged ? { description: trimmedDesc || undefined } : {}),
      });
    }

    const pendingItem = newItemRef.current.trim();
    if (pendingItem) {
      addChecklistItem(pendingItem);
    }
  }, [getCurrentTask, saveTaskField, addChecklistItem]);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  useClickOutside(popoverRef, handleCloseWithSave, { enabled: isOpen });

  const handleToggleTask = () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const next = !completed;
    if (onToggleComplete?.(currentTask.id, next) === false) return;
    setCompleted(next);
    const updatedTask = { ...currentTask, completed: next };
    setLatestTaskDraft(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleHabitDelta = (delta: number) => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    if (onHabitChange?.(currentTask.id, delta) === false) return;
    const nextFields = computeOptimisticHabitDelta(
      currentTask,
      delta,
      useUserStore.getState().user?.timezone,
    );
    const updatedTask = { ...currentTask, ...nextFields };
    setLatestTaskDraft(updatedTask);
    onTaskUpdate?.(updatedTask);
  };

  const handleTitleBlur = () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const trimmed = title.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) {
      setTitle(currentTask.title);
      titleRef.current = currentTask.title;
      return;
    }
    if (trimmed !== title) {
      setTitle(trimmed);
      titleRef.current = trimmed;
    }
    if (trimmed !== currentTask.title) {
      saveTaskField({ title: trimmed });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleDescriptionBlur = () => {
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const trimmed = descRef.current.trim();
    if (trimmed !== (currentTask.description || "").trim()) {
      saveTaskField({ description: trimmed || undefined });
    }
  };

  const handleDateChange = (newDate: string) => {
    const currentTask = getCurrentTask();
    if (
      !currentTask ||
      isTaskHardcoreLocked(
        currentTask,
        new Date(),
        useUserStore.getState().user?.timezone,
      )
    ) {
      return;
    }
    setDueDate(newDate);
    if (!newDate) {
      setDueTime("");
      setStartTime("");
      setDueEndTime("");
      setIsAllDay(false);
      saveTaskField({
        dueDate: undefined,
        dueTime: undefined,
        startTime: undefined,
        dueEndTime: undefined,
        isAllDay: false,
      });
    } else {
      saveTaskField({ dueDate: newDate });
    }
  };

  const handleEventScheduleChange = (patch: DatePickerEventSchedulePatch) => {
    const currentTask = getCurrentTask();
    const userTimeZone = useUserStore.getState().user?.timezone;
    if (
      !currentTask ||
      isTaskHardcoreLocked(currentTask, new Date(), userTimeZone)
    ) {
      return;
    }

    const normalized = normalizeEventSchedulePatch(
      currentTask,
      patch,
      userTimeZone,
    );

    if (normalized.dueDate !== undefined) setDueDate(normalized.dueDate);
    if (normalized.dueTime !== undefined) setDueTime(normalized.dueTime);
    if (normalized.startTime !== undefined) setStartTime(normalized.startTime);
    if (normalized.dueEndTime !== undefined) {
      setDueEndTime(normalized.dueEndTime);
    }
    if (normalized.isAllDay !== undefined) setIsAllDay(normalized.isAllDay);

    saveTaskField(normalized.taskPatch);
  };

  const handlePrioritySelect = (p: TaskPriorityOption) => {
    setPriority(p);
    saveTaskField({ priority: p });
  };

  const handleAddTag = (explicitTagInput?: string) => {
    const rawInput =
      typeof explicitTagInput === "string" ? explicitTagInput : newTagText;
    const { nextTags, addedAny, errorKey } = mergeTaskTagsWithLimit(
      tags,
      parseTaskTags(rawInput),
      MAX_TASK_TAGS,
    );

    if (errorKey === "maxTagsError") {
      toast.error(t("maxTagsError", { max: MAX_TASK_TAGS }));
    } else if (errorKey === "tagAlreadyAdded") {
      toast.error(t("tagAlreadyAdded"));
    }

    if (addedAny) {
      setTags(nextTags);
      saveTaskField({ tags: nextTags });
    }
    setNewTagText("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    saveTaskField({ tags: nextTags });
  };

  const handleUpdateTag = (oldTag: string, newTag: string) => {
    const { nextTags, updated, errorKey } = replaceTaskTag(
      tags,
      oldTag,
      newTag,
    );
    if (errorKey === "tagAlreadyAdded") {
      toast.error(t("tagAlreadyAdded"));
      return;
    }
    if (updated) {
      setTags(nextTags);
      saveTaskField({ tags: nextTags });
    }
  };

  const handleAddCheckItem = async () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setNewItemText("");
    newItemRef.current = "";
    setIsAddingItem(false);
    await addChecklistItem(trimmed);
  };

  const handleDeleteTask = () => {
    if (!task) return;
    onDelete?.(task.id);
    onClose();
  };

  const handleDuplicateTask = () => {
    if (task) {
      flushPendingChanges();
      const currentTask: Task = {
        ...task,
        title: titleRef.current.trim() || task.title,
        description: descRef.current.trim() || task.description,
        tags,
        checklist:
          checklistRef.current.length > 0
            ? checklistRef.current
            : task.checklist,
      };
      onDuplicate?.(currentTask);
      onClose();
    }
  };

  const handleOpenFullModal = () => {
    if (task) {
      flushPendingChanges();
      onEdit?.(task);
      onClose();
    }
  };

  const handleOpenFocusHistory = () => {
    if (task) {
      flushPendingChanges();
      onOpenFocusHistory?.(task);
      onClose();
    }
  };

  return {
    mounted,
    popoverRef,
    titleInputRef,
    isMobileScreen,
    popoverPosition,
    completed,
    title,
    setTitle: (val: string) => {
      const clamped = val.slice(0, TASK_TITLE_MAX_LENGTH);
      setTitle(clamped);
      titleRef.current = clamped;
    },
    description,
    setDescription: (val: string) => {
      setDescription(val);
      descRef.current = val;
    },
    descriptionFlushRef,
    dueDate,
    dueTime,
    startTime,
    dueEndTime,
    isAllDay,
    priority,
    tags,
    isAddingTag,
    setIsAddingTag,
    newTagText,
    setNewTagText,
    cancelAddTag: () => {
      setIsAddingTag(false);
      setNewTagText("");
    },
    checklist,
    isAddingItem,
    setIsAddingItem,
    newItemText,
    setNewItemText: (val: string) => {
      setNewItemText(val);
      newItemRef.current = val;
    },
    cancelAddItem: () => {
      setIsAddingItem(false);
      newItemRef.current = "";
    },
    isHabit,
    isDaily,
    isTodo,
    handleCloseWithSave,
    handleToggleTask,
    handleHabitDelta,
    handleTitleBlur,
    handleTitleKeyDown,
    handleDescriptionBlur,
    handleDateChange,
    handleEventScheduleChange,
    handlePrioritySelect,
    handleAddTag,
    handleRemoveTag,
    handleUpdateTag,
    handleAddCheckItem,
    handleToggleCheckItem: toggleChecklistItem,
    handleUpdateCheckItem: updateChecklistItem,
    handleDeleteCheckItem: deleteChecklistItem,
    handleDeleteTask,
    handleDuplicateTask,
    handleOpenFullModal,
    handleOpenFocusHistory,
  };
}
