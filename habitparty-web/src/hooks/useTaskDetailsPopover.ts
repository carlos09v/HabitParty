"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateTask } from "@/actions/taskActions";
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
import { useUserStore } from "@/store/userStore";
import type { ChecklistItem, Task, TaskPriorityOption } from "@/types/task";
import type { TaskDetailsPopoverProps } from "@/types/task-ui";
import type { DatePickerEventSchedulePatch } from "@/types/ui";
import {
  isTaskHardcoreLocked,
  normalizeEventSchedulePatch,
} from "@/utils/date";
import { calculateTaskReward } from "@/utils/economy";
import { mergeTaskTagsWithLimit, replaceTaskTag } from "@/utils/tags";
import {
  buildUpdateTaskPayload,
  computeOptimisticHabitDelta,
  mapTaskResponseToTask,
  parseTaskTags,
} from "@/utils/taskMapper";

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

  // Refs de sincronização imediata para auto-save e consolidação atômica sem closures defasadas
  const titleRef = useRef(task?.title || "");
  const descRef = useRef(task?.description || "");
  const descriptionFlushRef = useRef<(() => string) | null>(null);
  const newItemRef = useRef("");
  const checklistRef = useRef<ChecklistItem[]>(task?.checklist || []);
  const latestTaskRef = useRef<Task | undefined>(task);
  const confirmedTaskRef = useRef<Task | undefined>(task);
  const pendingFieldsRef = useRef<Partial<Task>>({});
  const flushScheduledRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

  const handleChecklistChanged = useCallback(
    (nextList: ChecklistItem[]) => {
      checklistRef.current = nextList;
      const baseTask = latestTaskRef.current;
      if (baseTask) {
        const updatedTask = { ...baseTask, checklist: nextList };
        latestTaskRef.current = updatedTask;
        confirmedTaskRef.current = confirmedTaskRef.current
          ? { ...confirmedTaskRef.current, checklist: nextList }
          : updatedTask;
        onTaskUpdate?.(updatedTask);
      }
    },
    [onTaskUpdate],
  );

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
  const syncedTaskIdRef = useRef<string | undefined>(task?.id);

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

  // Sincroniza dados locais e refs apenas quando uma tarefa diferente passa a ser exibida
  useEffect(() => {
    if (!task) {
      syncedTaskIdRef.current = undefined;
      latestTaskRef.current = undefined;
      confirmedTaskRef.current = undefined;
      pendingFieldsRef.current = {};
      flushScheduledRef.current = false;
      return;
    }
    if (syncedTaskIdRef.current === task.id) return;
    syncedTaskIdRef.current = task.id;
    latestTaskRef.current = task;
    confirmedTaskRef.current = task;
    pendingFieldsRef.current = {};
    flushScheduledRef.current = false;

    applyFieldsToLocalState(task);
    const initialChecklist = task.checklist || [];
    resetChecklist(initialChecklist);
    checklistRef.current = initialChecklist;
    setIsAddingTag(false);
    setNewTagText("");
    setIsAddingItem(false);
    setNewItemText("");
    newItemRef.current = "";
  }, [task, resetChecklist, applyFieldsToLocalState]);

  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  const taskType = task ? normalizeTaskType(task) : "todo";
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  const saveTaskField = useCallback(
    (fields: Partial<Task>) => {
      const baseTask = latestTaskRef.current ?? task;
      if (!baseTask) return;

      const currentChecklist =
        checklistRef.current.length > 0
          ? checklistRef.current
          : baseTask.checklist || [];

      const mergedDraft: Task = {
        ...baseTask,
        checklist: currentChecklist,
        ...fields,
      };
      const reward = calculateTaskReward({
        ...mergedDraft,
        isHardcoreModeEnabled: mergedDraft.isHardcoreModeEnabled,
        dueDate: mergedDraft.dueDate,
        isPenaltyApplied: mergedDraft.isPenaltyApplied,
      });
      const updated: Task = {
        ...mergedDraft,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
      };

      latestTaskRef.current = updated;
      pendingFieldsRef.current = {
        ...pendingFieldsRef.current,
        ...fields,
      };
      saveSequenceRef.current += 1;
      onTaskUpdate?.(updated);

      if (flushScheduledRef.current) return;
      flushScheduledRef.current = true;

      queueMicrotask(() => {
        flushScheduledRef.current = false;
        const snapshotTask = latestTaskRef.current;
        const patchedFields = pendingFieldsRef.current;
        pendingFieldsRef.current = {};
        if (!snapshotTask) return;

        const batchSeq = saveSequenceRef.current;
        const payload = buildUpdateTaskPayload(
          snapshotTask,
          undefined,
          useUserStore.getState().user?.timezone,
        );

        saveChainRef.current = saveChainRef.current.then(async () => {
          const previousConfirmed = confirmedTaskRef.current ?? snapshotTask;
          const res = await updateTask(snapshotTask.id, payload);
          if (!res.success) {
            toast.error(res.error || t("saveChangesError"));
            if (batchSeq === saveSequenceRef.current) {
              latestTaskRef.current = previousConfirmed;
              onTaskUpdate?.(previousConfirmed);
              if (isMountedRef.current) {
                applyFieldsToLocalState(previousConfirmed, patchedFields);
              }
            }
          } else if (res.data) {
            const mappedServer = mapTaskResponseToTask(
              res.data,
              snapshotTask.columnId || "",
            );
            const finalChecklist =
              res.data.checklist && res.data.checklist.length > 0
                ? res.data.checklist
                : snapshotTask.checklist;
            const syncedTask: Task = {
              ...mappedServer,
              title: res.data.name || snapshotTask.title,
              checklist: finalChecklist,
              totalFocusMinutes:
                res.data.totalFocusMinutes ?? snapshotTask.totalFocusMinutes,
              focusCyclesCount:
                res.data.focusCyclesCount ?? snapshotTask.focusCyclesCount,
            };
            confirmedTaskRef.current = syncedTask;
            if (batchSeq === saveSequenceRef.current) {
              latestTaskRef.current = syncedTask;
              onTaskUpdate?.(syncedTask);
              if (isMountedRef.current) {
                applyFieldsToLocalState(syncedTask, {
                  dueDate: syncedTask.dueDate,
                  dueTime: syncedTask.dueTime,
                  startTime: syncedTask.startTime,
                  dueEndTime: syncedTask.dueEndTime,
                  isAllDay: syncedTask.isAllDay,
                });
              }
            }
          }
        });
      });
    },
    [task, onTaskUpdate, applyFieldsToLocalState, t],
  );

  const flushPendingChanges = useCallback(() => {
    const currentTask = latestTaskRef.current ?? task;
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
  }, [task, saveTaskField, addChecklistItem]);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  useClickOutside(popoverRef, handleCloseWithSave, { enabled: isOpen });

  const handleToggleTask = () => {
    const currentTask = latestTaskRef.current ?? task;
    if (!currentTask) return;
    const next = !completed;
    setCompleted(next);
    const updatedTask = { ...currentTask, completed: next };
    latestTaskRef.current = updatedTask;
    onToggleComplete?.(currentTask.id, next);
    onTaskUpdate?.(updatedTask);
  };

  const handleHabitDelta = (delta: number) => {
    const currentTask = latestTaskRef.current ?? task;
    if (!currentTask) return;
    onHabitChange?.(currentTask.id, delta);
    const nextFields = computeOptimisticHabitDelta(
      currentTask,
      delta,
      useUserStore.getState().user?.timezone,
    );
    const updatedTask = { ...currentTask, ...nextFields };
    latestTaskRef.current = updatedTask;
    onTaskUpdate?.(updatedTask);
  };

  const handleTitleBlur = () => {
    const currentTask = latestTaskRef.current ?? task;
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
    const currentTask = latestTaskRef.current ?? task;
    if (!currentTask) return;
    const trimmed = descRef.current.trim();
    if (trimmed !== (currentTask.description || "").trim()) {
      saveTaskField({ description: trimmed || undefined });
    }
  };

  const handleDateChange = (newDate: string) => {
    const currentTask = latestTaskRef.current ?? task;
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
    const currentTask = latestTaskRef.current ?? task;
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
