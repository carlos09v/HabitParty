"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { components } from "@/api/schema";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { ListCard } from "@/components/ui/ListCard";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  getColumnIcon,
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
} from "@/constants/routine";
import { useBoardStore } from "@/store/boardStore";
import { useTaskStore } from "@/store/taskStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Task, TaskFilterType } from "@/types/task";
import { cn } from "@/utils";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type Column = components["schemas"]["BoardColumnSummaryDTO"];

export function DashboardMain({
  isCompact = false,
  initialTasks = [],
  workspaces = [],
  activeWorkspaceId = "",
  initialColumns = [],
}: {
  isCompact?: boolean;
  initialTasks?: Task[];
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  initialColumns?: Column[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskFilterType>("today");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("habitparty_welcome_dashboard");
      if (saved !== null) {
        setIsWelcomeExpanded(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const initWorkspaces = useWorkspaceStore((state) => state.init);
  const initTasks = useTaskStore((state) => state.init);
  const initBoard = useBoardStore((state) => state.init);
  const storeColumns = useBoardStore((state) => state.columns);

  const columns = storeColumns.length > 0 ? storeColumns : initialColumns;

  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (initializedFor.current !== activeWorkspaceId) {
      initWorkspaces({ workspaces, activeWorkspaceId });
      initTasks({ tasks: initialTasks });
      initBoard({ columns: initialColumns });
      initializedFor.current = activeWorkspaceId;
    }
  }, [
    activeWorkspaceId,
    workspaces,
    initialTasks,
    initialColumns,
    initWorkspaces,
    initTasks,
    initBoard,
  ]);

  const handleWelcomeToggle = (expanded: boolean) => {
    setIsWelcomeExpanded(expanded);
    if (!expanded) {
      const currentPage = searchParams.get("page");
      if (currentPage && currentPage !== "1") {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }
  };

  const itemsPerPage = isWelcomeExpanded ? 3 : 5;
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    return initialTasks.filter((task) => {
      if (!task.dueDate) {
        return activeFilter === "nodate";
      }

      const [year, month, day] = task.dueDate.split("-").map(Number);
      const taskDate = new Date(year, (month || 1) - 1, day || 1);
      taskDate.setHours(0, 0, 0, 0);

      const isToday = taskDate.getTime() === today.getTime();
      const isPast = taskDate.getTime() < today.getTime();
      const isWithin7Days =
        taskDate.getTime() >= today.getTime() &&
        taskDate.getTime() <= next7Days.getTime();

      switch (activeFilter) {
        case "today":
          return isToday;
        case "next7days":
          return isWithin7Days;
        case "overdue":
          return isPast && !task.completed;
        case "nodate":
          return false;
        default:
          return true;
      }
    });
  }, [initialTasks, activeFilter]);

  const is_Premium = useUserStore((state) => state.is_Premium);
  const maxColumns = is_Premium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  return (
    <main
      className={cn(
        "flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-200",
        isCompact ? "p-4 sm:p-5 gap-5" : "p-6 gap-8",
      )}
    >
      {/* Banner de Boas-vindas Expansível */}
      <WelcomeCard
        compact={isCompact}
        title="Bom dia, Carlos!"
        subtitle="Café na mão e foco na missão?"
        bullets={[
          "Pronto para ser 1% melhor hoje?",
          "Sua ofensiva atual é de 3 dias. Vamos manter o ritmo!",
        ]}
        isExpanded={isWelcomeExpanded}
        onToggle={handleWelcomeToggle}
        storageKey="dashboard"
        imageSrc="/assets/undraw/dashboard/avatar.svg"
        stats={[
          { label: "Ofensiva Atual", value: "3 Dias 🔥" },
          { label: "Meta de Hoje", value: "5/6 Concluídas 🎯" },
          { label: "XP Acumulado", value: "+35 XP Hoje ✨" },
        ]}
      />

      {/* Seção: Lista de Tarefas (Cards proporcionais com largura uniforme) */}
      <section className={cn("flex flex-col", isCompact ? "gap-3" : "gap-4")}>
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

        <ul className="flex items-center gap-3.5 sm:gap-4 w-full overflow-x-auto custom-scrollbar p-0 m-0 list-none pb-1">
          {columns.map((column) => {
            const ColumnIcon = getColumnIcon(column.icon);
            return (
              <li key={column.id} className="list-none shrink-0">
                <ListCard
                  compact={isCompact}
                  title={column.name || "Sem título"}
                  count={`${column.completedTasks ?? 0}/${column.totalTasks ?? 0}`}
                  icon={
                    <ColumnIcon size={isCompact ? 16 : 18} aria-hidden="true" />
                  }
                />
              </li>
            );
          })}
          <li className="list-none shrink-0">
            <ListCard
              compact={isCompact}
              title="Adicionar"
              isAdd={true}
              onClick={() => router.push("/tasks?createColumn=true")}
              icon={<Plus size={isCompact ? 16 : 18} aria-hidden="true" />}
            />
          </li>
        </ul>
      </section>

      {/* Seção: Filtros de Tarefas e Tabela com Paginação Adaptativa */}
      <section className={cn("flex flex-col", isCompact ? "gap-4" : "gap-5")}>
        <TaskFilters
          activeFilter={activeFilter}
          onFilterChange={(f) => setActiveFilter(f)}
        />
        <TaskTable
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          tasks={filteredTasks}
          activeFilter={activeFilter}
        />
      </section>
    </main>
  );
}
