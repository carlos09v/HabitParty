export const LOCALES = ["en", "pt-BR"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE_NAME = "habitparty_locale";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.habitparty.app";

export function isValidLocale(value?: string | null): value is AppLocale {
  return value === "en" || value === "pt-BR";
}

/**
 * Resolve o idioma a partir do cabeçalho Accept-Language do navegador.
 * Regra: se o idioma preferido começar com "pt", usa "pt-BR";
 * caso contrário (ou se não for identificado nada), o padrão é sempre "en".
 */
export function detectLocaleFromAcceptLanguage(
  acceptLanguage?: string | null,
): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(",")
    .map((part) => {
      const [lang, qPart] = part.trim().split(";q=");
      const q = qPart ? Number.parseFloat(qPart) : 1.0;
      return { lang: lang.toLowerCase(), q: Number.isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const item of languages) {
    if (item.lang.startsWith("pt")) {
      return "pt-BR";
    }
    if (item.lang.startsWith("en")) {
      return "en";
    }
  }

  return DEFAULT_LOCALE;
}
