import { HelpCircle } from "lucide-react";
import type { Metadata } from "next";
import { HelpFaqSection } from "@/components/help/HelpFaqSection";
import { HelpProductivityCycle } from "@/components/help/HelpProductivityCycle";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getCompactMode } from "@/utils/cookies";

export const metadata: Metadata = {
  title: "Central de Ajuda & Guia | HabitParty",
  description:
    "Tire dúvidas sobre economia matemática, regras de hábitos, recompensas e progressão no HabitParty.",
};

export default async function HelpPage() {
  const isCompact = await getCompactMode();

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
        {/* CABEÇALHO DA PÁGINA */}
        <header className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <HelpCircle className="text-gold" size={28} />
              <h1 className="text-headline-s font-bold text-neutral-50 drop-shadow-md">
                Central de Ajuda & Guia
              </h1>
            </div>
            <p className="text-body-m text-neutral-300 mt-1">
              Tire todas as suas dúvidas sobre economia matemática, regras de
              hábitos, recompensas e progressão no HabitParty.
            </p>
          </div>
        </header>

        {/* CICLO DE PRODUTIVIDADE (Server Component) */}
        <HelpProductivityCycle isCompact={isCompact} />

        {/* FAQ INTERATIVO + TABELAS DE ECONOMIA INTEGRADAS À BUSCA */}
        <HelpFaqSection isCompact={isCompact} />
      </div>
    </PageWrapper>
  );
}
