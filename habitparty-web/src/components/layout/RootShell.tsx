import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { AppToaster } from "@/components/layout/AppToaster";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { LocaleSwitchWatcher } from "@/components/layout/LocaleSwitchWatcher";
import { ThemeInitializer } from "@/components/layout/ThemeInitializer";
import { ThemeInitScript } from "@/components/layout/ThemeInitScript";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import {
  APP_THEMES,
  getThemePolarity,
  toDefaultPolarityTheme,
} from "@/constants/themes";
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

const ALL_THEME_IDS_PATTERN = [...APP_THEMES]
  .sort((a, b) => b.id.length - a.id.length)
  .map((item) => item.id)
  .join("|");

const LIGHT_THEME_CHECK_EXPR = APP_THEMES.filter(
  (item) => item.polarity === "light",
)
  .map((item) => `id===${JSON.stringify(item.id)}`)
  .join("||");

/**
 * Scripts inline síncronos para aplicar o tema/polaridade diretamente no `<html>`
 * antes do first paint do navegador.
 * - `THEME_INIT_SCRIPT_APP`: áreas autenticadas da aplicação (`(main)`, `(onboarding)`).
 * - `THEME_INIT_SCRIPT_DEFAULT`: áreas públicas/auth (`(public)`, `(auth)`), restritas a `dark` / `light`.
 */
const THEME_INIT_SCRIPT_APP = `(function(){try{var c=document.cookie;var m=c.match(/(?:^|;\\s*)theme=(${ALL_THEME_IDS_PATTERN})(?:;|$)/);if(m&&m[1]){var id=m[1];var pol=(${LIGHT_THEME_CHECK_EXPR})?"light":"dark";var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(pol);d.setAttribute("data-theme",id);return;}var p=c.match(/(?:^|;\\s*)sitePolarity=(light|dark)(?:;|$)/);if(p&&p[1]){var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(p[1]);d.setAttribute("data-theme",p[1]);}}catch(e){}})();`;

const THEME_INIT_SCRIPT_DEFAULT = `(function(){try{var c=document.cookie;var pol=null;var p=c.match(/(?:^|;\\s*)sitePolarity=(light|dark)(?:;|$)/);if(p&&p[1]){pol=p[1];}else{var m=c.match(/(?:^|;\\s*)theme=(${ALL_THEME_IDS_PATTERN})(?:;|$)/);if(m&&m[1]){var id=m[1];pol=(${LIGHT_THEME_CHECK_EXPR})?"light":"dark";}}if(pol){var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(pol);d.setAttribute("data-theme",pol);}}catch(e){}})();`;

interface RootShellProps {
  locale: AppLocale;
  theme?: ThemeMode;
  allowCustomThemes?: boolean;
  scope?: MessageScope;
  children: ReactNode;
}

export async function RootShell({
  locale,
  theme = "dark",
  allowCustomThemes = true,
  scope = "base",
  children,
}: RootShellProps) {
  const allMessages = await loadLocaleMessages(locale);
  const clientMessages = pickClientMessages(allMessages, scope, locale);
  const initialTheme = allowCustomThemes
    ? theme
    : toDefaultPolarityTheme(theme);
  const polarity = getThemePolarity(initialTheme);
  const initScript = allowCustomThemes
    ? THEME_INIT_SCRIPT_APP
    : THEME_INIT_SCRIPT_DEFAULT;

  return (
    <html
      lang={locale}
      className={polarity}
      data-theme={initialTheme}
      suppressHydrationWarning
    >
      <body
        className={`${plusJakarta.variable} font-sans antialiased overflow-x-hidden`}
      >
        <ThemeInitScript script={initScript} />
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <ThemeInitializer
            theme={initialTheme}
            allowCustomThemes={allowCustomThemes}
          />
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
