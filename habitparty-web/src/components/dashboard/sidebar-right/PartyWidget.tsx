"use client";

import { Sparkles, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { PartyWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";

/**
 * Widget de Membros da Party / Equipe (Formato Compacto).
 * Client Component: exibe dinamicamente "Party & Amigos" (Gamificado)
 * ou "Equipe & Colaboração" (Produtividade).
 */
export function PartyWidget({ isCompact = false }: PartyWidgetProps) {
  const t = useTranslations("dashboard.sidebarRight.partyWidget");
  const { isGamified } = useExperienceMode();
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between rounded-lg border border-dashed border-white/10 bg-white/5 transition-colors",
        isCompact ? "px-2.5 py-1.5" : "px-3 py-2",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Users
          size={isCompact ? 14 : 16}
          className="text-neutral-400 shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-neutral-300 truncate">
          {isGamified ? t("titleGamified") : t("titleProductivity")}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-400">
        <Sparkles size={11} className="text-gold/80" aria-hidden="true" />
        <span>{t("comingSoon")}</span>
      </div>
    </div>
  );
}
