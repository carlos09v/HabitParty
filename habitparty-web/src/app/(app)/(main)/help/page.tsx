import {
  Bug,
  GitBranch,
  HelpCircle,
  History,
  Mail,
  MessageSquareHeart,
} from "lucide-react";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { HelpChangelogSection } from "@/components/help/HelpChangelogSection";
import { HelpFaqSection } from "@/components/help/HelpFaqSection";
import { HelpProductivityCycle } from "@/components/help/HelpProductivityCycle";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { getHelpFaqs, getHelpTables } from "@/constants/help";
import { SUPPORT_LINKS } from "@/constants/links";
import type { AppLocale } from "@/i18n/config";
import { setStaticLocale } from "@/i18n/request";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("help.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

async function HelpStaticContent({ locale }: { locale: AppLocale }) {
  "use cache";
  cacheLife("static");
  cacheTag("help-content");

  setStaticLocale(locale);
  const t = await getTranslations({ locale, namespace: "help.page" });
  const faqs = getHelpFaqs(locale);
  const tables = getHelpTables(locale);

  return (
    <PageWrapper>
      <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
        {/* CABEÇALHO DA PÁGINA */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-primary/20 pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <HelpCircle
                className="text-gold-ink dark:text-gold shrink-0"
                size={28}
                aria-hidden="true"
              />
              <h1 className="text-2xl sm:text-headline-s font-bold text-neutral-50 dark:drop-shadow-md">
                {t("title")}
              </h1>
            </div>
            <p className="text-body-s sm:text-body-m text-neutral-300 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <a
            href="#novidades"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card hover:bg-surface dark:bg-surface/60 dark:hover:bg-surface border border-neutral-700 dark:border-primary/30 text-xs font-bold text-neutral-100 hover:text-gold-ink dark:hover:text-gold transition-colors shrink-0 self-start sm:self-auto whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <History
              size={15}
              className="text-success-400 shrink-0"
              aria-hidden="true"
            />
            <span>{t("changelogJump")}</span>
          </a>
        </header>

        {/* CICLO DE PRODUTIVIDADE (Server Component) */}
        <HelpProductivityCycle />

        {/* FAQ INTERATIVO + TABELAS DE ECONOMIA INTEGRADAS À BUSCA */}
        <HelpFaqSection faqs={faqs} tables={tables} />

        {/* CHANGELOG & ROADMAP DO ECOSSISTEMA */}
        <HelpChangelogSection />

        {/* CARD DE SUPORTE, CONTATO E REPORT DE BUGS */}
        <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/60 shadow-xs dark:shadow-none p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-start gap-3.5 sm:gap-4 max-w-2xl min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 dark:bg-gold/15 border border-amber-500/30 dark:border-gold/30 flex items-center justify-center text-gold-ink dark:text-gold shrink-0 mt-0.5">
              <MessageSquareHeart size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-neutral-50">
                {t("support.title")}
              </h2>
              <p className="text-body-s text-neutral-300 mt-1 leading-relaxed break-words">
                {t("support.descriptionBeforeIssue")}
                <strong className="text-neutral-100">
                  {t("support.githubIssueHighlight")}
                </strong>
                {t("support.descriptionMiddle")}
                <a
                  href={SUPPORT_LINKS.contactMailto}
                  className="text-gold-ink dark:text-gold font-semibold hover:underline break-all rounded outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {SUPPORT_LINKS.contactEmail}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
            <a
              href={SUPPORT_LINKS.githubIssues}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface/70 hover:bg-surface dark:bg-card dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-gold/50 text-xs font-bold text-neutral-100 hover:text-gold-ink dark:hover:text-gold transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Bug
                size={15}
                className="text-gold-ink dark:text-gold shrink-0"
                aria-hidden="true"
              />
              <span>{t("support.reportBug")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface/70 hover:bg-surface dark:bg-card dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-neutral-600 dark:hover:border-white/30 text-xs font-semibold text-neutral-200 hover:text-neutral-50 dark:hover:text-white transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <GitBranch size={15} className="shrink-0" aria-hidden="true" />
              <span>{t("support.repository")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.contactMailto}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold text-xs font-bold shadow-glow-gold-xs transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Mail size={15} className="shrink-0" aria-hidden="true" />
              <span>{t("support.sendEmail")}</span>
            </a>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}

export default async function HelpPage() {
  const locale = (await getLocale()) as AppLocale;

  return (
    <ScopedIntlProvider scope="help" locale={locale}>
      <HelpStaticContent locale={locale} />
    </ScopedIntlProvider>
  );
}
