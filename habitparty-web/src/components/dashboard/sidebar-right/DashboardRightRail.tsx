"use client";

import { Calendar, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { AppLocale } from "@/i18n/config";
import { useDashboardFilterStore } from "@/store/dashboardFilterStore";
import { useUserStore } from "@/store/userStore";
import type { DashboardRightRailProps } from "@/types/dashboard";
import { formatCoins } from "@/utils";
import { scrollToDashboardTasksPanel } from "@/utils/dashboardScroll";

const XL_MEDIA_QUERY = "(min-width: 1280px)";

/**
 * Container único para o Painel Direito do Dashboard:
 * - Em telas `xl+` (>= 1280px): monta `{children}` uma única vez no `<aside>` fixo (`w-[320px] 2xl:w-[345px]`).
 * - Em telas `< xl`: exibe apenas o botão flutuante (FAB) e monta `{children}` dentro do `SlideOverDrawer`
 *   somente quando aberto — eliminando dupla execução RSC, dupla serialização Flight e `id` duplicado no DOM.
 */
export function DashboardRightRail({
  balance = 0,
  asideAriaLabel,
  children,
}: DashboardRightRailProps) {
  const t = useTranslations("dashboard.sidebarRight.mobileDrawer");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const storeCoins = useUserStore((s) => s.user?.currentCoins);
  const currentBalance = storeCoins ?? balance;
  const isDesktopXl = useMediaQuery(XL_MEDIA_QUERY, true);
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useLatestRef(isOpen);
  const mobileDrawerCloseSeq = useDashboardFilterStore(
    (s) => s.mobileDrawerCloseSeq,
  );
  const lastHandledCloseSeqRef = useRef(mobileDrawerCloseSeq);
  const scrollRafRef = useRef<number | null>(null);

  const handleCloseDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Permite abrir a gaveta lateral via evento global (ex: clique no card de Ofensiva em < xl)
  useEffect(() => {
    if (isDesktopXl) return;
    const handleOpenRail = () => setIsOpen(true);
    window.addEventListener("habitparty:open-dashboard-rail", handleOpenRail);
    return () => {
      window.removeEventListener(
        "habitparty:open-dashboard-rail",
        handleOpenRail,
      );
    };
  }, [isDesktopXl]);

  // Fecha o drawer ao selecionar um dia no WeeklyCalendar mobile e rola suavemente até a lista de tarefas
  useEffect(() => {
    if (mobileDrawerCloseSeq === lastHandledCloseSeqRef.current) return;
    lastHandledCloseSeqRef.current = mobileDrawerCloseSeq;

    if (!isOpenRef.current) return;

    setIsOpen(false);
    if (scrollRafRef.current !== null) {
      window.cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollToDashboardTasksPanel();
    });

    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [mobileDrawerCloseSeq, isOpenRef]);

  // Fecha o drawer caso o usuário redimensione para xl+
  useEffect(() => {
    if (isDesktopXl && isOpen) {
      setIsOpen(false);
    }
  }, [isDesktopXl, isOpen]);

  if (isDesktopXl) {
    return (
      <aside
        data-panel="sidebar-right"
        className="hidden xl:flex shrink-0 bg-background dark:bg-primary-dark/25 border-l border-neutral-700 dark:border-primary/30 h-full flex-col overflow-y-auto custom-scrollbar z-20 w-[320px] 2xl:w-[345px] px-4 2xl:px-5 py-5 gap-4"
        aria-label={asideAriaLabel}
      >
        {asideAriaLabel && <h2 className="sr-only">{asideAriaLabel}</h2>}
        {children}
      </aside>
    );
  }

  return (
    <>
      <div className="xl:hidden fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full border border-neutral-700 bg-card hover:bg-surface dark:border-gold/40 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-amber-700 dark:text-gold shadow-sm dark:shadow-glow-gold-xs hover:shadow-md dark:hover:shadow-glow-gold hover:scale-105 active:scale-95 transition-[transform,scale,box-shadow,background-color,border-color] cursor-pointer group px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title={t("fabTitle")}
          aria-label={t("fabTitle")}
        >
          <Calendar
            size={18}
            className="text-amber-800 dark:text-gold group-hover:rotate-12 transition-transform"
            aria-hidden="true"
          />
          <span className="font-bold text-neutral-100">{t("fabLabel")}</span>
          {currentBalance > 0 && (
            <span className="inline-flex items-center gap-1 text-label-g font-semibold text-amber-800 bg-amber-500/15 border border-amber-500/30 dark:text-gold dark:bg-gold/15 dark:border-gold/30 px-1.5 py-0.5 rounded-full tabular-nums">
              <CoinIcon size={12} withGlow={isGamified} />
              <span>{formatCoins(currentBalance, { locale })}</span>
            </span>
          )}
        </button>
      </div>

      <SlideOverDrawer
        isOpen={isOpen}
        onClose={handleCloseDrawer}
        ariaLabel={t("drawerAriaLabel")}
        backdropAriaLabel={t("backdropAriaLabel")}
        containerClassName="xl:hidden"
        panelClassName="w-full sm:w-[380px]"
      >
        <header className="p-4 border-b border-neutral-700 dark:border-white/10 flex items-center justify-between bg-surface/60 dark:bg-surface-hover/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:bg-gold/15 dark:border-gold/30 flex items-center justify-center dark:text-gold">
              <Calendar size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-50 leading-tight">
                {t("headerTitle")}
              </h2>
              <p className="text-tiny text-neutral-400">
                {t("headerSubtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={t("closeAriaLabel")}
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4">
          {children}
        </div>
      </SlideOverDrawer>
    </>
  );
}
