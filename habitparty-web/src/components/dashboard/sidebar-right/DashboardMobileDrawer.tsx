"use client";

import { Calendar, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import type { DashboardMobileDrawerProps } from "@/types/dashboard";
import { cn } from "@/utils";

/**
 * Botão flutuante (FAB) e gaveta deslizante (Slide-over Drawer) para telas < xl.
 * Client Component (Leaf Node): recebe os widgets via `children` (composição RSC)
 * e isola apenas o estado de abertura/fechamento.
 */
export function DashboardMobileDrawer({
  isCompact = false,
  balance = 0,
  children,
}: DashboardMobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");

  // Fecha a gaveta automaticamente ao selecionar uma data no calendário mobile
  // biome-ignore lint/correctness/useExhaustiveDependencies: Fecha drawer quando parametro date muda
  useEffect(() => {
    setIsOpen(false);
  }, [urlDate]);

  return (
    <>
      {/* Botão Flutuante (FAB) para telas < xl */}
      <div className="xl:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-2 rounded-full border border-gold/40 bg-neutral-900/95 hover:bg-neutral-900 text-gold shadow-glow-gold-xs hover:shadow-glow-gold hover:scale-105 active:scale-95 transition-all backdrop-blur-md cursor-pointer group",
            isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
          )}
          title="Abrir calendário e resumo financeiro"
          aria-label="Abrir calendário e resumo financeiro"
        >
          <Calendar
            size={isCompact ? 16 : 18}
            className="text-gold group-hover:rotate-12 transition-transform"
          />
          <span className="font-bold text-neutral-100">Resumo</span>
          {balance > 0 && (
            <span className="text-[11px] font-semibold text-gold bg-gold/15 border border-gold/30 px-1.5 py-0.5 rounded-full">
              {balance} H
            </span>
          )}
        </button>
      </div>

      {/* Gaveta Lateral (Slide-over Drawer) para telas < xl */}
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="Resumo do Painel e Calendário Semanal"
        backdropAriaLabel="Fechar resumo lateral"
        containerClassName="xl:hidden"
        panelClassName="w-full sm:w-[380px]"
      >
        <header className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-hover/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold">
              <Calendar size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-50 leading-tight">
                Resumo & Calendário
              </h2>
              <p className="text-tiny text-neutral-400">
                Atividades, finanças e metas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar resumo"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4">
          {children}
        </div>
      </SlideOverDrawer>
    </>
  );
}
