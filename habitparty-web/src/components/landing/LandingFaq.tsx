"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import { LANDING_FAQS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-info" />
            Tire suas Dúvidas
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-50 tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="mt-3 text-base text-neutral-300">
            Tudo o que você precisa saber antes de iniciar sua primeira quest.
          </p>
        </div>

        <div className="space-y-4">
          {LANDING_FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className="rounded-xl bg-card dark:bg-surface/75 border border-neutral-700 dark:border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left text-neutral-100 hover:text-gold font-semibold text-base transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-neutral-400 transition-transform duration-300 shrink-0 ml-4",
                      isOpen && "rotate-180 text-gold",
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-neutral-300 leading-relaxed border-t border-neutral-700/60 dark:border-white/5 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
