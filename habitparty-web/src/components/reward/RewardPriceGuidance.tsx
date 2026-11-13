"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import type { AppLocale } from "@/i18n/config";
import type { PackageLevel, RewardType } from "@/types/reward";
import { cn, formatCoins } from "@/utils";
import {
  analyzeRewardPrice,
  type RewardEffortDescriptor,
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
  onApplySuggestedPrice?: (suggestedPrice: number) => void;
  disabled?: boolean;
}

/**
 * Guia econômico abaixo do input de preço no formulário de recompensa:
 * exibe equivalência em esforço, sugestão calibrada clicável e alertas não-bloqueantes.
 */
export function RewardPriceGuidance({
  type,
  price,
  durationMinutes,
  packageLevel,
  onApplySuggestedPrice,
  disabled = false,
}: RewardPriceGuidanceProps) {
  const t = useTranslations("rewards.formModal.priceGuidance");
  const locale = useLocale() as AppLocale;

  const numericPrice = Number.parseFloat(price.replace(",", ".")) || 0;
  const numericDuration = Number.parseInt(durationMinutes || "30", 10) || 30;

  const analysis = useMemo(
    () =>
      analyzeRewardPrice({
        type,
        price: numericPrice,
        durationMinutes: numericDuration,
        packageLevel,
      }),
    [type, numericPrice, numericDuration, packageLevel],
  );

  const effortSummary = formatEffortSummary(analysis.effort, t, locale);
  const warningMessage = formatWarningMessage(analysis.warning, t, locale);

  const hasSuggestedDiff =
    analysis.suggestedPrice !== null &&
    Math.abs(numericPrice - analysis.suggestedPrice) >= 0.01;

  const isWarning = analysis.status !== "ok";

  return (
    <div className="flex flex-col gap-1.5">
      {/* Linha de equivalência em esforço + atalho para aplicar preço sugerido */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-label-m">
        <span className="inline-flex items-center gap-1.5 text-neutral-300">
          <Sparkles size={12} className="text-gold shrink-0" />
          <span>
            <span className="text-neutral-400">{t("effortPrefix")}</span>{" "}
            <strong className="font-semibold text-neutral-100">
              {effortSummary}
            </strong>
          </span>
        </span>

        {analysis.suggestedPrice !== null &&
          hasSuggestedDiff &&
          onApplySuggestedPrice && (
            <div className="inline-flex items-center gap-1.5 shrink-0">
              <span className="text-neutral-400 text-tiny">
                {t("suggestedLabel")}
              </span>
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

      {/* Aviso suave (não-bloqueante) quando foge muito do padrão */}
      {isWarning && warningMessage && (
        <output
          className={cn(
            "flex items-start gap-2 rounded-lg border px-2.5 py-2 text-label-m leading-snug",
            "bg-amber-500/10 border-amber-500/35 text-amber-800 dark:bg-amber-500/10 dark:border-amber-400/35 dark:text-amber-200",
          )}
        >
          <AlertTriangle
            size={14}
            className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
          />
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-bold">
              {analysis.status === "too_low"
                ? t("tooLowTitle")
                : t("tooHighTitle")}
            </span>
            <span className="opacity-90">{warningMessage}</span>
          </div>
        </output>
      )}
    </div>
  );
}
