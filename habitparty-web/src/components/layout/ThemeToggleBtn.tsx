"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/hooks/useThemeMode";
import { cn } from "@/utils";

export interface ThemeToggleBtnProps {
  /**
   * - "row": Visual completo com label textual e pill switch (padrão para Sidebars)
   * - "icon": Visual compacto apenas com o ícone solar/lunar (ideal para Navbars e Headers)
   */
  variant?: "row" | "icon";
  className?: string;
}

export function ThemeToggleBtn({
  variant = "row",
  className,
}: ThemeToggleBtnProps) {
  const { theme, toggleTheme, mounted } = useThemeMode();
  const isLight = theme === "light";

  if (!mounted) {
    if (variant === "icon") {
      return (
        <div
          className={cn("h-9 w-9 rounded-xl opacity-0", className, "hidden")}
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        className={cn(
          "flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-body-s font-medium text-neutral-400 opacity-60",
          className,
          "hidden",
        )}
      >
        <div className="flex items-center gap-3">
          <Moon size={18} aria-hidden="true" />
          <span>Tema Escuro</span>
        </div>
        <div className="h-5 w-9 rounded-full bg-neutral-300 dark:bg-neutral-700/40" />
      </div>
    );
  }

  // Variante Compacta (Ícone para Headers / Navbars)
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "relative inline-flex items-center justify-center h-9 w-9 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
          "border border-neutral-700 bg-card hover:bg-surface-hover text-neutral-200 hover:text-neutral-50 shadow-2xs backdrop-blur-xs",
          "dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-200 dark:hover:text-white dark:shadow-none",
          className,
          "hidden",
        )}
        aria-label={
          isLight ? "Ativar tema escuro cósmico" : "Ativar tema claro solar"
        }
        title={
          isLight
            ? "Mudar para Modo Escuro Cósmico"
            : "Mudar para Modo Claro Solar"
        }
      >
        {isLight ? (
          <Moon
            className="w-4 h-4 text-neutral-200 transition-transform duration-200 hover:rotate-12"
            aria-hidden="true"
          />
        ) : (
          <Sun
            className="w-4 h-4 text-gold transition-transform duration-200 hover:rotate-45"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  // Variante Completa (Row com Label e Pill Switch para Sidebar)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-500/10 dark:hover:text-neutral-50 border-r-2 border-transparent text-left cursor-pointer group select-none",
        className,
        "hidden",
      )}
      aria-label={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
      title={isLight ? "Alternar para Tema Escuro" : "Alternar para Tema Claro"}
    >
      <div className="flex items-center gap-3">
        <span className="transition-colors">
          {isLight ? (
            <Sun size={18} className="text-amber-500" aria-hidden="true" />
          ) : (
            <Moon size={18} className="text-primary-light" aria-hidden="true" />
          )}
        </span>
        <span className="text-neutral-200 group-hover:text-neutral-50 dark:text-neutral-200 dark:group-hover:text-neutral-50 transition-colors">
          {isLight ? "Tema Claro" : "Tema Escuro"}
        </span>
      </div>

      {/* Indicador de Switch Visual */}
      <div
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full transition-colors h-5 w-9 p-0.5",
          isLight
            ? "bg-amber-100 border border-amber-300 shadow-2xs"
            : "bg-neutral-800 border border-white/15",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "inline-flex items-center justify-center transform rounded-full shadow-xs transition-transform duration-200 h-3.5 w-3.5",
            isLight
              ? "translate-x-4 bg-amber-500 text-white"
              : "translate-x-0.5 bg-neutral-400 text-neutral-900",
          )}
        >
          {isLight ? (
            <Sun size={10} className="stroke-3 text-white" />
          ) : (
            <Moon size={9} className="text-neutral-900" />
          )}
        </span>
      </div>
    </button>
  );
}
