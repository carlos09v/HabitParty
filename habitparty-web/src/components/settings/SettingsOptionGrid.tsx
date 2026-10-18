"use client";

import { Check, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { SettingsOptionItem } from "@/types/settings";
import { cn } from "@/utils";

interface SettingsOptionGridProps<T extends string | boolean> {
  statusMessage: ReactNode;
  options: readonly SettingsOptionItem<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  isCompact?: boolean;
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
}: SettingsOptionGridProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      {/* Banner de Status Ativo */}
      <div
        className={cn(
          "rounded-xl border flex items-center gap-3 w-fit transition-colors",
          isCompact ? "p-3" : "p-4",
          "bg-gold/10 border-gold/30 text-gold",
        )}
      >
        <Sparkles size={20} className="shrink-0 text-gold" />
        <div className="text-body-s">{statusMessage}</div>
      </div>

      {/* Grade de Seleção de Opções */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          const Icon = option.icon;

          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onSelect(option.value)}
              className={cn(
                "rounded-xl border text-left flex items-start justify-between gap-4 transition-all cursor-pointer h-full",
                isCompact ? "p-3" : "p-4",
                isSelected
                  ? "bg-primary-dark/60 border-gold shadow-glow-gold-sm ring-1 ring-gold"
                  : "bg-surface/40 border-primary/20 hover:border-primary/40",
              )}
            >
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {Icon && (
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-gold border border-primary/20 shrink-0">
                      <Icon size={18} />
                    </div>
                  )}
                  <span className="text-body-m font-bold text-neutral-100">
                    {option.title}
                  </span>
                  {option.badge && (
                    <span className="text-tiny font-bold px-2 py-0.5 rounded bg-gold/20 text-gold uppercase tracking-wider">
                      {option.badge}
                    </span>
                  )}
                </div>

                <p className="text-body-s text-neutral-300 leading-relaxed">
                  {option.description}
                </p>
              </div>

              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-gold text-neutral-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} className="stroke-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
