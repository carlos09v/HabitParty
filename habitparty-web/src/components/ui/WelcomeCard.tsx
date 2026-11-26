"use client";

import { HelpCircle, Sparkles, X } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  CONFIGURABLE_WELCOME_CARDS,
  WELCOME_CARD_DETAILS,
} from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import { useWelcomeCards } from "@/store/welcomeCardsStore";
import type { WelcomeCardProps, WelcomeCardStat } from "@/types/ui";
import { cn } from "@/utils";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

function getStatCardVariantClasses(
  variant: WelcomeCardStat["variant"],
  isInteractive: boolean,
  isActive: boolean,
): string {
  const baseByVariant =
    variant === "gold"
      ? "bg-card dark:bg-gold/10 border-neutral-700 dark:border-gold/30"
      : variant === "success"
        ? "bg-card dark:bg-emerald-500/10 border-neutral-700 dark:border-emerald-500/30"
        : variant === "info"
          ? "bg-card dark:bg-sky-500/15 border-neutral-700 dark:border-sky-400/40"
          : variant === "primary"
            ? "bg-card dark:bg-white/5 border-neutral-700 dark:border-primary-light/35"
            : variant === "warning"
              ? "bg-card dark:bg-amber-500/10 border-neutral-700 dark:border-amber-500/30"
              : "bg-card dark:bg-white/5 border-neutral-700 dark:border-white/10";

  const interactiveClasses = isInteractive
    ? "cursor-pointer hover:border-amber-500/50 dark:hover:border-gold/55 hover:bg-surface/70 dark:hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 active:scale-[0.99]"
    : "";

  const activeClasses = isActive
    ? "ring-2 ring-amber-500/60 dark:ring-gold/75 border-amber-500/60 dark:border-gold/70 shadow-glow-gold-xs"
    : "";

  return cn(baseByVariant, interactiveClasses, activeClasses);
}

function getStatIconClasses(variant: WelcomeCardStat["variant"]): string {
  if (variant === "gold") {
    return "bg-amber-500/10 dark:bg-gold/20 border-amber-500/25 dark:border-gold/30 text-amber-700 dark:text-gold";
  }
  if (variant === "success") {
    return "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/25 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
  }
  if (variant === "info") {
    return "bg-info/10 dark:bg-sky-500/25 border-info/25 dark:border-sky-400/30 text-info dark:text-sky-300";
  }
  if (variant === "primary") {
    return "bg-indigo-500/10 dark:bg-primary/30 border-indigo-500/25 dark:border-primary-light/30 text-indigo-700 dark:text-white";
  }
  if (variant === "warning") {
    return "bg-orange-500/10 dark:bg-amber-500/20 border-orange-500/25 dark:border-amber-500/30 text-orange-700 dark:text-amber-400";
  }
  return "bg-surface dark:bg-white/10 border-neutral-700 dark:border-white/15 text-neutral-200";
}

function getStatValueClasses(variant: WelcomeCardStat["variant"]): string {
  if (variant === "gold") return "text-amber-700 dark:text-gold";
  if (variant === "success") return "text-emerald-700 dark:text-emerald-400";
  if (variant === "info") return "text-info dark:text-sky-300";
  if (variant === "primary") return "text-indigo-700 dark:text-neutral-50";
  if (variant === "warning") return "text-orange-700 dark:text-amber-400";
  return "text-neutral-50";
}

interface WelcomeCardQuickActionsProps {
  hasQuickGuide: boolean;
  isDismissible: boolean;
  isGuideOpen: boolean;
  guidePopoverId: string;
  onToggleGuide: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRequestDismiss: () => void;
  quickGuideTitle: string;
  quickGuideAria: string;
  hideForeverTitle: string;
  hideForeverAria: string;
  className?: string;
}

function WelcomeCardQuickActions({
  hasQuickGuide,
  isDismissible,
  isGuideOpen,
  guidePopoverId,
  onToggleGuide,
  onRequestDismiss,
  quickGuideTitle,
  quickGuideAria,
  hideForeverTitle,
  hideForeverAria,
  className,
}: WelcomeCardQuickActionsProps) {
  if (!hasQuickGuide && !isDismissible) return null;

  return (
    <div className={cn("items-center gap-1 shrink-0", className)}>
      {hasQuickGuide && (
        <button
          type="button"
          onClick={onToggleGuide}
          aria-expanded={isGuideOpen}
          aria-controls={guidePopoverId}
          title={quickGuideTitle}
          aria-label={quickGuideAria}
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
            isGuideOpen
              ? "bg-primary/15 dark:bg-gold/20 border-primary/40 dark:border-gold/50 text-primary dark:text-gold"
              : "bg-surface/80 dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-300 hover:text-primary dark:hover:text-gold hover:border-primary/35 dark:hover:border-gold/35",
          )}
        >
          <HelpCircle size={15} />
        </button>
      )}
      {isDismissible && (
        <button
          type="button"
          onClick={onRequestDismiss}
          className="w-8 h-8 rounded-lg border border-transparent text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
          title={hideForeverTitle}
          aria-label={hideForeverAria}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function WelcomeCard({
  title,
  subtitle,
  bullets,
  imageSrc,
  icon,
  stats,
  headingLevel = "h1",
  className,
  imageWidth,
  imageHeight,
  storageKey,
  dismissible,
  onDismiss,
}: WelcomeCardProps) {
  const t = useTranslations("ui.welcomeCard");
  const { isGamified } = useExperienceMode();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { isCardHidden, hideCard } = useWelcomeCards();
  const guidePopoverId = useId();

  const guidePopover = useFloatingPopover<
    HTMLElement,
    HTMLButtonElement,
    HTMLElement
  >({
    align: "right",
    estimatedWidth: 360,
    estimatedHeight: 280,
    offset: 8,
    margin: 12,
  });

  const getCardText = (
    field: string,
    fallback?: string,
  ): string | undefined => {
    if (!storageKey) return fallback;
    const modeKey = isGamified ? `${field}Gamified` : `${field}Productivity`;
    const modePath = `cards.${storageKey}.${modeKey}` as Parameters<
      typeof t.has
    >[0];
    if (t.has(modePath)) {
      return t(modePath as Parameters<typeof t>[0]);
    }
    const basePath = `cards.${storageKey}.${field}` as Parameters<
      typeof t.has
    >[0];
    if (t.has(basePath)) {
      return t(basePath as Parameters<typeof t>[0]);
    }
    return fallback;
  };

  const defaultDetail = storageKey
    ? WELCOME_CARD_DETAILS[storageKey]
    : undefined;
  const fallbackTitle = title ?? "";
  const fallbackSubtitle = subtitle;
  const fallbackBullets = bullets ?? [];
  const resolvedImageSrc = imageSrc ?? defaultDetail?.imageSrc;
  const resolvedImageWidth = imageWidth ?? defaultDetail?.normalWidth ?? 120;
  const resolvedImageHeight = imageHeight ?? defaultDetail?.normalHeight ?? 72;

  const resolvedTitle = getCardText("title", fallbackTitle) || fallbackTitle;
  const resolvedSubtitle =
    getCardText("subtitle", fallbackSubtitle) || fallbackSubtitle;
  const hasLocalizedBullets =
    storageKey &&
    (t.has(`cards.${storageKey}.bullet0` as Parameters<typeof t.has>[0]) ||
      t.has(
        `cards.${storageKey}.bullet0Gamified` as Parameters<typeof t.has>[0],
      ));
  const resolvedBullets = (
    hasLocalizedBullets
      ? [
          getCardText("bullet0", fallbackBullets[0]) ||
            fallbackBullets[0] ||
            "",
          getCardText("bullet1", fallbackBullets[1]) ||
            fallbackBullets[1] ||
            "",
          getCardText("bullet2", fallbackBullets[2]) ||
            fallbackBullets[2] ||
            "",
        ]
      : fallbackBullets
  ).filter(Boolean);

  const HeaderIcon =
    icon ??
    CONFIGURABLE_WELCOME_CARDS.find((card) => card.key === storageKey)?.icon ??
    Sparkles;

  // Mantem respeito a ocultacao configurada em WelcomeCardsSettings,
  // preservando um <h1> semantico invisivel para leitores de tela quando headingLevel === "h1"
  if (storageKey && isCardHidden(storageKey)) {
    return headingLevel === "h1" ? (
      <h1 className="sr-only">{resolvedTitle}</h1>
    ) : null;
  }

  const isDismissible =
    dismissible !== undefined
      ? dismissible
      : Boolean(storageKey && storageKey !== "dashboard");

  const hasQuickGuide = resolvedBullets.length > 0 || Boolean(resolvedImageSrc);

  const handleConfirmDismiss = () => {
    if (storageKey) {
      hideCard(storageKey);
    }
    guidePopover.close();
    setIsConfirmModalOpen(false);
    onDismiss?.();
    toast.info(t("toastHiddenFull"));
  };

  const HeadingTag = headingLevel;

  return (
    <>
      <section
        ref={guidePopover.containerRef}
        className={cn(
          "w-full shrink-0 bg-linear-to-r from-primary/[0.05] via-card to-amber-500/[0.03] dark:from-primary-dark/45 dark:via-surface/85 dark:to-primary-dark/30 border border-neutral-700 dark:border-primary/35 shadow-xs dark:shadow-[0_0_16px_color-mix(in_srgb,var(--color-primary)_10%,transparent)] relative rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5",
          className,
        )}
        aria-label={t("sectionAria", { title: resolvedTitle })}
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
          {/* Esquerda: Identidade e proposito da pagina */}
          <div className="flex items-start sm:items-center justify-between gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className="rounded-xl bg-primary/10 dark:bg-gold/15 border border-primary/25 dark:border-gold/30 flex items-center justify-center text-primary dark:text-gold shrink-0 w-10 h-10"
                aria-hidden="true"
              >
                <HeaderIcon size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <HeadingTag className="font-extrabold text-neutral-50 tracking-tight truncate text-lg sm:text-xl">
                  {resolvedTitle}
                </HeadingTag>
                {resolvedSubtitle && (
                  <p className="text-xs sm:text-body-s text-neutral-300 leading-snug line-clamp-2 xl:line-clamp-1 mt-0.5">
                    {resolvedSubtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Acoes rapidas no topo direito em mobile/tablet */}
            <WelcomeCardQuickActions
              hasQuickGuide={hasQuickGuide}
              isDismissible={isDismissible}
              isGuideOpen={guidePopover.isOpen}
              guidePopoverId={guidePopoverId}
              onToggleGuide={(e) => {
                guidePopover.triggerRef.current = e.currentTarget;
                guidePopover.toggle();
              }}
              onRequestDismiss={() => setIsConfirmModalOpen(true)}
              quickGuideTitle={t("quickGuideTitle")}
              quickGuideAria={t("quickGuideAria")}
              hideForeverTitle={t("hideForeverTitle")}
              hideForeverAria={t("hideForeverAria")}
              className="flex xl:hidden"
            />
          </div>

          {/* Direita: 3 KPIs vivos/clicaveis + controles desktop */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            {stats && stats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex xl:items-center gap-2 w-full xl:w-auto min-w-0">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  const isInteractive = typeof stat.onClick === "function";
                  const isActive = Boolean(stat.active);
                  const pillClasses = cn(
                    "flex items-center gap-2.5 rounded-xl border transition-[border-color,background-color,box-shadow,transform] duration-150 min-w-0 text-left px-3 py-1.5 sm:px-3.5 sm:py-2",
                    getStatCardVariantClasses(
                      stat.variant,
                      isInteractive,
                      isActive,
                    ),
                  );

                  const pillContent = (
                    <>
                      {Icon && (
                        <div
                          className={cn(
                            "rounded-lg shrink-0 flex items-center justify-center border w-8 h-8",
                            getStatIconClasses(stat.variant),
                          )}
                          aria-hidden="true"
                        >
                          <Icon size={16} />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider truncate">
                          {stat.label}
                        </span>
                        <span
                          className={cn(
                            "font-extrabold truncate leading-tight text-sm",
                            getStatValueClasses(stat.variant),
                          )}
                        >
                          {stat.value}
                        </span>
                        {stat.hint && (
                          <span className="text-[11px] text-neutral-400 truncate max-w-[175px]">
                            {stat.hint}
                          </span>
                        )}
                      </div>
                    </>
                  );

                  if (isInteractive) {
                    return (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={stat.onClick}
                        aria-pressed={isActive}
                        aria-label={
                          stat.ariaLabel ??
                          `${stat.label}: ${stat.value}${stat.hint ? ` (${stat.hint})` : ""}`
                        }
                        title={
                          stat.hint
                            ? `${stat.label}: ${stat.value} — ${stat.hint}`
                            : `${stat.label}: ${stat.value}`
                        }
                        className={pillClasses}
                      >
                        {pillContent}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={stat.label}
                      className={pillClasses}
                      title={
                        stat.hint
                          ? `${stat.label}: ${stat.value} — ${stat.hint}`
                          : `${stat.label}: ${stat.value}`
                      }
                    >
                      {pillContent}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botoes Guia Rapido (?) e Ocultar (X) em desktop */}
            <WelcomeCardQuickActions
              hasQuickGuide={hasQuickGuide}
              isDismissible={isDismissible}
              isGuideOpen={guidePopover.isOpen}
              guidePopoverId={guidePopoverId}
              onToggleGuide={(e) => {
                guidePopover.triggerRef.current = e.currentTarget;
                guidePopover.toggle();
              }}
              onRequestDismiss={() => setIsConfirmModalOpen(true)}
              quickGuideTitle={t("quickGuideTitle")}
              quickGuideAria={t("quickGuideAria")}
              hideForeverTitle={t("hideForeverTitle")}
              hideForeverAria={t("hideForeverAria")}
              className="hidden xl:flex pl-2 border-l border-neutral-700 dark:border-white/10"
            />
          </div>
        </div>
      </section>

      {/* Popover Sob Demanda: Guia Rapido da Tela */}
      {hasQuickGuide &&
        guidePopover.isOpen &&
        guidePopover.shouldRenderPortal &&
        guidePopover.floatingStyle &&
        guidePopover.portalContainer &&
        createPortal(
          <section
            ref={guidePopover.popoverRef}
            id={guidePopoverId}
            aria-label={t("quickGuideTitle")}
            style={guidePopover.floatingStyle}
            className="w-[min(calc(100vw-24px),24rem)] rounded-2xl border border-neutral-700 dark:border-primary/40 bg-card dark:bg-surface p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/15 dark:bg-gold/15 border border-primary/25 dark:border-gold/30 flex items-center justify-center text-primary dark:text-gold shrink-0">
                  <HeaderIcon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-neutral-50 truncate">
                    {t("quickGuideTitle")}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {resolvedTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={guidePopover.close}
                aria-label={t("quickGuideCloseAria")}
                className="w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {resolvedImageSrc && (
              <div className="mb-3 rounded-xl bg-card dark:bg-white/[0.03] border border-neutral-700 dark:border-white/10 p-2.5 flex items-center justify-center h-24 overflow-hidden">
                <Image
                  src={resolvedImageSrc}
                  alt={t("illustrationAlt", { title: resolvedTitle })}
                  width={resolvedImageWidth}
                  height={resolvedImageHeight}
                  className="object-contain max-h-full w-auto"
                />
              </div>
            )}

            {resolvedBullets.length > 0 && (
              <ul className="flex flex-col gap-2 text-xs text-neutral-200 list-none p-0 m-0">
                {resolvedBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 leading-relaxed"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary/70 dark:bg-gold/80 mt-1.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>,
          guidePopover.portalContainer,
        )}

      {/* Modal de Confirmacao para Ocultar Card (montado sob demanda) */}
      {isDismissible && isConfirmModalOpen && (
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
