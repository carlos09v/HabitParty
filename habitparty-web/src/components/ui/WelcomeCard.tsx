"use client";

import { ChevronDown, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { CONFIGURABLE_WELCOME_CARDS } from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useWelcomeCards } from "@/store/welcomeCardsStore";
import type { WelcomeCardProps } from "@/types/ui";
import { cn } from "@/utils";

export function WelcomeCard({
  title,
  subtitle,
  bullets,
  imageSrc,
  icon,
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
  const t = useTranslations("ui.welcomeCard");
  const { isGamified } = useExperienceMode();
  const [internalExpanded, setInternalExpanded] = useState(
    defaultExpanded ?? false,
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { isCardHidden, hideCard } = useWelcomeCards();

  const getCardText = (
    field: string,
    fallback?: string,
  ): string | undefined => {
    if (!storageKey) return fallback;
    const modeKey = isGamified ? `${field}Gamified` : `${field}Productivity`;
    if (t.has(`cards.${storageKey}.${modeKey}`)) {
      return t(`cards.${storageKey}.${modeKey}`);
    }
    if (t.has(`cards.${storageKey}.${field}`)) {
      return t(`cards.${storageKey}.${field}`);
    }
    return fallback;
  };

  const resolvedTitle = getCardText("title", title) || title;
  const resolvedSubtitle = getCardText("subtitle", subtitle) || subtitle;
  const resolvedBullets =
    storageKey &&
    (t.has(`cards.${storageKey}.bullet0`) ||
      t.has(`cards.${storageKey}.bullet0Gamified`))
      ? [
          getCardText("bullet0", bullets[0]) || bullets[0],
          getCardText("bullet1", bullets[1]) || bullets[1],
          getCardText("bullet2", bullets[2]) || bullets[2],
        ]
      : bullets;

  const HeaderIcon =
    icon ??
    CONFIGURABLE_WELCOME_CARDS.find((card) => card.key === storageKey)?.icon ??
    Sparkles;

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
    toast.info(t("toastHiddenFull"));
  };

  return (
    <>
      <section
        className={cn(
          "w-full shrink-0 bg-linear-to-br from-primary-dark/40 via-surface/60 to-primary-dark/25 border border-primary/35 shadow-[0_0_20px_rgba(124,58,237,0.1)] backdrop-blur-md relative overflow-hidden transition-all duration-300",
          isExpanded
            ? compact
              ? "rounded-xl p-3.5 sm:p-4"
              : "rounded-2xl p-4 sm:p-6"
            : compact
              ? "rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5"
              : "rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3.5",
          className,
        )}
        aria-label={t("sectionAria", { title: resolvedTitle })}
      >
        {/* Header com Toggle, Ícone Temático e Botão de Ocultar Card */}
        <div className="w-full flex items-center justify-between gap-2 z-20">
          <button
            type="button"
            className="flex-1 text-left bg-transparent border-none p-0 flex items-center justify-between gap-3 cursor-pointer group select-none focus:outline-none focus:ring-2 focus:ring-gold/40 rounded-lg min-w-0"
            onClick={handleToggle}
            aria-expanded={isExpanded}
          >
            {/* Esquerda: Chevron animado + Ícone Temático + Título + Preview de subtítulo quando encolhido */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div
                className={cn(
                  "text-neutral-400 group-hover:text-gold transition-transform duration-300 shrink-0 flex items-center justify-center",
                  !isExpanded && "-rotate-90",
                )}
                aria-hidden="true"
              >
                <ChevronDown size={compact ? 18 : 20} />
              </div>

              <div
                className={cn(
                  "rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0 transition-colors group-hover:bg-gold/25",
                  compact ? "w-6 h-6" : "w-7 h-7 sm:w-8 sm:h-8",
                )}
                aria-hidden="true"
              >
                <HeaderIcon size={compact ? 13 : 16} />
              </div>

              <h2
                className={cn(
                  "font-extrabold text-neutral-50 group-hover:text-gold transition-colors truncate shrink-0 tracking-tight",
                  isExpanded
                    ? compact
                      ? "text-base sm:text-lg"
                      : "text-lg sm:text-xl"
                    : "text-sm sm:text-base",
                )}
              >
                {resolvedTitle}
              </h2>

              {/* Resumo inteligente em linha exibido apenas quando colapsado */}
              {!isExpanded && resolvedSubtitle && (
                <span className="text-body-s text-neutral-300 font-normal truncate hidden lg:inline-block min-w-0 flex-1">
                  — {resolvedSubtitle}
                </span>
              )}
            </div>

            {/* Direita: Preview de métricas (quando colapsado) + Indicador textual [Expandir / Recolher] */}
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {!isExpanded && stats && stats.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <span
                        key={stat.label}
                        className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap",
                          stat.variant === "gold"
                            ? "text-gold border-gold/30 bg-gold/10"
                            : stat.variant === "success"
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                              : stat.variant === "info"
                                ? "text-info dark:text-sky-300 border-info/35 dark:border-sky-400/40 bg-info/10 dark:bg-sky-500/15"
                                : stat.variant === "primary"
                                  ? "text-primary-dark dark:text-white border-primary/35 dark:border-primary-light/40 bg-primary/15 dark:bg-primary/25"
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

              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-300 group-hover:text-gold group-hover:border-gold/30 transition-colors flex items-center gap-1">
                {isExpanded ? t("collapse") : t("expand")}
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
                title={t("hideForeverTitle")}
                aria-label={t("hideForeverAria")}
              >
                <X size={compact ? 16 : 18} />
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo Expansível em 2 Andares (Topo: Texto + Ilustração | Base: 3 Cards de Indicadores em Largura Total) */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            isExpanded
              ? "grid-rows-[1fr] opacity-100 mt-3.5 sm:mt-4"
              : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none",
          )}
        >
          <div className="overflow-hidden min-h-0">
            <div className="flex flex-col gap-4 sm:gap-5 z-10">
              {/* Bloco Superior: Subtítulo e Marcadores à esquerda + Ilustração SVG à direita */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                <div className="flex flex-col gap-2.5 min-w-0 flex-1 max-w-3xl">
                  {resolvedSubtitle && (
                    <p
                      className={cn(
                        "text-gold font-semibold leading-snug",
                        compact ? "text-body-s" : "text-body-s sm:text-body-m",
                      )}
                    >
                      {resolvedSubtitle}
                    </p>
                  )}

                  <ul className="flex flex-col gap-1.5 text-body-s text-neutral-200 list-none p-0 m-0">
                    {resolvedBullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 leading-relaxed"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-gold/80 mt-2 shrink-0 shadow-glow-gold-xs"
                          aria-hidden="true"
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {imageSrc && (
                  <div
                    className={cn(
                      "shrink-0 flex items-center justify-center self-center relative rounded-xl bg-surface/60 dark:bg-white/[0.03] border border-neutral-700 dark:border-white/10 p-2.5",
                      compact
                        ? "w-28 h-20 sm:w-36 sm:h-22"
                        : "w-36 h-24 sm:w-44 sm:h-28",
                    )}
                  >
                    <div
                      className="absolute inset-0 bg-primary-light/15 rounded-full blur-xl pointer-events-none"
                      aria-hidden="true"
                    />
                    <Image
                      src={imageSrc}
                      alt={t("illustrationAlt", { title: resolvedTitle })}
                      width={imageWidth || (compact ? 130 : 165)}
                      height={imageHeight || (compact ? 75 : 95)}
                      priority
                      className="object-contain max-h-full w-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)] relative z-10"
                    />
                  </div>
                )}
              </div>

              {/* Bloco Inferior: 3 Cards de Indicadores em Largura Total (w-full), nunca espremidos */}
              {stats && stats.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-3.5 border-t border-white/10">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className={cn(
                          "flex items-center gap-3.5 rounded-xl border backdrop-blur-xs transition-all duration-200 min-w-0",
                          compact ? "p-2.5 sm:p-3" : "p-3 sm:p-3.5",
                          stat.variant === "gold"
                            ? "bg-gold/10 border-gold/30 hover:border-gold/50 shadow-glow-gold-xs"
                            : stat.variant === "success"
                              ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                              : stat.variant === "info"
                                ? "bg-info/10 dark:bg-sky-500/15 border-info/35 dark:border-sky-400/40 hover:border-info/55 dark:hover:border-sky-400/60 shadow-2xs dark:shadow-[0_0_12px_rgba(56,189,248,0.12)]"
                                : stat.variant === "primary"
                                  ? "bg-primary/5 dark:bg-white/5 border-primary/30 dark:border-primary-light/40 hover:border-primary/50 dark:hover:border-primary-light/60 shadow-xs"
                                  : stat.variant === "warning"
                                    ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50"
                                    : "bg-white/5 border-white/10 hover:border-primary/40",
                        )}
                      >
                        {Icon && (
                          <div
                            className={cn(
                              "rounded-lg shrink-0 flex items-center justify-center border",
                              compact ? "w-9 h-9" : "w-10 h-10",
                              stat.variant === "gold"
                                ? "bg-gold/20 border-gold/30 text-gold"
                                : stat.variant === "success"
                                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                                  : stat.variant === "info"
                                    ? "bg-info/15 dark:bg-sky-500/25 border-info/30 dark:border-sky-400/30 text-info dark:text-sky-300"
                                    : stat.variant === "primary"
                                      ? "bg-primary/15 dark:bg-primary/30 border-primary/30 dark:border-primary-light/30 text-primary-dark dark:text-white"
                                      : stat.variant === "warning"
                                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                                        : "bg-white/10 border-white/15 text-neutral-200",
                            )}
                          >
                            <Icon size={compact ? 18 : 20} />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                            {stat.label}
                          </span>
                          <span
                            className={cn(
                              "font-extrabold truncate",
                              compact
                                ? "text-sm sm:text-base"
                                : "text-base sm:text-lg",
                              stat.variant === "gold"
                                ? "text-gold"
                                : stat.variant === "success"
                                  ? "text-emerald-400"
                                  : stat.variant === "info"
                                    ? "text-info dark:text-sky-300"
                                    : stat.variant === "primary"
                                      ? "text-primary-dark dark:text-neutral-50"
                                      : stat.variant === "warning"
                                        ? "text-amber-400"
                                        : "text-neutral-50",
                            )}
                          >
                            {stat.value}
                          </span>
                          {stat.hint && (
                            <span
                              className="text-xs text-neutral-300 truncate"
                              title={stat.hint}
                            >
                              {stat.hint}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
          title={t("confirmModalTitle")}
          description={
            <div className="flex flex-col gap-2">
              <p>
                {t.rich("confirmModalBody1", {
                  bold: (chunks) => (
                    <span className="font-semibold text-neutral-100">
                      {chunks}
                    </span>
                  ),
                })}
              </p>
              <p className="text-neutral-400 text-xs">
                {t.rich("confirmModalBody2", {
                  gold: (chunks) => (
                    <span className="text-gold font-medium">{chunks}</span>
                  ),
                })}
              </p>
            </div>
          }
          confirmText={t("confirmModalConfirm")}
          cancelText={t("confirmModalCancel")}
          variant="warning"
        />
      )}
    </>
  );
}
