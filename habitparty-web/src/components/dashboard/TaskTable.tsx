import { type Task } from "@/types/task";
import { TaskRow } from "./TaskRow";
import { TaskPagination } from "./TaskPagination";

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Praticar 15 minutos de violão",
    category: "Hábitos",
    type: "habit",
    importance: "normal", // Verde
    rewardXp: 10,
    rewardGold: 1.75,
    completed: false,
    streak: 4,
    positiveCount: 5,
    negativeCount: 1,
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "2",
    title: "Resolver 30 questões de concurso",
    category: "Trabalho",
    type: "daily",
    difficulty: "high", // Vermelho
    rewardXp: 25,
    rewardGold: 3.75,
    completed: false,
    streak: 12,
    daysOfWeek: [1, 3, 5],
  },
  {
    id: "3",
    title: "Tomar creatina e vitaminas",
    category: "Hábitos",
    type: "habit",
    importance: "low", // Azul claro (low importance)
    rewardXp: 3,
    rewardGold: 0.5,
    completed: false,
    streak: 21,
    positiveCount: 18,
    negativeCount: 0,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "4",
    title: "Finalizar modelagem do banco de dados",
    category: "Trabalho",
    type: "todo",
    difficulty: "high",
    rewardXp: 25,
    rewardGold: 3.75,
    completed: false,
    dueDate: "2026-10-04",
  },
  {
    id: "5",
    title: "Arrumar a mesa de trabalho",
    category: "Hábitos",
    type: "daily",
    difficulty: "low", // Verde
    rewardXp: 5,
    rewardGold: 0.75,
    completed: true,
    streak: 7,
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  {
    id: "6",
    title: "Leitura de 10 páginas de arquitetura",
    category: "Trabalho",
    type: "daily",
    difficulty: "normal", // Amarelo
    rewardXp: 10,
    rewardGold: 1.75,
    completed: false,
    streak: 9,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: "7",
    title: "Fazer backup dos repositórios",
    category: "Trabalho",
    type: "todo",
    difficulty: "trivial", // Azul
    rewardXp: 5,
    rewardGold: 0.75,
    completed: false,
    dueDate: "2026-10-05",
  },
];

interface TaskTableProps {
  itemsPerPage?: number;
  currentPage?: number;
}

export function TaskTable({
  itemsPerPage = 3,
  currentPage = 1,
}: TaskTableProps) {
  const totalItems = MOCK_TASKS.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTasks = MOCK_TASKS.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <section className="flex flex-col gap-3 w-full" aria-label="Lista de tarefas">
      {/* Cabeçalho da Grade (mesmo grid de TaskRow) */}
      <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.5fr)_40px] items-center gap-4 px-4 py-2 text-body-s font-bold text-neutral-300" aria-hidden="true">
        <span className="pl-14">Nome</span>
        <span>Lista</span>
        <span>Tipo</span>
        <span>Frequência/Prazo</span>
        <span className="text-right sr-only">Ações</span>
      </div>

      {/* Linhas de Tarefas */}
      <div className="flex flex-col gap-3 w-full" role="list">
        {paginatedTasks.map((task) => (
          <div key={task.id} role="listitem">
            <TaskRow task={task} />
          </div>
        ))}
      </div>

      <TaskPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />
    </section>
  );
}
