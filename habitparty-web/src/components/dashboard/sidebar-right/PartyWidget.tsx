import { Sparkles, Users } from "lucide-react";
import { cn } from "@/utils";

interface PartyWidgetProps {
  isCompact?: boolean;
}

/**
 * Widget de Membros da Party / Amigos (Formato Compacto).
 * Server Component: renderiza de forma estática sem JavaScript de cliente,
 * ocupando o mínimo de espaço vertical enquanto a feature está em desenvolvimento.
 */
export function PartyWidget({ isCompact = false }: PartyWidgetProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between rounded-lg border border-dashed border-white/10 bg-white/5 transition-colors",
        isCompact ? "px-2.5 py-1.5" : "px-3 py-2",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Users
          size={isCompact ? 14 : 16}
          className="text-neutral-400 shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-neutral-300 truncate">
          Party & Amigos
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-400">
        <Sparkles size={11} className="text-gold/80" aria-hidden="true" />
        <span>Em breve</span>
      </div>
    </div>
  );
}
