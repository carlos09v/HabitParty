import { cookies, headers } from "next/headers";
import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  detectLocaleFromAcceptLanguage,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "./config";

export async function getRequestLocale(): Promise<AppLocale> {
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

  return {
    ...common.default,
    ...layout.default,
    ...landing.default,
    ...auth.default,
    ...onboarding.default,
    ...dashboard.default,
    ...settings.default,
    tasks: tasks.default,
    focus: focus.default,
    rewards: rewards.default,
    inventory: inventory.default,
    history: history.default,
    help: help.default,
    admin: admin.default,
  };
}

/**
 * Remove namespaces estritamente exclusivos de servidor (SEO / generateMetadata)
 * antes de serializar o dicionário para o NextIntlClientProvider.
 */
export function pickClientMessages(
  messages: AbstractIntlMessages,
): AbstractIntlMessages {
  const { metadata: _metadata, ...rest } = messages;
  return rest;
}

export default getRequestConfig(async () => {
  const locale = await getRequestLocale();
  const messages = await loadLocaleMessages(locale);

  return {
    locale,
    messages,
  };
});
