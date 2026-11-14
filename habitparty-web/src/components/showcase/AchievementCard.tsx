"use client";

import { CheckCircle2, Lock, Pin, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { RARITY_THEMES } from "@/constants/achievements";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { AchievementItemResponseDTO } from "@/types/showcase";
import { cn, formatShortDate, resolveAchievementCopy } from "@/utils";

interface AchievementCardProps {
  achievement: AchievementItemResponseDTO;
  isPinnedInShowcase: boolean;
  isVisitorMode: boolean;
  onPinToShowcase: (achievement: AchievementItemResponseDTO) => void;
  isCompact?: boolean;
}

export function AchievementCard({
  achievement,
  isPinnedInShowcase,
  isVisitorMode,
  onPinToShowcase,
  isCompact = false,
}: AchievementCardProps) {
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const t = useTranslations("showcase.gallery");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const { isGamified } = useExperienceMode();

  const isSecretLocked = achievement.isSecret && !achievement.unlocked;
  const theme = RARITY_THEMES[achievement.rarity] || RARITY_THEMES.COMMON;

  const resolvedCopy = resolveAchievementCopy(
    achievement,
    isGamified,
    tCatalog,
  );
  const title = isSecretLocked ? t("secretTitle") : resolvedCopy.title;
  const description = isSecretLocked
    ? t("secretDescription")
    : resolvedCopy.description;

  const formattedUnlockDate = achievement.unlockedAt
    ? formatShortDate(achievement.unlockedAt, {
        includeYear: true,
        monthFormat: "short",
        locale,
        dateFormat,
        timeZone: userTimeZone,
      })
    : null;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border flex flex-col justify-between gap-3.5 transition-colors",
        isCompact ? "p-4" : "p-5",
        achievement.unlocked
          ? cn("bg-card dark:bg-surface/60", theme.cardBorder, theme.cardGlow)
          : "border-neutral-700 bg-surface/55 dark:border-primary/15 dark:bg-surface/15 opacity-80 hover:opacity-100 dark:opacity-75 dark:hover:opacity-95",
      )}
    >
      {achievement.unlocked && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20 dark:opacity-50",
            theme.accentGradient,
          )}
        />
      )}

      {/* TOP ROW: ICON + RARITY + POINTS */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform",
            achievement.unlocked
              ? cn(theme.iconBg, theme.iconText)
              : "bg-surface/80 border-neutral-700 dark:bg-surface/60 dark:border-primary/20 text-neutral-400",
          )}
        >
          <AchievementIcon
            iconKey={achievement.iconName}
            size={24}
            isSecretLocked={isSecretLocked}
          />
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                theme.badgeBg,
                theme.badgeText,
                theme.badgeBorder,
              )}
            >
              {tRarities(achievement.rarity)}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gold/15 text-amber-700 dark:text-gold border border-gold/35">
              <Trophy size={10} />
              {t("pointsBadge", { points: achievement.points })}
            </span>
          </div>

          {achievement.unlocked ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              <span>{t("unlockedBadge")}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400">
              <Lock size={11} />
              <span>{t("lockedBadge")}</span>
            </span>
          )}
        </div>
      </div>

      {/* MIDDLE: TITLE + DESCRIPTION */}
      <div className="relative z-10 flex-1">
        <h3
          className={cn(
            "text-body-m font-extrabold",
            achievement.unlocked ? "text-neutral-50" : "text-neutral-200",
          )}
        >
          {title}
        </h3>
        <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {/* BOTTOM: PROGRESS BAR OR UNLOCK DATE + PIN BUTTON */}
      <div className="relative z-10 pt-2 border-t border-neutral-700 dark:border-primary/15 flex flex-col gap-2">
        {!isSecretLocked && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-neutral-300 tabular-nums">
                {t("progressLabel", {
                  current: achievement.currentValue,
                  target: achievement.targetValue,
                })}
              </span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  achievement.unlocked
                    ? "text-amber-700 dark:text-gold"
                    : "text-neutral-400",
                )}
              >
                {achievement.progressPercent}%
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-neutral-700 dark:bg-neutral-900 overflow-hidden border border-neutral-600/40 dark:border-primary/15">
              <div
                className={cn(
                  "h-full w-full origin-left transition-transform duration-500",
                  achievement.unlocked ? theme.progressFill : "bg-primary",
                )}
                style={{
                  transform: `scaleX(${Math.min(100, Math.max(0, achievement.progressPercent)) / 100})`,
                }}
              />
            </div>
          </div>
        )}

        {achievement.unlocked && (
          <div className="flex items-center justify-between gap-2 pt-1">
            {formattedUnlockDate ? (
              <span className="text-[11px] text-neutral-400">
                {t("unlockedOn", { date: formattedUnlockDate })}
              </span>
            ) : (
              <span />
            )}

            {!isVisitorMode && (
              <button
                type="button"
                onClick={() => onPinToShowcase(achievement)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer",
                  isPinnedInShowcase
                    ? "bg-gold/20 border-gold text-amber-700 dark:text-gold"
                    : "bg-surface/70 border-neutral-700 text-neutral-200 hover:border-gold/50 hover:text-amber-700 dark:border-primary/25 dark:text-neutral-300 dark:hover:text-gold",
                )}
              >
                <Pin size={11} />
                <span>
                  {isPinnedInShowcase
                    ? t("pinnedInShowcase")
                    : t("pinToShowcase")}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
