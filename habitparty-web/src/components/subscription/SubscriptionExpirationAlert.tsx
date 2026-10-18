"use client";

import { AlertTriangle, Clock, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import type { components } from "@/api/schema";
import { UpgradePremiumModal } from "@/components/subscription/UpgradePremiumModal";
import { cn } from "@/utils";
import { getSubscriptionExpirationInfo } from "@/utils/subscription";

type User = components["schemas"]["UserResponseDTO"];

interface SubscriptionExpirationAlertProps {
  user?: Partial<User> | null;
  className?: string;
}

export function SubscriptionExpirationAlert({
  user,
  className,
}: SubscriptionExpirationAlertProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const info = getSubscriptionExpirationInfo(user);

  // Exibe apenas se estiver expirando em até 7 dias
  if (!info.isExpiringSoon) {
    return null;
  }

  const isLastDay = info.isLastDay;
  const isUrgent = info.isUrgent;

  return (
    <>
      <aside
        aria-label="Aviso de expiração da assinatura"
        className={cn(
          "rounded-xl p-2.5 border transition-all duration-300 flex flex-col gap-1.5",
          isLastDay
            ? "bg-danger-500/10 border-danger-500/40 shadow-glow-danger-xs"
            : isUrgent
              ? "bg-orange-500/10 border-orange-500/35 shadow-glow-gold-xs"
              : "bg-gold/10 border-gold/30",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border",
              isLastDay
                ? "bg-danger-500/20 border-danger-500/40 text-danger-400 animate-pulse"
                : isUrgent
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-gold/20 border-gold/40 text-gold",
            )}
          >
            {isLastDay ? (
              <AlertTriangle size={13} className="stroke-2" />
            ) : isUrgent ? (
              <Clock size={13} className="stroke-2" />
            ) : (
              <Sparkles size={13} className="stroke-2" />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span
              className={cn(
                "text-xs font-bold leading-tight truncate",
                isLastDay
                  ? "text-danger-300"
                  : isUrgent
                    ? "text-orange-300"
                    : "text-gold",
              )}
            >
              {isLastDay
                ? `🚨 ${info.formattedRemaining}`
                : `⏳ ${info.formattedRemaining} de Premium`}
            </span>
            <span className="text-[10px] text-neutral-400 leading-tight truncate">
              {isLastDay
                ? "Quadros e bônus extras serão guardados"
                : "Mantenha seus 6 quadros e itens VIP"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsUpgradeModalOpen(true)}
          className={cn(
            "w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98",
            isLastDay
              ? "bg-danger-500 hover:bg-danger-600 text-white"
              : isUrgent
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gold hover:bg-gold-hover text-neutral-900",
          )}
        >
          <Crown size={12} className="shrink-0 stroke-2" />
          <span>Renovar Acesso</span>
        </button>
      </aside>

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
