"use client";

import { ArrowUpRight, ChevronDown, HelpCircle, Search, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { HelpReferenceTables } from "@/components/help/HelpReferenceTables";
import { FilterBar } from "@/components/ui/FilterBar";
import { HELP_CATEGORY_IDS } from "@/constants/help";
import type { HelpCategory, HelpFaqItem, HelpTableEntry } from "@/types/help";
import { cn } from "@/utils";

interface HelpFaqSectionProps {
  isCompact?: boolean;
  /** Perguntas frequentes já resolvidas no idioma ativo (via servidor). */
  faqs: HelpFaqItem[];
  /** Tabelas de referência já resolvidas no idioma ativo (via servidor). */
  tables: Record<string, HelpTableEntry>;
}

export function HelpFaqSection({
  isCompact = false,
  faqs,
  tables,
}: HelpFaqSectionProps) {
  const t = useTranslations("help.faq");
  const [activeCategory, setActiveCategory] = useState<HelpCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaqIds, setExpandedFaqIds] = useState<Set<string>>(
    new Set(["philosophy", "task-types"]),
  );

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedFaqIds(new Set(faqs.map((f) => f.id)));
  };

  const handleCollapseAll = () => {
    setExpandedFaqIds(new Set());
  };

  // Filtragem combinada por categoria e texto de busca
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "ALL" || faq.category === activeCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const inQuestion = faq.question.toLowerCase().includes(query);
      const inAnswer = faq.answer.toLowerCase().includes(query);
      const inTags = faq.tags.some((tag) => tag.toLowerCase().includes(query));
      const inBullets = faq.bullets?.some((b) =>
        b.toLowerCase().includes(query),
      );

      return inQuestion || inAnswer || inTags || inBullets;
    });
  }, [activeCategory, searchQuery, faqs]);

  return (
    <div className="flex flex-col gap-6">
      {/* ==========================================
          BARRA DE FILTROS & BUSCA
          ========================================== */}
      <section className="flex flex-col gap-4">
        <FilterBar
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: t("searchPlaceholder"),
          }}
          leftActions={
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface dark:bg-surface/60 border border-neutral-700 dark:border-white/10 shrink-0 overflow-x-auto max-w-full custom-scrollbar">
              {HELP_CATEGORY_IDS.map((tabId) => {
                const isActive = activeCategory === tabId;
                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setActiveCategory(tabId)}
                    className={cn(
                      "px-3 rounded-lg font-semibold transition-colors cursor-pointer select-none whitespace-nowrap",
                      isCompact ? "py-1 text-xs" : "py-1.5 text-xs",
                      isActive
                        ? "bg-gold text-on-gold shadow-sm font-bold"
                        : "text-neutral-300 hover:text-neutral-50 hover:bg-card dark:hover:bg-white/5",
                    )}
                  >
                    {t(`categories.${tabId}`)}
                  </button>
                );
              })}
            </div>
          }
          rightActions={
            searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={cn(
                  "flex items-center gap-1 px-3 rounded-xl border border-neutral-700 dark:border-white/10 bg-card dark:bg-white/5 text-neutral-300 hover:text-neutral-100 hover:bg-surface-hover dark:hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer",
                  isCompact ? "py-1" : "py-1.5",
                )}
              >
                <X size={14} />
                {t("clearSearch")}
              </button>
            ) : undefined
          }
        />
      </section>

      {/* ==========================================
          PERGUNTAS FREQUENTES & DETALHES
          ========================================== */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-gold" size={20} />
            <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
              {t("sectionTitle")}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface dark:bg-white/10 text-neutral-300 border border-neutral-700 dark:border-white/10">
              {filteredFaqs.length}{" "}
              {filteredFaqs.length === 1
                ? t("topicSingular")
                : t("topicPlural")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-xs text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              {t("expandAll")}
            </button>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-xs text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              {t("collapseAll")}
            </button>
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card dark:bg-surface/20 border border-neutral-700 dark:border-primary/20 shadow-xs dark:shadow-none text-center flex flex-col items-center justify-center gap-3">
            <Search className="text-neutral-400" size={32} />
            <p className="text-body-m font-bold text-neutral-200">
              {t("emptyTitle", { query: searchQuery })}
            </p>
            <p className="text-body-s text-neutral-400 max-w-md">
              {t("emptyDescription")}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover transition-colors cursor-pointer shadow-glow-gold-xs"
            >
              {t("viewAllTopics")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqIds.has(faq.id);
              const categoryLabel = t(`categories.${faq.category}`);

              return (
                <div
                  key={faq.id}
                  className={cn(
                    "rounded-xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/30 shadow-2xs dark:shadow-none overflow-hidden transition-colors duration-200",
                    isExpanded &&
                      "border-amber-500/45 dark:border-gold/40 shadow-glow-gold-xs",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className={cn(
                      "w-full text-left flex items-start justify-between gap-4 cursor-pointer hover:bg-surface/50 dark:hover:bg-white/5 transition-colors select-none outline-none focus-visible:ring-1 focus-visible:ring-gold",
                      isCompact ? "p-3.5 sm:p-4" : "p-4 sm:p-5",
                    )}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-neutral-400 transition-transform duration-200 shrink-0 mt-0.5",
                          isExpanded &&
                            "rotate-180 text-amber-700 dark:text-gold",
                        )}
                      >
                        <ChevronDown size={18} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              "text-body-m font-bold text-neutral-100 transition-colors",
                              isExpanded && "text-amber-700 dark:text-gold",
                            )}
                          >
                            {faq.question}
                          </h3>
                          {activeCategory === "ALL" && categoryLabel && (
                            <span className="text-tiny font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25 dark:bg-primary-dark/40 dark:text-primary-light dark:border-primary/30">
                              {categoryLabel}
                            </span>
                          )}
                          {faq.highlightBadge && (
                            <span className="text-tiny font-bold px-2 py-0.5 rounded-md bg-amber-500/15 dark:bg-gold/15 text-amber-800 dark:text-gold border border-amber-500/35 dark:border-gold/30">
                              {faq.highlightBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      className={cn(
                        "pt-3 text-neutral-300 text-body-s flex flex-col gap-3 border-t border-neutral-700 dark:border-white/5 animate-in fade-in duration-150",
                        isCompact
                          ? "px-3.5 pb-4 sm:px-4"
                          : "px-4 pb-5 sm:px-5 sm:pb-5",
                      )}
                    >
                      <p className="leading-relaxed">{faq.answer}</p>

                      {faq.bullets && faq.bullets.length > 0 && (
                        <ul className="flex flex-col gap-1.5 list-disc list-inside bg-surface/60 dark:bg-primary-dark/20 p-3.5 rounded-lg border border-neutral-700 dark:border-primary/20 shadow-none text-neutral-200">
                          {faq.bullets.map((bullet) => (
                            <li key={bullet} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-neutral-700 dark:border-white/5">
                        {faq.tags && faq.tags.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-tiny uppercase text-neutral-400 dark:text-neutral-500 font-bold mr-1">
                              {t("tagsLabel")}
                            </span>
                            {faq.tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setSearchQuery(tag)}
                                className="text-label-g px-2 py-0.5 rounded-md bg-surface/70 dark:bg-white/5 hover:bg-amber-500/15 dark:hover:bg-gold/20 hover:text-amber-800 dark:hover:text-gold text-neutral-300 dark:text-neutral-400 border border-neutral-700 dark:border-white/10 transition-colors cursor-pointer"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div />
                        )}

                        {faq.actionLink && (
                          <Link
                            href={faq.actionLink.href}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 dark:bg-gold/15 dark:hover:bg-gold/25 border border-amber-500/40 dark:border-gold/40 text-amber-800 dark:text-gold text-xs font-bold transition-colors shadow-glow-gold-xs group"
                          >
                            <span>{faq.actionLink.label}</span>
                            <ArrowUpRight
                              size={13}
                              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                            />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          TABELAS DE ECONOMIA MATEMÁTICA (Integradas à Busca e Categoria)
          ========================================== */}
      <HelpReferenceTables
        isCompact={isCompact}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        tables={tables}
      />
    </div>
  );
}
