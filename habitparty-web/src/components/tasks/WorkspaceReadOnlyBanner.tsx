"use client";

import { Crown, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

export interface WorkspaceReadOnlyBannerProps {
  onOpenUpgrade: () => void;
}

/**
 * Banner de aviso exibido no topo do Quadro de Tarefas quando o workspace ativo
 * está em modo somente-leitura (3º+ workspace sem assinatura VIP ativa).
 */
export function WorkspaceReadOnlyBanner({
  onOpenUpgrade,
}: WorkspaceReadOnlyBannerProps) {
  const t = useTranslations("tasks.container");

  return (
    <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-xl bg-amber-500/10 border border-amber-500/35 shadow-xs dark:bg-gold/10 dark:border-gold/40 dark:shadow-glow-gold-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-700 dark:bg-gold/20 dark:border-gold/40 dark:text-gold shrink-0">
          <Lock size={16} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-body-s font-bold text-neutral-100">
              {t("readOnlyTitle")}
            </span>
            <span className="text-tiny uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-gold/20 dark:text-gold dark:border-gold/30">
              VIP
            </span>
          </div>
          <p className="text-xs text-neutral-300">{t("readOnlyDescription")}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenUpgrade}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs shadow-xs dark:shadow-glow-gold-xs transition-colors cursor-pointer shrink-0"
      >
        <Crown size={14} className="fill-on-gold" />
        <span>{t("reactivatePremium")}</span>
      </button>
    </div>
  );
}
