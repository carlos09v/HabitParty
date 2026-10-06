import type { ListCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function ListCard({
  title,
  count,
  icon,
  isAdd,
  compact,
  onClick,
  className,
}: ListCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center transition-all cursor-pointer group shrink-0 rounded-xl select-none",
        compact
          ? "w-[130px] h-[96px] p-2.5 gap-1.5"
          : "w-[160px] h-[122px] p-3.5 gap-2",
        isAdd
          ? "bg-primary-dark/15 border-2 border-dashed border-primary-light/50 text-primary-light hover:border-gold hover:text-gold hover:bg-primary-dark/30 hover:shadow-[0_0_14px_rgba(237,229,57,0.25)] hover:scale-[1.02]"
          : "bg-primary-dark/20 border border-primary/40 text-neutral-50 hover:bg-primary-dark/40 hover:border-primary-light hover:shadow-[0_0_12px_rgba(124,58,237,0.25)] hover:scale-[1.02]",
        className,
      )}
    >
      {/* Bloco de ícone padronizado para todos os cards */}
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg transition-colors shrink-0",
            compact ? "w-7 h-7" : "w-9 h-9",
            isAdd
              ? "bg-primary-light/10 text-primary-light group-hover:bg-gold/20 group-hover:text-gold"
              : "bg-primary-dark/30 text-neutral-300 group-hover:text-gold group-hover:bg-primary-dark/50",
          )}
        >
          {icon}
        </div>
      )}

      {/* Textos */}
      <div className="flex flex-col items-center gap-0.5 w-full min-w-0 px-1">
        <span
          className={cn(
            "font-medium truncate max-w-full text-center leading-tight",
            compact ? "text-label-g" : "text-body-s",
            isAdd && "text-primary-light group-hover:text-gold font-semibold",
          )}
        >
          {title}
        </span>

        {!isAdd && count ? (
          <span
            className={cn(
              "font-bold tracking-wider text-neutral-100 leading-tight",
              compact ? "text-xs" : "text-subtitle-m",
            )}
          >
            {count}
          </span>
        ) : isAdd ? (
          <span className="font-medium text-neutral-400 group-hover:text-gold/80 leading-tight text-tiny">
            Nova lista
          </span>
        ) : null}
      </div>
    </button>
  );
}
