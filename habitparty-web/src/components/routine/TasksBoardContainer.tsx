"use client";

import { RoutineBoard } from "@/components/routine/RoutineBoard";
import {
  type ColumnSummary,
  RoutineFilters,
} from "@/components/routine/RoutineFilters";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { INITIAL_COLUMNS } from "@/mocks/tasks";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { MAX_COLUMNS_PREMIUM } from "@/constants/routine";

export function TasksBoardContainer() {
  const {
    columns,
    setColumns,
    visibleColumnIds,
    toggleColumnVisibility,
    createColumn,
  } = useRoutineColumns(INITIAL_COLUMNS);

  const columnsList: ColumnSummary[] = columns.map((col) => ({
    id: col.id,
    title: col.title,
    tasksCount: col.tasks.length,
  }));

  return (
    <main className="flex-1 min-w-0 h-screen flex flex-col p-6 gap-6 overflow-hidden custom-scrollbar">
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        compact
        title="Gerencie suas Tarefas!"
        subtitle="Organize seu Layout e mantenha o ritmo."
        bullets={[
          "Organize seu Layout e arraste colunas para a melhor ordem.",
          "Crie colunas apropriadas para cada contexto de tarefa.",
          "Classifique entre Diário, Hábito e Afazer (ToDo).",
        ]}
        imageSrc="/assets/undraw/task/undraw_next-task_jtbr 1.svg"
        imageWidth={136}
        imageHeight={93}
        className="p-4 max-w-2xl rounded-xl border border-primary/30 bg-primary-dark/20 shrink-0"
      />

      {/* Barra de Filtros */}
      <RoutineFilters
        columnsCount={columns.length}
        maxColumns={MAX_COLUMNS_PREMIUM}
        columnsList={columnsList}
        visibleColumnIds={visibleColumnIds}
        onToggleColumnVisibility={toggleColumnVisibility}
        onOpenCreateColumn={createColumn}
      />

      {/* Quadro Kanban Responsivo */}
      <section className="flex-1 min-w-0 flex flex-col" aria-label="Quadro de rotinas">
        <RoutineBoard
          columns={columns}
          setColumns={setColumns}
          visibleColumnIds={visibleColumnIds}
          onAddColumn={createColumn}
        />
      </section>
    </main>
  );
}
