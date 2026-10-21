import { CalendarCheck } from "lucide-react";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { DASHBOARD_EMPTY_MESSAGES } from "@/constants/dashboard";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import type { TaskTableProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";
import { TaskPagination } from "./TaskPagination";

export function TaskTable({
  itemsPerPage = 3,
  currentPage = 1,
  tasks,
  activeFilter = "today",
  onToggle,
  onHabitChange,
  onContextMenu,
  onOpenDetails,
  onDelete,
  onEdit,
  onDuplicate,
  selectedDate,
  onPageChange,
  isCompact = false,
}: TaskTableProps) {
  const totalItems = tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  const formattedDate = formatShortDate(selectedDate);

  const fallbackEmpty = {
    title: "Nenhuma tarefa encontrada",
    description: "Não encontramos tarefas para o filtro selecionado.",
    icon: CalendarCheck,
  };

  const emptyMeta = selectedDate
    ? {
        title: "Tudo limpo nesta data! 🎉",
        description: `Não há tarefas agendadas para o dia ${formattedDate}.`,
        icon: CalendarCheck,
      }
    : DASHBOARD_EMPTY_MESSAGES[activeFilter] || fallbackEmpty;

  const EmptyIcon = emptyMeta.icon;

  const panelId = selectedDate ? "panel-date" : `panel-${activeFilter}`;
  const tabId = selectedDate ? "tab-date" : `tab-${activeFilter}`;

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className="flex flex-col gap-2.5 w-full"
      aria-label="Lista de tarefas"
    >
      {/* Cabeçalho da Grade Responsivo */}
      <div
        className={cn(
          "grid items-center text-xs font-semibold text-neutral-300",
          TASK_TABLE_GRID_COLS,
          isCompact ? "gap-2.5 px-3 py-1.5" : "gap-4 px-4 py-2",
        )}
        aria-hidden="true"
      >
        <span className="pl-13">Nome</span>
        <span className="hidden sm:block">Lista</span>
        <span>Tipo</span>
        <span className="hidden sm:block">Prioridade</span>
        <span className="hidden md:block">Frequência/Prazo</span>
        <span className="text-right sr-only">Ações</span>
      </div>

      {/* Linhas de Tarefas ou Estado Vazio */}
      {paginatedTasks.length === 0 ? (
        <div
          className={cn(
            "w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/30 bg-primary-dark/20 backdrop-blur-sm",
            isCompact ? "py-8 px-4 gap-2.5" : "py-12 px-6 gap-3.5",
          )}
        >
          <div className="w-12 h-12 rounded-full bg-primary/25 border border-primary/40 flex items-center justify-center text-gold shadow-xs">
            <EmptyIcon size={24} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-body-m font-bold text-neutral-100">
              {emptyMeta.title}
            </h4>
            <p className="text-body-s text-neutral-400 max-w-sm">
              {emptyMeta.description}
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 w-full p-0 m-0 list-none">
          {paginatedTasks.map((task) => (
            <li key={task.id} className="list-none">
              <TaskRow
                task={task}
                activeFilter={activeFilter}
                selectedDate={selectedDate}
                onToggle={onToggle}
                onHabitChange={onHabitChange}
                onContextMenu={onContextMenu}
                onOpenDetails={onOpenDetails}
                onDelete={onDelete}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                isCompact={isCompact}
              />
            </li>
          ))}
        </ul>
      )}

      {totalItems > 0 && (
        <TaskPagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          isCompact={isCompact}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
}
