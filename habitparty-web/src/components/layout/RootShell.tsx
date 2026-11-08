import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/layout/AppToaster";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { LocaleSwitchWatcher } from "@/components/layout/LocaleSwitchWatcher";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import type { AppLocale } from "@/i18n/config";
import { loadLocaleMessages, pickClientMessages } from "@/i18n/request";
import type { MessageScope } from "@/i18n/scopes";
import type { ThemeMode } from "@/types/ui";
import "@/app/globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

/**
 * Script inline síncrono para aplicar o tema salvo no cookie (`theme=light|dark`)
 * diretamente no `<html>` antes do primeiro paint do navegador.
 * Essencial nas rotas estáticas (`(public)/[locale]`), cujo HTML é cacheado com `class="dark"`.
 */
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)theme=(light|dark)/);if(m&&m[1]){var d=document.documentElement;if(!d.classList.contains(m[1])){d.classList.remove("light","dark");d.classList.add(m[1]);}}}catch(e){}})();`;

interface RootShellProps {
  locale: AppLocale;
  theme?: ThemeMode;
  scope?: MessageScope;
  children: ReactNode;
}

export async function RootShell({
  locale,
  theme = "dark",
  scope = "base",
  children,
}: RootShellProps) {
  const allMessages = await loadLocaleMessages(locale);
  const clientMessages = pickClientMessages(allMessages, scope, locale);

  return (
    <html lang={locale} className={theme} suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}
      >
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Script estático e controlado para evitar FOUC de tema antes do first paint
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <ThemeInitializer theme={theme} />
          <TopProgressBar />
          <LocaleSwitchWatcher />
          {children}
          <AppToaster />
          <CookieConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
