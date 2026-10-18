import { Pause, Play, Timer } from "lucide-react";
import { cn } from "@/utils";

interface DemoFocusCardProps {
  timerSeconds: number;
  isRunning: boolean;
  onToggleTimer: () => void;
}

export function DemoFocusCard({
  timerSeconds,
  isRunning,
  onToggleTimer,
}: DemoFocusCardProps) {
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="p-4 rounded-xl bg-card dark:bg-card/70 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-sm flex flex-col justify-between hover:border-primary-light/40 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-info uppercase tracking-wider bg-info/10 px-2 py-0.5 rounded flex items-center gap-1">
            <Timer className="w-3 h-3" />
            Foco Zen
          </span>
          <span className="text-xs font-semibold text-neutral-400">25 min</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-2xl font-black text-neutral-50 tracking-wider font-mono">
            {formatTimer(timerSeconds)}
          </div>
          {isRunning && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4 bg-info rounded-full animate-pulse" />
              <span className="w-1.5 h-6 bg-info rounded-full animate-pulse delay-100" />
              <span className="w-1.5 h-3 bg-info rounded-full animate-pulse delay-200" />
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-400 mt-1">
          {isRunning
            ? "Hiperfoco ativo • Notificações silenciadas"
            : "Elimine distrações e foque na tarefa"}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          {isRunning ? "Em execução" : "Iniciar sessão:"}
        </span>
        <button
          type="button"
          onClick={onToggleTimer}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer",
            isRunning
              ? "bg-warning-500/20 text-warning-500 border border-warning-500/40"
              : "bg-primary hover:bg-primary-light text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]",
          )}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pausar
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" /> Iniciar Foco
            </>
          )}
        </button>
      </div>
    </div>
  );
}
