"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { SettingsOptionItem } from "@/types/settings";
import { cn } from "@/utils";

interface SettingsOptionGridProps<T extends string | boolean> {
  statusMessage: ReactNode;
  options: readonly SettingsOptionItem<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  isCompact?: boolean;
  /** Bloqueia todas as opções (ex.: enquanto uma troca está em andamento). */
  disabled?: boolean;
  /** Opção cuja aplicação está em andamento — exibe um spinner no lugar do check. */
  pendingValue?: T | null;
}

/**
 * Componente unificado para grids de opções selecionáveis (Tema, Densidade, etc.).
 * Elimina duplicações de lógica, botões e classes de estilo do Tailwind.
 */
export function SettingsOptionGrid<T extends string | boolean>({
  statusMessage,
  options,
  selectedValue,
  onSelect,
  isCompact = false,
  disabled = false,
  pendingValue = null,
}: SettingsOptionGridProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      {/* Banner de Status Ativo */}
      <div
        className={cn(
          "rounded-xl border flex items-center gap-3 w-fit transition-colors",
          isCompact ? "p-3" : "p-4",
          "bg-amber-500/10 dark:bg-gold/10 border-amber-500/30 dark:border-gold/30 text-amber-800 dark:text-gold",
        )}
      >
        <Sparkles
          size={20}
          className="shrink-0 text-amber-600 dark:text-gold"
        />
        <div className="text-body-s">{statusMessage}</div>
      </div>

      {/* Grade de Seleção de Opções */}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 mt-1",
          options.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2",
        )}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          const isPending =
            pendingValue !== null && option.value === pendingValue;
          const Icon = option.icon;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-busy={isPending || undefined}
              className={cn(
                "rounded-xl border text-left flex items-start justify-between gap-4 transition-colors cursor-pointer h-full disabled:cursor-wait",
                isCompact ? "p-3" : "p-4",
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
                  <Loader2
                    size={14}
                    className="animate-spin"
                    aria-hidden="true"
                  />
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
        })}
      </div>
    </div>
  );
}
