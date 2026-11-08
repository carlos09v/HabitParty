import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { LanguageToggleBtn } from "@/components/layout/LanguageToggleBtn";
import { ThemeToggleBtn } from "@/components/layout/ThemeToggleBtn";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CosmicGalaxyIllustration } from "@/components/ui/CosmicGalaxyIllustration";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export const instant = false;

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [t, locale] = await Promise.all([
    getTranslations("auth.layout"),
    getLocale(),
  ]);

  return (
    <ScopedIntlProvider scope="auth">
      <div className="relative min-h-[100dvh] w-full flex bg-background overflow-hidden">
        {/* LADO ESQUERDO: Branding + Formulário Centralizado na Metade (50% do viewport) */}
        <div className="w-full lg:w-1/2 min-h-[100dvh] flex flex-col justify-between p-4 sm:p-8 lg:p-16 relative z-10">
          {/* Top bar: Logo HabitParty e Alternadores de Idioma e Tema */}
          <div className="flex items-center justify-between w-full max-w-[487px] mx-auto">
            <Link
              href={`/${locale}`}
              className="inline-block transition-opacity hover:opacity-90"
            >
              <BrandLogo
                alt="HabitParty"
                width={251}
                height={55}
                className="w-auto h-11"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageToggleBtn variant="icon" />
              <ThemeToggleBtn variant="icon" />
            </div>
          </div>

          {/* Container de Formulário: largura de 487px fiel ao Figma */}
          <main className="w-full max-w-[487px] mx-auto my-auto py-8">
            {children}
          </main>

          {/* Rodapé sutil */}
          <footer className="w-full max-w-[487px] mx-auto text-[12px] text-neutral-400 text-center lg:text-left">
            {t("copyright", { year: new Date().getFullYear() })}
          </footer>
        </div>

        {/* LADO DIREITO: Ilustração Cósmica da Galáxia (50% do viewport) */}
        <div className="hidden lg:flex lg:w-1/2 relative min-h-screen items-center justify-end overflow-hidden pointer-events-none">
          {/* Glow cósmico suave pré-composto na base e centro da galáxia */}
          <div
            aria-hidden="true"
            className="cosmic-ambient-auth absolute inset-0 z-0 pointer-events-none"
          />

          {/* Galáxia em escala generosa que ocupa a metade da tela (z-10 sobre a elipse azul) */}
          <div className="absolute top-0 right-0 w-full h-full max-w-[850px] flex items-start justify-end z-10 opacity-95 dark:opacity-100">
            <CosmicGalaxyIllustration alt={t("galaxyAlt")} priority />
          </div>
        </div>
      </div>
    </ScopedIntlProvider>
  );
}
