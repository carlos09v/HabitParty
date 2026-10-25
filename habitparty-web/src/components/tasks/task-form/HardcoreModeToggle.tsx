import { AlertTriangle, Calendar, Flame, Lock, Zap } from "lucide-react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/utils";

interface HardcoreModeToggleProps {
  isHardcore: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  taskType?: "HABIT" | "DAILY" | "TODO" | string;
}

export function HardcoreModeToggle({
  isHardcore,
  onChange,
  disabled = false,
  taskType,
}: HardcoreModeToggleProps) {
  const isTodo = (taskType || "").toUpperCase() === "TODO";

  return (
    <div className="flex flex-col gap-2 pt-2 border-t border-white/10 mt-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-body-s font-semibold text-neutral-200">
            Modo Hardcore?
          </span>

          <InfoTooltip
            title={
              isTodo
                ? "Modo Hardcore (Prazo Fatal)"
                : "Modo Hardcore (Alto Risco)"
            }
            icon={<Zap size={14} className="fill-gold text-gold" />}
            ariaLabel="Entenda como funciona o Modo Hardcore"
          >
            {isTodo ? (
              <>
                <p className="text-neutral-300 leading-relaxed text-label-g">
                  Um compromisso rigoroso para entregas inegociáveis. Se o
                  afazer não for concluído até as 23:59 da data de entrega:
                </p>

                <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                  <li className="flex items-start gap-1.5">
                    <span className="text-danger-400 font-bold shrink-0">
                      🪙 -50% Moedas:
                    </span>
                    <span className="text-neutral-300">
                      Multa deduzida diretamente do seu saldo na virada do dia.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-danger-400 font-bold shrink-0">
                      ⚡ -50% XP:
                    </span>
                    <span className="text-neutral-300">
                      Penalidade aplicada no seu progresso de nível.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-warning-400 font-bold shrink-0 flex items-center gap-0.5">
                      <Lock size={12} className="shrink-0" /> Data Congelada:
                    </span>
                    <span className="text-neutral-300">
                      Após o vencimento, o prazo não pode ser adiado.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-neutral-400 font-bold shrink-0 flex items-center gap-0.5">
                      <Calendar size={12} className="shrink-0" /> Entrega
                      Tardia:
                    </span>
                    <span className="text-neutral-300">
                      Concluir após o prazo rende apenas 50% da recompensa (sem
                      bônus).
                    </span>
                  </li>
                </ul>

                <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
                  💡 Exige data de vencimento. Passou do prazo, a data é travada
                  e resta concluir atrasado ou excluir a tarefa.
                </div>
              </>
            ) : (
              <>
                <p className="text-neutral-300 leading-relaxed text-label-g">
                  Um compromisso rigoroso para suas metas inegociáveis. Se a
                  rotina não for concluída antes da virada do dia (23:59):
                </p>

                <ul className="flex flex-col gap-1.5 py-1 text-label-g text-neutral-200">
                  <li className="flex items-start gap-1.5">
                    <span className="text-danger-400 font-bold shrink-0">
                      🪙 -50% Moedas:
                    </span>
                    <span className="text-neutral-300">
                      Multa deduzida diretamente do seu saldo.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-danger-400 font-bold shrink-0">
                      ⚡ -50% XP:
                    </span>
                    <span className="text-neutral-300">
                      Penalidade aplicada no seu progresso de nível.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-warning-400 font-bold shrink-0 flex items-center gap-0.5">
                      <Flame size={12} className="shrink-0" /> Zera Streak:
                    </span>
                    <span className="text-neutral-300">
                      Sua ofensiva é reiniciada para o Dia 1.
                    </span>
                  </li>
                </ul>

                <div className="text-tiny text-neutral-400 bg-white/5 rounded-md p-1.5 border border-white/10 italic">
                  💡 Dica: Use apenas em hábitos e diárias que você tem certeza
                  que precisa priorizar acima de tudo.
                </div>
              </>
            )}
          </InfoTooltip>
        </div>

        <Switch
          checked={isHardcore}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label="Alternar Modo Hardcore"
          className={cn(
            isHardcore &&
              "bg-danger-500 border-danger-500 shadow-[0_0_10px_rgba(251,44,54,0.5)]",
          )}
        />
      </div>

      {/* Alerta Contextual quando Hardcore está ativo */}
      {isHardcore && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-tiny font-medium animate-in fade-in duration-200">
          <AlertTriangle size={13} className="shrink-0 text-danger-400" />
          <span>
            {isTodo
              ? "Alto Risco Ativo: 50% de penalidade se não cumprido até o prazo. A data não poderá ser adiada após o vencimento."
              : "Alto Risco Ativo: 50% de penalidade em Moedas e XP se não cumprida hoje."}
          </span>
        </div>
      )}
    </div>
  );
}
