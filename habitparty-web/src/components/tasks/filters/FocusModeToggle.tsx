import type { FocusModeToggleProps } from "@/types/task-ui";
import { cn } from "@/utils";

export function FocusModeToggle({
  focusMode,
  onToggleFocusMode,
  isCompact = false,
}: FocusModeToggleProps) {
  return (
    <div className="hidden items-center gap-2 px-2 py-1">
      <span
        className={cn(
          "font-medium text-neutral-300 select-none",
          isCompact ? "text-tiny" : "text-xs",
        )}
      >
        Modo Foco:
      </span>
      <button
        type="button"
        onClick={onToggleFocusMode}
        aria-pressed={focusMode}
        title={
          focusMode
            ? "Modo Foco ativado: ocultando tarefas concluídas"
            : "Ativar Modo Foco para priorizar pendências"
        }
        className={cn(
          "w-7 h-4 rounded-full p-0.5 transition-colors cursor-pointer flex items-center focus:outline-none focus:ring-1 focus:ring-gold",
          focusMode ? "bg-gold shadow-glow-gold-xs" : "bg-white/15",
        )}
      >
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-transform shadow-xs",
            focusMode
              ? "translate-x-3 bg-neutral-900"
              : "translate-x-0 bg-neutral-400",
          )}
        />
      </button>
    </div>
  );
}
