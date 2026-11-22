"use client";

import { CheckCircle2, Compass, History, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/utils";

type HelpUpdatesTab = "changelog" | "roadmap";

interface ReleaseItemConfig {
  id: "v14" | "v13" | "v12" | "v11" | "v15" | "v16" | "v20";
  version: string;
  isReleased: boolean;
  isCurrent?: boolean;
}

const CHANGELOG_ITEMS: readonly ReleaseItemConfig[] = [
  { id: "v14", version: "v1.4", isReleased: true, isCurrent: true },
  { id: "v13", version: "v1.3", isReleased: true },
  { id: "v12", version: "v1.2", isReleased: true },
  { id: "v11", version: "v1.1", isReleased: true },
] as const;

const ROADMAP_ITEMS: readonly ReleaseItemConfig[] = [
  { id: "v15", version: "v1.5", isReleased: false },
  { id: "v16", version: "v1.6", isReleased: false },
  { id: "v20", version: "v2.0+", isReleased: false },
] as const;

/**
 * Seção de Novidades, Changelog e Roadmap na Central de Ajuda.
 * Mantém cards informativos estáticos (sem affordance de clique) e alternância por abas.
 */
export function HelpChangelogSection() {
  const t = useTranslations("help.changelog");
  const [activeTab, setActiveTab] = useState<HelpUpdatesTab>("changelog");

  const items = activeTab === "changelog" ? CHANGELOG_ITEMS : ROADMAP_ITEMS;

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
                className="text-emerald-800 dark:text-emerald-400 shrink-0"
                size={20}
              />
            ) : (
              <Compass
                className="text-amber-800 dark:text-gold shrink-0"
                size={20}
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
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "changelog"}
            onClick={() => setActiveTab("changelog")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              activeTab === "changelog"
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35"
                : "text-neutral-300 hover:text-neutral-100 border border-transparent",
            )}
          >
            <History size={14} className="shrink-0" />
            <span>{t("tabs.changelog")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "roadmap"}
            onClick={() => setActiveTab("roadmap")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
              activeTab === "roadmap"
                ? "bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold border border-amber-500/35 dark:border-gold/35"
                : "text-neutral-300 hover:text-neutral-100 border border-transparent",
            )}
          >
            <Rocket size={14} className="shrink-0" />
            <span>{t("tabs.roadmap")}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => {
          const highlights = t.raw(`items.${item.id}.highlights`) as string[];
          const isLastOdd = idx === items.length - 1 && items.length % 2 === 1;

          return (
            <article
              key={item.id}
              className={cn(
                "rounded-xl border p-5 flex flex-col gap-3",
                item.isReleased
                  ? "bg-card dark:bg-surface/50 border-emerald-500/30 dark:border-emerald-500/25 shadow-xs dark:shadow-none"
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
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                        : "bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold",
                    )}
                  >
                    {item.version}
                  </span>
                  <span className="text-tiny font-semibold text-neutral-400">
                    {t(`items.${item.id}.statusLabel`)}
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
                  {t(`items.${item.id}.title`)}
                </h3>
                <p className="text-tiny text-neutral-300 mt-1 leading-relaxed">
                  {t(`items.${item.id}.summary`)}
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
                        className="text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5"
                      />
                    ) : (
                      <Sparkles
                        size={14}
                        className="text-amber-800 dark:text-gold shrink-0 mt-0.5"
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
