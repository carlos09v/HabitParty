"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteBoardColumnAction } from "@/actions/boardColumnActions";
import { UpgradeColumnLimitCard } from "@/components/subscription/UpgradeColumnLimitCard";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ListCard } from "@/components/ui/ListCard";
import { getColumnIcon } from "@/constants/routine";
import type {
  ColumnSummaryDTO,
  DashboardListSummaryProps,
} from "@/types/dashboard";
import type { BoardColumn } from "@/types/task";
import { cn } from "@/utils";

const CreateBoardColumnModal = dynamic(
  () =>
    import("@/components/tasks/CreateBoardColumnModal").then((mod) => ({
      default: mod.CreateBoardColumnModal,
    })),
  { ssr: false },
);

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

export function DashboardListSummary({
  initialColumns,
  maxColumns,
  isCompact = false,
  isPremium = false,
  tasks,
}: DashboardListSummaryProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnSummaryDTO[]>(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const isLimitReached = columns.length >= maxColumns;

  // Context Menu da coluna
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    column: null,
  });

  // Modal de edição da coluna
  const [columnToEdit, setColumnToEdit] = useState<BoardColumn | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal de exclusão da coluna
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleContextMenu = (e: React.MouseEvent, column: ColumnSummaryDTO) => {
    e.preventDefault();
    e.stopPropagation();
    const boardCol: BoardColumn = {
      id: column.id || "",
      title: column.name || "Sem título",
      order: column.orderIndex ?? 0,
      icon: column.icon || "sun",
      tasks: [],
    };
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      column: boardCol,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!columnToDelete?.id) return;
    setIsDeleting(true);
    try {
      const res = await deleteBoardColumnAction(columnToDelete.id);
      if (!res.success) {
        toast.error(res.error || "Falha ao excluir coluna.");
        return;
      }
      toast.success(`Coluna "${columnToDelete.title}" excluída com sucesso!`);
      setColumns((prev) => prev.filter((c) => c.id !== columnToDelete.id));
      setColumnToDelete(null);
      router.refresh();
    } catch {
      toast.error("Erro inesperado ao excluir coluna.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section
      className={cn("flex flex-col shrink-0", isCompact ? "gap-3" : "gap-4")}
    >
      <header className="flex items-center justify-between">
        <h3
          className={cn(
            "font-bold text-neutral-50",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          Resumo de Listas
        </h3>
        <output
          className="text-sm text-neutral-400 font-bold"
          aria-label="Contagem de listas criadas e limite do plano"
        >
          {columns.length}/{maxColumns}
        </output>
      </header>

      <ul className="flex items-center gap-3.5 sm:gap-4 w-full overflow-x-auto custom-scrollbar px-1 py-2 m-0 list-none">
        {columns.map((column) => {
          const ColumnIcon = getColumnIcon(column.icon);
          const colTasks = tasks
            ? tasks.filter((t) => t.columnId === column.id)
            : null;
          const completedCount = colTasks
            ? colTasks.filter((t) => t.completed).length
            : (column.completedTasks ?? 0);
          const totalCount = colTasks
            ? colTasks.length
            : (column.totalTasks ?? 0);

          return (
            <li
              key={column.id}
              className="list-none shrink-0"
              onContextMenu={(e) => handleContextMenu(e, column)}
            >
              <Link
                href={`/tasks?columnId=${column.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-gold rounded-lg block"
                title={`${column.name || "Lista"} • Botão direito para editar ou excluir`}
              >
                <ListCard
                  compact={isCompact}
                  title={column.name || "Sem título"}
                  count={`${completedCount}/${totalCount}`}
                  icon={
                    <ColumnIcon size={isCompact ? 16 : 18} aria-hidden="true" />
                  }
                />
              </Link>
            </li>
          );
        })}

        <li className="list-none shrink-0">
          {isLimitReached ? (
            <UpgradeColumnLimitCard
              compact={isCompact}
              isPremium={isPremium}
              currentCount={columns.length}
              maxCount={maxColumns}
            />
          ) : (
            <Link
              href="/tasks?createColumn=true"
              className="focus:outline-none focus:ring-2 focus:ring-gold rounded-lg block"
            >
              <ListCard
                compact={isCompact}
                title="Adicionar"
                isAdd={true}
                icon={<Plus size={isCompact ? 16 : 18} aria-hidden="true" />}
              />
            </Link>
          )}
        </li>
      </ul>

      {/* Popover / Context Menu com Editar e Excluir */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, column: null }))
        }
        items={[
          {
            label: "Editar",
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.column) {
                setColumnToEdit(contextMenu.column);
                setIsEditModalOpen(true);
              }
            },
          },
          {
            label: "Excluir",
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: () => {
              if (contextMenu.column) {
                setColumnToDelete(contextMenu.column);
              }
            },
          },
        ]}
      />

      {/* Modal: Editar Coluna */}
      {isEditModalOpen && (
        <CreateBoardColumnModal
          isOpen={isEditModalOpen}
          columnToEdit={columnToEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setColumnToEdit(null);
          }}
          onSuccess={(savedCol) => {
            setColumns((prev) =>
              prev.map((c) =>
                c.id === savedCol.id
                  ? { ...c, name: savedCol.title, icon: savedCol.icon }
                  : c,
              ),
            );
            setIsEditModalOpen(false);
            setColumnToEdit(null);
            router.refresh();
          }}
        />
      )}

      {/* Modal: Confirmação de Exclusão da Coluna */}
      {Boolean(columnToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(columnToDelete)}
          title="Excluir Coluna"
          description={
            <>
              Tem certeza de que deseja excluir a coluna{" "}
              <span className="font-bold text-neutral-100">
                &quot;{columnToDelete?.title}&quot;
              </span>
              ? Esta ação é irreversível e todas as tarefas desta coluna serão
              removidas permanentemente.
            </>
          }
          confirmText="Excluir Coluna"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isDeleting}
          onClose={() => {
            if (!isDeleting) setColumnToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </section>
  );
}
