"use client";

import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("ui.iconPicker");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);

  const gridColsClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 6
        ? "grid-cols-6"
        : "grid-cols-5";

  const getOptionLabel = (item: IconOption) => {
    const key = `icons.${item.id}` as Parameters<typeof t.has>[0];
    return t.has(key) ? t(key as Parameters<typeof t>[0]) : item.label;
  };

  const handleSelect = (item: IconOption) => {
    const label = getOptionLabel(item);
    if (item.isPremium && !isPremium) {
      toast.info(t("exclusiveToast", { label }));
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
        <legend className="sr-only">{t("groupAria")}</legend>
        {options.map((item) => {
          const Icon = item.icon;
          const isSelected = value.toLowerCase() === item.id.toLowerCase();
          const isLocked = item.isPremium && !isPremium;
          const label = getOptionLabel(item);

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              title={item.isPremium ? t("exclusiveBadge", { label }) : label}
              onClick={() => handleSelect(item)}
              disabled={disabled}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-lg border transition-[color,background-color,border-color,opacity] cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-gold",
                isCompact ? "p-1.5 min-h-[50px]" : "p-2 min-h-[56px]",
                isSelected
                  ? "opacity-100 border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                  : isLocked
                    ? "opacity-45 hover:opacity-85 border-neutral-700/70 bg-surface/40 dark:border-primary/15 dark:bg-primary-dark/15 text-neutral-400 hover:text-gold hover:border-gold/40"
                    : "opacity-100 border-primary/30 bg-primary-dark/20 text-neutral-200 hover:text-gold hover:border-gold/40",
                disabled && "opacity-40 cursor-not-allowed pointer-events-none",
              )}
            >
              {item.isPremium && (
                <Crown
                  size={10}
                  className={cn(
                    "absolute top-1 right-1",
                    isLocked
                      ? "text-gold/75 fill-gold/45"
                      : "text-gold fill-gold",
                  )}
                />
              )}
              <Icon size={isCompact ? 16 : 18} />
              <span className="text-[10px] font-medium leading-none truncate max-w-full">
                {label}
              </span>
            </button>
          );
        })}
      </fieldset>

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
