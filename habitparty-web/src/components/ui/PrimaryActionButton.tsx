import { type LucideIcon, Plus } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface PrimaryActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: LucideIcon;
  isCompact?: boolean;
}

/**
 * Botão de Ação Primária padrão para rightActions de FilterBars e cabeçalhos de lista.
 * Usa fundo dourado aquecido (gold-warm) com texto escuro para garantir contraste
 * de acessibilidade excelente e feedback tátil padronizado em todas as telas.
 */
export function PrimaryActionButton({
  label,
  icon: Icon = Plus,
  isCompact = false,
  className,
  ...props
}: PrimaryActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 rounded-lg bg-gold-warm hover:bg-gold-warm-hover active:bg-gold-warm-pressed text-neutral-950 font-bold transition-all cursor-pointer active:scale-98 shadow-sm shrink-0 select-none",
        isCompact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2.5 text-body-s",
        className,
      )}
      {...props}
    >
      <Icon
        size={isCompact ? 14 : 16}
        className="stroke-3 shrink-0 text-neutral-950"
      />
      <span className="text-neutral-950">{label}</span>
    </button>
  );
}
