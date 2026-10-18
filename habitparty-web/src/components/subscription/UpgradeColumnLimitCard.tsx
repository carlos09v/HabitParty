"use client";

import { Crown, Lock } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  // Se já for Premium, realmente bateu o teto absoluto de 6/6
  if (isPremium) {
    return (
      <ListCard
        compact={compact}
        title="Limite Atingido"
        subtitle={`${currentCount}/${maxCount} (Máximo)`}
        disabled={true}
        icon={<Lock size={compact ? 16 : 18} aria-hidden="true" />}
      />
    );
  }

  const hasSurplus = currentCount > maxCount;
  const subtitle = hasSurplus
    ? `Você tem ${currentCount} listas • Seja VIP 👑`
    : "Seja Premium (até 6) 👑";

  // Se for Free (4/4 ou com colunas na mochila), o card convida para o upgrade com 1 clique!
  return (
    <>
      <ListCard
        compact={compact}
        title="Limite Atingido"
        subtitle={subtitle}
        onClick={() => setIsOpen(true)}
        className="cursor-pointer group border-gold/40 bg-gold/5 hover:bg-gold/15 hover:border-gold hover:shadow-glow-gold transition-all"
        icon={
          <Crown
            size={compact ? 16 : 18}
            className="text-gold fill-gold/20 group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />
        }
      />
      <UpgradePremiumModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
