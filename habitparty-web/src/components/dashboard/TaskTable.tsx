import { CalendarCheck, CheckCircle2, Sparkles } from "lucide-react";
import { useCompactMode } from "@/hooks/useCompactMode";
import type {
  TaskFilterType,
  TaskTableProps as TaskTableComponentProps,
} from "@/types/task";
import { cn } from "@/utils";
import { TaskPagination } from "./TaskPagination";
import { TaskRow } from "./TaskRow";

const EMPTY_MESSAGES: Partial<
  Record<
    TaskFilterType,
    { title: string; description: string; icon: typeof CalendarCheck }
  >
> = {
  today: {
    title: "Tudo limpo por hoje! 🎉",
    description: "Você não possui nenhuma tarefa pendente para hoje.",
    icon: CalendarCheck,
  },
  next7days: {
    title: "Sem tarefas nos próximos 7 dias",
    description: "Sua semana está tranquila. Que tal planejar novas metas?",
    icon: Sparkles,
  },
  overdue: {
    title: "Tudo em dia! ✨",
    description: "Parabéns, você não possui nenhuma tarefa atrasada.",
    icon: CheckCircle2,
  },
  nodate: {
    title: "Nenhuma tarefa sem prazo",
    description: "Todas as suas tarefas possuem uma data de entrega definida.",
    icon: CalendarCheck,
  },
};

export function TaskTable({
  itemsPerPage = 3,
  currentPage = 1,
  tasks,
  activeFilter = "today",
}: TaskTableComponentProps) {
  const totalItems = tasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  const { isCompact } = useCompactMode();

  const fallbackEmpty = {
    title: "Nenhuma tarefa encontrada",
    description: "Não encontramos tarefas para o filtro selecionado.",
    icon: CalendarCheck,
  };
  const emptyMeta = EMPTY_MESSAGES[activeFilter] || fallbackEmpty;
  const EmptyIcon = emptyMeta.icon;

  return (
    <section
      className="flex flex-col gap-2.5 w-full"
      aria-label="Lista de tarefas"
    >
      {/* Cabeçalho da Grade (mesmo grid de TaskRow) */}
      <div
        className={cn(
          "grid grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_36px] items-center text-xs font-semibold text-neutral-300",
          isCompact ? "gap-3 px-3 py-1.5" : "gap-4 px-4 py-2",
        )}
        aria-hidden="true"
      >
        <span className="pl-13">Nome</span>
        <span>Lista</span>
        <span>Tipo</span>
        <span>Frequência/Prazo</span>
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
          <div className="w-12 h-12 rounded-full bg-primary/25 border border-primary/40 flex items-center justify-center text-gold shadow-sm">
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
        <ul className="flex flex-col gap-2 w-full">
          {paginatedTasks.map((task) => (
            <li key={task.id}>
              <TaskRow task={task} />
            </li>
          ))}
        </ul>
      )}

      {totalItems > 0 && (
        <TaskPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </section>
  );
}
