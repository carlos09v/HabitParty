import { Sparkles, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { PartyWidgetProps } from "@/types/dashboard";
import { cn } from "@/utils";

/**
 * Widget de Membros da Party / Equipe (Formato Compacto).
 * Client Component: exibe dinamicamente "Party & Amigos" (Gamificado)
 * ou "Equipe & Colaboração" (Produtividade).
 */
export async function PartyWidget({
  isCompact = false,
  experienceMode = "PRODUCTIVITY",
}: PartyWidgetProps) {
  const t = await getTranslations("dashboard.sidebarRight.partyWidget");
  const isGamified = experienceMode === "GAMIFIED";
  return (
    <div
      className={cn(
        "w-full flex items-center justify-between rounded-lg border border-neutral-700 dark:border-dashed dark:border-white/10 bg-white dark:bg-white/5 shadow-2xs dark:shadow-none transition-colors",
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

      <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full bg-surface dark:bg-white/5 border border-neutral-700 dark:border-white/10 text-tiny font-medium text-neutral-400">
        <Sparkles
          size={11}
          className="text-amber-600 dark:text-gold/80"
          aria-hidden="true"
        />
        <span>{t("comingSoon")}</span>
      </div>
    </div>
  );
}
