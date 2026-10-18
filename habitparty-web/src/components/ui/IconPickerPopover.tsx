"use client";

import { ChevronDown, Crown, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useUserStore } from "@/store/userStore";
import type { IconOption } from "@/types/ui";
import { cn } from "@/utils";

export interface IconPickerPopoverProps {
  options: readonly IconOption[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  align?: "left" | "right";
  triggerVariant?: "compact" | "full";
  className?: string;
  title?: string;
}

/**
 * Seletor de ícones flutuante sob demanda (Popover).
 * Reduz a poluição visual em modais, mantendo a tela compacta e abrindo
 * a grade de ícones somente quando o usuário decide personalizar.
 */
export function IconPickerPopover({
  options,
  value,
  onChange,
  disabled = false,
  align = "left",
  triggerVariant = "compact",
  className,
  title = "Selecione um Ícone",
}: IconPickerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    containerRef,
    () => {
      if (isOpen) setIsOpen(false);
    },
    {
      enabled: isOpen,
      onEscape: () => setIsOpen(false),
    },
  );

  const selectedOption =
    options.find((opt) => opt.id.toLowerCase() === value?.toLowerCase()) ||
    options[0];
  const CurrentIcon = selectedOption?.icon;

  const handleSelect = (item: IconOption) => {
    if (item.isPremium && !isPremium) {
      toast.info(
        `O ícone "${item.label}" é exclusivo para membros Premium! Faça o upgrade para desbloquear.`,
      );
      setIsUpgradeModalOpen(true);
      return;
    }
    onChange(item.id);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        {/* Botão de Disparo / Gatilho */}
        {triggerVariant === "compact" ? (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            title={`Ícone: ${selectedOption?.label || value}. Clique para alterar.`}
            className={cn(
              "flex items-center justify-center gap-1.5 h-[42px] px-3 rounded-lg border transition-all cursor-pointer select-none shrink-0",
              "focus:outline-none focus:ring-1 focus:ring-gold",
              isOpen
                ? "border-gold bg-gold/15 text-gold shadow-glow-gold-xs"
                : "border-primary/40 bg-background/50 hover:bg-white/5 text-neutral-200 hover:text-gold hover:border-gold/40",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            {CurrentIcon && <CurrentIcon size={19} className="shrink-0" />}
            {selectedOption?.isPremium && (
              <Crown
                size={11}
                className="text-gold fill-gold shrink-0 -ml-0.5"
              />
            )}
            <ChevronDown
              size={13}
              className={cn(
                "text-neutral-400 transition-transform duration-150 shrink-0",
                isOpen && "rotate-180 text-gold",
              )}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            className={cn(
              "w-full flex items-center justify-between gap-3 h-[42px] px-3.5 rounded-lg border transition-all cursor-pointer select-none",
              "focus:outline-none focus:ring-1 focus:ring-gold",
              isOpen
                ? "border-gold bg-gold/15 text-gold shadow-glow-gold-xs"
                : "border-primary/40 bg-background/50 hover:bg-white/5 text-neutral-200 hover:border-gold/40",
              disabled && "opacity-50 cursor-not-allowed",
              className,
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {CurrentIcon && (
                <span className="p-1 rounded-md bg-gold/15 text-gold shrink-0 flex items-center gap-1">
                  <CurrentIcon size={16} />
                  {selectedOption?.isPremium && (
                    <Crown size={10} className="fill-gold" />
                  )}
                </span>
              )}
              <span className="text-body-s font-medium truncate text-neutral-100">
                {selectedOption?.label || value}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <span className="text-[11px] text-neutral-400">Alterar</span>
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform duration-150",
                  isOpen && "rotate-180 text-gold",
                )}
              />
            </div>
          </button>
        )}

        {/* Popover Flutuante */}
        {isOpen && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label={title}
            className={cn(
              "absolute top-full mt-1.5 z-50 p-3 rounded-xl border border-primary/40 bg-surface/95 backdrop-blur-md shadow-2xl",
              "w-80 max-w-[calc(100vw-2rem)] animate-in fade-in zoom-in-95 duration-150",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-caption font-semibold text-neutral-200 uppercase tracking-wider">
                  {title}
                </span>
                <span className="text-[10px] text-neutral-400">
                  ({options.length} ícones)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Fechar seleção de ícones"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto pr-0.5 custom-scrollbar">
              {options.map((item) => {
                const Icon = item.icon;
                const isSelected =
                  value.toLowerCase() === item.id.toLowerCase();
                const isLocked = item.isPremium && !isPremium;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    title={
                      item.isPremium
                        ? `${item.label} (Exclusivo VIP)`
                        : item.label
                    }
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all cursor-pointer select-none",
                      "focus:outline-none focus:ring-1 focus:ring-gold",
                      isSelected
                        ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                        : isLocked
                          ? "border-primary/20 bg-primary-dark/20 text-neutral-400 hover:text-gold hover:border-gold/40 hover:bg-white/5"
                          : "border-primary/25 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40 hover:bg-white/5",
                    )}
                  >
                    {item.isPremium && (
                      <Crown
                        size={10}
                        className="absolute top-1 right-1 text-gold fill-gold"
                      />
                    )}
                    <Icon size={18} />
                    <span className="text-[10px] font-medium leading-none truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
