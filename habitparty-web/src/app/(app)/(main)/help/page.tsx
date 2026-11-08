import {
  Bug,
  GitBranch,
  HelpCircle,
  Mail,
  MessageSquareHeart,
} from "lucide-react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { HelpFaqSection } from "@/components/help/HelpFaqSection";
import { HelpProductivityCycle } from "@/components/help/HelpProductivityCycle";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getHelpFaqs, getHelpTables } from "@/constants/help";
import { SUPPORT_LINKS } from "@/constants/landing";
import type { AppLocale } from "@/i18n/config";
import { setStaticLocale } from "@/i18n/request";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getCompactMode } from "@/utils/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

async function HelpStaticContent({
  locale,
  isCompact,
}: {
  locale: AppLocale;
  isCompact: boolean;
}) {
  "use cache";
  cacheLife("static");
  cacheTag("help-content");

  setStaticLocale(locale);
  const t = await getTranslations({ locale, namespace: "help.page" });
  const faqs = getHelpFaqs(locale);
  const tables = getHelpTables(locale);

  return (
    <PageWrapper isCompact={isCompact}>
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
        {/* CABEÇALHO DA PÁGINA */}
        <header className="flex items-end justify-between border-b border-primary/20 pb-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <HelpCircle className="text-gold" size={28} />
              <h1 className="text-headline-s font-bold text-neutral-50 dark:drop-shadow-md">
                {t("title")}
              </h1>
            </div>
            <p className="text-body-m text-neutral-300 mt-1">{t("subtitle")}</p>
          </div>
        </header>

        {/* CICLO DE PRODUTIVIDADE (Server Component) */}
        <HelpProductivityCycle isCompact={isCompact} />

        {/* FAQ INTERATIVO + TABELAS DE ECONOMIA INTEGRADAS À BUSCA */}
        <HelpFaqSection isCompact={isCompact} faqs={faqs} tables={tables} />

        {/* CARD DE SUPORTE, CONTATO E REPORT DE BUGS */}
        <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/60 shadow-xs dark:shadow-none p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 dark:bg-gold/15 border border-amber-500/30 dark:border-gold/30 flex items-center justify-center text-amber-600 dark:text-gold shrink-0 mt-0.5">
              <MessageSquareHeart size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-50">
                {t("support.title")}
              </h2>
              <p className="text-body-s text-neutral-300 mt-1 leading-relaxed">
                {t("support.descriptionBeforeIssue")}
                <strong className="text-neutral-100">
                  {t("support.githubIssueHighlight")}
                </strong>
                {t("support.descriptionMiddle")}
                <a
                  href={SUPPORT_LINKS.contactMailto}
                  className="text-amber-700 dark:text-gold font-semibold hover:underline"
                >
                  {SUPPORT_LINKS.contactEmail}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
            <a
              href={SUPPORT_LINKS.githubIssues}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface/70 hover:bg-surface dark:bg-card dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-gold/50 text-xs font-bold text-neutral-100 hover:text-amber-700 dark:hover:text-gold transition-colors"
            >
              <Bug size={15} className="text-amber-600 dark:text-gold" />
              <span>{t("support.reportBug")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface/70 hover:bg-surface dark:bg-card dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-neutral-600 dark:hover:border-white/30 text-xs font-semibold text-neutral-200 hover:text-neutral-50 dark:hover:text-white transition-colors"
            >
              <GitBranch size={15} />
              <span>{t("support.repository")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.contactMailto}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold text-xs font-bold shadow-glow-gold-xs transition-colors"
            >
              <Mail size={15} />
              <span>{t("support.sendEmail")}</span>
            </a>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}

export default async function HelpPage() {
  const [isCompact, locale] = await Promise.all([
    getCompactMode(),
    getLocale() as Promise<AppLocale>,
  ]);

  return (
    <ScopedIntlProvider scope="help" locale={locale}>
      <HelpStaticContent locale={locale} isCompact={isCompact} />
    </ScopedIntlProvider>
  );
}
