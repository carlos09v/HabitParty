"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { updateTask } from "@/actions/taskActions";
import {
  MAX_TAG_LENGTH,
  MAX_TASK_TAGS,
  normalizeTaskType,
} from "@/constants/task";
import { useAnchoredPopoverPosition } from "@/hooks/useAnchoredPopoverPosition";
import { useChecklist } from "@/hooks/useChecklist";
import { useClickOutside } from "@/hooks/useClickOutside";
import type { ChecklistItem, Task, TaskPriorityOption } from "@/types/task";
import type { TaskDetailsPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { calculateTaskReward } from "@/utils/economy";
import { buildUpdateTaskPayload } from "@/utils/taskMapper";
import {
  type FormatSyntax,
  TaskDescriptionEditor,
  TaskDetailsChecklist,
  TaskDetailsFooter,
  TaskDetailsHeader,
  TaskDetailsTags,
} from "./task-details";

const POPOVER_OPTIONS = {
  popoverWidth: 380,
  popoverHeight: 420,
};

export function TaskDetailsPopover({
  isOpen,
  onClose,
  task,
  columnTitle,
  anchorRect,
  onTaskUpdate,
  onDelete,
  onToggleComplete,
  onEdit,
  onDuplicate,
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
  const checklistRef = useRef<ChecklistItem[]>(task?.checklist || []);

  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [priority, setPriority] = useState<string>(task?.priority || "MEDIUM");
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
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Posição com prevenção de overflow no viewport
  const popoverPosition = useAnchoredPopoverPosition(
    isOpen,
    anchorRect,
    popoverRef,
    POPOVER_OPTIONS,
    mounted,
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
      const initialChecklist = task.checklist || [];
      resetChecklist(initialChecklist);
      checklistRef.current = initialChecklist;
      setIsAddingTag(false);
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingItem(false);
      setNewItemText("");
      newItemRef.current = "";
    }
  }, [task, resetChecklist]);

  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

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
          toast.error(res.error || "Erro ao salvar alterações da tarefa.");
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
    const pendingTag = newTagRef.current.trim().slice(0, MAX_TAG_LENGTH);
    let tagsChanged = false;

    if (
      pendingTag &&
      nextTags.length < MAX_TASK_TAGS &&
      !nextTags.some((t) => t.toLowerCase() === pendingTag.toLowerCase())
    ) {
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
      addChecklistItem(pendingItem);
    }
  }, [task, tags, saveTaskField, addChecklistItem]);

  const handleApplyFormat = useCallback((syntax: FormatSyntax) => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const currentDesc = descRef.current;
    const start = textarea.selectionStart ?? currentDesc.length;
    const end = textarea.selectionEnd ?? currentDesc.length;
    const selectedText = currentDesc.substring(start, end);

    let replacement = "";
    if (syntax === "bold") {
      replacement = selectedText
        ? `**${selectedText}**`
        : "**texto em negrito**";
    } else if (syntax === "italic") {
      replacement = selectedText ? `*${selectedText}*` : "*texto em itálico*";
    } else if (syntax === "highlight") {
      replacement = selectedText
        ? `==${selectedText}==`
        : "==texto destacado==";
    } else if (syntax === "bullet") {
      replacement = selectedText ? `\n- ${selectedText}` : "\n- Novo item";
    } else if (syntax === "code") {
      replacement = selectedText ? `\`${selectedText}\`` : "`código`";
    }

    const nextDesc =
      currentDesc.substring(0, start) +
      replacement +
      currentDesc.substring(end);

    setDescription(nextDesc);
    descRef.current = nextDesc;

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 50);
  }, []);

  const handleCloseWithSave = useCallback(() => {
    flushPendingChanges();
    onClose();
  }, [flushPendingChanges, onClose]);

  // Listener para fechar e auto-salvar ao clicar fora ou pressionar Escape
  useClickOutside(popoverRef, handleCloseWithSave, { enabled: isOpen });

  if (!isOpen || !mounted || !task) return null;

  const handleToggleTask = () => {
    const next = !completed;
    setCompleted(next);
    onToggleComplete?.(task.id, next);
    onTaskUpdate?.({ ...task, completed: next });
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
    if (
      task?.isHardcoreModeEnabled &&
      task?.dueDate &&
      new Date(`${task.dueDate}T23:59:59`) < new Date()
    ) {
      return;
    }
    setDueDate(newDate);
    saveTaskField({ dueDate: newDate || undefined });
  };

  const handlePrioritySelect = (p: TaskPriorityOption) => {
    setPriority(p);
    saveTaskField({ priority: p });
  };

  // Tags
  const handleAddTag = () => {
    const trimmed = newTagText.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) {
      setIsAddingTag(false);
      return;
    }
    if (tags.length >= MAX_TASK_TAGS) {
      toast.error(`Uma tarefa pode ter no máximo ${MAX_TASK_TAGS} tags.`);
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingTag(false);
      return;
    }
    const alreadyExists = tags.some(
      (t) => t.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyExists) {
      toast.error("Esta tag já foi adicionada.");
      setNewTagText("");
      newTagRef.current = "";
      setIsAddingTag(false);
      return;
    }

    const nextTags = [...tags, trimmed];
    setTags(nextTags);
    saveTaskField({ tags: nextTags });
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
    toggleChecklistItem(itemId);
  };

  const handleDeleteCheckItem = (itemId?: string) => {
    deleteChecklistItem(itemId);
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
        tags: tags,
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

  return createPortal(
    <>
      {/* Backdrop para mobile (< sm) */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs z-[119] sm:hidden animate-in fade-in duration-200"
        onClick={handleCloseWithSave}
        aria-hidden="true"
      />

      <div
        ref={popoverRef}
        style={
          isMobileScreen
            ? undefined
            : {
                top: `${popoverPosition.top}px`,
                left: `${popoverPosition.left}px`,
              }
        }
        className={cn(
          "fixed z-[120] select-none flex flex-col gap-3.5 backdrop-blur-xl shadow-2xl",
          // Mobile (< sm): Bottom Sheet fixado na base com scroll interno
          "max-sm:inset-x-0 max-sm:bottom-0 max-sm:w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 max-sm:border-primary/40 max-sm:bg-surface/98 max-sm:p-4 max-sm:max-h-[85vh] max-sm:overflow-y-auto max-sm:animate-in max-sm:slide-in-from-bottom max-sm:duration-200",
          // Desktop (sm+): Popover flutuante ancorado
          "sm:w-[380px] sm:max-w-[calc(100vw-24px)] sm:rounded-2xl sm:border sm:border-primary/40 sm:bg-card/95 sm:p-4 sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-150",
        )}
        role="dialog"
        aria-label="Detalhes rápidos da tarefa"
      >
        {/* Pílula visual de puxar para mobile */}
        <div className="sm:hidden w-12 h-1.5 rounded-full bg-white/25 mx-auto -mt-1 mb-1 shrink-0" />

        {/* 1. TOPO: Checkbox / Tipo + Prazo + Prioridade + Fechar */}
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
          onEdit={handleOpenFullModal}
          onClose={handleCloseWithSave}
        />

        {/* 2. ÁREA CENTRAL ROLÁVEL COM CABEÇALHO E RODAPÉ FIXOS */}
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 max-h-[min(500px,calc(100vh-200px))]">
          {/* TÍTULO EDITÁVEL */}
          <div className="rounded-xl border border-primary/25 bg-surface/50 px-2.5 py-1.5 focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-all">
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
                "w-full bg-transparent border-none outline-none",
                "text-base font-bold text-neutral-50 placeholder:text-neutral-500",
                completed && !isHabit && "line-through text-neutral-400",
              )}
            />
          </div>

          {/* DESCRIÇÃO */}
          <TaskDescriptionEditor
            description={description}
            onChange={(val) => {
              setDescription(val);
              descRef.current = val;
            }}
            onBlur={handleDescriptionBlur}
            textareaRef={descTextareaRef}
          />

          {/* TAGS */}
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

          {/* CHECKLIST / SUBTAREFAS */}
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
        </div>

        {/* 3. RODAPÉ */}
        <TaskDetailsFooter
          task={task}
          columnTitle={columnTitle}
          onApplyFormat={handleApplyFormat}
          onDeleteTask={handleDeleteTask}
          onDuplicateTask={onDuplicate ? handleDuplicateTask : undefined}
          onOpenEdit={handleOpenFullModal}
        />
      </div>
    </>,
    document.body,
  );
}
