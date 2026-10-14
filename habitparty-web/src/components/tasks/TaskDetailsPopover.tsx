"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/actions/checklistActions";
import { updateTask } from "@/actions/taskActions";
import { calculateTaskReward, normalizeTaskType } from "@/constants/task";
import type {
  ChecklistItem,
  Task,
  TaskDetailsPopoverProps,
  TaskPriorityOption,
} from "@/types/task";
import { cn } from "@/utils";
import { buildUpdateTaskPayload } from "@/utils/taskMapper";
import {
  TaskDescriptionEditor,
  TaskDetailsChecklist,
  TaskDetailsFooter,
  TaskDetailsHeader,
  TaskDetailsTags,
  useTaskDetailsPosition,
} from "./task-details";

export function TaskDetailsPopover({
  isOpen,
  onClose,
  task,
  columnTitle,
  anchorRect,
  onTaskUpdate,
  onDelete,
  onToggleComplete,
}: TaskDetailsPopoverProps) {
  const [, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Refs de sincronização imediata para auto-save ao sair
  const titleRef = useRef(task?.title || "");
  const descRef = useRef(task?.description || "");
  const newTagRef = useRef("");
  const newItemRef = useRef("");

  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [priority, setPriority] = useState<string>(task?.priority || "MEDIUM");
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    task?.checklist || [],
  );
  const checklistRef = useRef<ChecklistItem[]>(task?.checklist || []);

  // Estados de controle da interface
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);

  // Posição com prevenção de overflow no viewport
  const popoverPosition = useTaskDetailsPosition(
    isOpen,
    anchorRect,
    popoverRef,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincroniza dados locais e refs quando o task muda
  useEffect(() => {
    if (task) {
      setCompleted(Boolean(task.completed));
      setTitle(task.title || "");
      titleRef.current = task.title || "";
      setDescription(task.description || "");
      descRef.current = task.description || "";
      setDueDate(task.dueDate || "");
      setPriority(task.priority || "MEDIUM");
      setTags(task.tags || []);
      const currentList = task.checklist || [];
      setChecklist(currentList);
      checklistRef.current = currentList;
      setIsAddingTag(false);
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingItem(false);
      setNewItemText("");
      newItemRef.current = "";
    }
  }, [task]);

  const taskType = task ? normalizeTaskType(task) : "todo";
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  // Helper central de salvamento persistente
  const saveTaskField = useCallback(
    (fields: Partial<Task>) => {
      if (!task) return;
      const reward = calculateTaskReward({
        ...task,
        ...fields,
      });
      const updated = {
        ...task,
        ...fields,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
      };
      onTaskUpdate?.(updated);

      const payload = buildUpdateTaskPayload(updated);
      startTransition(async () => {
        const res = await updateTask(task.id, payload);
        if (!res.success) {
          toast.error(res.error || "Erro ao salvar alterações da tarefa.");
        }
      });
    },
    [task, onTaskUpdate],
  );

  // Efetua flush e auto-save de qualquer campo pendente antes de fechar
  const flushPendingChanges = useCallback(() => {
    if (!task) return;

    const trimmedTitle = titleRef.current.trim();
    const trimmedDesc = descRef.current.trim();
    const originalDesc = (task.description || "").trim();

    const titleChanged = trimmedTitle !== "" && trimmedTitle !== task.title;
    const descChanged = trimmedDesc !== originalDesc;

    let nextTags = [...(task.tags || tags)];
    const pendingTag = newTagRef.current.trim();
    let tagsChanged = false;

    if (pendingTag && !nextTags.includes(pendingTag)) {
      nextTags = [...nextTags, pendingTag];
      tagsChanged = true;
    }

    if (titleChanged || descChanged || tagsChanged) {
      saveTaskField({
        ...(titleChanged ? { title: trimmedTitle } : {}),
        ...(descChanged ? { description: trimmedDesc || undefined } : {}),
        ...(tagsChanged ? { tags: nextTags } : {}),
      });
    }

    // Se havia uma subtarefa sendo digitada, salva no backend e sincroniza
    const pendingItem = newItemRef.current.trim();
    if (pendingItem) {
      const tempId = `temp-${Date.now()}`;
      const optimisticItem: ChecklistItem = {
        id: tempId,
        name: pendingItem,
        isCompleted: false,
      };
      const nextList = [...checklistRef.current, optimisticItem];
      checklistRef.current = nextList;
      setChecklist(nextList);
      onTaskUpdate?.({ ...task, checklist: nextList });

      startTransition(async () => {
        const res = await addChecklistItemAction(task.id, {
          name: pendingItem,
        });
        if (res.success && res.data) {
          const confirmed = nextList.map((item) =>
            item.id === tempId ? (res.data as ChecklistItem) : item,
          );
          checklistRef.current = confirmed;
          onTaskUpdate?.({ ...task, checklist: confirmed });
        }
      });
    }
  }, [task, tags, saveTaskField, onTaskUpdate]);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  // Listener para fechar e auto-salvar ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(targetNode)) {
        handleCloseWithSave();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseWithSave();
      }
    };

    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleCloseWithSave]);

  if (!isOpen || !mounted || !task) return null;

  const handleToggleTask = () => {
    const next = !completed;
    setCompleted(next);
    onToggleComplete?.(task.id, next);
  };

  const handleTitleBlur = () => {
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
    const trimmed = description.trim();
    if (trimmed !== (task.description || "").trim()) {
      saveTaskField({ description: trimmed || undefined });
    }
  };

  const handleDateChange = (newDate: string) => {
    setDueDate(newDate);
    saveTaskField({ dueDate: newDate || undefined });
  };

  const handlePrioritySelect = (p: TaskPriorityOption) => {
    setPriority(p);
    saveTaskField({ priority: p });
  };

  // Tags
  const handleAddTag = () => {
    const trimmed = newTagText.trim();
    if (!trimmed) {
      setIsAddingTag(false);
      return;
    }
    if (!tags.includes(trimmed)) {
      const nextTags = [...tags, trimmed];
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

  // Subtarefas / Checklist
  const handleToggleCheckItem = (itemId?: string) => {
    if (!itemId) return;
    const nextChecklist = checklist.map((item) =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
    );
    setChecklist(nextChecklist);
    checklistRef.current = nextChecklist;
    onTaskUpdate?.({ ...task, checklist: nextChecklist });

    startTransition(async () => {
      const res = await toggleChecklistItemAction(itemId);
      if (!res.success) {
        toast.error(res.error || "Erro ao atualizar subtarefa.");
        setChecklist(checklist);
        checklistRef.current = checklist;
        onTaskUpdate?.({ ...task, checklist });
      }
    });
  };

  const handleDeleteCheckItem = (itemId?: string) => {
    if (!itemId) return;
    const nextChecklist = checklist.filter((item) => item.id !== itemId);
    setChecklist(nextChecklist);
    checklistRef.current = nextChecklist;
    onTaskUpdate?.({ ...task, checklist: nextChecklist });

    startTransition(async () => {
      const res = await deleteChecklistItemAction(itemId);
      if (!res.success) {
        toast.error(res.error || "Erro ao remover subtarefa.");
        setChecklist(checklist);
        checklistRef.current = checklist;
        onTaskUpdate?.({ ...task, checklist });
      }
    });
  };

  const handleAddCheckItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: ChecklistItem = {
      id: tempId,
      name: trimmed,
      isCompleted: false,
    };
    const nextChecklist = [...checklist, optimisticItem];
    setChecklist(nextChecklist);
    checklistRef.current = nextChecklist;
    onTaskUpdate?.({ ...task, checklist: nextChecklist });

    setNewItemText("");
    newItemRef.current = "";
    setIsAddingItem(false);

    startTransition(async () => {
      const res = await addChecklistItemAction(task.id, { name: trimmed });
      if (!res.success) {
        toast.error(res.error || "Erro ao adicionar subtarefa.");
        const rolledBack = checklistRef.current.filter(
          (item) => item.id !== tempId,
        );
        checklistRef.current = rolledBack;
        setChecklist(rolledBack);
        onTaskUpdate?.({ ...task, checklist: rolledBack });
      } else if (res.data) {
        const confirmed = checklistRef.current.map((item) =>
          item.id === tempId ? (res.data as ChecklistItem) : item,
        );
        checklistRef.current = confirmed;
        setChecklist(confirmed);
        onTaskUpdate?.({ ...task, checklist: confirmed });
      }
    });
  };

  const handleDeleteTask = () => {
    if (confirm(`Tem certeza que deseja excluir "${task.title}"?`)) {
      onDelete?.(task.id);
      onClose();
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
      }}
      className={cn(
        "fixed z-[120] w-[360px] max-w-[calc(100vw-24px)]",
        "bg-popover border border-primary/45 rounded-2xl shadow-card-deep backdrop-blur-md",
        "p-4 flex flex-col gap-3.5 select-none animate-in fade-in zoom-in-95 duration-150",
      )}
      role="dialog"
      aria-label="Detalhes rápidos da tarefa"
    >
      {/* 1. TOPO: Checkbox / Tipo + Prazo + Prioridade */}
      <TaskDetailsHeader
        task={task}
        completed={completed}
        isHabit={isHabit}
        isDaily={isDaily}
        isTodo={isTodo}
        dueDate={dueDate}
        priority={priority}
        onToggleComplete={handleToggleTask}
        onDateChange={handleDateChange}
        onPrioritySelect={handlePrioritySelect}
      />

      {/* 2. TÍTULO EDITÁVEL */}
      <div className="flex flex-col">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            titleRef.current = e.target.value;
          }}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="Título da tarefa..."
          className={cn(
            "w-full bg-transparent border border-transparent rounded px-1.5 py-0.5",
            "text-base font-bold text-neutral-50 placeholder:text-neutral-500",
            "hover:border-white/15 focus:border-gold focus:bg-primary-dark/30 focus:outline-none transition-all",
            completed && !isHabit && "line-through text-neutral-400",
          )}
        />
      </div>

      {/* 3. DESCRIÇÃO & BARRA DE FORMATAÇÃO */}
      <TaskDescriptionEditor
        description={description}
        onChange={(val) => {
          setDescription(val);
          descRef.current = val;
        }}
        onBlur={handleDescriptionBlur}
        showFormatToolbar={showFormatToolbar}
        textareaRef={descTextareaRef}
      />

      {/* 4. TAGS */}
      <TaskDetailsTags
        tags={tags}
        isAddingTag={isAddingTag}
        newTagText={newTagText}
        onNewTagTextChange={(val) => {
          setNewTagText(val);
          newTagRef.current = val;
        }}
        onStartAddTag={() => setIsAddingTag(true)}
        onCancelAddTag={() => {
          setIsAddingTag(false);
          newTagRef.current = "";
        }}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* 5. CHECKLIST / SUBTAREFAS */}
      {!isHabit && (
        <TaskDetailsChecklist
          checklist={checklist}
          isAddingItem={isAddingItem}
          newItemText={newItemText}
          onNewItemTextChange={(val) => {
            setNewItemText(val);
            newItemRef.current = val;
          }}
          onStartAddItem={() => setIsAddingItem(true)}
          onCancelAddItem={() => {
            setIsAddingItem(false);
            newItemRef.current = "";
          }}
          onAddItem={handleAddCheckItem}
          onToggleItem={handleToggleCheckItem}
          onDeleteItem={handleDeleteCheckItem}
        />
      )}

      {/* 6. RODAPÉ */}
      <TaskDetailsFooter
        columnTitle={columnTitle}
        showFormatToolbar={showFormatToolbar}
        onToggleFormatToolbar={() => setShowFormatToolbar((prev) => !prev)}
        onDeleteTask={handleDeleteTask}
      />
    </div>,
    document.body,
  );
}
