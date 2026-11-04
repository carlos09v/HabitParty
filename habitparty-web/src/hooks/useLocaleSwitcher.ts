"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { setLocaleCookie } from "@/actions/ui";
import {
  DEFAULT_LOCALE,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";
import { useLocaleSwitchStore } from "@/store/localeSwitchStore";
import { useProgressStore } from "@/store/progressStore";
import type { AppLocale } from "@/types/ui";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function persistLocaleCookieClient(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: Sincroniza o cookie de idioma localmente na landing estática sem Server Action
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

/** Id da operação de troca de idioma na barra de progresso global. */
const LOCALE_PROGRESS_ID = "locale";

/**
 * Tempo máximo que a troca pode ficar "pendente". Rede de segurança para
 * nunca deixar a UI travada caso a resposta do servidor não chegue.
 */
const LOCALE_SWITCH_TIMEOUT_MS = 15_000;

function finishLocaleSwitch() {
  useLocaleSwitchStore.getState().setPendingLocale(null);
  useProgressStore.getState().done(LOCALE_PROGRESS_ID);
}

function useCurrentLocale(): AppLocale {
  const rawLocale = useLocale();
  return isValidLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
}

/**
 * Hook para trocar o idioma da aplicação.
 *
 * - Fonte de verdade: `useLocale()` do next-intl (o idioma realmente renderizado).
 * - Uma única ida e volta: a Server Action apenas grava o cookie; o Next devolve
 *   a rota já re-renderizada na mesma resposta (sem `router.refresh()`).
 * - Trava global: enquanto houver uma troca pendente, novos cliques são ignorados
 *   em TODOS os seletores montados.
 * - Feedback: aciona a barra fina global (`TopProgressBar`) e expõe
 *   `pendingLocale`/`isSwitching` para spinners locais.
 */
export function useLocaleSwitcher() {
  const t = useTranslations("ui.languageToggle");
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const pendingLocale = useLocaleSwitchStore((state) => state.pendingLocale);
  const [, startTransition] = useTransition();

  const targetLocale: AppLocale = locale === "pt-BR" ? "en" : "pt-BR";
  const isStaticLandingRoute = pathname === "/en" || pathname === "/pt-BR";
  const staticTargetHref = isStaticLandingRoute ? `/${targetLocale}` : null;

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      const target: AppLocale = isValidLocale(nextLocale)
        ? nextLocale
        : DEFAULT_LOCALE;

      if (useLocaleSwitchStore.getState().pendingLocale || target === locale) {
        return;
      }

      useLocaleSwitchStore.getState().setPendingLocale(target);
      useProgressStore.getState().start(LOCALE_PROGRESS_ID, t("switching"));

      startTransition(async () => {
        try {
          await setLocaleCookie(target);
        } catch {
          finishLocaleSwitch();
          toast.error(t("error"));
        }
      });
    },
    [locale, t],
  );

  const toggleLocale = useCallback(() => {
    setLocale(targetLocale);
  }, [targetLocale, setLocale]);

  return {
    /** Idioma atualmente renderizado. */
    locale,
    /** Próximo idioma ao alternar (`en` <-> `pt-BR`). */
    targetLocale,
    /** URL estática de destino quando estiver na landing (`/en` ou `/pt-BR`). */
    staticTargetHref,
    /** Idioma de destino enquanto a troca está em andamento. */
    pendingLocale,
    isSwitching: pendingLocale !== null,
    isEnglish: locale === "en",
    isPortuguese: locale === "pt-BR",
    setLocale,
    toggleLocale,
  };
}

/**
 * Observa a conclusão da troca de idioma: quando o idioma renderizado passa a
 * ser o idioma pendente, a nova UI já foi aplicada — libera a trava e encerra
 * a barra de progresso. Também garante que na landing estática (`/en`, `/pt-BR`)
 * o cookie `habitparty_locale` fique sincronizado com o idioma da URL.
 */
export function useLocaleSwitchWatcher() {
  const pathname = usePathname();
  const locale = useCurrentLocale();
  const pendingLocale = useLocaleSwitchStore((state) => state.pendingLocale);

  useEffect(() => {
    if (pathname === "/en" || pathname === "/pt-BR") {
      persistLocaleCookieClient(locale);
    }
  }, [pathname, locale]);

  useEffect(() => {
    if (!pendingLocale) return;

    if (pendingLocale === locale) {
      finishLocaleSwitch();
      return;
    }

    const timer = setTimeout(finishLocaleSwitch, LOCALE_SWITCH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingLocale, locale]);
}
