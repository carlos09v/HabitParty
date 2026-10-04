"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface WelcomeCardStat {
  label: string;
  value: string;
}

interface WelcomeCardProps {
  title: string;
  subtitle?: string;
  bullets: string[];
  imageSrc?: string;
  stats?: WelcomeCardStat[];
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  compact?: boolean;
  className?: string;
  imageWidth?: number;
  imageHeight?: number;
}

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
}: WelcomeCardProps) {
  // Estado que controla se o card está aberto ou encolhido
  const [internalExpanded, setInternalExpanded] = useState(true);

  const isExpanded =
    externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (onToggle) {
      onToggle(next);
    } else {
      setInternalExpanded(next);
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "bg-primary-dark/30 border border-primary/40 rounded-xl p-3.5 shadow-[0_0_15px_rgba(124,58,237,0.12)] relative overflow-hidden flex flex-col transition-all max-w-3xl",
          className,
        )}
      >
        {/* Header compacto */}
        <div
          className="flex items-center gap-2.5 cursor-pointer z-20 w-fit group select-none"
          onClick={handleToggle}
        >
          <div className="text-neutral-400 group-hover:text-gold transition-colors">
            {isExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </div>
          <h2 className="text-subtitle-m font-bold text-neutral-50 group-hover:text-gold transition-colors">
            {title}
          </h2>
        </div>

        {/* Conteúdo compacto */}
        {isExpanded && (
          <div className="flex items-center justify-between gap-6 z-10 mt-2 pl-7 animate-in fade-in duration-300">
            {/* Texto e Bullets */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              {subtitle && (
                <p className="text-body-s text-gold font-medium">{subtitle}</p>
              )}
              <ul className="flex flex-col gap-1 text-[13px] text-neutral-300 list-disc list-inside">
                {bullets.map((bullet, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Imagem compacta e proporcional */}
            {imageSrc && (
              <div className="shrink-0 flex items-center justify-center pr-2">
                <Image
                  src={imageSrc}
                  alt="Ilustração da rotina"
                  width={imageWidth || 136}
                  height={imageHeight || 93}
                  priority
                  className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-primary-dark/30 border border-primary/40 rounded-2xl px-8 py-5 shadow-[0_0_15px_rgba(124,58,237,0.15)] relative overflow-hidden flex flex-col transition-all",
        className,
      )}
    >
      {/* Header com Toggle (Ícone + Título clicáveis) */}
      <div
        className="flex items-center gap-3 cursor-pointer z-20 w-fit group select-none"
        onClick={handleToggle}
      >
        <div className="text-neutral-400 group-hover:text-gold transition-colors">
          {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </div>
        <h2 className="text-headline-m font-bold text-neutral-50 group-hover:text-gold transition-colors">
          {title}
        </h2>
      </div>

      {/* Conteúdo Expansível */}
      {isExpanded && (
        <div className="flex flex-col xl:flex-row items-start justify-between gap-6 z-10 mt-3.5 pr-0 xl:pr-[280px] animate-in fade-in duration-300">
          {/* Coluna 1: Motivação e Instruções */}
          <div className="flex flex-col gap-2 max-w-xl">
            {subtitle && (
              <p className="text-body-m text-gold font-medium">{subtitle}</p>
            )}

            <ul className="flex flex-col gap-1.5 text-body-s text-neutral-300 list-disc list-inside">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 2: Mini-cards de gamificação rápida (somente se fornecidos, ex: Dashboard) */}
          {stats && stats.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-0.5 px-3 py-2 rounded-xl bg-white/4 border border-white/8 backdrop-blur-xs min-w-[130px]"
                >
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {stat.label}
                  </span>
                  <span className="text-body-s font-bold text-neutral-100">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Ilustração SVG em escala ampliada e proporcional ao desktop 1920 */}
          <div className="hidden xl:flex absolute right-6 bottom-0 z-10 w-[270px] h-[180px] items-end justify-end pointer-events-none">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt="Ilustração do avatar"
                width={imageWidth || 270}
                height={imageHeight || 180}
                priority
                className="object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
              />
            ) : (
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-neutral-500 text-label-m">
                Imagem
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
