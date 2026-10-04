"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Sun } from "lucide-react";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { ListCard } from "@/components/ui/ListCard";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";

export function DashboardMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);

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

  return (
    <main className="flex-1 min-w-0 flex flex-col p-6 gap-8 overflow-y-auto custom-scrollbar">
      {/* Banner de Boas-vindas Expansível */}
      <WelcomeCard
        title="Bom dia, Carlos!"
        subtitle="Café na mão e foco na missão?"
        bullets={[
          "Pronto para ser 1% melhor hoje?",
          "Sua ofensiva atual é de 3 dias. Vamos manter o ritmo!",
        ]}
        isExpanded={isWelcomeExpanded}
        onToggle={handleWelcomeToggle}
        imageSrc="/assets/undraw/dashboard/avatar.svg"
        stats={[
          { label: "Ofensiva Atual", value: "3 Dias 🔥" },
          { label: "Meta de Hoje", value: "5/6 Concluídas 🎯" },
          { label: "XP Acumulado", value: "+35 XP Hoje ✨" },
        ]}
      />

      {/* Seção: Lista de Tarefas (Cards proporcionais) */}
      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-50">
            Resumo de Listas
          </h3>
          <span className="text-sm text-neutral-400 font-bold" aria-label="Progresso de listas">5/6</span>
        </header>

        <div className="flex items-center gap-4 w-full flex-wrap xl:flex-nowrap" role="list">
          <ListCard title="Bem vindo!" count="3/12" icon={<Sun size={24} aria-hidden="true" />} />
          <ListCard title="Hábitos" count="3/12" icon={<Sun size={24} aria-hidden="true" />} />
          <ListCard title="Trabalho" count="3/12" icon={<Sun size={24} aria-hidden="true" />} />
          <ListCard title="Foco" count="3/12" icon={<Sun size={24} aria-hidden="true" />} />
          <ListCard title="Leitura" count="3/12" icon={<Sun size={24} aria-hidden="true" />} />
          <ListCard title="Adicionar" isAdd={true} icon={<Plus size={28} aria-hidden="true" />} />
        </div>
      </section>

      {/* Seção: Filtros de Tarefas e Tabela com Paginação Adaptativa */}
      <section className="flex flex-col gap-5">
        <TaskFilters />
        <TaskTable itemsPerPage={itemsPerPage} currentPage={currentPage} />
      </section>
    </main>
  );
}
