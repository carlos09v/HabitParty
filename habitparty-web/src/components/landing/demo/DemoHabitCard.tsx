import { Coins, Minus, Plus } from "lucide-react";

interface DemoHabitCardProps {
  waterCount: number;
  onMinus: () => void;
  onPlus: (e: React.MouseEvent) => void;
}

export function DemoHabitCard({
  waterCount,
  onMinus,
  onPlus,
}: DemoHabitCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card dark:bg-card/70 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-sm flex flex-col justify-between hover:border-primary-light/40 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-primary-dark dark:text-primary-light uppercase tracking-wider bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded">
            Hábito Diário
          </span>
          <span className="text-xs font-bold text-gold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" /> +5
          </span>
        </div>
        <h4 className="text-sm font-bold text-neutral-50 flex items-center gap-2">
          💧 Beber 2L de Água
        </h4>
        <p className="text-xs text-neutral-400 mt-1">
          Registros de hoje:{" "}
          <strong className="text-neutral-200">{waterCount} copos</strong>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-700/60 dark:border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400">
          Clique para pontuar:
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMinus}
            className="w-8 h-8 rounded-lg bg-surface hover:bg-surface-hover text-neutral-200 hover:text-neutral-50 dark:bg-surface dark:hover:bg-surface-hover dark:text-neutral-300 dark:hover:text-white flex items-center justify-center border border-neutral-700 dark:border-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Diminuir copo"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onPlus}
            className="px-3 h-8 rounded-lg bg-primary hover:bg-primary-light text-white font-bold text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(124,58,237,0.4)] active:scale-95 transition-all hover:scale-105 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            +15 XP
          </button>
        </div>
      </div>
    </div>
  );
}
