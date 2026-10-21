import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative h-[100dvh] w-full flex flex-col justify-between bg-background overflow-x-hidden overflow-y-auto lg:overflow-hidden custom-scrollbar select-none">
      {/* 
        ====================================================
        ORBES DE LUZ CÓSMICOS SUTIS (Identidade HabitParty)
        ==================================================== 
      */}
      <div className="cosmic-orb absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-magenta/15 blur-[250px] pointer-events-none z-0 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-blue/20 blur-[280px] pointer-events-none z-0 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/20 blur-[200px] pointer-events-none z-0 opacity-25 dark:opacity-100" />

      {/* TOP HEADER: Branding e Indicador de Etapa */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-4 pb-1.5 flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="inline-flex items-center transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
        >
          <Image
            src="/assets/logo.png"
            alt="HabitParty"
            width={200}
            height={44}
            className="w-auto h-8 sm:h-9 lg:h-10 object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-card/80 border border-neutral-700 text-neutral-300 dark:bg-surface/60 dark:border-primary/30 dark:text-neutral-300 text-[11px] sm:text-xs backdrop-blur-md shadow-xs">
          <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="font-medium text-neutral-100 dark:text-neutral-200">
            Configuração Inicial
          </span>
          <span className="text-neutral-400">•</span>
          <span className="text-neutral-400">Passo 1 de 1</span>
        </div>
      </header>

      {/* ÁREA PRINCIPAL: Flex container adaptativo com rolagem fluida quando necessário */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center py-2">
        {children}
      </main>

      {/* RODAPÉ DISCRETO */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2.5 text-center text-xs text-neutral-400 shrink-0">
        © {new Date().getFullYear()} HabitParty. Todos os direitos reservados.
      </footer>
    </div>
  );
}
