"use client";

import { Calendar, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.sidebarRight.mobileDrawer");
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
            "flex items-center gap-2 rounded-full border border-neutral-700 bg-card hover:bg-surface dark:border-gold/40 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-amber-700 dark:text-gold shadow-sm dark:shadow-glow-gold-xs hover:shadow-md dark:hover:shadow-glow-gold hover:scale-105 active:scale-95 transition-[transform,scale,box-shadow,background-color,border-color] cursor-pointer group",
            isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
          )}
          title={t("fabTitle")}
          aria-label={t("fabTitle")}
        >
          <Calendar
            size={isCompact ? 16 : 18}
            className="text-amber-600 dark:text-gold group-hover:rotate-12 transition-transform"
          />
          <span className="font-bold text-neutral-100">{t("fabLabel")}</span>
          {balance > 0 && (
            <span className="text-label-g font-semibold text-amber-800 bg-amber-500/15 border border-amber-500/30 dark:text-gold dark:bg-gold/15 dark:border-gold/30 px-1.5 py-0.5 rounded-full">
              {balance} H
            </span>
          )}
        </button>
      </div>

      {/* Gaveta Lateral (Slide-over Drawer) para telas < xl */}
      <SlideOverDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel={t("drawerAriaLabel")}
        backdropAriaLabel={t("backdropAriaLabel")}
        containerClassName="xl:hidden"
        panelClassName="w-full sm:w-[380px]"
      >
        <header className="p-4 border-b border-neutral-700 dark:border-white/10 flex items-center justify-between bg-surface/60 dark:bg-surface-hover/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:bg-gold/15 dark:border-gold/30 flex items-center justify-center dark:text-gold">
              <Calendar size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-50 leading-tight">
                {t("headerTitle")}
              </h2>
              <p className="text-tiny text-neutral-400">
                {t("headerSubtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("closeAriaLabel")}
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
