import { Sparkles, Users } from "lucide-react";
import { cn } from "@/utils";

interface PartyWidgetProps {
  isCompact?: boolean;
}

/**
 * Widget de Membros da Party / Amigos.
 * Server Component: renderiza de forma estática sem JavaScript de cliente.
 */
export function PartyWidget({ isCompact = false }: PartyWidgetProps) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h4 className="text-subtitle-s font-bold text-neutral-100">Amigos</h4>
          <span className="text-tiny text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
            Party (em breve)
          </span>
        </div>
        <Users size={16} className="text-neutral-400" />
      </div>

      {/* Espaço reservado enquanto a funcionalidade de amigos/party não existe */}
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center rounded-lg border border-dashed border-white/10 bg-white/5",
          isCompact ? "p-3 gap-1.5" : "p-4 gap-2",
        )}
      >
        <div className="p-1.5 rounded-full bg-white/5 text-neutral-400">
          <Sparkles size={isCompact ? 14 : 16} className="text-gold/80" />
        </div>
        <p className="text-tiny text-neutral-300 font-medium leading-relaxed max-w-[240px]">
          O sistema de grupos e lista de amigos estará disponível em breve!
        </p>
      </div>
    </div>
  );
}
