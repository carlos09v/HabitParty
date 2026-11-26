"use client";

import {
  AlertTriangle,
  Award,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Download,
  Flame,
  Hourglass,
  Lock,
  RotateCw,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getMyRetrospectiveAction,
  getPublicUserRetrospectiveAction,
} from "@/actions/socialActions";
import { ShowcaseTabPanelFallback } from "@/components/showcase/ShowcaseTabs";
import type { AppLocale } from "@/i18n/config";
import type { UserRetrospectiveData } from "@/types/social";
import { cn } from "@/utils/cn";
import { resolveRetrospectiveViewMeta } from "@/utils/showcaseUtils";

interface RetrospectivePanelProps {
  initialRetrospective: UserRetrospectiveData | null;
  isLoading?: boolean;
  loadError?: boolean;
  onRetry?: () => void;
  isGamified: boolean;
  isOwnProfile?: boolean;
  targetUsername?: string;
  onOpenExportModal?: (retro: UserRetrospectiveData) => void;
  onRetrospectiveChange?: (next: UserRetrospectiveData) => void;
}

export function RetrospectivePanel({
  initialRetrospective,
  isLoading = false,
  loadError = false,
  onRetry,
  isGamified,
  isOwnProfile = true,
  targetUsername,
  onOpenExportModal,
  onRetrospectiveChange,
}: RetrospectivePanelProps) {
  const locale = useLocale() as AppLocale;
  const format = useFormatter();
  const t = useTranslations("showcase.retrospective");
  const tError = useTranslations("showcase.errorState");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");

  const [retro, setRetro] = useState<UserRetrospectiveData | null>(
    initialRetrospective,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRetro(initialRetrospective);
  }, [initialRetrospective]);

  const handleSelectYear = (year: number) => {
    if (retro?.year === year) return;
    startTransition(async () => {
      const res = isOwnProfile
        ? await getMyRetrospectiveAction(year)
        : targetUsername
          ? await getPublicUserRetrospectiveAction(targetUsername, year)
          : { success: false as const, error: t("loadError") };

      if (!res.success) {
        toast.error(res.error || t("loadError"));
        return;
      }
      if (!res.data) {
        toast.error(t("loadError"));
        return;
      }
      setRetro(res.data);
      onRetrospectiveChange?.(res.data);
    });
  };

  if (isLoading) {
    return <ShowcaseTabPanelFallback />;
  }

  if (!retro) {
    if (isOwnProfile || loadError) {
      return (
        <section
          role="alert"
          className="rounded-2xl border border-red-500/35 bg-card dark:bg-surface/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-body-s text-neutral-300"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={18}
              className="text-red-700 dark:text-red-400 shrink-0"
              aria-hidden="true"
            />
            <span>{t("loadError")}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCw size={13} aria-hidden="true" />
              <span>{tError("retry")}</span>
            </button>
          )}
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 p-6 flex items-center gap-3 text-body-s text-neutral-300">
        <Lock
          size={18}
          className="text-neutral-400 shrink-0"
          aria-hidden="true"
        />
        <span>{t("publicUnavailable")}</span>
      </section>
    );
  }

  const availableYears =
    retro.availableYears.length > 0 ? retro.availableYears : [retro.year];

  const {
    focusHours,
    bestMonthName,
    archetypeTitle,
    archetypeDesc,
    rarestTitle,
    rarestRarityLabel,
  } = resolveRetrospectiveViewMeta(retro, locale, isGamified, {
    tRetro: t,
    tCatalog,
    tRarities,
  });

  return (
    <section className="flex flex-col gap-5">
      {/* Header & Year Selector */}
      <div className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/55 p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-50">
                {isGamified
                  ? t("titleGamified", { year: retro.year })
                  : t("titleEssential", { year: retro.year })}
              </h2>
              {retro.inSeasonalWindow && retro.eligible && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/40 text-[11px] font-extrabold text-amber-800 dark:text-gold">
                  <Sparkles size={11} aria-hidden="true" />
                  <span>{t("seasonalBadge")}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {t("subtitle", { timezone: retro.timezone })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableYears.length > 1 && (
              <fieldset className="inline-flex items-center gap-1 p-1 rounded-xl border border-neutral-700 dark:border-primary/25 bg-surface/70 m-0">
                <legend className="sr-only">{t("yearLabel")}</legend>
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    aria-pressed={yr === retro.year}
                    disabled={isPending}
                    onClick={() => handleSelectYear(yr)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                      yr === retro.year
                        ? "bg-gold text-on-gold shadow-xs"
                        : "text-neutral-300 hover:text-neutral-50",
                    )}
                  >
                    {yr}
                  </button>
                ))}
              </fieldset>
            )}

            {isOwnProfile && retro.eligible && onOpenExportModal && (
              <button
                type="button"
                onClick={() => onOpenExportModal(retro)}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <Download size={14} aria-hidden="true" />
                <span>{t("downloadBanner", { year: retro.year })}</span>
              </button>
            )}
          </div>
        </div>

        {/* Eligible vs Gate Progress */}
        {!retro.eligible ? (
          <div className="rounded-xl border border-dashed border-neutral-700 dark:border-primary/30 bg-surface/45 p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-body-m font-bold text-neutral-100">
                {t("ineligibleTitle", { year: retro.year })}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {t("ineligibleDesc", {
                  required: retro.criteriaRequired,
                  total: 3,
                })}
              </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  met: retro.activeDays >= retro.minActiveDaysRequired,
                  label: t("gateDays", {
                    current: format.number(retro.activeDays),
                    required: format.number(retro.minActiveDaysRequired),
                  }),
                },
                {
                  met: retro.tasksCompleted >= retro.minTasksRequired,
                  label: t("gateTasks", {
                    current: format.number(retro.tasksCompleted),
                    required: format.number(retro.minTasksRequired),
                  }),
                },
                {
                  met: retro.focusMinutes >= retro.minFocusMinutesRequired,
                  label: t("gateFocus", {
                    current: format.number(retro.focusMinutes),
                    required: format.number(retro.minFocusMinutesRequired),
                  }),
                },
              ].map((gate) => (
                <li
                  key={gate.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold",
                    gate.met
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-neutral-700 bg-background/40 text-neutral-300",
                  )}
                >
                  {gate.met ? (
                    <CheckCircle2
                      size={15}
                      className="shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleDashed
                      size={15}
                      className="shrink-0 text-neutral-500"
                      aria-hidden="true"
                    />
                  )}
                  <span>{gate.label}</span>
                </li>
              ))}
            </ul>

            <p className="text-[11px] text-neutral-400">{t("windowNote")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Archetype Hero Strip */}
            <div className="rounded-xl border border-amber-500/35 dark:border-gold/35 bg-gradient-to-br from-amber-500/10 via-primary/10 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/45 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
                  <Sparkles size={22} aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-gold block">
                    {t("archetypeLabel")}
                  </span>
                  <h3 className="text-lg font-black text-neutral-50">
                    {archetypeTitle}
                  </h3>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {archetypeDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* 6 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
                  <CalendarDays size={18} aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t("metrics.activeDays")}
                  </span>
                  <p className="text-xl font-black text-neutral-50 tabular-nums">
                    {format.number(retro.activeDays)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {t("metrics.activeDaysSub")}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-700 dark:text-sky-300 shrink-0">
                  <Swords size={18} aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t("metrics.tasksCompleted")}
                  </span>
                  <p className="text-xl font-black text-neutral-50 tabular-nums">
                    {format.number(retro.tasksCompleted)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {t("metrics.hardTasks", {
                      count: format.number(retro.hardTasksCompleted),
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary dark:text-primary-light shrink-0">
                  <Hourglass size={18} aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t("metrics.focusHours")}
                  </span>
                  <p className="text-xl font-black text-neutral-50 tabular-nums">
                    {format.number(focusHours)}h
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {t("metrics.focusSessions", {
                      sessions: format.number(retro.focusSessionsCount),
                      pomodoros: format.number(retro.pomodorosCompleted),
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/35 flex items-center justify-center text-amber-800 dark:text-gold shrink-0">
                  <Zap size={18} aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {isGamified
                      ? t("metrics.xpEarned")
                      : t("metrics.xpEarnedEssential")}
                  </span>
                  <p className="text-xl font-black text-neutral-50 tabular-nums">
                    {format.number(retro.xpEarned)}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {isGamified
                      ? t("metrics.coinsEarned", {
                          coins: format.number(retro.coinsEarned),
                        })
                      : t("metrics.creditsEarned", {
                          credits: format.number(retro.coinsEarned),
                        })}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-700 dark:text-orange-300 shrink-0">
                  <Flame size={18} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t("metrics.bestMonth")}
                  </span>
                  <p className="text-xl font-black text-neutral-50 capitalize truncate">
                    {bestMonthName || t("noBestMonth")}
                  </p>
                  {bestMonthName && (
                    <p className="text-[11px] text-neutral-400">
                      {t("metrics.bestMonthSub", {
                        count: format.number(retro.bestMonthTasksCount),
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-neutral-700 dark:border-primary/20 bg-surface/50 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-magenta/15 border border-magenta/30 flex items-center justify-center text-magenta dark:text-fuchsia-300 shrink-0">
                  {rarestTitle ? (
                    <Trophy size={18} aria-hidden="true" />
                  ) : (
                    <Award size={18} aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    {t("metrics.rarestTitle")}
                  </span>
                  <p className="text-sm font-black text-neutral-50 truncate mt-0.5">
                    {rarestTitle || t("noRarestYet", { year: retro.year })}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {format.number(retro.achievementsUnlockedCount)}{" "}
                    {t("metrics.achievementsSub")}
                    {rarestRarityLabel ? ` • ${rarestRarityLabel}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400">{t("windowNote")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
