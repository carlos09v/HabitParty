import { ReactNode } from "react";
import { cn } from "@/utils";

interface ListCardProps {
  title: string;
  count?: string;
  icon?: ReactNode;
  isAdd?: boolean; // Se for true, muda o estilo para o botão pontilhado/vazio
}

export function ListCard({ title, count, icon, isAdd }: ListCardProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center justify-center w-full h-[122px] max-w-[145px] p-3 rounded-xl transition-all cursor-pointer group shrink-0",
        isAdd
          ? // Card de Adicionar: borda tracejada em roxo claro da marca, fundo translúcido e hover dourado vibrante
            "bg-primary-dark/15 border-2 border-dashed border-primary-light/50 text-primary-light hover:border-gold hover:text-gold hover:bg-primary-dark/30 hover:shadow-[0_0_14px_rgba(237,229,57,0.25)] hover:scale-[1.02] gap-2"
          : // Cards de Listas normais
            "bg-primary-dark/20 border border-primary/40 text-neutral-50 hover:bg-primary-dark/40 hover:border-primary-light hover:shadow-[0_0_12px_rgba(124,58,237,0.25)] hover:scale-[1.02] gap-2",
      )}
    >
      {/* Bloco de ícone */}
      {icon && !isAdd && (
        <div className="flex items-center justify-center p-2 rounded-lg bg-primary-dark/30 text-neutral-300 group-hover:text-gold group-hover:bg-primary-dark/50 transition-colors">
          {icon}
        </div>
      )}

      {/* Ícone livre para o card de adicionar */}
      {icon && isAdd && (
        <div className="flex items-center justify-center text-primary-light group-hover:text-gold transition-colors">
          {icon}
        </div>
      )}

      {/* Textos */}
      <div className="flex flex-col items-center gap-0.5">
        <span
          className={cn(
            "text-body-s font-medium truncate max-w-[110px]",
            isAdd && "text-primary-light group-hover:text-gold font-semibold",
          )}
        >
          {title}
        </span>

        {!isAdd && count && (
          <span className="text-subtitle-m font-bold tracking-wider text-neutral-100">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
