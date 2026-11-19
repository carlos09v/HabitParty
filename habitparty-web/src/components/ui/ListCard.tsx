import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { ListCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function ListCard({
  title,
  count,
  subtitle,
  icon,
  isAdd,
  disabled,
  as = "button",
  reserveMenuSpace = false,
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

  const sharedClasses = cn(
    "flex flex-col justify-between transition-[transform,background-color,border-color,color,opacity] duration-150 w-full rounded-xl select-none text-left relative overflow-hidden p-2.5 sm:p-3 gap-1.5 min-h-[72px]",
    disabled
      ? "bg-surface/60 dark:bg-neutral-900/40 border border-neutral-700/50 text-neutral-500 cursor-not-allowed opacity-60 shadow-none"
      : isAdd
        ? "items-center justify-center text-center cursor-pointer group bg-primary/10 dark:bg-primary/20 border-2 border-dashed border-primary/50 dark:border-primary-light/70 text-primary dark:text-neutral-100 hover:border-primary dark:hover:border-gold hover:text-primary-dark dark:hover:text-gold hover:bg-primary/15 dark:hover:bg-primary-dark/50 shadow-none dark:hover:shadow-[0_0_14px_rgba(237,229,57,0.25)] hover:scale-[1.01]"
        : "cursor-pointer group bg-card dark:bg-surface/55 border border-neutral-700/80 dark:border-primary/35 text-neutral-50 hover:bg-card-hover dark:hover:bg-primary-dark/40 hover:border-primary/50 dark:hover:border-primary-light hover:shadow-sm dark:hover:shadow-[0_0_14px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:-translate-y-0.5",
    className,
  );

  const innerContent = (
    <>
      {/* Topo: Ícone à esquerda + Contador em pílula à direita */}
      <div
        className={cn(
          "flex items-center w-full gap-2",
          isAdd ? "justify-center" : "justify-between",
          reserveMenuSpace && !isAdd && "pr-7",
        )}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg transition-colors shrink-0 w-7 h-7",
              disabled
                ? "bg-neutral-800/80 text-neutral-400"
                : isAdd
                  ? "bg-primary/15 dark:bg-primary-light/20 text-primary dark:text-neutral-100 group-hover:bg-primary/20 dark:group-hover:bg-gold/20 group-hover:text-primary-dark dark:group-hover:text-gold"
                  : "bg-primary/10 dark:bg-primary-dark/45 border border-primary/20 dark:border-primary-light/35 text-primary dark:text-primary-light group-hover:text-primary-dark dark:group-hover:text-gold group-hover:border-primary/40 dark:group-hover:border-gold/40",
            )}
          >
            {icon}
          </div>
        )}

        {!isAdd && count && (
          <span
            className={cn(
              "font-bold tracking-wide tabular-nums px-2 py-0.5 rounded-md border transition-colors shrink-0 text-xs",
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
            "font-semibold truncate max-w-full leading-tight transition-colors text-body-s",
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
          <ProgressBar
            as="span"
            decorative
            percent={progressPercent}
            className="h-1 bg-neutral-700/40 dark:bg-white/10"
            fillClassName={cn(
              "transition-[transform,background-color] duration-300",
              isAllDone
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "bg-primary dark:bg-gold",
            )}
          />
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
    </>
  );

  if (as === "div") {
    return <div className={sharedClasses}>{innerContent}</div>;
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      disabled={disabled}
      aria-disabled={disabled}
      className={sharedClasses}
    >
      {innerContent}
    </button>
  );
}
