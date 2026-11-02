"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocaleMode } from "@/hooks/useLocaleMode";
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
  const { isEnglish, toggleLocale, isPending } = useLocaleMode();

  const ariaLabel = isEnglish ? t("switchToPtAria") : t("switchToEnAria");
  const titleLabel = isEnglish ? t("switchToPtTitle") : t("switchToEnTitle");

  // Variante Compacta (Ícone + Sigla para Headers / Navbars / Footers)
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        disabled={isPending}
        className={cn(
          "relative inline-flex items-center justify-center gap-1.5 h-9 px-2.5 rounded-xl transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-gold/50 group disabled:opacity-70",
          "border border-neutral-700 bg-card/90 hover:bg-surface-hover hover:border-primary/40 text-neutral-200 hover:text-neutral-50 shadow-2xs backdrop-blur-xs",
          "dark:border-white/12 dark:bg-white/[0.04] dark:hover:bg-white/[0.09] dark:hover:border-gold/40 dark:text-neutral-200 dark:hover:text-white dark:shadow-none",
          className,
        )}
        aria-label={ariaLabel}
        title={titleLabel}
      >
        <Languages
          className="w-4 h-4 text-primary dark:text-primary-light group-hover:text-gold transition-colors shrink-0"
          aria-hidden="true"
        />
        <span className="text-[11px] font-extrabold tracking-wider uppercase text-neutral-100 group-hover:text-gold transition-colors">
          {isEnglish ? "EN" : "PT"}
        </span>
      </button>
    );
  }

  // Variante Completa (Row com Label e Switch EN/PT para Sidebar)
  return (
    <button
      type="button"
      onClick={toggleLocale}
      disabled={isPending}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 rounded-lg transition-all text-body-s font-medium outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 text-neutral-200 hover:bg-surface-hover hover:text-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-500/10 dark:hover:text-neutral-50 border-r-2 border-transparent text-left cursor-pointer group select-none disabled:opacity-70",
        className,
      )}
      aria-label={ariaLabel}
      title={titleLabel}
    >
      <div className="flex items-center gap-3">
        <span className="transition-colors">
          <Languages
            size={18}
            className="text-primary dark:text-primary-light group-hover:text-gold transition-colors"
            aria-hidden="true"
          />
        </span>
        <span className="text-neutral-200 group-hover:text-neutral-50 dark:text-neutral-200 dark:group-hover:text-neutral-50 transition-colors">
          {t("label")}
        </span>
      </div>

      {/* Indicador de Idioma Ativo */}
      <div
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface border border-neutral-700 dark:bg-neutral-900/90 dark:border-white/15 px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider"
        aria-hidden="true"
      >
        <span
          className={cn(
            "px-1 py-0.5 rounded-full transition-colors",
            isEnglish
              ? "bg-gold text-neutral-950"
              : "text-neutral-400 group-hover:text-neutral-200 dark:text-neutral-400 dark:group-hover:text-neutral-300",
          )}
        >
          EN
        </span>
        <span
          className={cn(
            "px-1 py-0.5 rounded-full transition-colors",
            !isEnglish
              ? "bg-gold text-neutral-950"
              : "text-neutral-400 group-hover:text-neutral-200 dark:text-neutral-400 dark:group-hover:text-neutral-300",
          )}
        >
          PT
        </span>
      </div>
    </button>
  );
}
