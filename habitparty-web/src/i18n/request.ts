import { cookies, headers } from "next/headers";
import { type AbstractIntlMessages, IntlErrorCode } from "next-intl";
import { getRequestConfig, setRequestLocale } from "next-intl/server";
import { cache } from "react";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  detectLocaleFromAcceptLanguage,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "./config";
import { type MessageScope, pickScopedClientMessages } from "./scopes";

const localeMessagesCache = new Map<AppLocale, AbstractIntlMessages>();

const getStaticLocaleStore = cache((): { locale?: AppLocale } => ({}));

/**
 * Fixa o idioma da renderização atual de forma estática (sem ler `cookies()` ou `headers()`).
 * Usado nas rotas estáticas sob `app/(public)/[locale]`.
 */
export function setStaticLocale(locale: AppLocale): void {
  getStaticLocaleStore().locale = locale;
  setRequestLocale(locale);
}

export async function getRequestLocale(
  explicitLocale?: string,
): Promise<AppLocale> {
  if (isValidLocale(explicitLocale)) {
    return explicitLocale;
  }

  const staticLocale = getStaticLocaleStore().locale;
  if (isValidLocale(staticLocale)) {
    return staticLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  try {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language");
    return detectLocaleFromAcceptLanguage(acceptLanguage);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function loadLocaleMessages(
  locale: AppLocale,
): Promise<AbstractIntlMessages> {
  const cached = localeMessagesCache.get(locale);
  if (cached) {
    return cached;
  }

  const [
    common,
    layout,
    landing,
    auth,
    onboarding,
    dashboard,
    settings,
    tasks,
    focus,
    rewards,
    inventory,
    history,
    help,
    admin,
  ] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/layout.json`),
    import(`../messages/${locale}/landing.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/onboarding.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/settings.json`),
    import(`../messages/${locale}/tasks.json`),
    import(`../messages/${locale}/focus.json`),
    import(`../messages/${locale}/rewards.json`),
    import(`../messages/${locale}/inventory.json`),
    import(`../messages/${locale}/history.json`),
    import(`../messages/${locale}/help.json`),
    import(`../messages/${locale}/admin.json`),
  ]);

  const messages: AbstractIntlMessages = Object.freeze({
    ...common.default,
    ...layout.default,
    landing: landing.default,
    auth: auth.default,
    onboarding: onboarding.default,
    dashboard: dashboard.default,
    settings: settings.default,
    tasks: tasks.default,
    focus: focus.default,
    rewards: rewards.default,
    inventory: inventory.default,
    history: history.default,
    help: help.default,
    admin: admin.default,
  });

  localeMessagesCache.set(locale, messages);
  return messages;
}

/**
 * Extrai e filtra as mensagens necessárias para o cliente conforme o escopo.
 * Por padrão (no root layout), retorna apenas o escopo `base`.
 */
export function pickClientMessages(
  messages: AbstractIntlMessages,
  scope: MessageScope = "base",
  locale?: AppLocale,
): AbstractIntlMessages {
  return pickScopedClientMessages(messages, scope, locale);
}

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  const locale = await getRequestLocale(explicitLocale);
  const messages = await loadLocaleMessages(locale);

  return {
    locale,
    messages,
    onError(error) {
      if (
        process.env.NODE_ENV === "development" &&
        error.code === IntlErrorCode.MISSING_MESSAGE
      ) {
        throw error;
      }
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    },
  };
});
