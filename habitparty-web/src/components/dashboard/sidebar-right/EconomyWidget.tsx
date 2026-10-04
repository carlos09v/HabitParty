import { Coins } from "lucide-react";

interface EconomyWidgetProps {
  balance?: number;
}

export function EconomyWidget({ balance = 26 }: EconomyWidgetProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header com Saldo */}
      <div className="flex items-center justify-between w-full">
        <h4 className="text-subtitle-s font-bold text-neutral-100">Economia</h4>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gold/15 border border-gold/30">
          <span className="text-[11px] text-neutral-300">Carteira:</span>
          <div className="flex items-center gap-1">
            <Coins size={14} className="text-gold" />
            <span className="text-body-s font-bold text-gold">{balance}</span>
          </div>
        </div>
      </div>

      {/* Área reservada para o Gráfico de Barras */}
      <div className="p-3 rounded-lg border border-primary/30 bg-primary-dark/20 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>Ganhos por Semana</span>
          <span className="text-gold font-medium">+14 🪙 essa semana</span>
        </div>

        {/* Placeholder elegante do gráfico com respiro adequado no topo */}
        <div className="h-14 w-full flex items-end justify-between gap-3 px-2 border-b border-white/8">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-primary/40 rounded-t h-5"></div>
            <span className="text-[10px] text-neutral-400">Sem 1</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-primary/50 rounded-t h-8"></div>
            <span className="text-[10px] text-neutral-400">Sem 2</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-primary/60 rounded-t h-6"></div>
            <span className="text-[10px] text-neutral-400">Sem 3</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-gold rounded-t h-10 shadow-[0_0_8px_rgba(237,229,57,0.3)]"></div>
            <span className="text-[10px] text-gold font-bold">Sem 4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
