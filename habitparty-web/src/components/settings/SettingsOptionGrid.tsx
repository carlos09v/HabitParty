import { Check, Loader2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { SettingsOptionItem } from "@/types/settings";
import { cn } from "@/utils/cn";

interface SettingsOptionGridProps<T extends string | boolean> {
  statusMessage?: ReactNode;
  options: readonly SettingsOptionItem<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  /** Bloqueia todas as opções (ex.: enquanto uma troca está em andamento). */
  disabled?: boolean;
  /** Opção cuja aplicação está em andamento — exibe um spinner no lugar do check. */
  pendingValue?: T | null;
  /** Visual density preset ("compact" matches stacked privacy option selectors). */
  variant?: "default" | "compact";
  /** Optional section heading & fieldset accessible label ID. */
  labelId?: string;
  title?: string;
  description?: string;
  /** Aviso contextual exibido quando o grupo depende de outra opção (ex.: privacidade). */
  dependencyHint?: ReactNode;
  /** Atenua visualmente o grupo quando bloqueado por uma regra superior. */
  dimmed?: boolean;
}

/**
 * Componente unificado para grids de opções selecionáveis (Tema, Experiência, Idioma, Privacidade, etc.).
 * Elimina duplicações de lógica, botões e classes de estilo do Tailwind.
 */
export function SettingsOptionGrid<T extends string | boolean>({
  statusMessage,
  options,
  selectedValue,
  onSelect,
  disabled = false,
  pendingValue = null,
  variant = "default",
  labelId,
  title,
  description,
  dependencyHint,
  dimmed = false,
}: SettingsOptionGridProps<T>) {
  const isCompact = variant === "compact";

  const gridClassName = cn(
    isCompact
      ? "grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-0 p-0 m-0"
      : cn(
          "grid grid-cols-1 gap-4 mt-1",
          options.length === 3
            ? "@lg:grid-cols-2 @3xl:grid-cols-3"
            : "@lg:grid-cols-2",
        ),
  );

  const optionButtons = options.map((option) => {
    const isSelected = option.value === selectedValue;
    const isPending = pendingValue !== null && option.value === pendingValue;
    const Icon = option.icon;

    if (isCompact) {
      return (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={isSelected}
          aria-busy={isPending || undefined}
          disabled={disabled}
          onClick={() => onSelect(option.value)}
          className={cn(
            "flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
            isSelected
              ? "bg-amber-500/[0.08] dark:bg-primary-dark/60 border-gold shadow-glow-gold-xs ring-1 ring-gold"
              : "bg-surface/45 border-neutral-700 hover:border-primary/40 dark:bg-surface/40 dark:border-primary/20",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-100">
              {Icon && (
                <Icon
                  size={14}
                  className={cn(
                    "shrink-0",
                    isSelected ? "text-gold" : "text-neutral-400",
                  )}
                  aria-hidden="true"
                />
              )}
              <span>{option.title}</span>
            </span>
            {isPending ? (
              <Loader2
                size={14}
                className="text-gold shrink-0 animate-spin"
                aria-hidden="true"
              />
            ) : (
              isSelected && (
                <Check
                  size={14}
                  className="text-gold shrink-0"
                  aria-hidden="true"
                />
              )
            )}
          </div>
          <span className="text-[11px] text-neutral-400 leading-snug">
            {option.description}
          </span>
        </button>
      );
    }

    return (
      <button
        key={String(option.value)}
        type="button"
        onClick={() => onSelect(option.value)}
        disabled={disabled}
        aria-pressed={isSelected}
        aria-busy={isPending || undefined}
        className={cn(
          "rounded-xl border text-left flex items-start justify-between gap-4 transition-colors cursor-pointer h-full disabled:cursor-wait p-4",
          isSelected
            ? "bg-amber-500/[0.08] dark:bg-primary-dark/60 border-gold shadow-glow-gold-sm ring-1 ring-gold"
            : "bg-surface/45 border-neutral-700 hover:border-primary/40 dark:bg-surface/40 dark:border-primary/20",
          disabled && !isSelected && "opacity-60",
        )}
      >
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-gold border border-neutral-700 dark:border-primary/20 shrink-0">
                <Icon size={18} />
              </div>
            )}
            <span className="text-body-m font-bold text-neutral-100">
              {option.title}
            </span>
            {option.badge && (
              <span className="text-tiny font-bold px-2 py-0.5 rounded bg-amber-500/15 dark:bg-gold/20 text-amber-800 dark:text-gold uppercase tracking-wider">
                {option.badge}
              </span>
            )}
          </div>

          <p className="text-body-s text-neutral-300 leading-relaxed">
            {option.description}
          </p>
        </div>

        {isPending ? (
          <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0 mt-0.5">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          </div>
        ) : (
          isSelected && (
            <div className="w-6 h-6 rounded-full bg-gold text-on-gold flex items-center justify-center shrink-0 mt-0.5">
              <Check size={14} className="stroke-3" />
            </div>
          )
        )}
      </button>
    );
  });

  const statusAndGrid = (
    <>
      {statusMessage && (
        <div className="rounded-xl border flex items-center gap-3 w-full sm:w-fit max-w-full transition-colors p-4 bg-amber-500/10 dark:bg-gold/10 border-amber-500/30 dark:border-gold/30 text-amber-800 dark:text-gold">
          <Sparkles
            size={20}
            className="shrink-0 text-amber-800 dark:text-gold"
            aria-hidden="true"
          />
          <div className="text-body-s min-w-0 flex-1">{statusMessage}</div>
        </div>
      )}

      <div className={gridClassName}>{optionButtons}</div>
    </>
  );

  if (title || labelId) {
    return (
      <fieldset
        className={cn(
          "@container flex flex-col border-0 p-0 m-0 min-w-0 transition-opacity",
          isCompact ? "gap-2.5" : "gap-4",
          dimmed && "opacity-60",
        )}
      >
        {title && (
          <legend
            id={labelId}
            className="text-body-s font-bold text-neutral-100 p-0 float-none w-full"
          >
            {title}
          </legend>
        )}
        {description && (
          <p className="text-tiny text-neutral-400 -mt-1.5">{description}</p>
        )}
        {dependencyHint && (
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
            {dependencyHint}
          </p>
        )}

        {statusAndGrid}
      </fieldset>
    );
  }

  return (
    <div
      className={cn(
        "@container flex flex-col",
        isCompact ? "gap-2.5" : "gap-4",
        dimmed && "opacity-60",
      )}
    >
      {statusAndGrid}
    </div>
  );
}
