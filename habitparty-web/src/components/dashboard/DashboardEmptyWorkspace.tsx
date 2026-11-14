import { ArrowRight, LayoutDashboard, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DashboardEmptyWorkspaceActions } from "@/components/dashboard/DashboardEmptyWorkspaceActions";
import { getCurrentUser } from "@/services/userService";

export async function DashboardEmptyWorkspace() {
  const [t, user] = await Promise.all([
    getTranslations("dashboard.emptyWorkspace"),
    getCurrentUser(),
  ]);
  const isGamified = user?.experienceMode === "GAMIFIED";

  return (
    <div className="flex h-full w-full overflow-hidden items-center justify-center p-6 select-none relative">
      {/* CARD PRINCIPAL CONVIDATIVO */}
      <div className="relative z-10 w-full max-w-lg p-8 sm:p-10 rounded-2xl bg-card dark:bg-surface/90 border border-neutral-700 dark:border-primary/30 shadow-sm dark:shadow-card-deep text-center flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Ícone Cósmico / Produtividade Iluminado */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-gold-ink dark:bg-gold/15 dark:border-gold/40 dark:text-gold shadow-glow-gold-sm flex items-center justify-center mb-1">
          {isGamified ? (
            <Sparkles size={28} className="animate-pulse" aria-hidden="true" />
          ) : (
            <LayoutDashboard size={28} aria-hidden="true" />
          )}
        </div>

        {/* Textos Acolhedores */}
        <div className="flex flex-col gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-50 tracking-tight">
            {isGamified ? t("titleGamified") : t("titleProductivity")}
          </h2>
          <p className="text-body-s sm:text-body-m text-neutral-300 leading-relaxed max-w-md">
            {isGamified
              ? t("descriptionPrefixGamified")
              : t("descriptionPrefixProductivity")}{" "}
            <strong className="text-neutral-100 font-semibold">
              {t("workspaceHighlight")}
            </strong>{" "}
            {t("descriptionSuffix")}
          </p>
        </div>

        {/* Ações: Opção Híbrida (Botão de Modal + Atalho para Assistente) */}
        <div className="flex flex-col items-center gap-3.5 w-full pt-1">
          <DashboardEmptyWorkspaceActions />

          <Link
            href="/firstStep"
            className="text-xs sm:text-body-s text-neutral-400 hover:text-gold-ink dark:hover:text-gold transition-colors inline-flex items-center gap-1.5 pt-1 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded group"
          >
            <span>{t("wizardQuestion")}</span>
            <span className="text-neutral-200 group-hover:text-gold-ink dark:group-hover:text-gold font-semibold underline underline-offset-4 flex items-center gap-1">
              {t("wizardLink")}
              <ArrowRight
                size={13}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
