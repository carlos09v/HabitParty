import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { HelpFaqItem } from "@/types/help";
import { cn } from "@/utils";

interface HelpFaqCardProps {
  faq: HelpFaqItem;
  isExpanded: boolean;
  isCompact?: boolean;
  showCategoryBadge: boolean;
  categoryLabel: string;
  tagsLabel: string;
  onToggle: (id: string) => void;
  onSelectTag: (tag: string) => void;
}

export function HelpFaqCard({
  faq,
  isExpanded,
  isCompact = false,
  showCategoryBadge,
  categoryLabel,
  tagsLabel,
  onToggle,
  onSelectTag,
}: HelpFaqCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/30 shadow-2xs dark:shadow-none overflow-hidden transition-colors duration-200",
        isExpanded &&
          "border-amber-500/45 dark:border-gold/40 shadow-glow-gold-xs",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(faq.id)}
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
              isExpanded && "rotate-180 text-amber-700 dark:text-gold",
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
              {showCategoryBadge && categoryLabel && (
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
            isCompact ? "px-3.5 pb-4 sm:px-4" : "px-4 pb-5 sm:px-5 sm:pb-5",
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
                  {tagsLabel}
                </span>
                {faq.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectTag(tag)}
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
}
