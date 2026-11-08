import { Bug, GitBranch, Mail } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LANDING_NAV_LINK_CONFIGS, SUPPORT_LINKS } from "@/constants/landing";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const locale = useLocale();
  const t = useTranslations("landing.footer");
  const tNav = useTranslations("landing.navbar");

  return (
    <footer className="border-t border-neutral-700 dark:border-white/10 bg-card/70 dark:bg-neutral-900/60 pt-16 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Coluna 1: Marca */}
          <div className="lg:col-span-2 space-y-4">
            <Link href={`/${locale}`} className="inline-block">
              <BrandLogo
                alt="HabitParty"
                width={160}
                height={36}
                className="w-auto h-9"
              />
            </Link>
            <p className="text-sm text-neutral-300 max-w-sm leading-relaxed">
              {t("brandDescription")}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={SUPPORT_LINKS.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/80 hover:bg-surface-hover dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-700 dark:border-white/10 text-xs font-medium text-neutral-300 hover:text-gold transition-colors"
                aria-label={t("githubAria")}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
              <a
                href={SUPPORT_LINKS.contactMailto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/80 hover:bg-surface-hover dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-700 dark:border-white/10 text-xs font-medium text-neutral-300 hover:text-gold transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gold" />
                <span>{SUPPORT_LINKS.contactEmail}</span>
              </a>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4">
              {t("exploreTitle")}
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              {LANDING_NAV_LINK_CONFIGS.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="hover:text-gold transition-colors"
                  >
                    {tNav(`links.${link.id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Acesso */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4">
              {t("accessTitle")}
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li>
                <Link
                  href="/signIn"
                  className="hover:text-gold transition-colors"
                >
                  {t("signInLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/signUp"
                  className="hover:text-gold transition-colors"
                >
                  {t("signUpFreeLink")}
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="hover:text-gold transition-colors"
                >
                  {t("helpCenterLink")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Suporte & Contato */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-100 mb-4">
              {t("supportTitle")}
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300">
              <li>
                <a
                  href={SUPPORT_LINKS.githubIssues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  <Bug className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span>{t("reportBugLink")}</span>
                </a>
              </li>
              <li>
                <a
                  href={SUPPORT_LINKS.githubRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors inline-flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{t("officialRepoLink")}</span>
                </a>
              </li>
              <li>
                <a
                  href={SUPPORT_LINKS.contactMailto}
                  className="hover:text-gold transition-colors inline-flex items-center gap-1.5 break-all"
                >
                  <Mail className="w-3.5 h-3.5 text-info shrink-0" />
                  <span>{SUPPORT_LINKS.contactEmail}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Inferior com Copyright */}
        <div className="pt-8 border-t border-neutral-700/80 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <p>{t("copyright", { year: currentYear })}</p>
          <div className="flex items-center gap-4">
            <p className="text-center sm:text-right">{t("tagline")}</p>
            <div className="flex items-center gap-2">
              <LanguageToggleBtn variant="icon" />
              <ThemeToggleBtn variant="icon" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
