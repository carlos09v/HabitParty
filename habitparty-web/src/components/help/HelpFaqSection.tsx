"use client";

import { HelpCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { HelpFaqCard } from "@/components/help/HelpFaqCard";
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
            {filteredFaqs.map((faq) => (
              <HelpFaqCard
                key={faq.id}
                faq={faq}
                isExpanded={expandedFaqIds.has(faq.id)}
                isCompact={isCompact}
                showCategoryBadge={activeCategory === "ALL"}
                categoryLabel={t(`categories.${faq.category}`)}
                tagsLabel={t("tagsLabel")}
                onToggle={toggleFaq}
                onSelectTag={setSearchQuery}
              />
            ))}
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
