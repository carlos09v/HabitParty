"use client";

import { CheckSquare, Trash2 } from "lucide-react";
import type { CreateTaskFormReturn } from "@/hooks/useCreateTaskForm";

interface TaskChecklistSectionProps {
  form: CreateTaskFormReturn;
}

export function TaskChecklistSection({ form }: TaskChecklistSectionProps) {
  const {
    checklist,
    newChecklistText,
    setNewChecklistText,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
    isPending,
  } = form;

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
      <div className="flex items-center justify-between">
        <span className="text-body-s text-neutral-300 font-medium flex items-center gap-1.5">
          <CheckSquare size={15} className="text-gold" />
          <span>Checklist / Subtarefas</span>
        </span>
        <span className="text-tiny text-neutral-400">
          {checklist.length} {checklist.length === 1 ? "item" : "itens"}
        </span>
      </div>

      {/* Input para adicionar item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newChecklistText}
          onChange={(e) => setNewChecklistText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddChecklistItem();
            }
          }}
          placeholder="+ Adicionar item ao checklist..."
          className="flex-1 bg-background/50 border border-primary/40 rounded-lg px-3 py-1.5 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors text-body-s"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={handleAddChecklistItem}
          disabled={!newChecklistText.trim() || isPending}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-neutral-50 rounded-lg text-body-s font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de itens rascunhados */}
      {checklist.length > 0 && (
        <ul className="flex flex-col gap-1.5 max-h-32 overflow-y-auto custom-scrollbar mt-1">
          {checklist.map((item, idx) => (
            <li
              key={`item-${idx}-${item}`}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-background/40 border border-primary/20 text-body-s text-neutral-200"
            >
              <span className="truncate">• {item}</span>
              <button
                type="button"
                onClick={() => handleRemoveChecklistItem(idx)}
                disabled={isPending}
                className="text-white/70 hover:text-danger-500 p-1 rounded transition-colors cursor-pointer disabled:opacity-50"
                aria-label={`Remover item ${item}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
