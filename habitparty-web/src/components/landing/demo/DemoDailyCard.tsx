import { CheckCircle2, Coins, Flame } from "lucide-react";
import { cn } from "@/utils";

interface DemoDailyCardProps {
  isStudyDone: boolean;
  studyStreak: number;
  onToggle: (e: React.MouseEvent) => void;
}

export function DemoDailyCard({
  isStudyDone,
  studyStreak,
  onToggle,
}: DemoDailyCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border flex flex-col justify-between transition-all",
        isStudyDone
          ? "bg-success-500/10 border-success-500/40"
          : "bg-card dark:bg-card/70 border-neutral-700 dark:border-white/10 hover:border-primary-light/40 shadow-xs dark:shadow-sm",
      )}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-warning-500 uppercase tracking-wider bg-warning-500/10 px-2 py-0.5 rounded flex items-center gap-1">
            <Flame className="w-3 h-3 fill-warning-500" />
            Streak {studyStreak} dias
          </span>
          <span className="text-xs font-bold text-gold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> +25
          </span>
        </div>
        <h4
          className={cn(
            "text-sm font-bold flex items-center gap-2",
            isStudyDone ? "line-through text-neutral-400" : "text-neutral-50",
          )}
        >
          💻 1h de Estudo Profundo
        </h4>
        <p className="text-xs text-neutral-400 mt-1">
          Reseta à meia-noite se não for concluída.
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          {isStudyDone ? "Concluída!" : "Completar Quest:"}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer",
            isStudyDone
              ? "bg-success-500/20 text-success-500 border border-success-500/30"
              : "bg-gold hover:bg-gold-hover text-neutral-900 shadow-sm dark:shadow-glow-gold hover:scale-105",
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {isStudyDone ? "Feito!" : "Concluir (+60 XP)"}
        </button>
      </div>
    </div>
  );
}
