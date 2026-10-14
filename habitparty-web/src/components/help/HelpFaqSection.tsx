"use client";

import { ChevronDown, HelpCircle, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterBar } from "@/components/ui/FilterBar";
import { HELP_CATEGORIES, HELP_FAQS } from "@/constants/help";
import type { HelpCategory } from "@/types/help";
import { cn } from "@/utils";

interface HelpFaqSectionProps {
  isCompact?: boolean;
}

export function HelpFaqSection({ isCompact = false }: HelpFaqSectionProps) {
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
    setExpandedFaqIds(new Set(HELP_FAQS.map((f) => f.id)));
  };

  const handleCollapseAll = () => {
    setExpandedFaqIds(new Set());
  };

  // Filtragem combinada por categoria e texto de busca
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return HELP_FAQS.filter((faq) => {
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
  }, [activeCategory, searchQuery]);

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
            placeholder:
              "Pesquisar por dúvida, termo ou regra (ex: decaimento, caixa misteriosa, hardcore)...",
          }}
          leftActions={
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/60 border border-white/10 shrink-0 overflow-x-auto max-w-full custom-scrollbar">
              {HELP_CATEGORIES.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      "px-3 rounded-lg font-semibold transition-all cursor-pointer select-none whitespace-nowrap",
                      isCompact ? "py-1 text-xs" : "py-1.5 text-xs",
                      isActive
                        ? "bg-gold text-neutral-900 shadow-sm font-bold"
                        : "text-neutral-300 hover:text-neutral-50 hover:bg-white/5",
                    )}
                  >
                    {tab.label}
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
                  "flex items-center gap-1 px-3 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:text-neutral-100 hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer",
                  isCompact ? "py-1" : "py-1.5",
                )}
              >
                <X size={14} />
                Limpar busca
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
            <h2 className="text-body-l sm:text-subtitle-s font-bold text-neutral-100">
              Perguntas & Respostas Frequentes
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10">
              {filteredFaqs.length}{" "}
              {filteredFaqs.length === 1 ? "tópico" : "tópicos"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-xs text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              Expandir todos
            </button>
            <span className="text-neutral-600">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-xs text-neutral-400 hover:text-gold transition-colors font-medium cursor-pointer"
            >
              Recolher todos
            </button>
          </div>
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-surface/20 border border-primary/20 text-center flex flex-col items-center justify-center gap-3">
            <Search className="text-neutral-400" size={32} />
            <p className="text-body-m font-bold text-neutral-200">
              Nenhum tópico encontrado para "{searchQuery}"
            </p>
            <p className="text-body-s text-neutral-400 max-w-md">
              Tente pesquisar com outros termos ou altere a categoria
              selecionada acima.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-gold text-neutral-900 font-bold text-xs hover:bg-gold-hover transition-colors cursor-pointer shadow-glow-gold-xs"
            >
              Ver todos os tópicos
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqIds.has(faq.id);

              return (
                <div
                  key={faq.id}
                  className={cn(
                    "rounded-xl border border-primary/20 bg-surface/30 backdrop-blur-md overflow-hidden transition-all duration-200",
                    isExpanded && "border-gold/40 shadow-glow-gold-xs",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors select-none outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-neutral-400 transition-transform duration-200 shrink-0 mt-0.5",
                          isExpanded && "rotate-180 text-gold",
                        )}
                      >
                        <ChevronDown size={18} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              "text-body-m font-bold text-neutral-100 transition-colors",
                              isExpanded && "text-gold",
                            )}
                          >
                            {faq.question}
                          </h3>
                          {faq.highlightBadge && (
                            <span className="text-tiny font-bold px-2 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/30">
                              {faq.highlightBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-1 text-neutral-300 text-body-s flex flex-col gap-3 border-t border-white/5 animate-in fade-in duration-150">
                      <p className="leading-relaxed">{faq.answer}</p>

                      {faq.bullets && faq.bullets.length > 0 && (
                        <ul className="flex flex-col gap-1.5 list-disc list-inside bg-primary-dark/20 p-3.5 rounded-lg border border-primary/20 text-neutral-200">
                          {faq.bullets.map((bullet) => (
                            <li key={bullet} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      )}

                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5">
                          <span className="text-tiny uppercase text-neutral-500 font-bold mr-1">
                            Tags:
                          </span>
                          {faq.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSearchQuery(tag)}
                              className="text-label-g px-2 py-0.5 rounded-md bg-white/5 hover:bg-gold/20 hover:text-gold text-neutral-400 border border-white/10 transition-colors cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
