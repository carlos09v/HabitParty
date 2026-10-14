"use client";

import { Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { components } from "@/api/schema";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { ListCard } from "@/components/ui/ListCard";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  getColumnIcon,
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
} from "@/constants/routine";
import { useUserStore } from "@/store/userStore";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import {
  getFirstName,
  getGreeting,
  getTodayDateString,
  getTodayTasks,
  getTodayXp,
} from "@/utils/dashboardMetrics";

type Workspace = components["schemas"]["WorkspaceResponseDTO"];
type Column = components["schemas"]["BoardColumnSummaryDTO"];

interface DashboardMainProps {
  isCompact?: boolean;
  initialTasks?: Task[];
  workspaces?: Workspace[];
  activeWorkspaceId?: string;
  initialColumns?: Column[];
  transactions?: TransactionHistoryResponseDTO[];
}

export function DashboardMain({
  isCompact = false,
  initialTasks = [],
  initialColumns = [],
  transactions = [],
}: DashboardMainProps) {
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);

  const user = useUserStore((state) => state.user);
  const is_Premium = useUserStore((state) => state.is_Premium);
  const maxColumns = is_Premium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const isLimitReached = initialColumns.length >= maxColumns;

  // Métricas do WelcomeCard calculadas via utilitário puro
  const greeting = useMemo(() => getGreeting(), []);
  const firstName = getFirstName(user?.fullName, user?.username);
  const streak = user?.currentStreak ?? 0;

  const todayDateStr = useMemo(() => getTodayDateString(), []);
  const todayTasks = useMemo(
    () => getTodayTasks(initialTasks, todayDateStr),
    [initialTasks, todayDateStr],
  );
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const totalTodayTasks = todayTasks.length;
  const todayXp = useMemo(() => getTodayXp(transactions), [transactions]);

  return (
    <main
      className={cn(
        "flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-200",
        isCompact ? "p-4 sm:p-5 gap-5" : "p-6 gap-8",
      )}
    >
      {/* Banner de Boas-vindas Expansível com Métricas */}
      <WelcomeCard
        compact={isCompact}
        title={`${greeting}, ${firstName}!`}
        subtitle="Café na mão e foco na missão?"
        bullets={[
          "Pronto para ser 1% melhor hoje?",
          streak > 0
            ? `Sua ofensiva atual é de ${streak} ${streak === 1 ? "dia" : "dias"}. Vamos manter o ritmo!`
            : "Complete suas tarefas de hoje para iniciar uma sequência de ofensiva!",
        ]}
        isExpanded={isWelcomeExpanded}
        onToggle={setIsWelcomeExpanded}
        storageKey="dashboard"
        imageSrc="/assets/undraw/dashboard/avatar.svg"
        stats={[
          {
            label: "Ofensiva Atual",
            value: `${streak} ${streak === 1 ? "Dia" : "Dias"} 🔥`,
          },
          {
            label: "Meta de Hoje",
            value:
              totalTodayTasks > 0
                ? `${completedTodayTasks}/${totalTodayTasks} Concluídas 🎯`
                : `${completedTodayTasks} Concluídas 🎯`,
          },
          { label: "XP Acumulado", value: `+${todayXp} XP Hoje ✨` },
        ]}
      />

      {/* Seção: Resumo de Listas */}
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
            {initialColumns.length}/{maxColumns}
          </output>
        </header>

        <ul className="flex items-center gap-3.5 sm:gap-4 w-full overflow-x-auto custom-scrollbar px-1 py-2 m-0 list-none">
          {initialColumns.map((column) => {
            const ColumnIcon = getColumnIcon(column.icon);
            return (
              <li key={column.id} className="list-none shrink-0">
                <Link
                  href={`/tasks?columnId=${column.id}`}
                  className="focus:outline-none focus:ring-2 focus:ring-gold rounded-lg block"
                >
                  <ListCard
                    compact={isCompact}
                    title={column.name || "Sem título"}
                    count={`${column.completedTasks ?? 0}/${column.totalTasks ?? 0}`}
                    icon={
                      <ColumnIcon
                        size={isCompact ? 16 : 18}
                        aria-hidden="true"
                      />
                    }
                  />
                </Link>
              </li>
            );
          })}
          <li className="list-none shrink-0">
            {isLimitReached ? (
              <ListCard
                compact={isCompact}
                title="Limite atingido"
                subtitle={`${initialColumns.length}/${maxColumns} no plano ${is_Premium ? "Premium" : "Free"}`}
                disabled={true}
                icon={<Lock size={isCompact ? 16 : 18} aria-hidden="true" />}
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
      </section>

      {/* Seção: Filtros de Tarefas e Tabela com Paginação Adaptativa */}
      <DashboardTasksPanel
        initialTasks={initialTasks}
        columns={initialColumns}
        isCompact={isCompact}
        isWelcomeExpanded={isWelcomeExpanded}
      />
    </main>
  );
}
