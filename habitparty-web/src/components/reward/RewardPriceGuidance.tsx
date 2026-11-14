"use client";

import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import type { AppLocale } from "@/i18n/config";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import {
  analyzeRewardPrice,
  type RewardEffortDescriptor,
  type RewardPriceAnalysis,
  type RewardPriceWarningDescriptor,
} from "@/utils/rewardEconomy";

function formatDays(days: number, locale: AppLocale): string {
  const intlLocale = locale === "en" ? "en-US" : "pt-BR";
  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: days >= 5 ? 0 : 1,
  }).format(days);
}

function formatEffortSummary(
  effort: RewardEffortDescriptor,
  t: ReturnType<typeof useTranslations<"rewards.formModal.priceGuidance">>,
  locale: AppLocale,
): string {
  switch (effort.key) {
    case "free":
      return t("effort.free");
    case "easyTasks":
      return t("effort.easyTasks", { count: effort.count });
    case "hardSingleTask":
      return t("effort.hardSingleTask");
    case "mediumTasks":
      return t("effort.mediumTasks", { count: effort.count });
    case "halfDayMix":
      return t("effort.halfDayMix");
    case "oneProductiveDay":
      return t("effort.oneProductiveDay", { hardCount: effort.hardCount });
    case "multipleProductiveDays":
      return t("effort.multipleProductiveDays", {
        days: formatDays(effort.days, locale),
      });
  }
}

function formatWarningMessage(
  warning: RewardPriceWarningDescriptor | undefined,
  t: ReturnType<typeof useTranslations<"rewards.formModal.priceGuidance">>,
  locale: AppLocale,
): string | null {
  if (!warning) return null;
  switch (warning.key) {
    case "belowCalibrated":
      return t("warnings.belowCalibrated", {
        price: formatCoins(warning.suggestedPrice, { locale }),
      });
    case "aboveCalibrated":
      return t("warnings.aboveCalibrated", {
        price: formatCoins(warning.suggestedPrice, { locale }),
      });
    case "singleUseTooLow":
      return t("warnings.singleUseTooLow");
    case "singleUseTooHigh":
      return t("warnings.singleUseTooHigh");
  }
}

interface RewardPriceGuidanceProps {
  type: RewardType;
  price: string;
  durationMinutes?: string;
  packageLevel?: PackageLevel;
  analysis?: RewardPriceAnalysis;
  onApplySuggestedPrice?: (suggestedPrice: number) => void;
  disabled?: boolean;
}

/**
 * Guia econômico abaixo do input de preço no formulário de recompensa:
 * exibe equivalência em esforço, sugestão calibrada clicável e alertas em InfoTooltip
 * sem expandir a altura do modal.
 */
export function RewardPriceGuidance({
  type,
  price,
  durationMinutes,
  packageLevel,
  analysis: providedAnalysis,
  onApplySuggestedPrice,
  disabled = false,
}: RewardPriceGuidanceProps) {
  const t = useTranslations("rewards.formModal.priceGuidance");
  const locale = useLocale() as AppLocale;

  const numericPrice = Number.parseFloat(price.replace(",", ".")) || 0;
  const numericDuration = Number.parseInt(durationMinutes || "30", 10) || 30;

  const analysis = useMemo(
    () =>
      providedAnalysis ??
      analyzeRewardPrice({
        type,
        price: numericPrice,
        durationMinutes: numericDuration,
        packageLevel,
      }),
    [providedAnalysis, type, numericPrice, numericDuration, packageLevel],
  );

  const effortSummary = formatEffortSummary(analysis.effort, t, locale);
  const warningMessage = formatWarningMessage(analysis.warning, t, locale);

  const hasSuggestedDiff =
    analysis.suggestedPrice !== null &&
    Math.abs(numericPrice - analysis.suggestedPrice) >= 0.01;

  const isWarning = analysis.status !== "ok";
  const warningTitle =
    analysis.status === "too_low" ? t("tooLowTitle") : t("tooHighTitle");
  const warningBadgeLabel =
    analysis.status === "too_low" ? t("tooLowBadge") : t("tooHighBadge");

  const renderWarningTooltip = (align: "left" | "right") => {
    if (!isWarning || !warningMessage) return null;

    return (
      <InfoTooltip
        ariaLabel={t("warningTooltipAria")}
        title={warningTitle}
        icon={
          <AlertTriangle
            size={14}
            className="text-amber-600 dark:text-amber-400 shrink-0"
          />
        }
        triggerIcon={<AlertTriangle size={11} className="shrink-0" />}
        triggerLabel={warningBadgeLabel}
        align={align}
        side="top"
        triggerClassName={cn(
          "px-2 py-0.5 rounded-md font-bold text-tiny leading-none whitespace-nowrap",
          "bg-amber-500/15 border-amber-500/40 text-amber-800 hover:bg-amber-500/25 hover:border-amber-500/60 hover:text-amber-900 focus:text-amber-900",
          "dark:bg-amber-500/15 dark:border-amber-400/40 dark:text-amber-300 dark:hover:bg-amber-500/25 dark:hover:border-amber-400/60 dark:hover:text-amber-200 dark:focus:text-amber-200",
        )}
        popoverClassName="border-amber-500/45 dark:border-amber-400/45"
      >
        <p className="text-neutral-200 leading-relaxed text-label-g">
          {warningMessage}
        </p>
      </InfoTooltip>
    );
  };

  if (analysis.suggestedPrice === null) {
    return (
      <div className="flex items-center justify-between gap-2 min-h-[24px] text-label-m">
        <span className="inline-flex items-center gap-1.5 text-neutral-300 min-w-0">
          <Sparkles size={12} className="text-gold shrink-0" />
          <span className="truncate">
            <span className="text-neutral-400">{t("effortPrefix")}</span>{" "}
            <strong className="font-semibold text-neutral-100">
              {effortSummary}
            </strong>
          </span>
        </span>
        {isWarning && warningMessage && (
          <div className="shrink-0">{renderWarningTooltip("right")}</div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Linha 1: Equivalência em esforço */}
      <div className="flex items-center gap-1.5 min-h-[20px] text-label-m text-neutral-300">
        <Sparkles size={12} className="text-gold shrink-0" />
        <span className="truncate">
          <span className="text-neutral-400">{t("effortPrefix")}</span>{" "}
          <strong className="font-semibold text-neutral-100">
            {effortSummary}
          </strong>
        </span>
      </div>

      {/* Linha 2 (altura fixa): Alerta em InfoTooltip + atalho de preço sugerido */}
      <div className="flex items-center justify-between gap-2 min-h-[24px] text-label-m">
        <div className="flex items-center min-w-0">
          {isWarning && warningMessage ? (
            renderWarningTooltip("left")
          ) : !hasSuggestedDiff ? (
            <span className="inline-flex items-center gap-1 text-tiny text-emerald-700 dark:text-success-400 font-medium">
              <Check size={11} className="shrink-0" />
              <span>{t("calibratedLabel")}</span>
            </span>
          ) : (
            <span className="text-neutral-400 text-tiny">
              {t("suggestedLabel")}
            </span>
          )}
        </div>

        {hasSuggestedDiff && onApplySuggestedPrice && (
          <div className="inline-flex items-center gap-1.5 shrink-0">
            {isWarning && (
              <span className="text-neutral-400 text-tiny hidden sm:inline">
                {t("suggestedLabel")}
              </span>
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onApplySuggestedPrice(analysis.suggestedPrice as number)
              }
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 dark:bg-gold/15 hover:bg-amber-500/20 dark:hover:bg-gold/25 border border-amber-500/35 dark:border-gold/40 text-amber-800 dark:text-gold font-bold text-tiny transition-colors cursor-pointer disabled:opacity-50"
            >
              <CoinIcon size={11} />
              <span>
                {t("applySuggested", {
                  price: formatCoins(analysis.suggestedPrice, { locale }),
                })}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
