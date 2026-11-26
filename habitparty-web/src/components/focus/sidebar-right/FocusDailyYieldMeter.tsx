import { Info, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { cn } from "@/utils";
import {
  DAILY_YIELD_TIER_STYLES,
  type DailyFocusYieldInfo,
} from "@/utils/focusDailyYield";
import { formatFocusMinutes } from "@/utils/focusFormatters";

function computeSegmentFill(
  loggedMinutes: number,
  startMinutes: number,
  endMinutes: number,
): number {
  const span = Math.max(1, endMinutes - startMinutes);
  return Math.min(
    100,
    Math.max(0, Math.round(((loggedMinutes - startMinutes) / span) * 100)),
  );
}

interface FocusDailyYieldMeterProps {
  yieldInfo: DailyFocusYieldInfo;
  isGamified: boolean;
  isFilteredByActivity?: boolean;
}

/**
 * Medidor visual do rendimento diário de foco (4h / 6h / 8h) com barras compostas na GPU (`scaleX`).
 */
export function FocusDailyYieldMeter({
  yieldInfo,
  isGamified,
  isFilteredByActivity = false,
}: FocusDailyYieldMeterProps) {
  const t = useTranslations("focus.metrics");

  const seg1Fill = computeSegmentFill(
    yieldInfo.loggedMinutesToday,
    0,
    yieldInfo.tier1CapMinutes,
  );
  const seg2Fill = computeSegmentFill(
    yieldInfo.loggedMinutesToday,
    yieldInfo.tier1CapMinutes,
    yieldInfo.tier2CapMinutes,
  );
  const seg3Fill = computeSegmentFill(
    yieldInfo.loggedMinutesToday,
    yieldInfo.tier2CapMinutes,
    yieldInfo.hardCapMinutes,
  );

  return (
    <div className="pt-2 border-t border-neutral-700/60 dark:border-white/10 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold leading-none",
              DAILY_YIELD_TIER_STYLES[yieldInfo.tierPercent],
            )}
          >
            <Zap size={11} className="shrink-0" aria-hidden="true" />
            <span>
              {yieldInfo.tierPercent === 0
                ? isGamified
                  ? t("dailyYieldCappedLabel")
                  : t("dailyYieldCappedLabelProductivity")
                : isGamified
                  ? t("dailyYieldRateLabel", {
                      percent: yieldInfo.tierPercent,
                    })
                  : t("dailyYieldRateLabelProductivity", {
                      percent: yieldInfo.tierPercent,
                    })}
            </span>
          </span>
          {isFilteredByActivity && (
            <span
              title={t("globalScopeTitle")}
              className="px-1.5 py-px rounded text-[10px] font-semibold bg-surface/80 border border-neutral-700/80 dark:border-white/10 text-neutral-400 shrink-0"
            >
              {t("globalScopeBadge")}
            </span>
          )}
          <InfoTooltip
            title={
              isGamified
                ? t("dailyYieldTooltipTitle")
                : t("dailyYieldTooltipTitleProductivity")
            }
            icon={
              <Info
                size={12}
                className="text-neutral-400 hover:text-gold shrink-0"
              />
            }
            size={12}
            align="left"
            side="top"
            ariaLabel={
              isGamified
                ? t("dailyYieldTooltipAria")
                : t("dailyYieldTooltipAriaProductivity")
            }
          >
            <p className="text-label-g text-neutral-300 leading-relaxed">
              {isGamified
                ? t("dailyYieldTooltipIntro")
                : t("dailyYieldTooltipIntroProductivity")}
            </p>
            <ul className="flex flex-col gap-0.5 text-label-g text-neutral-200 py-0.5 tabular-nums">
              <li>
                •{" "}
                {isGamified
                  ? t("dailyYieldTier100")
                  : t("dailyYieldTier100Productivity")}
              </li>
              <li>
                •{" "}
                {isGamified
                  ? t("dailyYieldTier50")
                  : t("dailyYieldTier50Productivity")}
              </li>
              <li>
                •{" "}
                {isGamified
                  ? t("dailyYieldTier25")
                  : t("dailyYieldTier25Productivity")}
              </li>
              <li>
                •{" "}
                {isGamified
                  ? t("dailyYieldTier0")
                  : t("dailyYieldTier0Productivity")}
              </li>
            </ul>
            <p className="text-tiny text-neutral-400">
              {yieldInfo.tierPercent === 0
                ? isGamified
                  ? t("dailyYieldZeroReachedHint")
                  : t("dailyYieldZeroReachedHintProductivity")
                : t(
                    isGamified
                      ? "dailyYieldRemainingHint"
                      : "dailyYieldRemainingHintProductivity",
                    {
                      remaining: formatFocusMinutes(
                        yieldInfo.currentTierMinutesRemaining,
                      ),
                      untilCap: formatFocusMinutes(yieldInfo.minutesUntilZero),
                    },
                  )}
            </p>
          </InfoTooltip>
        </div>
        <span className="text-[11px] font-semibold text-neutral-400 tabular-nums shrink-0">
          {formatFocusMinutes(yieldInfo.loggedMinutesToday)} /{" "}
          {formatFocusMinutes(yieldInfo.hardCapMinutes)}
        </span>
      </div>

      {/* Barras animadas via GPU transform: scaleX(...) sem reflow */}
      <div
        className="flex items-center gap-0.5 h-1.5 w-full"
        aria-hidden="true"
      >
        <div className="flex-[2] h-full rounded-l-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
          <div
            className="w-full h-full bg-emerald-500/85 origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${seg1Fill / 100})` }}
          />
        </div>
        <div className="flex-1 h-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
          <div
            className="w-full h-full bg-amber-500/85 origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${seg2Fill / 100})` }}
          />
        </div>
        <div className="flex-1 h-full rounded-r-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
          <div
            className="w-full h-full bg-orange-500/85 origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${seg3Fill / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}
