"use client";

import { Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { useUserStore } from "@/store/userStore";
import type { IconOption, IconPickerProps } from "@/types/ui";
import { cn } from "@/utils";

export function IconPicker({
  options,
  value,
  onChange,
  disabled = false,
  columns = 5,
  className,
  isCompact = false,
}: IconPickerProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);

  const gridColsClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 6
        ? "grid-cols-6"
        : "grid-cols-5";

  const handleSelect = (item: IconOption) => {
    if (item.isPremium && !isPremium) {
      toast.info(
        `O ícone "${item.label}" é exclusivo para membros Premium! Faça o upgrade para desbloquear.`,
      );
      setIsUpgradeModalOpen(true);
      return;
    }
    onChange(item.id);
  };

  return (
    <>
      <fieldset
        className={cn("grid gap-2 border-0 p-0 m-0", gridColsClass, className)}
      >
        <legend className="sr-only">Seleção de ícone</legend>
        {options.map((item) => {
          const Icon = item.icon;
          const isSelected = value.toLowerCase() === item.id.toLowerCase();
          const isLocked = item.isPremium && !isPremium;

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              title={
                item.isPremium ? `${item.label} (Exclusivo VIP)` : item.label
              }
              onClick={() => handleSelect(item)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-lg border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-gold",
                isCompact ? "p-1.5 min-h-[50px]" : "p-2 min-h-[56px]",
                isSelected
                  ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                  : isLocked
                    ? "border-primary/20 bg-primary-dark/20 text-neutral-400 hover:text-gold hover:border-gold/40"
                    : "border-primary/30 bg-primary-dark/20 text-neutral-300 hover:text-gold hover:border-gold/40",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {item.isPremium && (
                <Crown
                  size={10}
                  className="absolute top-1 right-1 text-gold fill-gold"
                />
              )}
              <Icon size={isCompact ? 16 : 18} />
              <span className="text-[10px] font-medium leading-none truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </fieldset>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
