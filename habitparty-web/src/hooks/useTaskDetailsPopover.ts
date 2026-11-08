"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTask } from "@/actions/taskActions";
import {
  MAX_TASK_TAGS,
  normalizeTaskType,
  TASK_DETAILS_POPOVER_OPTIONS,
} from "@/constants/task";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useChecklist } from "@/hooks/useChecklist";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useIsClient } from "@/hooks/useIsClient";
import type { ChecklistItem, Task, TaskPriorityOption } from "@/types/task";
import type { FormatSyntax, TaskDetailsPopoverProps } from "@/types/task-ui";
import { getTodayDateString, isTaskHardcoreLocked } from "@/utils/date";
import { calculateTaskReward } from "@/utils/economy";
import { applyMarkdownFormat } from "@/utils/markdown";
import {
  buildUpdateTaskPayload,
  computeOptimisticHabitDelta,
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
}: Omit<TaskDetailsPopoverProps, "columnTitle">) {
  const t = useTranslations("tasks.hooks");
  const [, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Refs de sincronização imediata para auto-save ao sair
  const titleRef = useRef(task?.title || "");
  const descRef = useRef(task?.description || "");
  const newTagRef = useRef("");
  const newItemRef = useRef("");
  const checklistRef = useRef<ChecklistItem[]>(task?.checklist || []);

  const mounted = useIsClient();
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [dueTime, setDueTime] = useState(
    task?.dueTime ? task.dueTime.slice(0, 5) : "",
  );
  const [priority, setPriority] = useState<string>(task?.priority || "NONE");
  const [tags, setTags] = useState<string[]>(task?.tags || []);

  const handleChecklistChanged = useCallback(
    (nextList: ChecklistItem[]) => {
      checklistRef.current = nextList;
      if (task) {
        onTaskUpdate?.({ ...task, checklist: nextList });
      }
    },
    [task, onTaskUpdate],
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

  // Sincroniza dados locais e refs apenas quando uma tarefa diferente passa a ser exibida
  useEffect(() => {
    if (!task) {
      syncedTaskIdRef.current = undefined;
      return;
    }
    if (syncedTaskIdRef.current === task.id) return;
    syncedTaskIdRef.current = task.id;

    setCompleted(Boolean(task.completed));
    setTitle(task.title || "");
    titleRef.current = task.title || "";
    setDescription(task.description || "");
    descRef.current = task.description || "";
    setDueDate(task.dueDate || "");
    setDueTime(task.dueTime ? task.dueTime.slice(0, 5) : "");
    setPriority(task.priority || "NONE");
    setTags(task.tags || []);
    const initialChecklist = task.checklist || [];
    resetChecklist(initialChecklist);
    checklistRef.current = initialChecklist;
    setIsAddingTag(false);
    setNewTagText("");
    newTagRef.current = "";
    setIsAddingItem(false);
    setNewItemText("");
    newItemRef.current = "";
  }, [task, resetChecklist]);

  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  const taskType = task ? normalizeTaskType(task) : "todo";
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  const saveTaskField = useCallback(
    (fields: Partial<Task>) => {
      if (!task) return;
      const reward = calculateTaskReward({
        ...task,
        ...fields,
        isHardcoreModeEnabled:
          fields.isHardcoreModeEnabled ?? task.isHardcoreModeEnabled,
        dueDate: fields.dueDate ?? task.dueDate,
        isPenaltyApplied: fields.isPenaltyApplied ?? task.isPenaltyApplied,
      });
      const currentChecklist =
        checklistRef.current.length > 0
          ? checklistRef.current
          : task.checklist || [];
      const updated = {
        ...task,
        checklist: currentChecklist,
        ...fields,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
      };
      onTaskUpdate?.(updated);

      const payload = buildUpdateTaskPayload(updated);
      startTransition(async () => {
        const res = await updateTask(task.id, payload);
        if (!res.success) {
          toast.error(res.error || t("saveChangesError"));
        } else if (res.data) {
          const finalChecklist =
            res.data.checklist && res.data.checklist.length > 0
              ? res.data.checklist
              : currentChecklist;
          onTaskUpdate?.({
            ...updated,
            title: res.data.name || updated.title,
            checklist: finalChecklist,
          });
        }
      });
    },
    [task, onTaskUpdate, t],
  );

  const flushPendingChanges = useCallback(() => {
    if (!task) return;

    const trimmedTitle = titleRef.current.trim();
    const trimmedDesc = descRef.current.trim();
    const originalDesc = (task.description || "").trim();

    const titleChanged = trimmedTitle !== "" && trimmedTitle !== task.title;
    const descChanged = trimmedDesc !== originalDesc;

    let nextTags = [...(task.tags || tags)];
    const parsedPendingTags = parseTaskTags(newTagRef.current);
    let tagsChanged = false;

    for (const pendingTag of parsedPendingTags) {
      if (
        nextTags.length < MAX_TASK_TAGS &&
        !nextTags.some((t) => t.toLowerCase() === pendingTag.toLowerCase())
      ) {
        nextTags = [...nextTags, pendingTag];
        tagsChanged = true;
      }
    }

    if (titleChanged || descChanged || tagsChanged) {
      saveTaskField({
        ...(titleChanged ? { title: trimmedTitle } : {}),
        ...(descChanged ? { description: trimmedDesc || undefined } : {}),
        ...(tagsChanged ? { tags: nextTags } : {}),
      });
    }

    const pendingItem = newItemRef.current.trim();
    if (pendingItem) {
      addChecklistItem(pendingItem);
    }
  }, [task, tags, saveTaskField, addChecklistItem]);

  const handleApplyFormat = useCallback((syntax: FormatSyntax) => {
    const textarea = descTextareaRef.current;
    const { nextDesc, nextCursorPos } = applyMarkdownFormat(
      textarea,
      descRef.current,
      syntax,
    );

    setDescription(nextDesc);
    descRef.current = nextDesc;

    setTimeout(() => {
      const targetTextarea = descTextareaRef.current;
      if (targetTextarea) {
        targetTextarea.focus();
        targetTextarea.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    }, 50);
  }, []);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  useClickOutside(popoverRef, handleCloseWithSave, { enabled: isOpen });

  const handleToggleTask = () => {
    if (!task) return;
    const next = !completed;
    setCompleted(next);
    onToggleComplete?.(task.id, next);
    onTaskUpdate?.({ ...task, completed: next });
  };

  const handleHabitDelta = (delta: number) => {
    if (!task) return;
    onHabitChange?.(task.id, delta);
    const nextFields = computeOptimisticHabitDelta(task, delta);
    onTaskUpdate?.({ ...task, ...nextFields });
  };

  const handleTitleBlur = () => {
    if (!task) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
      titleRef.current = task.title;
      return;
    }
    if (trimmed !== task.title) {
      saveTaskField({ title: trimmed });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleDescriptionBlur = () => {
    if (!task) return;
    const trimmed = description.trim();
    if (trimmed !== (task.description || "").trim()) {
      saveTaskField({ description: trimmed || undefined });
    }
  };

  const handleDateChange = (newDate: string) => {
    if (!task || isTaskHardcoreLocked(task)) {
      return;
    }
    setDueDate(newDate);
    if (!newDate) {
      setDueTime("");
      saveTaskField({ dueDate: undefined, dueTime: undefined });
    } else {
      saveTaskField({ dueDate: newDate });
    }
  };

  const handleTimeChange = (newTime: string) => {
    if (!task || isTaskHardcoreLocked(task)) {
      return;
    }
    const cleanTime = newTime ? newTime.slice(0, 5) : "";
    setDueTime(cleanTime);
    if (cleanTime && !dueDate) {
      const todayIso = getTodayDateString();
      setDueDate(todayIso);
      saveTaskField({ dueDate: todayIso, dueTime: cleanTime });
    } else {
      saveTaskField({ dueTime: cleanTime || undefined });
    }
  };

  const handlePrioritySelect = (p: TaskPriorityOption) => {
    setPriority(p);
    saveTaskField({ priority: p });
  };

  const handleAddTag = () => {
    const parsedNewTags = parseTaskTags(newTagText);
    if (parsedNewTags.length === 0) {
      setIsAddingTag(false);
      return;
    }
    if (tags.length >= MAX_TASK_TAGS) {
      toast.error(t("maxTagsError", { max: MAX_TASK_TAGS }));
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingTag(false);
      return;
    }

    const nextTags = [...tags];
    let addedAny = false;
    let hadDuplicate = false;

    for (const candidate of parsedNewTags) {
      if (nextTags.length >= MAX_TASK_TAGS) {
        toast.error(t("maxTagsError", { max: MAX_TASK_TAGS }));
        break;
      }
      const alreadyExists = nextTags.some(
        (tagItem) => tagItem.toLowerCase() === candidate.toLowerCase(),
      );
      if (alreadyExists) {
        hadDuplicate = true;
        continue;
      }
      nextTags.push(candidate);
      addedAny = true;
    }

    if (!addedAny && hadDuplicate) {
      toast.error(t("tagAlreadyAdded"));
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingTag(false);
      return;
    }

    if (addedAny) {
      setTags(nextTags);
      saveTaskField({ tags: nextTags });
    }
    setNewTagText("");
    newTagRef.current = "";
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    saveTaskField({ tags: nextTags });
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

  return {
    mounted,
    popoverRef,
    titleInputRef,
    descTextareaRef,
    isMobileScreen,
    popoverPosition,
    completed,
    title,
    setTitle: (val: string) => {
      setTitle(val);
      titleRef.current = val;
    },
    description,
    setDescription: (val: string) => {
      setDescription(val);
      descRef.current = val;
    },
    dueDate,
    dueTime,
    priority,
    tags,
    isAddingTag,
    setIsAddingTag,
    newTagText,
    setNewTagText: (val: string) => {
      setNewTagText(val);
      newTagRef.current = val;
    },
    cancelAddTag: () => {
      setIsAddingTag(false);
      newTagRef.current = "";
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
    handleTimeChange,
    handlePrioritySelect,
    handleAddTag,
    handleRemoveTag,
    handleAddCheckItem,
    handleToggleCheckItem: toggleChecklistItem,
    handleUpdateCheckItem: updateChecklistItem,
    handleDeleteCheckItem: deleteChecklistItem,
    handleApplyFormat,
    handleDeleteTask,
    handleDuplicateTask,
    handleOpenFullModal,
  };
}
