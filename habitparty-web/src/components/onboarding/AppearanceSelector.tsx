import { Moon, Sun } from "lucide-react";
import { cn } from "@/utils";

interface AppearanceSelectorProps {
  theme: "light" | "dark";
  onSetTheme: (theme: "light" | "dark") => void;
  isDark: boolean;
}

export function AppearanceSelector({
  theme,
  onSetTheme,
  isDark,
}: AppearanceSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-neutral-700 bg-card/90 shadow-xs dark:border-primary/20 dark:bg-surface/30 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="text-body-s font-bold text-neutral-50 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-gold text-[11px] font-bold">
            3
          </span>
          Aparência Inicial
        </h3>
        <span className="text-[11px] text-neutral-400">
          Altere a qualquer momento
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSetTheme("dark")}
          className={cn(
            "col-span-2 flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer",
            isDark
              ? "border-primary bg-primary/10 ring-1 ring-primary/30 text-neutral-50 shadow-sm dark:border-gold dark:bg-primary-dark/60 dark:text-neutral-50 dark:ring-1 dark:ring-gold/40"
              : "border-neutral-700 bg-card hover:bg-surface-hover text-neutral-300 hover:text-neutral-50 dark:border-primary/20 dark:bg-primary-dark/15 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-primary-dark/30",
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-md",
              isDark
                ? "bg-primary/20 text-primary-dark dark:bg-gold/20 dark:text-gold"
                : "bg-surface text-neutral-400 dark:bg-neutral-800 dark:text-neutral-400",
            )}
          >
            <Moon size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-50">
              Escuro Cósmico
            </span>
            <span className="text-[10px] text-neutral-400">Padrão RPG</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSetTheme("light")}
          className={cn(
            "flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all cursor-pointer",
            theme === "light"
              ? "border-primary bg-primary/10 ring-1 ring-primary/30 text-neutral-50 shadow-sm dark:border-gold dark:bg-primary-dark/60 dark:text-neutral-50 dark:ring-1 dark:ring-gold/40"
              : "border-neutral-700 bg-card hover:bg-surface-hover text-neutral-300 hover:text-neutral-50 dark:border-primary/20 dark:bg-primary-dark/15 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-primary-dark/30",
            "hidden",
          )}
        >
          <div
            className={cn(
              "p-1.5 rounded-md",
              theme === "light"
                ? "bg-primary/20 text-primary-dark dark:bg-gold/20 dark:text-gold"
                : "bg-surface text-neutral-400 dark:bg-neutral-800 dark:text-neutral-400",
            )}
          >
            <Sun size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-neutral-50">
              Claro Solar
            </span>
            <span className="text-[10px] text-neutral-400">Visual Arejado</span>
          </div>
        </button>
      </div>
    </div>
  );
}
