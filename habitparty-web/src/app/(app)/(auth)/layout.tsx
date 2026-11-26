import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CosmicGalaxyIllustration } from "@/components/ui/CosmicGalaxyIllustration";
import { SkipLink } from "@/components/ui/SkipLink";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [t, tUi, locale] = await Promise.all([
    getTranslations("auth.layout"),
    getTranslations("ui"),
    getLocale(),
  ]);

  return (
    <ScopedIntlProvider scope="auth">
      <ThemeInitializer allowCustomThemes={false} />
      <SkipLink label={tUi("skipToContent")} />

      <div className="relative min-h-[100dvh] w-full flex bg-background overflow-x-clip">
        {/* LADO ESQUERDO: Branding + Formulário Centralizado na Metade (50% do viewport) */}
        <div className="w-full lg:w-[56%] xl:w-1/2 min-h-[100dvh] flex flex-col justify-between p-4 pb-20 sm:p-8 lg:p-10 xl:p-16 relative z-10">
          {/* Top bar: Logo HabitParty e Alternadores de Idioma e Tema */}
          <header className="flex items-center justify-between gap-2 w-full max-w-[487px] mx-auto">
            <Link
              href={`/${locale}`}
              aria-label={t("backToHome")}
              className="inline-block shrink-0 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <BrandLogo
                alt="HabitParty"
                width={251}
                height={55}
                className="w-auto h-8 sm:h-10 lg:h-11"
                priority
              />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <LanguageToggleBtn variant="icon" />
              <ThemeToggleBtn variant="icon" />
            </div>
          </header>

          {/* Container de Formulário */}
          <main
            id="main-content"
            tabIndex={-1}
            className="w-full max-w-[487px] mx-auto my-auto py-8 outline-none"
          >
            {children}
          </main>

          {/* Rodapé sutil */}
          <footer className="w-full max-w-[487px] mx-auto text-[12px] text-neutral-400 text-center lg:text-left">
            {t("copyright", { year: new Date().getFullYear() })}
          </footer>
        </div>

        {/* LADO DIREITO: Ilustração Cósmica da Galáxia (sticky em telas altas) */}
        <div
          aria-hidden="true"
          className="hidden lg:flex lg:w-[44%] xl:w-1/2 sticky top-0 h-dvh items-center justify-end overflow-hidden pointer-events-none"
        >
          {/* Glow cósmico suave pré-composto na base e centro da galáxia */}
          <div className="cosmic-ambient-auth absolute inset-0 z-0 pointer-events-none" />

          {/* Galáxia em escala generosa que ocupa a metade da tela */}
          <div className="absolute top-0 right-0 w-full h-full max-w-[850px] flex items-start justify-end z-10 opacity-95 dark:opacity-100">
            <CosmicGalaxyIllustration />
          </div>
        </div>
      </div>
    </ScopedIntlProvider>
  );
}
