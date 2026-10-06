"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { WelcomeCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function WelcomeCard({
  title,
  subtitle,
  bullets,
  imageSrc,
  stats,
  isExpanded: externalIsExpanded,
  onToggle,
  compact = false,
  className,
  imageWidth,
  imageHeight,
  storageKey,
}: WelcomeCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(true);

  // Carrega estado salvo do localStorage se storageKey estiver configurada
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`habitparty_welcome_${storageKey}`);
        if (saved !== null) {
          const isVal = saved === "true";
          setInternalExpanded(isVal);
          onToggle?.(isVal);
        }
      } catch {
        // localStorage indisponível ou em modo anônimo restrito
      }
    }
  }, [storageKey, onToggle]);

  const isExpanded =
    externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (storageKey) {
      try {
        localStorage.setItem(`habitparty_welcome_${storageKey}`, String(next));
      } catch {
        // ignore
      }
    }

    if (onToggle) {
      onToggle(next);
    } else {
      setInternalExpanded(next);
    }
  };

  return (
    <section
      className={cn(
        "w-full bg-primary-dark/30 border border-primary/35 shadow-[0_0_15px_rgba(124,58,237,0.12)] relative overflow-hidden transition-all duration-300",
        compact ? "rounded-xl p-3 sm:p-3.5" : "rounded-2xl p-4 sm:px-6 sm:py-5",
        className,
      )}
      aria-label={`Boas-vindas: ${title}`}
    >
      {/* Header com Toggle e Smart Summary Bar quando colapsado */}
      <button
        type="button"
        className="w-full text-left bg-transparent border-none p-0 flex items-center justify-between gap-3 cursor-pointer z-20 group select-none focus:outline-none focus:ring-2 focus:ring-gold/40 rounded-lg"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        {/* Esquerda: Chevron animado + Título + Preview de subtítulo quando encolhido */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "text-neutral-400 group-hover:text-gold transition-transform duration-300 shrink-0 flex items-center justify-center",
              !isExpanded && "-rotate-90",
            )}
            aria-hidden="true"
          >
            <ChevronDown size={compact ? 18 : 22} />
          </div>

          <h2
            className={cn(
              "font-bold text-neutral-50 group-hover:text-gold transition-colors truncate shrink-0",
              compact ? "text-base sm:text-lg" : "text-lg sm:text-2xl",
            )}
          >
            {title}
          </h2>

          {/* Resumo inteligente em linha exibido apenas quando colapsado */}
          {!isExpanded && subtitle && (
            <span className="text-body-s text-neutral-300 font-normal truncate hidden sm:inline-block max-w-md">
              — {subtitle}
            </span>
          )}
        </div>

        {/* Direita: Preview de métricas (quando colapsado) + Indicador textual [Expandir / Recolher] */}
        <div className="flex items-center gap-2.5 shrink-0 ml-2">
          {!isExpanded && stats && stats.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5">
              {stats.map((stat) => (
                <span
                  key={stat.label}
                  className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-200"
                >
                  {stat.value}
                </span>
              ))}
            </div>
          )}

          <span className="text-xs font-semibold text-neutral-400 group-hover:text-gold transition-colors flex items-center gap-1">
            {isExpanded ? "Recolher" : "Expandir"}
          </span>
        </div>
      </button>

      {/* Conteúdo Expansível com Transição Suave via Grid CSS */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded
            ? "grid-rows-[1fr] opacity-100 mt-3 sm:mt-4"
            : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 z-10">
            {/* Coluna 1: Subtítulo e Marcadores */}
            <div className="flex flex-col gap-2 max-w-2xl flex-1 min-w-0">
              {subtitle && (
                <p
                  className={cn(
                    "text-gold font-medium leading-snug",
                    compact ? "text-body-s" : "text-body-s sm:text-body-m",
                  )}
                >
                  {subtitle}
                </p>
              )}

              <ul className="flex flex-col gap-1.5 text-body-s text-neutral-300 list-disc list-inside">
                {bullets.map((bullet) => (
                  <li key={bullet} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna 2: Mini-cards de métricas de gamificação (se fornecidos, ex: Dashboard) */}
            {stats && stats.length > 0 && (
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs min-w-[120px]"
                  >
                    <span className="text-label-g text-neutral-400 font-medium">
                      {stat.label}
                    </span>
                    <span className="text-body-s font-bold text-neutral-100">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Coluna 3: Ilustração SVG proporcional e padronizada */}
            {imageSrc && (
              <div
                className={cn(
                  "shrink-0 flex items-center justify-center self-center lg:self-end",
                  compact
                    ? "w-28 h-20 sm:w-36 sm:h-24"
                    : "w-36 h-24 sm:w-48 sm:h-32 xl:w-56 xl:h-36",
                )}
              >
                <Image
                  src={imageSrc}
                  alt={`Ilustração: ${title}`}
                  width={imageWidth || (compact ? 136 : 220)}
                  height={imageHeight || (compact ? 90 : 140)}
                  priority
                  className="object-contain max-h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
