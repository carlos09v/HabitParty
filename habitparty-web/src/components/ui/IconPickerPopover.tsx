"use client";

import { ChevronDown, Crown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
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
 * Seletor de ícones flutuante sob demanda (Popover via Portal).
 * Renderiza fora do overflow de modais (usando createPortal no document.body),
 * evitando que o modal expanda verticalmente ou crie barra de rolagem.
 */
export function IconPickerPopover({
  options,
  value,
  onChange,
  disabled = false,
  align = "left",
  triggerVariant = "compact",
  className,
  title,
}: IconPickerPopoverProps) {
  const t = useTranslations("ui.iconPicker");
  const resolvedTitle = title ?? t("popoverTitle");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);

  const getOptionLabel = (item?: IconOption) => {
    if (!item) return "";
    const key = `icons.${item.id}` as Parameters<typeof t.has>[0];
    return t.has(key) ? t(key as Parameters<typeof t>[0]) : item.label;
  };

  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen,
    close,
    toggle,
    coords,
    shouldRenderPortal,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align,
    estimatedHeight: 296,
    estimatedWidth: 320,
    matchTriggerWidth: false,
    offset: 6,
    margin: 12,
    zIndex: 160,
    disabled,
  });

  const selectedOption =
    options.find((opt) => opt.id.toLowerCase() === value?.toLowerCase()) ||
    options[0];
  const CurrentIcon = selectedOption?.icon;
  const selectedLabel = getOptionLabel(selectedOption) || value;

  const handleSelect = (item: IconOption) => {
    const label = getOptionLabel(item);
    if (item.isPremium && !isPremium) {
      toast.info(t("exclusiveToast", { label }));
      close();
      setIsUpgradeModalOpen(true);
      return;
    }
    onChange(item.id);
    close();
  };

  const popoverContent = isOpen && coords && (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label={resolvedTitle}
      style={floatingStyle}
      className={cn(
        "p-3 rounded-xl border border-primary/40 bg-surface/95 backdrop-blur-md shadow-2xl",
        "w-80 max-w-[calc(100vw-1.5rem)] animate-in fade-in zoom-in-95 duration-150",
        coords.placement === "top" ? "origin-bottom" : "origin-top",
      )}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="text-caption font-semibold text-neutral-200 uppercase tracking-wider">
            {resolvedTitle}
          </span>
          <span className="text-[10px] text-neutral-400">
            {t("iconsCount", { count: options.length })}
          </span>
        </div>
        <button
          type="button"
          onClick={close}
          className="text-neutral-400 hover:text-neutral-200 p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={t("closeAria")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 max-h-60 overflow-y-auto pr-0.5 custom-scrollbar">
        {options.map((item) => {
          const Icon = item.icon;
          const isSelected = value.toLowerCase() === item.id.toLowerCase();
          const isLocked = item.isPremium && !isPremium;
          const label = getOptionLabel(item);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              title={item.isPremium ? t("exclusiveBadge", { label }) : label}
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
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div className="relative inline-block" ref={containerRef}>
        {triggerVariant === "compact" ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            title={t("compactButtonTitle", { label: selectedLabel })}
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
            ref={triggerRef}
            type="button"
            onClick={toggle}
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
                {selectedLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
              <span className="text-[11px] text-neutral-400">
                {t("change")}
              </span>
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

        {shouldRenderPortal &&
          popoverContent &&
          createPortal(popoverContent, document.body)}
      </div>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
