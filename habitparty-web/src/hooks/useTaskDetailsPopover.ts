"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  countRewardedChecklistItems,
  MAX_REWARDED_SUBTASKS,
  MAX_TASK_TAGS,
  normalizeTaskType,
  supportsRewardedChecklistSteps,
  TASK_DETAILS_POPOVER_OPTIONS,
  TASK_TITLE_MAX_LENGTH,
} from "@/constants/task";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useChecklist } from "@/hooks/useChecklist";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useIsClient } from "@/hooks/useIsClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  isReadOnly = false,
  onOpenFocusHistory,
}: Omit<TaskDetailsPopoverProps, "columnTitle">) {
  const t = useTranslations("tasks.hooks");
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Refs de sincronização imediata para flush ao fechar sem closures defasadas
  const titleRef = useRef(task?.title || "");
  const descRef = useRef(task?.description || "");
  const descriptionFlushRef = useRef<(() => string) | null>(null);
  const newTagTextRef = useRef("");
  const tagsRef = useRef<string[]>(task?.tags || []);
  const newItemRef = useRef("");
  const newItemRewardedRef = useRef(false);
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

  const canRewardChecklistItems = supportsRewardedChecklistSteps(task);

  const {
    checklist,
    resetChecklist,
    addItem: addChecklistItem,
    toggleItem: toggleChecklistItem,
    toggleItemReward: toggleChecklistItemReward,
    updateItem: updateChecklistItem,
    deleteItem: deleteChecklistItem,
  } = useChecklist({
    initialItems: task?.checklist,
    taskId: task?.id,
    onChecklistChanged: handleChecklistChanged,
    canRewardItems: canRewardChecklistItems,
    isRewardLocked: completed,
  });

  // Estados de controle da interface
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isNewItemRewarded, setIsNewItemRewarded] = useState(false);
  const isMobileScreen = useMediaQuery("(max-width: 639px)", false);

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
        const nextTags = sourceTask.tags || [];
        setTags(nextTags);
        tagsRef.current = nextTags;
      }
      if (checkField("checklist") && fieldsToSync && sourceTask.checklist) {
        resetChecklist(sourceTask.checklist);
        checklistRef.current = sourceTask.checklist;
      }
    },
    [resetChecklist],
  );

  const handleNewTaskSelected = useCallback(
    (newTask: Task) => {
      const initialChecklist = newTask.checklist || [];
      resetChecklist(initialChecklist);
      checklistRef.current = initialChecklist;
      setIsAddingTag(false);
      setNewTagText("");
      newTagTextRef.current = "";
      tagsRef.current = newTask.tags || [];
      setIsAddingItem(false);
      setNewItemText("");
      newItemRef.current = "";
      setIsNewItemRewarded(false);
      newItemRewardedRef.current = false;
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
    if (isReadOnly) return;
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

    let flushedTags: string[] | undefined;
    const pendingTagInput = newTagTextRef.current.trim();
    if (pendingTagInput) {
      newTagTextRef.current = "";
      const { nextTags, addedAny } = mergeTaskTagsWithLimit(
        tagsRef.current,
        parseTaskTags(pendingTagInput),
        MAX_TASK_TAGS,
      );
      if (addedAny) {
        flushedTags = nextTags;
        tagsRef.current = nextTags;
        setTags(nextTags);
      }
    }

    if (titleChanged || descChanged || flushedTags) {
      saveTaskField({
        ...(titleChanged ? { title: trimmedTitle } : {}),
        ...(descChanged ? { description: trimmedDesc || undefined } : {}),
        ...(flushedTags ? { tags: flushedTags } : {}),
      });
    }

    const pendingItem = newItemRef.current.trim();
    if (pendingItem) {
      const currentTaskForItem = getCurrentTask();
      const canMarkRewarded =
        supportsRewardedChecklistSteps(currentTaskForItem) &&
        !currentTaskForItem?.completed &&
        newItemRewardedRef.current &&
        countRewardedChecklistItems(checklistRef.current) <
          MAX_REWARDED_SUBTASKS;
      newItemRef.current = "";
      newItemRewardedRef.current = false;
      addChecklistItem(pendingItem, canMarkRewarded);
    }
  }, [isReadOnly, getCurrentTask, saveTaskField, addChecklistItem]);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  useClickOutside(popoverRef, handleCloseWithSave, {
    enabled: isOpen,
    onEscape: handleCloseWithSave,
  });

  // Foco ao abrir + restauração de foco ao fechar (WCAG 2.4.3 / 2.1.2)
  useEffect(() => {
    if (!isOpen || !mounted) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frameId = window.requestAnimationFrame(() => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(document.activeElement)
      ) {
        popoverRef.current.focus({ preventScroll: true });
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (
        previousFocus?.isConnected &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          popoverRef.current?.contains(document.activeElement))
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isOpen, mounted]);

  // Em mobile (< sm), trava rolagem do body e contém o foco via Tab dentro do bottom sheet modal
  useEffect(() => {
    if (!isOpen || !mounted || !isMobileScreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleTrapTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !popoverRef.current) return;
      const focusables = popoverRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === popoverRef.current
        ) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleTrapTab);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleTrapTab);
    };
  }, [isOpen, mounted, isMobileScreen]);

  const handleToggleTask = () => {
    if (isReadOnly) return;
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const next = !completed;
    if (onToggleComplete) {
      if (onToggleComplete(currentTask.id, next) === false) return;
    }
    setCompleted(next);
    const nextChecklist =
      next && !isHabit && checklistRef.current.length > 0
        ? checklistRef.current.map((item) => ({ ...item, isCompleted: true }))
        : checklistRef.current;
    if (next && !isHabit && checklistRef.current.length > 0) {
      resetChecklist(nextChecklist);
      checklistRef.current = nextChecklist;
    }
    const updatedTask = {
      ...currentTask,
      completed: next,
      hasClaimedReward: next ? true : currentTask.hasClaimedReward,
      lastCompletedAt: next
        ? new Date().toISOString()
        : currentTask.lastCompletedAt,
      checklist: nextChecklist,
    };
    setLatestTaskDraft(updatedTask);
    if (!onToggleComplete) {
      onTaskUpdate?.(updatedTask);
    }
  };

  const handleHabitDelta = (delta: number) => {
    if (isReadOnly) return;
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    if (onHabitChange) {
      if (onHabitChange(currentTask.id, delta) === false) return;
    }
    const nextFields = computeOptimisticHabitDelta(
      currentTask,
      delta,
      useUserStore.getState().user?.timezone,
    );
    const updatedTask = { ...currentTask, ...nextFields };
    setLatestTaskDraft(updatedTask);
    if (!onHabitChange) {
      onTaskUpdate?.(updatedTask);
    }
  };

  const handleTitleBlur = () => {
    if (isReadOnly) return;
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const currentTitleValue = titleRef.current;
    const trimmed = currentTitleValue.trim().slice(0, TASK_TITLE_MAX_LENGTH);
    if (!trimmed) {
      setTitle(currentTask.title);
      titleRef.current = currentTask.title;
      return;
    }
    if (trimmed !== currentTitleValue) {
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
    if (isReadOnly) return;
    const currentTask = getCurrentTask();
    if (!currentTask) return;
    const trimmed = descRef.current.trim();
    if (trimmed !== (currentTask.description || "").trim()) {
      saveTaskField({ description: trimmed || undefined });
    }
  };

  const handleDateChange = (newDate: string) => {
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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

    const nextIsAllDay =
      normalized.isAllDay !== undefined
        ? normalized.isAllDay
        : Boolean(currentTask.isAllDay);
    const nextStart =
      (normalized.startTime !== undefined
        ? normalized.startTime
        : currentTask.startTime) ||
      (normalized.dueTime !== undefined
        ? normalized.dueTime
        : currentTask.dueTime) ||
      "";
    const nextEnd =
      normalized.dueEndTime !== undefined
        ? normalized.dueEndTime
        : currentTask.dueEndTime || "";

    if (!nextIsAllDay && nextEnd && (!nextStart || nextEnd <= nextStart)) {
      toast.error(t("dueEndTimeAfterStartError"));
      return;
    }

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
    if (isReadOnly) return;
    setPriority(p);
    saveTaskField({ priority: p });
  };

  const handleAddTag = (explicitTagInput?: string) => {
    if (isReadOnly) return;
    const rawInput =
      typeof explicitTagInput === "string"
        ? explicitTagInput
        : newTagTextRef.current;
    const { nextTags, addedAny, errorKey } = mergeTaskTagsWithLimit(
      tagsRef.current,
      parseTaskTags(rawInput),
      MAX_TASK_TAGS,
    );

    if (errorKey === "maxTagsError") {
      toast.error(t("maxTagsError", { max: MAX_TASK_TAGS }));
    } else if (errorKey === "tagAlreadyAdded") {
      toast.error(t("tagAlreadyAdded"));
    }

    if (addedAny) {
      tagsRef.current = nextTags;
      setTags(nextTags);
      saveTaskField({ tags: nextTags });
    }
    newTagTextRef.current = "";
    setNewTagText("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (isReadOnly) return;
    const nextTags = tagsRef.current.filter((item) => item !== tagToRemove);
    tagsRef.current = nextTags;
    setTags(nextTags);
    saveTaskField({ tags: nextTags });
  };

  const handleUpdateTag = (oldTag: string, newTag: string) => {
    if (isReadOnly) return;
    const { nextTags, updated, errorKey } = replaceTaskTag(
      tagsRef.current,
      oldTag,
      newTag,
    );
    if (errorKey === "tagAlreadyAdded") {
      toast.error(t("tagAlreadyAdded"));
      return;
    }
    if (updated) {
      tagsRef.current = nextTags;
      setTags(nextTags);
      saveTaskField({ tags: nextTags });
    }
  };

  const handleAddCheckItem = async () => {
    if (isReadOnly) return;
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    const shouldReward =
      canRewardChecklistItems &&
      !completed &&
      isNewItemRewarded &&
      countRewardedChecklistItems(checklist) < MAX_REWARDED_SUBTASKS;
    setNewItemText("");
    newItemRef.current = "";
    setIsNewItemRewarded(false);
    newItemRewardedRef.current = false;
    await addChecklistItem(trimmed, shouldReward);
  };

  const handleToggleCheckItem = useCallback(
    (itemId?: string) => {
      if (isReadOnly) return;
      void toggleChecklistItem(itemId);
    },
    [isReadOnly, toggleChecklistItem],
  );

  const handleToggleCheckItemReward = useCallback(
    (itemId?: string) => {
      if (isReadOnly) return;
      void toggleChecklistItemReward(itemId);
    },
    [isReadOnly, toggleChecklistItemReward],
  );

  const handleUpdateCheckItem = useCallback(
    (itemId?: string, newName?: string) => {
      if (isReadOnly) return;
      void updateChecklistItem(itemId, newName);
    },
    [isReadOnly, updateChecklistItem],
  );

  const handleDeleteCheckItem = useCallback(
    (itemId?: string) => {
      if (isReadOnly) return;
      void deleteChecklistItem(itemId);
    },
    [isReadOnly, deleteChecklistItem],
  );

  const buildCurrentTaskSnapshot = useCallback((): Task | null => {
    const baseTask = getCurrentTask() ?? task;
    if (!baseTask) return null;

    const flushedDesc = descriptionFlushRef.current?.();
    if (flushedDesc !== undefined) {
      descRef.current = flushedDesc;
    }

    const trimmedTitle = titleRef.current
      .trim()
      .slice(0, TASK_TITLE_MAX_LENGTH);
    const trimmedDesc = descRef.current.trim();

    return {
      ...baseTask,
      title: trimmedTitle || baseTask.title,
      description: trimmedDesc || undefined,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      startTime: startTime || undefined,
      dueEndTime: dueEndTime || undefined,
      isAllDay,
      priority: priority as TaskPriorityOption,
      tags: tagsRef.current,
      checklist: checklistRef.current,
    };
  }, [
    dueDate,
    dueEndTime,
    dueTime,
    getCurrentTask,
    isAllDay,
    priority,
    startTime,
    task,
  ]);

  const handleDeleteTask = () => {
    if (isReadOnly || !task) return;
    onDelete?.(task.id);
  };

  const handleDuplicateTask = () => {
    if (isReadOnly || !task) return;
    flushPendingChanges();
    const currentTask = buildCurrentTaskSnapshot();
    if (!currentTask) return;
    onDuplicate?.(currentTask);
    onClose();
  };

  const handleOpenFullModal = () => {
    if (isReadOnly || !task) return;
    flushPendingChanges();
    const snapshot = buildCurrentTaskSnapshot();
    if (!snapshot) return;
    onEdit?.(snapshot);
    onClose();
  };

  const handleOpenFocusHistory = () => {
    if (!task) return;
    flushPendingChanges();
    const snapshot = buildCurrentTaskSnapshot();
    onOpenFocusHistory?.(snapshot ?? task);
    onClose();
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
    setNewTagText: (val: string) => {
      setNewTagText(val);
      newTagTextRef.current = val;
    },
    cancelAddTag: () => {
      setIsAddingTag(false);
      setNewTagText("");
      newTagTextRef.current = "";
    },
    checklist,
    isAddingItem,
    setIsAddingItem,
    newItemText,
    setNewItemText: (val: string) => {
      setNewItemText(val);
      newItemRef.current = val;
    },
    isNewItemRewarded,
    setIsNewItemRewarded: (val: boolean) => {
      setIsNewItemRewarded(val);
      newItemRewardedRef.current = val;
    },
    cancelAddItem: () => {
      setIsAddingItem(false);
      setIsNewItemRewarded(false);
      newItemRef.current = "";
      newItemRewardedRef.current = false;
    },
    isHabit,
    isDaily,
    isTodo,
    canRewardChecklistItems,
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
    handleToggleCheckItem,
    handleToggleCheckItemReward,
    handleUpdateCheckItem,
    handleDeleteCheckItem,
    handleDeleteTask,
    handleDuplicateTask,
    handleOpenFullModal,
    handleOpenFocusHistory,
  };
}
