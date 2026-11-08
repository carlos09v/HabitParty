import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export const instant = false;

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations("onboarding.layout");

  return (
    <ScopedIntlProvider scope="onboarding">
      <div className="relative h-[100dvh] w-full flex flex-col justify-between bg-background overflow-x-hidden overflow-y-auto lg:overflow-hidden custom-scrollbar select-none">
        {/* 
        ====================================================
        ORBES DE LUZ CÓSMICOS SUTIS (Identidade HabitParty)
        ==================================================== 
      */}
        <div
          aria-hidden="true"
          className="cosmic-ambient-onboarding absolute inset-0 pointer-events-none z-0"
        />

        {/* TOP HEADER: Branding, Indicador de Etapa e Seletor de Idioma */}
        <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-3 sm:pt-4 pb-1.5 flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-90 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-lg"
          >
            <BrandLogo
              alt="HabitParty"
              width={200}
              height={44}
              className="w-auto h-8 sm:h-9 lg:h-10"
              priority
            />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-card/95 border border-neutral-700 text-neutral-300 dark:bg-surface/90 dark:border-primary/30 dark:text-neutral-300 text-[11px] sm:text-xs shadow-xs">
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="font-medium text-neutral-100 dark:text-neutral-200">
                {t("headerBadge")}
              </span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-400">
                {t("stepIndicator", { current: 1, total: 1 })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggleBtn variant="icon" />
              <ThemeToggleBtn variant="icon" />
            </div>
          </div>
        </header>

        {/* ÁREA PRINCIPAL: Flex container adaptativo com rolagem fluida quando necessário */}
        <main className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col justify-center py-2">
          {children}
        </main>

        {/* RODAPÉ DISCRETO */}
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2.5 text-center text-xs text-neutral-400 shrink-0">
          {t("copyright", { year: new Date().getFullYear() })}
        </footer>
      </div>
    </ScopedIntlProvider>
  );
}
