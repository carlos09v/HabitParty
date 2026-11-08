"use client";

import { Crown, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ListCard } from "@/components/ui/ListCard";
import { UpgradePremiumModal } from "./UpgradePremiumModal";

interface UpgradeColumnLimitCardProps {
  compact?: boolean;
  isPremium?: boolean;
  currentCount: number;
  maxCount: number;
}

export function UpgradeColumnLimitCard({
  compact = false,
  isPremium = false,
  currentCount,
  maxCount,
}: UpgradeColumnLimitCardProps) {
  const t = useTranslations("upgradeColumnLimitCard");
  const [isOpen, setIsOpen] = useState(false);

  // Se já for Premium, realmente bateu o teto absoluto de 6/6
  if (isPremium) {
    return (
      <ListCard
        compact={compact}
        title={t("title")}
        subtitle={t("maxSubtitle", { current: currentCount, max: maxCount })}
        disabled={true}
        icon={<Lock size={compact ? 16 : 18} aria-hidden="true" />}
      />
    );
  }

  const hasSurplus = currentCount > maxCount;
  const surplusCount = Math.max(0, currentCount - maxCount);
  const title = hasSurplus
    ? t("surplusTitle", { count: surplusCount })
    : t("title");
  const subtitle = hasSurplus
    ? t("surplusSubtitle", { current: currentCount })
    : t("upgradeSubtitle");

  // Se for Free (4/4 ou com colunas na mochila), o card convida para o upgrade com 1 clique!
  return (
    <>
      <ListCard
        compact={compact}
        title={title}
        subtitle={subtitle}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer group border-gold/40 bg-gold/5 hover:bg-gold/15 hover:border-gold transition-[border-color,background-color]"
        icon={
          <Crown
            size={compact ? 16 : 18}
            className="text-gold fill-gold/20 group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />
        }
      />
      {isOpen && (
        <UpgradePremiumModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
