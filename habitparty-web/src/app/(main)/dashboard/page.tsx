import { Suspense } from "react";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import {
  WeeklyCalendar,
  ActivitiesWidget,
  EconomyWidget,
  PartyWidget,
} from "@/components/dashboard/sidebar-right";

export default function DashboardPage() {
  return (
    // Container flex para separar o Main da Sidebar Right (travado em h-screen para não rolar a janela)
    <div className="flex h-screen w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex-1 p-8 text-center text-body-s text-neutral-400">
            Carregando painel...
          </div>
        }
      >
        <DashboardMain />
      </Suspense>

      {/* SIDEBAR DIREITA (WIDGETS GAMIFICADOS - 345px, fixa na tela sem nenhum scroll) */}
      <aside className="w-[345px] shrink-0 bg-primary-dark/20 border-l border-primary/30 backdrop-blur-md px-5 py-5 h-screen flex flex-col gap-4 overflow-hidden">
        <WeeklyCalendar />
        <div className="h-px w-full bg-white/8" />
        <ActivitiesWidget />
        <div className="h-px w-full bg-white/8" />
        <EconomyWidget balance={26} />
        <div className="h-px w-full bg-white/8" />
        <PartyWidget />
      </aside>
    </div>
  );
}
