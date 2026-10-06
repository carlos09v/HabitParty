"use client";

import {
  Baseline,
  Bold,
  Calendar,
  Check,
  Flag,
  Flame,
  Highlighter,
  List,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/actions/checklistActions";
import { updateTask } from "@/actions/taskActions";
import {
  normalizeTaskType,
  TASK_PRIORITY_META,
  TODO_PRIORITY_OPTIONS,
} from "@/constants/task";
import type {
  Task,
  TaskDetailsPopoverProps,
  TaskPriorityOption,
} from "@/types/task";
import { cn } from "@/utils";
import { buildUpdateTaskPayload } from "@/utils/taskMapper";

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

  const [mounted, setMounted] = useState(false);
  const [completed, setCompleted] = useState(Boolean(task?.completed));
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [priority, setPriority] = useState<string>(task?.priority || "MEDIUM");
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [checklist, setChecklist] = useState(task?.checklist || []);

  // UI state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);

  // Position state
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setCompleted(Boolean(task.completed));
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.dueDate || "");
      setPriority(task.priority || "MEDIUM");
      setTags(task.tags || []);
      setChecklist(task.checklist || []);
      setIsMenuOpen(false);
      setIsPriorityPickerOpen(false);
      setIsDatePickerOpen(false);
      setIsAddingTag(false);
      setIsAddingItem(false);
    }
  }, [task]);

  // Adjust coordinates based on anchorRect to prevent overflowing viewport
  useLayoutEffect(() => {
    if (!isOpen || !anchorRect || !popoverRef.current) return;

    const popoverWidth = 360;
    const margin = 12;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Default: anchored to the right side of the card
    let targetLeft = anchorRect.right + margin;

    // Flip to left side if it would overflow right screen edge
    if (targetLeft + popoverWidth > screenWidth - margin) {
      targetLeft = anchorRect.left - popoverWidth - margin;
    }

    // Ensure it doesn't overflow left edge either
    if (targetLeft < margin) {
      targetLeft = Math.max(margin, screenWidth - popoverWidth - margin);
    }

    // Align top with task card top, but keep within viewport vertically
    const popoverHeight = popoverRef.current.offsetHeight || 420;
    let targetTop = anchorRect.top;

    if (targetTop + popoverHeight > screenHeight - margin) {
      targetTop = Math.max(margin, screenHeight - popoverHeight - margin);
    }
    if (targetTop < margin) {
      targetTop = margin;
    }

    setPopoverPosition({ top: targetTop, left: targetLeft });
  }, [isOpen, anchorRect]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(targetNode)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !task) return null;

  const taskType = normalizeTaskType(task);
  const isHabit = taskType === "habit";
  const isDaily = taskType === "daily";
  const isTodo = taskType === "todo";

  // Optimistic helper to update and persist task changes with full valid payload
  const saveTaskField = (fields: Partial<Task>) => {
    const updated = { ...task, ...fields };
    onTaskUpdate?.(updated);

    const payload = buildUpdateTaskPayload(updated);

    startTransition(async () => {
      const res = await updateTask(task.id, payload);
      if (!res.success) {
        toast.error(res.error || "Erro ao salvar alterações da tarefa.");
      }
    });
  };

  const handleToggleTask = () => {
    const next = !completed;
    setCompleted(next);
    onToggleComplete?.(task.id, next);
  };

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(task.title);
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
    setIsDatePickerOpen(false);
    saveTaskField({ dueDate: newDate || undefined });
  };

  const handlePrioritySelect = (p: TaskPriorityOption) => {
    setPriority(p);
    setIsPriorityPickerOpen(false);
    saveTaskField({ priority: p });
  };

  // Text formatting actions for Description
  const applyFormat = (syntax: "bold" | "highlight" | "bullet") => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);

    let replacement = "";
    if (syntax === "bold") {
      replacement = selectedText
        ? `**${selectedText}**`
        : "**texto em negrito**";
    } else if (syntax === "highlight") {
      replacement = selectedText
        ? `==${selectedText}==`
        : "==texto destacado==";
    } else if (syntax === "bullet") {
      replacement = selectedText ? `\n- ${selectedText}` : "\n- Novo item";
    }

    const nextDesc =
      description.substring(0, start) +
      replacement +
      description.substring(end);

    setDescription(nextDesc);
    saveTaskField({ description: nextDesc || undefined });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + replacement.length,
        start + replacement.length,
      );
    }, 50);
  };

  // Tags actions
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
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tagToRemove);
    setTags(nextTags);
    saveTaskField({ tags: nextTags });
  };

  // Checklist actions
  const handleToggleCheckItem = (itemId?: string) => {
    if (!itemId) return;
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
      ),
    );

    startTransition(async () => {
      const res = await toggleChecklistItemAction(itemId);
      if (!res.success) {
        toast.error(res.error || "Erro ao atualizar subtarefa.");
      }
    });
  };

  const handleDeleteCheckItem = (itemId?: string) => {
    if (!itemId) return;
    setChecklist((prev) => prev.filter((item) => item.id !== itemId));

    startTransition(async () => {
      const res = await deleteChecklistItemAction(itemId);
      if (!res.success) {
        toast.error(res.error || "Erro ao remover subtarefa.");
      }
    });
  };

  const handleAddCheckItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { id: tempId, name: trimmed, isCompleted: false };
    setChecklist((prev) => [...prev, optimisticItem]);
    setNewItemText("");
    setIsAddingItem(false);

    startTransition(async () => {
      const res = await addChecklistItemAction(task.id, { name: trimmed });
      if (!res.success) {
        toast.error(res.error || "Erro ao adicionar subtarefa.");
        setChecklist((prev) => prev.filter((item) => item.id !== tempId));
      } else if (res.data) {
        setChecklist((prev) =>
          prev.map((item) => (item.id === tempId ? res.data : item)),
        );
      }
    });
  };

  const handleDeleteTask = () => {
    if (confirm(`Tem certeza que deseja excluir "${task.title}"?`)) {
      onDelete?.(task.id);
      onClose();
    }
  };

  const priorityMeta =
    TASK_PRIORITY_META[priority] || TASK_PRIORITY_META.MEDIUM;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        top: `${popoverPosition.top}px`,
        left: `${popoverPosition.left}px`,
      }}
      className={cn(
        "fixed z-[120] w-[360px] max-w-[calc(100vw-24px)]",
        "bg-[#1e1038] border border-primary/45 rounded-2xl shadow-card-deep backdrop-blur-md",
        "p-4 flex flex-col gap-3.5 select-none animate-in fade-in zoom-in-95 duration-150",
      )}
      role="dialog"
      aria-label="Detalhes rápidos da tarefa"
    >
      {/* 1. LINHA SUPERIOR: Identificação / Checkbox + Data (apenas quando aplicável) + Bandeira de Prioridade (SEM BOTÃO X) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* HÁBITO: Não tem data nem checkbox de conclusão */}
          {isHabit ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded text-tiny font-bold uppercase tracking-wider bg-info/15 border border-info/40 text-info shrink-0">
                Hábito
              </span>
              <span className="text-tiny font-medium text-neutral-400 truncate">
                {task.resetCounter === "WEEKLY"
                  ? "Reset semanal"
                  : task.resetCounter === "MONTHLY"
                    ? "Reset mensal"
                    : "Reset diário"}
              </span>
              {(task.streak ?? task.currentStreak ?? 0) > 0 && (
                <span
                  className="flex items-center gap-1 text-tiny text-warning-500 font-bold ml-0.5 shrink-0"
                  title="Streak atual"
                >
                  <Flame
                    size={12}
                    className="fill-warning-500/20 text-warning-500"
                  />
                  {task.streak ?? task.currentStreak}
                </span>
              )}
            </div>
          ) : (
            <>
              {/* Checkbox de Conclusão para Diária e ToDo */}
              <button
                type="button"
                onClick={handleToggleTask}
                aria-label={
                  completed ? "Marcar como pendente" : "Marcar como concluída"
                }
                className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0",
                  completed
                    ? "bg-gold border-gold text-neutral-900 shadow-glow-gold-xs"
                    : "border-primary/50 bg-primary-dark/40 hover:border-gold",
                )}
              >
                {completed && <Check size={12} className="stroke-3" />}
              </button>

              {/* Separador vertical */}
              <div className="h-4 w-px bg-white/15 shrink-0" />

              {/* Data / Prazo: Exibido APENAS para To-Do (Afazeres) */}
              {isTodo ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-1.5 text-gold hover:text-gold-hover transition-colors font-medium text-xs px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer"
                    title="Clique para alterar a data"
                  >
                    <Calendar size={13} className="text-gold shrink-0" />
                    <span>{dueDate || "Sem prazo"}</span>
                  </button>

                  {/* Popover Inline do Picker de Data */}
                  {isDatePickerOpen && (
                    <div className="absolute left-0 top-full mt-1.5 z-50 bg-[#160b2b] border border-primary/40 rounded-lg p-2.5 shadow-xl flex flex-col gap-2 min-w-[200px] animate-in fade-in duration-100">
                      <span className="text-tiny font-bold text-neutral-300">
                        Data de Entrega / Prazo
                      </span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-background/80 border border-primary/40 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-gold"
                      />
                      <div className="flex justify-between items-center pt-1 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleDateChange("")}
                          className="text-tiny text-neutral-400 hover:text-danger-500 cursor-pointer"
                        >
                          Sem data
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen(false)}
                          className="text-tiny text-gold font-bold hover:underline cursor-pointer"
                        >
                          Concluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isDaily ? (
                <span className="text-tiny font-medium text-magenta bg-magenta/15 border border-magenta/40 px-2 py-0.5 rounded uppercase tracking-wider">
                  Diária
                </span>
              ) : null}
            </>
          )}
        </div>

        {/* Canto Superior Direito: Apenas a Bandeira de Prioridade (SEM 'X') */}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setIsPriorityPickerOpen(!isPriorityPickerOpen)}
            className={cn(
              "p-1.5 rounded-md border flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105",
              priorityMeta.badgeColor,
            )}
            title={`Prioridade: ${priorityMeta.label} (clique para alterar)`}
          >
            <Flag size={13} />
          </button>

          {/* Popover Inline de Seleção de Prioridade */}
          {isPriorityPickerOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 bg-[#160b2b] border border-primary/40 rounded-lg p-1.5 shadow-xl flex flex-col gap-1 w-32 animate-in fade-in duration-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-0.5">
                Prioridade
              </span>
              {TODO_PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePrioritySelect(opt.id)}
                  className={cn(
                    "flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left",
                    priority === opt.id
                      ? "bg-white/15 font-bold text-neutral-50"
                      : "text-neutral-300 hover:bg-white/8 hover:text-neutral-100",
                  )}
                >
                  <span>{opt.label}</span>
                  {priority === opt.id && (
                    <Check size={11} className="text-gold" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. TÍTULO EDITÁVEL */}
      <div className="flex flex-col">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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

      {/* 3. DESCRIÇÃO EDITÁVEL & BARRA DE FORMATAÇÃO */}
      <div className="flex flex-col gap-1.5">
        {/* Barra de Formatação Condicional (ativada pelo ícone 'A com linha') */}
        {showFormatToolbar && (
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-lg animate-in fade-in duration-100">
            <button
              type="button"
              onClick={() => applyFormat("bold")}
              title="Negrito (**texto**)"
              className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("highlight")}
              title="Destacar (==texto==)"
              className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Highlighter size={13} />
            </button>
            <button
              type="button"
              onClick={() => applyFormat("bullet")}
              title="Lista de itens (- item)"
              className="p-1 rounded text-neutral-300 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer"
            >
              <List size={13} />
            </button>
          </div>
        )}

        <textarea
          ref={descTextareaRef}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescriptionBlur}
          placeholder="Adicione uma descrição ou anotações..."
          className="w-full bg-primary-dark/25 border border-primary/20 rounded-lg p-2.5 text-xs text-neutral-200 placeholder:text-neutral-500 hover:border-primary/40 focus:border-gold/60 focus:outline-none focus:bg-primary-dark/40 resize-none custom-scrollbar transition-all leading-relaxed"
        />
      </div>

      {/* 4. TAGS (SEM A TAG FANTASMA 'GERAL') */}
      <div className="flex items-center gap-1.5 flex-wrap min-h-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group/tag"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-red-400 cursor-pointer opacity-70 hover:opacity-100"
              title={`Remover tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}

        {isAddingTag ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTagText}
              onChange={(e) => setNewTagText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") setIsAddingTag(false);
              }}
              onBlur={handleAddTag}
              placeholder="Tag..."
              className="w-20 bg-background/60 border border-primary/40 rounded px-1.5 py-0.5 text-tiny text-neutral-50 focus:outline-none focus:border-gold"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingTag(true)}
            title="Adicionar Tag"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-tiny text-neutral-400 hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
          >
            <Plus size={10} />
            <span>Tag</span>
          </button>
        )}
      </div>

      {/* 5. CHECKLIST / SUBTAREFAS (Exibido apenas para tarefas que possuem subtarefas, como Diárias e Afazeres) */}
      {!isHabit && (
        <>
          <div className="h-px w-full bg-white/8 my-0.5" />
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-white/4 group/item transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCheckItem(item.id)}
                    className={cn(
                      "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                      item.isCompleted
                        ? "bg-gold border-gold text-neutral-900"
                        : "border-primary/50 bg-primary-dark/40 hover:border-gold",
                    )}
                  >
                    {item.isCompleted && (
                      <Check size={9} className="stroke-3" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-xs text-neutral-200 truncate",
                      item.isCompleted && "line-through text-neutral-500",
                    )}
                  >
                    {item.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCheckItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-neutral-500 hover:text-danger-500 transition-all cursor-pointer shrink-0"
                  aria-label={`Excluir item ${item.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {isAddingItem ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCheckItem();
                    if (e.key === "Escape") setIsAddingItem(false);
                  }}
                  placeholder="Nome da subtarefa..."
                  className="flex-1 bg-background/50 border border-primary/40 rounded px-2 py-0.5 text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold"
                />
                <button
                  type="button"
                  onClick={handleAddCheckItem}
                  className="px-2 py-0.5 rounded bg-gold text-neutral-900 font-bold text-tiny hover:brightness-110 cursor-pointer"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer py-0.5"
              >
                <Plus size={12} />
                <span>Adicionar item</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* DIVISOR */}
      <div className="h-px w-full bg-white/8 my-0.5" />

      {/* 6. RODAPÉ: Coluna Atual + Ícone Baseline (A com linha) + Menu de Opções */}
      <div className="flex items-center justify-between pt-0.5">
        {columnTitle ? (
          <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10 text-neutral-300 text-tiny font-medium truncate max-w-[170px]">
            {columnTitle}
          </span>
        ) : (
          <div />
        )}

        <div className="relative flex items-center gap-1.5">
          {/* Botão de Formatação de Texto (A com uma linha embaixo) substituindo o Lápis */}
          <button
            type="button"
            onClick={() => setShowFormatToolbar(!showFormatToolbar)}
            title="Formatação de texto (Negrito, Destacar, Lista)"
            className={cn(
              "p-1.5 rounded-md transition-colors cursor-pointer",
              showFormatToolbar
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                : "text-neutral-300 hover:text-gold hover:bg-white/8",
            )}
            aria-label="Alternar barra de formatação de texto"
          >
            <Baseline size={15} />
          </button>

          {/* Menu de Mais Opções */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Mais opções"
            className="p-1.5 rounded-md text-neutral-300 hover:text-gold hover:bg-white/8 transition-colors cursor-pointer"
          >
            <MoreHorizontal size={15} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 bottom-full mb-1.5 w-32 bg-[#160b2b] border border-primary/40 rounded-lg shadow-xl py-1 z-50 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleDeleteTask();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-danger-500 hover:bg-danger-500/10 cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Excluir tarefa</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
