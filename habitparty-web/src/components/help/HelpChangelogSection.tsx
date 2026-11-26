"use client";

import { CheckCircle2, Compass, History, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import {
  RELEASED_APP_VERSIONS_DESC,
  UPCOMING_APP_VERSIONS,
} from "@/constants/releases";
import { cn } from "@/utils";

type HelpUpdatesTab = "changelog" | "roadmap";
const HELP_UPDATES_TABS: readonly HelpUpdatesTab[] = [
  "changelog",
  "roadmap",
] as const;

/**
 * Seção de Novidades, Changelog e Roadmap na Central de Ajuda.
 * Implementa o padrão WAI-ARIA Tabs (com navegação por setas e foco sincronizado)
 * e consome a lista canônica de versões em `constants/releases.ts`.
 */
export function HelpChangelogSection() {
  const t = useTranslations("help.changelog");
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<HelpUpdatesTab>("changelog");
  const tabRefs = useRef<Record<HelpUpdatesTab, HTMLButtonElement | null>>({
    changelog: null,
    roadmap: null,
  });

  const items =
    activeTab === "changelog"
      ? RELEASED_APP_VERSIONS_DESC
      : UPCOMING_APP_VERSIONS;

  const getTabId = (tab: HelpUpdatesTab) => `${baseId}-tab-${tab}`;
  const activeTabId = getTabId(activeTab);

  const handleTabKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % HELP_UPDATES_TABS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + HELP_UPDATES_TABS.length) %
        HELP_UPDATES_TABS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = HELP_UPDATES_TABS.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      const nextTab = HELP_UPDATES_TABS[nextIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextTab]?.focus();
    }
  };

  return (
    <section
      id="novidades"
      className="flex flex-col gap-5 pt-6 border-t border-primary/20 scroll-mt-24"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {activeTab === "changelog" ? (
              <History
                className="text-success-400 shrink-0"
                size={20}
                aria-hidden="true"
              />
            ) : (
              <Compass
                className="text-gold-ink dark:text-gold shrink-0"
                size={20}
                aria-hidden="true"
              />
            )}
            <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
              {t("sectionTitle")}
            </h2>
          </div>
          <p className="text-body-s text-neutral-300">{t("sectionSubtitle")}</p>
        </div>

        <div
          role="tablist"
          aria-label={t("tabsAriaLabel")}
          className="inline-flex items-center p-1 rounded-xl bg-surface/80 dark:bg-card/80 border border-neutral-700 dark:border-primary/25 shrink-0 self-start sm:self-auto"
        >
          {HELP_UPDATES_TABS.map((tab, index) => {
            const isSelected = activeTab === tab;
            const isChangelog = tab === "changelog";

            return (
              <button
                key={tab}
                ref={(el) => {
                  tabRefs.current[tab] = el;
                }}
                id={getTabId(tab)}
                type="button"
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                  isSelected
                    ? isChangelog
                      ? "bg-success-500/15 text-success-400 border-success-500/40 after:content-[''] after:absolute after:inset-x-2.5 after:bottom-0 after:border-b-2 after:border-current"
                      : "bg-amber-500/15 dark:bg-gold/15 text-gold-ink dark:text-gold border-amber-500/40 dark:border-gold/40 after:content-[''] after:absolute after:inset-x-2.5 after:bottom-0 after:border-b-2 after:border-current"
                    : "text-neutral-300 hover:text-neutral-100 border-transparent",
                )}
              >
                {isChangelog ? (
                  <History size={14} className="shrink-0" aria-hidden="true" />
                ) : (
                  <Rocket size={14} className="shrink-0" aria-hidden="true" />
                )}
                <span>{t(`tabs.${tab}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        aria-labelledby={activeTabId}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: Painel de aba focável conforme padrão WAI-ARIA quando não contém controles interativos
        tabIndex={0}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {items.map((item, idx) => {
          const highlights = t.raw(
            `items.${item.helpId}.highlights`,
          ) as string[];
          const isLastOdd = idx === items.length - 1 && items.length % 2 === 1;

          return (
            <article
              key={item.helpId}
              className={cn(
                "rounded-xl border p-5 flex flex-col gap-3",
                item.isReleased
                  ? "bg-card dark:bg-surface/50 border-success-500/30 dark:border-success-500/25 shadow-xs dark:shadow-none"
                  : "bg-card dark:bg-surface/40 border-neutral-700 dark:border-primary/25 shadow-xs dark:shadow-none",
                isLastOdd && "md:col-span-2",
              )}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide font-mono",
                      item.isReleased
                        ? "bg-success-500/15 text-success-400"
                        : "bg-amber-500/15 dark:bg-gold/15 text-gold-ink dark:text-gold",
                    )}
                  >
                    {item.version}
                  </span>
                  <span className="text-tiny font-semibold text-neutral-400">
                    {t(`items.${item.helpId}.statusLabel`)}
                  </span>
                </div>

                {item.isCurrent && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/15 border border-primary/25 text-primary dark:text-neutral-100 dark:border-primary-light/35">
                    {t("currentBadge")}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-body-m font-bold text-neutral-50">
                  {t(`items.${item.helpId}.title`)}
                </h3>
                <p className="text-tiny text-neutral-300 mt-1 leading-relaxed">
                  {t(`items.${item.helpId}.summary`)}
                </p>
              </div>

              <ul
                className={cn(
                  "space-y-2 pt-3 border-t border-neutral-700/60 dark:border-white/10",
                  isLastOdd &&
                    "md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-2 md:space-y-0",
                )}
              >
                {highlights.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs text-neutral-200 leading-relaxed"
                  >
                    {item.isReleased ? (
                      <CheckCircle2
                        size={14}
                        aria-hidden="true"
                        className="text-success-400 shrink-0 mt-0.5"
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        aria-hidden="true"
                        className="text-gold-ink dark:text-gold shrink-0 mt-0.5"
                      />
                    )}
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
