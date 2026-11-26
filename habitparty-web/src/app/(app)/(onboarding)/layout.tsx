import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { signOut } from "@/actions/auth";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SkipLink } from "@/components/ui/SkipLink";
import { getDefaultThemeForPolarity } from "@/constants/themes";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getOptionalThemeCookie, getSitePolarity } from "@/utils/cookies";

export const instant = false;

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [t, tUi, cookieTheme, sitePolarity] = await Promise.all([
    getTranslations("onboarding.layout"),
    getTranslations("ui"),
    getOptionalThemeCookie(),
    getSitePolarity(),
  ]);
  const initialTheme = cookieTheme ?? getDefaultThemeForPolarity(sitePolarity);

  return (
    <ScopedIntlProvider scope="onboarding">
      <ThemeInitializer theme={initialTheme} allowCustomThemes={true} />
      <SkipLink label={tUi("skipToContent")} />

      <div className="relative min-h-[100dvh] w-full flex flex-col justify-between bg-background overflow-x-clip custom-scrollbar">
        {/* Orbes de luz cósmicos sutis */}
        <div
          aria-hidden="true"
          className="cosmic-ambient-onboarding absolute inset-0 pointer-events-none z-0"
        />

        {/* TOP HEADER: Branding, Indicador de Etapa, Preferências e Sair */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-4 pb-1.5 flex items-center justify-between gap-2 shrink-0">
          <div className="inline-flex items-center shrink-0">
            <BrandLogo
              alt="HabitParty"
              width={200}
              height={44}
              className="w-auto h-7 sm:h-9 lg:h-10"
              priority
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-card/95 border border-neutral-700 text-neutral-300 dark:bg-surface/90 dark:border-primary/30 dark:text-neutral-300 text-xs shadow-xs whitespace-nowrap">
              <span
                aria-hidden="true"
                className="w-2 h-2 rounded-full bg-primary dark:bg-gold motion-safe:animate-pulse shrink-0"
              />
              <span className="font-medium text-neutral-100 dark:text-neutral-200">
                {t("headerBadge")}
              </span>
              <span aria-hidden="true" className="text-neutral-400">
                •
              </span>
              <span className="text-neutral-400">{t("quickSetupHint")}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <LanguageToggleBtn variant="icon" />
              <ThemeToggleBtn variant="icon" />
              <form action={signOut}>
                <button
                  type="submit"
                  aria-label={t("signOutAria")}
                  title={t("signOutAria")}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg border border-neutral-700/80 dark:border-white/10 bg-card/90 hover:bg-surface-hover dark:bg-surface/80 dark:hover:bg-surface text-xs font-semibold text-neutral-300 hover:text-neutral-50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  <LogOut size={15} aria-hidden="true" />
                  <span className="hidden sm:inline">{t("signOut")}</span>
                </button>
              </form>
            </div>
          </div>
        </header>

        {/* ÁREA PRINCIPAL */}
        <main
          id="main-content"
          tabIndex={-1}
          className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col py-2 outline-none"
        >
          {children}
        </main>

        {/* RODAPÉ DISCRETO */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-2.5 pb-20 sm:pb-3 text-center text-xs text-neutral-400 shrink-0">
          {t("copyright", { year: new Date().getFullYear() })}
        </footer>
      </div>
    </ScopedIntlProvider>
  );
}
