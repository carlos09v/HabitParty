import {
  ArrowLeftToLine,
  ArrowRightToLine,
  Check,
  Columns3,
  Copy,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pencil,
  Timer,
  Trash2,
} from "lucide-react";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import { normalizeTaskType } from "@/constants/task";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { BoardColumn, Task } from "@/types/task";
import type { ColumnWidthPreset } from "@/types/task-ui";

/**
 * Constrói de forma padronizada os itens do ContextMenu de uma Tarefa (Focar, Editar, Duplicar, Excluir).
 */
export function buildTaskContextMenuItems(options: {
  task: Task | null;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStartFocus?: (task: Task) => void;
  labels?: {
    startFocus?: string;
    edit?: string;
    duplicate?: string;
    delete?: string;
  };
}): ContextMenuItem[] {
  const { task, onEdit, onDuplicate, onDelete, onStartFocus, labels } = options;
  const canFocus =
    Boolean(task) &&
    normalizeTaskType(task as Task) !== "habit" &&
    !task?.completed;

  return [
    ...(canFocus && task
      ? [
          {
            label: labels?.startFocus || "Focar nesta tarefa",
            icon: <Timer size={14} className="text-gold" />,
            onClick: () => {
              if (onStartFocus) {
                onStartFocus(task);
              } else {
                useFocusTimerStore.getState().startFocusTask({
                  id: task.id,
                  title: task.title,
                });
              }
            },
          },
        ]
      : []),
    {
      label: labels?.edit || "Editar",
      icon: <Pencil size={14} />,
      onClick: () => {
        if (task) onEdit(task);
      },
    },
    {
      label: labels?.duplicate || "Duplicar",
      icon: <Copy size={14} />,
      onClick: () => {
        if (task) onDuplicate(task);
      },
    },
    {
      label: labels?.delete || "Excluir",
      icon: <Trash2 size={14} />,
      variant: "destructive",
      onClick: () => {
        if (task) onDelete(task);
      },
    },
  ];
}

/**
 * Constrói de forma padronizada os itens do ContextMenu de uma Coluna (Editar, Layout opcional, Excluir).
 */
export function buildColumnContextMenuItems(options: {
  column: BoardColumn | null;
  columnWidths?: Record<string, ColumnWidthPreset>;
  onEdit: (column: BoardColumn) => void;
  onDelete: (column: BoardColumn) => void;
  onInsertLeft?: (column: BoardColumn) => void;
  onInsertRight?: (column: BoardColumn) => void;
  onColumnWidthChange?: (columnId: string, width: ColumnWidthPreset) => void;
  labels?: {
    edit?: string;
    delete?: string;
    insertLeft?: string;
    insertRight?: string;
    layout?: string;
    compact?: string;
    normal?: string;
    wide?: string;
  };
}): ContextMenuItem[] {
  const {
    column,
    columnWidths,
    onEdit,
    onDelete,
    onInsertLeft,
    onInsertRight,
    onColumnWidthChange,
    labels,
  } = options;
  const currentWidth = (column && columnWidths?.[column.id]) || "normal";

  return [
    {
      label: labels?.edit || "Editar",
      icon: <Pencil size={14} />,
      onClick: () => {
        if (column) onEdit(column);
      },
    },
    ...(onInsertLeft && column
      ? [
          {
            label: labels?.insertLeft || "Inserir coluna à esquerda",
            icon: <ArrowLeftToLine size={14} />,
            onClick: () => onInsertLeft(column),
          },
        ]
      : []),
    ...(onInsertRight && column
      ? [
          {
            label: labels?.insertRight || "Inserir coluna à direita",
            icon: <ArrowRightToLine size={14} />,
            onClick: () => onInsertRight(column),
          },
        ]
      : []),
    ...(onColumnWidthChange && column
      ? [
          {
            label: labels?.layout || "Layout",
            icon: <LayoutGrid size={14} />,
            children: [
              {
                label: labels?.compact || "Compacto",
                icon:
                  currentWidth === "compact" ? (
                    <Check size={14} className="text-gold shrink-0" />
                  ) : (
                    <Minimize2
                      size={14}
                      className="text-neutral-400 shrink-0"
                    />
                  ),
                active: currentWidth === "compact",
                onClick: () => onColumnWidthChange(column.id, "compact"),
              },
              {
                label: labels?.normal || "Padrão",
                icon:
                  currentWidth === "normal" ? (
                    <Check size={14} className="text-gold shrink-0" />
                  ) : (
                    <Columns3 size={14} className="text-neutral-400 shrink-0" />
                  ),
                active: currentWidth === "normal",
                onClick: () => onColumnWidthChange(column.id, "normal"),
              },
              {
                label: labels?.wide || "Largo",
                icon:
                  currentWidth === "wide" ? (
                    <Check size={14} className="text-gold shrink-0" />
                  ) : (
                    <Maximize2
                      size={14}
                      className="text-neutral-400 shrink-0"
                    />
                  ),
                active: currentWidth === "wide",
                onClick: () => onColumnWidthChange(column.id, "wide"),
              },
            ],
          },
        ]
      : []),
    {
      label: labels?.delete || "Excluir",
      icon: <Trash2 size={14} />,
      variant: "destructive",
      onClick: () => {
        if (column) onDelete(column);
      },
    },
  ];
}
