"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState, useTransition } from "react";
import { setLocaleCookie } from "@/actions/ui";
import { isValidLocale } from "@/i18n/config";
import { useUIStore } from "@/store/uiStore";
import type { AppLocale } from "@/types/ui";

export function useLocaleMode() {
  const router = useRouter();
  const nextIntlLocale = useLocale();
  const storeLocale = useUIStore((state) => state.locale);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialLocale: AppLocale = isValidLocale(nextIntlLocale)
    ? nextIntlLocale
    : "en";

  useEffect(() => {
    if (useUIStore.getState().locale !== initialLocale) {
      useUIStore.setState({ locale: initialLocale });
    }
    setMounted(true);
  }, [initialLocale]);

  const activeLocale = mounted ? storeLocale : initialLocale;

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      const valid: AppLocale = isValidLocale(nextLocale) ? nextLocale : "en";
      useUIStore.setState({ locale: valid });
      if (typeof document !== "undefined") {
        document.documentElement.lang = valid;
      }
      startTransition(async () => {
        await setLocaleCookie(valid);
        router.refresh();
      });
    },
    [router],
  );

  const toggleLocale = useCallback(() => {
    const nextLocale: AppLocale = activeLocale === "pt-BR" ? "en" : "pt-BR";
    setLocale(nextLocale);
  }, [activeLocale, setLocale]);

  return {
    locale: activeLocale,
    isEnglish: activeLocale === "en",
    isPortuguese: activeLocale === "pt-BR",
    setLocale,
    toggleLocale,
    isPending,
    mounted,
  };
}
