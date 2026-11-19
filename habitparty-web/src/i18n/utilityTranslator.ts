import {
  createTranslator,
  type NamespaceKeys,
  type NestedKeyOf,
} from "next-intl";
import enUtilities from "@/messages/en/utilities.json";
import ptBrUtilities from "@/messages/pt-BR/utilities.json";
import { type AppLocale, isValidLocale } from "./config";

export type UtilityMessages = typeof enUtilities;
export type UtilityNamespace = NamespaceKeys<
  UtilityMessages,
  NestedKeyOf<UtilityMessages>
>;

const UTILITY_MESSAGES: Record<AppLocale, UtilityMessages> = {
  en: enUtilities,
  "pt-BR": ptBrUtilities satisfies UtilityMessages,
};

const translatorCache = new Map<string, unknown>();

function buildTranslator<N extends UtilityNamespace>(
  locale: AppLocale,
  namespace: N,
) {
  return createTranslator({
    locale,
    messages: UTILITY_MESSAGES[locale],
    namespace,
  });
}

/**
 * Resolve e memoriza um translator tipado do `next-intl` para utilitários puros
 * e helpers compartilhados fora do ciclo de hooks React (SSR, Client e Zustand).
 */
export function getUtilityTranslator<N extends UtilityNamespace>(
  locale: AppLocale | string | undefined | null,
  namespace: N,
): ReturnType<typeof buildTranslator<N>> {
  const safeLocale: AppLocale = isValidLocale(locale) ? locale : "pt-BR";
  const cacheKey = `${safeLocale}:${namespace}`;
  const cached = translatorCache.get(cacheKey);
  if (cached) {
    return cached as ReturnType<typeof buildTranslator<N>>;
  }

  const translator = buildTranslator(safeLocale, namespace);
  translatorCache.set(cacheKey, translator);
  return translator;
}

export { enUtilities, ptBrUtilities };
