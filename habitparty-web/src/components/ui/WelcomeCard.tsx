"use client";

import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useWelcomeCards } from "@/store/welcomeCardsStore";
import type { WelcomeCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function WelcomeCard({
  title,
  subtitle,
  bullets,
  imageSrc,
  stats,
  isExpanded: externalIsExpanded,
  defaultExpanded,
  onToggle,
  compact = false,
  className,
  imageWidth,
  imageHeight,
  storageKey,
  dismissible,
  onDismiss,
}: WelcomeCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(
    defaultExpanded ?? false,
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { isCardHidden, hideCard } = useWelcomeCards();

  // Carrega estado de expansão salvo do localStorage se storageKey estiver configurada
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`habitparty_welcome_${storageKey}`);
        if (saved !== null) {
          const isVal = saved === "true";
          setInternalExpanded(isVal);
          onToggle?.(isVal);
        } else if (defaultExpanded !== undefined) {
          setInternalExpanded(defaultExpanded);
          onToggle?.(defaultExpanded);
        }
      } catch {
        // localStorage indisponível ou em modo anônimo restrito
      }
    }
  }, [storageKey, onToggle, defaultExpanded]);

  // Se o card estiver ocultado pelo usuário nas configurações ou via modal, não renderiza
  if (storageKey && isCardHidden(storageKey)) {
    return null;
  }

  const isExpanded =
    externalIsExpanded !== undefined ? externalIsExpanded : internalExpanded;

  const isDismissible =
    dismissible !== undefined
      ? dismissible
      : Boolean(storageKey && storageKey !== "dashboard");

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

  const handleConfirmDismiss = () => {
    if (storageKey) {
      hideCard(storageKey);
    }
    setIsConfirmModalOpen(false);
    onDismiss?.();
    toast.info(
      "Card de boas-vindas ocultado. Você pode reativá-lo nas Configurações.",
    );
  };

  return (
    <>
      <section
        className={cn(
          "w-full shrink-0 bg-primary-dark/30 border border-primary/35 shadow-[0_0_15px_rgba(124,58,237,0.12)] relative overflow-hidden transition-all duration-300",
          isExpanded
            ? compact
              ? "rounded-xl p-3 sm:p-3.5"
              : "rounded-2xl p-4 sm:px-6 sm:py-5"
            : compact
              ? "rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5"
              : "rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3",
          className,
        )}
        aria-label={`Boas-vindas: ${title}`}
      >
        {/* Header com Toggle e Botão de Ocultar Card */}
        <div className="w-full flex items-center justify-between gap-2 z-20">
          <button
            type="button"
            className="flex-1 text-left bg-transparent border-none p-0 flex items-center justify-between gap-3 cursor-pointer group select-none focus:outline-none focus:ring-2 focus:ring-gold/40 rounded-lg min-w-0"
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
                  isExpanded
                    ? compact
                      ? "text-base sm:text-lg"
                      : "text-lg sm:text-2xl"
                    : "text-sm sm:text-base",
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
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <span
                        key={stat.label}
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 transition-colors",
                          stat.variant === "gold"
                            ? "text-gold border-gold/30 bg-gold/10"
                            : stat.variant === "success"
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              : stat.variant === "info"
                                ? "text-sky-300 border-sky-400/40 bg-sky-500/15"
                                : stat.variant === "primary"
                                  ? "text-white border-primary-light/40 bg-primary/25"
                                  : stat.variant === "warning"
                                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                                    : "text-neutral-200 border-white/10 bg-white/5",
                        )}
                        title={`${stat.label}: ${stat.value}`}
                      >
                        {Icon && <Icon size={12} className="shrink-0" />}
                        <span>{stat.value}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              <span className="text-xs font-semibold text-neutral-400 group-hover:text-gold transition-colors flex items-center gap-1">
                {isExpanded ? "Recolher" : "Expandir"}
              </span>
            </div>
          </button>

          {/* Botão de Fechar / Ocultar Permanentemente (apenas para cards dismissíveis) */}
          {isDismissible && (
            <div className="flex items-center pl-1.5 sm:pl-2 border-l border-white/10 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmModalOpen(true);
                }}
                className="p-1 sm:p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/40"
                title="Ocultar card permanentemente"
                aria-label="Ocultar card de boas-vindas permanentemente"
              >
                <X size={compact ? 16 : 18} />
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo Expansível com Transição Suave via Grid CSS */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded
              ? "grid-rows-[1fr] opacity-100 mt-3 sm:mt-4"
              : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none",
          )}
        >
          <div className="overflow-hidden min-h-0">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 xl:gap-6 z-10">
              {/* Coluna 1: Subtítulo e Marcadores (com largura mínima garantida para evitar letras espremidas) */}
              <div
                className={cn(
                  "flex flex-col gap-2 min-w-0 flex-1",
                  stats && stats.length > 0
                    ? "min-w-[280px] lg:min-w-[340px] max-w-2xl"
                    : "max-w-3xl",
                )}
              >
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

              {/* Coluna 2: Mini-cards de métricas de gamificação */}
              {stats && stats.length > 0 && (
                <div className="flex flex-wrap sm:grid sm:grid-cols-2 lg:flex lg:flex-wrap xl:grid xl:grid-cols-3 gap-2.5 shrink-0 w-full xl:w-auto">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border backdrop-blur-xs transition-all duration-200",
                          stat.variant === "gold"
                            ? "bg-gold/10 border-gold/30 hover:border-gold/50 shadow-glow-gold-xs"
                            : stat.variant === "success"
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                              : stat.variant === "info"
                                ? "bg-sky-500/15 border-sky-400/40 hover:border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                                : stat.variant === "primary"
                                  ? "bg-surface/80 border-primary-light/40 hover:border-primary-light/60 shadow-xs"
                                  : stat.variant === "warning"
                                    ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                                    : "bg-surface/60 border-primary/25 hover:border-primary/40",
                        )}
                      >
                        {Icon && (
                          <div
                            className={cn(
                              "p-2 rounded-lg shrink-0 flex items-center justify-center",
                              stat.variant === "gold"
                                ? "bg-gold/20 text-gold"
                                : stat.variant === "success"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : stat.variant === "info"
                                    ? "bg-sky-500/25 text-sky-300 border border-sky-400/30"
                                    : stat.variant === "primary"
                                      ? "bg-primary/30 text-white"
                                      : stat.variant === "warning"
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-white/10 text-neutral-300",
                            )}
                          >
                            <Icon size={18} />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-300 uppercase tracking-wider truncate">
                            {stat.label}
                          </span>
                          <span
                            className={cn(
                              "text-sm sm:text-base font-extrabold truncate",
                              stat.variant === "gold"
                                ? "text-gold"
                                : stat.variant === "success"
                                  ? "text-emerald-400"
                                  : stat.variant === "info"
                                    ? "text-white font-black drop-shadow-xs"
                                    : "text-neutral-50",
                            )}
                          >
                            {stat.value}
                          </span>
                          {stat.hint && (
                            <span className="text-[10px] text-neutral-400 truncate">
                              {stat.hint}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coluna 3: Ilustração SVG proporcional e padronizada */}
              {imageSrc && (
                <div
                  className={cn(
                    "shrink-0 flex items-center justify-center self-center lg:self-center relative",
                    compact
                      ? "w-28 h-20 sm:w-36 sm:h-24"
                      : "w-36 h-24 sm:w-44 sm:h-28 xl:w-52 xl:h-32",
                  )}
                >
                  <div
                    className="absolute inset-0 bg-primary-light/10 rounded-full blur-xl pointer-events-none"
                    aria-hidden="true"
                  />
                  <Image
                    src={imageSrc}
                    alt={`Ilustração: ${title}`}
                    width={imageWidth || (compact ? 136 : 220)}
                    height={imageHeight || (compact ? 90 : 140)}
                    priority
                    className="object-contain max-h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] relative z-10"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Confirmação para Ocultar Card */}
      {isDismissible && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDismiss}
          title="Ocultar card de boas-vindas?"
          description={
            <div className="flex flex-col gap-2">
              <p>
                Este card informativo será removido{" "}
                <span className="font-semibold text-neutral-100">
                  permanentemente
                </span>{" "}
                desta tela para que você tenha mais espaço útil.
              </p>
              <p className="text-neutral-400 text-xs">
                Caso queira exibi-lo novamente, você poderá reativá-lo a
                qualquer momento na página de{" "}
                <span className="text-gold font-medium">Configurações</span>.
              </p>
            </div>
          }
          confirmText="Sim, ocultar card"
          cancelText="Cancelar"
          variant="warning"
        />
      )}
    </>
  );
}
