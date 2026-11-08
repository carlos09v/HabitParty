"use client";

import { Languages, Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  persistLocaleCookieClient,
  useLocaleSwitcher,
} from "@/hooks/useLocaleSwitcher";
import { cn } from "@/utils";

export interface LanguageToggleBtnProps {
  /**
   * - "row": Visual completo com label textual e indicador EN/PT (padrão para Sidebars)
   * - "icon": Visual compacto com ícone de idioma e sigla EN/PT (ideal para Navbars, Footers e Headers)
   */
  variant?: "row" | "icon";
  className?: string;
}

export function LanguageToggleBtn({
  variant = "row",
  className,
}: LanguageToggleBtnProps) {
  const t = useTranslations("ui.languageToggle");
  const {
    isEnglish,
    toggleLocale,
    isSwitching,
    pendingLocale,
    locale,
    targetLocale,
    staticTargetHref,
  } = useLocaleSwitcher();

  // Durante a troca, o indicador já mostra o idioma de destino (com spinner),
  // enquanto o conteúdo da página ainda está sendo carregado.
  const displayIsEnglish = (pendingLocale ?? locale) === "en";

  const ariaLabel = isSwitching
    ? t("switching")
    : isEnglish
      ? t("switchToPtAria")
      : t("switchToEnAria");
  const titleLabel = isSwitching
    ? t("switching")
    : isEnglish
      ? t("switchToPtTitle")
      : t("switchToEnTitle");

  const LeadingIcon = isSwitching ? Loader2 : Languages;

  const iconClasses = cn(
    "relative inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-xl transition-colors duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group disabled:cursor-wait disabled:opacity-80",
    "border border-neutral-700 bg-card hover:bg-surface-hover hover:border-primary/40 text-neutral-200 hover:text-neutral-50 shadow-2xs",
    "dark:border-white/12 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] dark:hover:border-gold/40 dark:text-neutral-200 dark:hover:text-white dark:shadow-none",
    className,
  );

  const iconContent = (
    <>
      <LeadingIcon
        className={cn(
          "w-4 h-4 text-primary dark:text-primary-light group-hover:text-gold transition-colors shrink-0",
          isSwitching && "animate-spin text-gold dark:text-gold",
        )}
        aria-hidden="true"
      />
      <span className="text-[11px] font-extrabold tracking-wider uppercase text-neutral-100 group-hover:text-gold transition-colors">
        {displayIsEnglish ? "EN" : "PT"}
      </span>
    </>
  );

  // Variante Compacta (Ícone + Sigla para Headers / Navbars / Footers)
  if (variant === "icon") {
    if (staticTargetHref) {
      return (
        <Link
          href={staticTargetHref}
          scroll={false}
          onClick={() => persistLocaleCookieClient(targetLocale)}
          className={iconClasses}
          aria-label={ariaLabel}
          title={titleLabel}
        >
          {iconContent}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={toggleLocale}
        disabled={isSwitching}
        aria-busy={isSwitching}
        className={iconClasses}
        aria-label={ariaLabel}
        title={titleLabel}
      >
        {iconContent}
      </button>
    );
  }

  const rowClasses = cn(
    "flex w-full items-center justify-between px-3 py-2 rounded-lg transition-colors text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-500/10 dark:hover:text-neutral-50 border-r-2 border-transparent text-left cursor-pointer group select-none disabled:cursor-wait disabled:opacity-80",
    className,
  );

  const rowContent = (
    <>
      <div className="flex items-center gap-3">
        <span className="transition-colors">
          <LeadingIcon
            size={18}
            className={cn(
              "text-primary dark:text-primary-light group-hover:text-gold transition-colors",
              isSwitching && "animate-spin text-gold dark:text-gold",
            )}
            aria-hidden="true"
          />
        </span>
        <span className="text-neutral-200 group-hover:text-neutral-50 dark:text-neutral-200 dark:group-hover:text-neutral-50 transition-colors">
          {t("label")}
        </span>
      </div>

      {/* Indicador de Idioma Ativo (ou de destino, durante a troca) */}
      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface border border-neutral-700 dark:bg-neutral-900/90 dark:border-white/15 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider"
        aria-hidden="true"
      >
        <span
          className={cn(
            "px-1 py-0.5 rounded-full transition-colors",
            displayIsEnglish
              ? "bg-gold text-neutral-950"
              : "text-neutral-400 group-hover:text-neutral-200 dark:text-neutral-400 dark:group-hover:text-neutral-300",
          )}
        >
          EN
        </span>
        <span
          className={cn(
            "px-1 py-0.5 rounded-full transition-colors",
            !displayIsEnglish
              ? "bg-gold text-neutral-950"
              : "text-neutral-400 group-hover:text-neutral-200 dark:text-neutral-400 dark:group-hover:text-neutral-300",
          )}
        >
          PT
        </span>
      </div>
    </>
  );

  // Variante Completa (Row com Label e Switch EN/PT para Sidebar)
  if (staticTargetHref) {
    return (
      <Link
        href={staticTargetHref}
        scroll={false}
        onClick={() => persistLocaleCookieClient(targetLocale)}
        className={rowClasses}
        aria-label={ariaLabel}
        title={titleLabel}
      >
        {rowContent}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isSwitching}
      aria-busy={isSwitching}
      className={rowClasses}
      aria-label={ariaLabel}
      title={titleLabel}
    >
      {rowContent}
    </button>
  );
}
