import { Check, Plus, Trash2, X } from "lucide-react";
import type { ChecklistItem } from "@/types/task";
import { cn } from "@/utils";

interface TaskDetailsChecklistProps {
  checklist: ChecklistItem[];
  isAddingItem: boolean;
  newItemText: string;
  onNewItemTextChange: (val: string) => void;
  onStartAddItem: () => void;
  onCancelAddItem: () => void;
  onAddItem: () => void;
  onToggleItem: (itemId?: string) => void;
  onDeleteItem: (itemId?: string) => void;
}

export function TaskDetailsChecklist({
  checklist,
  isAddingItem,
  newItemText,
  onNewItemTextChange,
  onStartAddItem,
  onCancelAddItem,
  onAddItem,
  onToggleItem,
  onDeleteItem,
}: TaskDetailsChecklistProps) {
  const completedCount = checklist.filter((i) => i.isCompleted).length;

  return (
    <div className="flex flex-col gap-2 pt-1 border-t border-white/8">
      <div className="flex items-center justify-between text-tiny font-bold text-neutral-400 uppercase tracking-wider">
        <span>Subtarefas</span>
        {checklist.length > 0 && (
          <span className="text-neutral-400 font-medium">
            {completedCount}/{checklist.length}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 py-1 px-1 rounded-md hover:bg-white/4 group/item transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => onToggleItem(item.id)}
                className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all cursor-pointer shrink-0",
                  item.isCompleted
                    ? "bg-gold border-gold text-neutral-900"
                    : "border-primary/50 bg-primary-dark/40 hover:border-gold",
                )}
              >
                {item.isCompleted && <Check size={9} className="stroke-3" />}
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
              onClick={() => onDeleteItem(item.id)}
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
              onChange={(e) => onNewItemTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddItem();
                if (e.key === "Escape") onCancelAddItem();
              }}
              placeholder="Nome da subtarefa..."
              className="flex-1 bg-background/50 border border-primary/40 rounded px-2 py-0.5 text-xs text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={onAddItem}
              className="px-2 py-0.5 rounded bg-gold text-neutral-900 font-bold text-tiny hover:brightness-110 cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={onCancelAddItem}
              className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStartAddItem}
            className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer py-0.5"
          >
            <Plus size={12} />
            <span>Adicionar item</span>
          </button>
        )}
      </div>
    </div>
  );
}
