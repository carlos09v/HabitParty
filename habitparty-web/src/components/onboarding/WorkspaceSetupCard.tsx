import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils";

interface WorkspaceSetupCardProps {
  workspaceName: string;
  onChangeName: (name: string) => void;
  chips: string[];
  onSelectChip: (chip: string) => void;
  disabled?: boolean;
}

export function WorkspaceSetupCard({
  workspaceName,
  onChangeName,
  chips,
  onSelectChip,
  disabled = false,
}: WorkspaceSetupCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-neutral-700 bg-card/90 shadow-xs dark:border-primary/30 dark:bg-surface/50 dark:shadow-card-deep backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-body-s font-bold text-neutral-100 flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-gold text-[11px] font-bold">
            2
          </span>
          Seu Primeiro Ambiente de Trabalho
        </h2>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-wider">
          ⭐ Essencial
        </span>
      </div>

      <p className="text-tiny sm:text-xs text-neutral-300">
        Ambientes organizam suas tarefas, rotinas e hábitos por contexto. Você
        poderá criar mais ambientes depois no painel.
      </p>

      <div className="flex flex-col gap-2">
        <Input
          label="Nome do Ambiente"
          id="workspaceName"
          value={workspaceName}
          maxLength={12}
          onChange={(e) => onChangeName(e.target.value.slice(0, 12))}
          placeholder="Ex: Vida Pessoal, Estudos..."
          hint="Máximo de 12 caracteres."
          required
          compact
          disabled={disabled}
        />

        {/* Sugestões Rápidas (Chips clicáveis) */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[11px] text-neutral-400 font-medium">
            Sugestões rápidas para o seu foco:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const isChipActive = workspaceName === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSelectChip(chip)}
                  disabled={disabled}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border",
                    isChipActive
                      ? "bg-gold/20 border-gold/60 text-gold font-bold shadow-sm"
                      : "bg-surface hover:bg-surface-hover border-neutral-700 text-neutral-200 hover:text-neutral-50 dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-primary-dark/40",
                  )}
                >
                  {isChipActive && (
                    <Check size={11} className="inline mr-1 -mt-0.5" />
                  )}
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
