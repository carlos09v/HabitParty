import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { type AppLocale, DEFAULT_LOCALE, isValidLocale } from "./config";
import { loadLocaleMessages } from "./request";
import { type MessageScope, pickScopedClientMessages } from "./scopes";

interface ScopedIntlProviderProps {
  scope: MessageScope | readonly MessageScope[];
  locale?: AppLocale;
  children: ReactNode;
}

/**
 * Server Component que fornece ao `NextIntlClientProvider` apenas o subconjunto
 * de traduções exigido pelos Client Components daquele grupo ou segmento de rota (`scope`),
 * filtrando chaves exclusivas de servidor.
 */
export async function ScopedIntlProvider({
  scope,
  locale: explicitLocale,
  children,
}: ScopedIntlProviderProps) {
  const [rawLocale, allMessages] = explicitLocale
    ? [explicitLocale, await loadLocaleMessages(explicitLocale)]
    : await Promise.all([getLocale(), getMessages()]);
  const locale: AppLocale = isValidLocale(rawLocale)
    ? rawLocale
    : DEFAULT_LOCALE;
  const scopedMessages = pickScopedClientMessages(allMessages, scope, locale);

  return (
    <NextIntlClientProvider locale={locale} messages={scopedMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
