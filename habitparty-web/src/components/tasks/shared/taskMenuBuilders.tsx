import {
  Check,
  Columns3,
  Copy,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import type { BoardColumn, Task } from "@/types/task";
import type { ColumnWidthPreset } from "@/types/task-ui";

/**
 * Constrói de forma padronizada os itens do ContextMenu de uma Tarefa (Editar, Duplicar, Excluir).
 */
export function buildTaskContextMenuItems(options: {
  task: Task | null;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
}): ContextMenuItem[] {
  const { task, onEdit, onDuplicate, onDelete } = options;
  return [
    {
      label: "Editar",
      icon: <Pencil size={14} />,
      onClick: () => {
        if (task) onEdit(task);
      },
    },
    {
      label: "Duplicar",
      icon: <Copy size={14} />,
      onClick: () => {
        if (task) onDuplicate(task);
      },
    },
    {
      label: "Excluir",
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
  onColumnWidthChange?: (columnId: string, width: ColumnWidthPreset) => void;
}): ContextMenuItem[] {
  const { column, columnWidths, onEdit, onDelete, onColumnWidthChange } =
    options;
  const currentWidth = (column && columnWidths?.[column.id]) || "normal";

  return [
    {
      label: "Editar",
      icon: <Pencil size={14} />,
      onClick: () => {
        if (column) onEdit(column);
      },
    },
    ...(onColumnWidthChange && column
      ? [
          {
            label: "Layout",
            icon: <LayoutGrid size={14} />,
            children: [
              {
                label: "Compacto",
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
                label: "Padrão",
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
                label: "Largo",
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
      label: "Excluir",
      icon: <Trash2 size={14} />,
      variant: "destructive",
      onClick: () => {
        if (column) onDelete(column);
      },
    },
  ];
}
