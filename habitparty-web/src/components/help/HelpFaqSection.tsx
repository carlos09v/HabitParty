"use client";

import { HelpCircle, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useState } from "react";
import { HelpFaqCard } from "@/components/help/HelpFaqCard";
import {
  filterHelpTables,
  HelpReferenceTables,
} from "@/components/help/HelpReferenceTables";
import { FilterBar } from "@/components/ui/FilterBar";
import { FilterTabStrip } from "@/components/ui/FilterTabStrip";
import { HELP_CATEGORY_IDS } from "@/constants/helpConfig";
import type { HelpCategory, HelpFaqItem, HelpTableEntry } from "@/types/help";
import { normalizeSearchText } from "@/utils";

interface HelpFaqSectionProps {
  /** Perguntas frequentes já resolvidas no idioma ativo (via servidor). */
  faqs: HelpFaqItem[];
  /** Tabelas de referência já resolvidas no idioma ativo (via servidor). */
  tables: Record<string, HelpTableEntry>;
}

export function HelpFaqSection({ faqs, tables }: HelpFaqSectionProps) {
  const t = useTranslations("help.faq");
  const [activeCategory, setActiveCategory] = useState<HelpCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [expandedFaqIds, setExpandedFaqIds] = useState<Set<string>>(
    () => new Set(["philosophy", "task-types"]),
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

  const handleSelectTag = (tag: string) => {
    setActiveCategory("ALL");
    setSearchQuery(tag);
  };

  const categoryOptions = HELP_CATEGORY_IDS.map((tabId) => ({
    id: tabId,
    label: t(`categories.${tabId}`),
  }));

  const normalizedQuery = normalizeSearchText(deferredSearchQuery);

  // Filtragem normalizada (sem acentos) unificada entre FAQs e Tabelas de Referência
  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "ALL" || faq.category === activeCategory;

    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;

    const inQuestion = normalizeSearchText(faq.question).includes(
      normalizedQuery,
    );
    const inAnswer = normalizeSearchText(faq.answer).includes(normalizedQuery);
    const inTags = faq.tags.some((tag) =>
      normalizeSearchText(tag).includes(normalizedQuery),
    );
    const inBullets = faq.bullets?.some((b) =>
      normalizeSearchText(b).includes(normalizedQuery),
    );

    return inQuestion || inAnswer || inTags || inBullets;
  });

  const filteredTables = filterHelpTables(
    tables,
    activeCategory,
    normalizedQuery,
  );

  const hasNoResults = filteredFaqs.length === 0 && filteredTables.length === 0;

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
            <FilterTabStrip
              options={categoryOptions}
              value={activeCategory}
              onChange={setActiveCategory}
              ariaLabel={t("categoriesAriaLabel")}
            />
          }
        />
      </section>

      {/* ==========================================
          ESTADO VAZIO UNIFICADO (0 FAQs e 0 Tabelas)
          ========================================== */}
      {hasNoResults ? (
        <output
          aria-live="polite"
          className="p-6 sm:p-12 rounded-2xl bg-card dark:bg-surface/20 border border-neutral-700 dark:border-primary/20 shadow-xs dark:shadow-none text-center flex flex-col items-center justify-center gap-3"
        >
          <Search className="text-neutral-400" size={32} aria-hidden="true" />
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
            className="mt-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover transition-colors cursor-pointer shadow-glow-gold-xs outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {t("viewAllTopics")}
          </button>
        </output>
      ) : (
        <>
          {/* ==========================================
              PERGUNTAS FREQUENTES & DETALHES
              ========================================== */}
          {filteredFaqs.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <HelpCircle
                    className="text-gold-ink dark:text-gold shrink-0"
                    size={20}
                    aria-hidden="true"
                  />
                  <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
                    {t("sectionTitle")}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface dark:bg-white/10 text-neutral-300 border border-neutral-700 dark:border-white/10 shrink-0">
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
                    className="text-xs text-neutral-400 hover:text-gold-ink dark:hover:text-gold transition-colors font-medium cursor-pointer rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {t("expandAll")}
                  </button>
                  <span
                    aria-hidden="true"
                    className="text-neutral-400 dark:text-neutral-600"
                  >
                    •
                  </span>
                  <button
                    type="button"
                    onClick={handleCollapseAll}
                    className="text-xs text-neutral-400 hover:text-gold-ink dark:hover:text-gold transition-colors font-medium cursor-pointer rounded px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    {t("collapseAll")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {filteredFaqs.map((faq) => (
                  <HelpFaqCard
                    key={faq.id}
                    faq={faq}
                    isExpanded={expandedFaqIds.has(faq.id)}
                    showCategoryBadge={activeCategory === "ALL"}
                    categoryLabel={t(`categories.${faq.category}`)}
                    tagsLabel={t("tagsLabel")}
                    onToggle={toggleFaq}
                    onSelectTag={handleSelectTag}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ==========================================
              TABELAS DE ECONOMIA MATEMÁTICA (Integradas à Busca e Categoria)
              ========================================== */}
          <HelpReferenceTables tables={filteredTables} />
        </>
      )}
    </div>
  );
}
