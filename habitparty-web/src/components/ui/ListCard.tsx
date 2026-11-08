import { useTranslations } from "next-intl";
import type { ListCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function ListCard({
  title,
  count,
  subtitle,
  icon,
  isAdd,
  disabled,
  compact,
  onClick,
  onContextMenu,
  className,
}: ListCardProps) {
  const t = useTranslations("ui.listCard");

  // Extrai progresso caso `count` esteja no formato "concluídas/total"
  let progressPercent: number | null = null;
  let isAllDone = false;
  if (!isAdd && count && count.includes("/")) {
    const [doneStr, totalStr] = count.split("/");
    const done = Number.parseInt(doneStr, 10);
    const total = Number.parseInt(totalStr, 10);
    if (!Number.isNaN(done) && !Number.isNaN(total) && total > 0) {
      progressPercent = Math.min(100, Math.round((done / total) * 100));
      isAllDone = done === total;
    } else if (total === 0) {
      progressPercent = 0;
    }
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "flex flex-col justify-between transition-[transform,background-color,border-color,color,opacity] duration-150 w-full rounded-xl select-none text-left relative overflow-hidden",
        compact ? "p-3 gap-2 min-h-[82px]" : "p-3.5 gap-2.5 min-h-[96px]",
        disabled
          ? "bg-surface/60 dark:bg-neutral-900/40 border border-neutral-700/50 text-neutral-500 cursor-not-allowed opacity-60 shadow-none"
          : isAdd
            ? "items-center justify-center text-center cursor-pointer group bg-primary/10 dark:bg-primary/20 border-2 border-dashed border-primary/50 dark:border-primary-light/70 text-primary dark:text-neutral-100 hover:border-primary dark:hover:border-gold hover:text-primary-dark dark:hover:text-gold hover:bg-primary/15 dark:hover:bg-primary-dark/50 shadow-none dark:hover:shadow-[0_0_14px_rgba(237,229,57,0.25)] hover:scale-[1.01]"
            : "cursor-pointer group bg-white dark:bg-surface/55 border border-neutral-700/80 dark:border-primary/35 text-neutral-50 hover:bg-card-hover dark:hover:bg-primary-dark/40 hover:border-primary/50 dark:hover:border-primary-light hover:shadow-sm dark:hover:shadow-[0_0_14px_rgba(124,58,237,0.22)] hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Topo: Ícone à esquerda + Contador em pílula à direita */}
      <div
        className={cn(
          "flex items-center w-full gap-2",
          isAdd ? "justify-center" : "justify-between",
        )}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg transition-colors shrink-0",
              compact ? "w-7 h-7" : "w-8 h-8",
              disabled
                ? "bg-neutral-800/80 text-neutral-500"
                : isAdd
                  ? "bg-primary/15 dark:bg-primary-light/20 text-primary dark:text-neutral-100 group-hover:bg-primary/20 dark:group-hover:bg-gold/20 group-hover:text-primary-dark dark:group-hover:text-gold"
                  : "bg-primary/10 dark:bg-primary-dark/45 border border-primary/20 dark:border-primary/30 text-primary dark:text-primary-light group-hover:text-primary-dark dark:group-hover:text-gold group-hover:border-primary/40 dark:group-hover:border-gold/40",
            )}
          >
            {icon}
          </div>
        )}

        {!isAdd && count && (
          <span
            className={cn(
              "font-bold tracking-wide tabular-nums px-2 py-0.5 rounded-md border transition-colors",
              compact ? "text-[11px]" : "text-xs",
              isAllDone
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-background/60 dark:bg-background/50 border-neutral-700/60 dark:border-white/10 text-neutral-200 group-hover:border-primary/30 dark:group-hover:border-gold/30 group-hover:text-primary dark:group-hover:text-gold",
            )}
          >
            {count}
          </span>
        )}
      </div>

      {/* Base: Nome da lista + Barra de progresso (ou subtítulo) */}
      <div
        className={cn(
          "flex flex-col w-full min-w-0",
          isAdd ? "items-center gap-0.5" : "gap-1.5",
        )}
      >
        <span
          className={cn(
            "font-semibold truncate max-w-full leading-tight transition-colors",
            compact ? "text-xs" : "text-body-s",
            disabled
              ? "text-neutral-400"
              : isAdd
                ? "text-primary dark:text-neutral-100 group-hover:text-primary-dark dark:group-hover:text-gold"
                : "text-neutral-100 group-hover:text-primary dark:group-hover:text-gold",
          )}
        >
          {title}
        </span>

        {!isAdd && progressPercent !== null ? (
          <div className="w-full h-1 rounded-full bg-neutral-700/40 dark:bg-white/10 overflow-hidden">
            <div
              className={cn(
                "h-full w-full origin-left transition-[transform,background-color] duration-300",
                isAllDone
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : "bg-primary dark:bg-gold",
              )}
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
        ) : subtitle ? (
          <span
            className={cn(
              "font-medium leading-tight text-tiny truncate max-w-full",
              disabled
                ? "text-neutral-500"
                : "text-neutral-400 dark:text-neutral-300 group-hover:text-primary/80 dark:group-hover:text-gold/90",
            )}
          >
            {subtitle}
          </span>
        ) : isAdd ? (
          <span className="font-medium text-neutral-500 dark:text-neutral-300 group-hover:text-primary/80 dark:group-hover:text-gold/90 leading-tight text-tiny">
            {t("newList")}
          </span>
        ) : null}
      </div>
    </button>
  );
}
