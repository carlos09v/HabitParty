"use client";

import { Loader2, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getFocusActivityDeletionSummary } from "@/actions/focusActions";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusActivityDeletionSummaryResponseDTO,
} from "@/types/focus";
import { cn, formatCoins } from "@/utils";
import { getCurrentLevel } from "@/utils/levels";

interface DeleteFocusActivityModalProps {
  activity: FocusActivity | null;
  isDeleting: boolean;
  deleteHistory: boolean;
  onDeleteHistoryChange: (checked: boolean) => void;
  onClose: () => void;
  onConfirm: (summary: FocusActivityDeletionSummaryResponseDTO | null) => void;
}

/**
 * Modal compartilhado de confirmação de exclusão de atividade de foco (/focus e /dashboard).
 * Exibe a prévia exata do XP e moedas acumulados pela atividade e reforça a trava não-negativa (>= 0).
 */
export function DeleteFocusActivityModal({
  activity,
  isDeleting,
  deleteHistory,
  onDeleteHistoryChange,
  onClose,
  onConfirm,
}: DeleteFocusActivityModalProps) {
  const t = useTranslations("focus.main.deleteModal");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const userTotalXp = useUserStore((s) => s.user?.totalXp ?? 0);
  const userCurrentCoins = useUserStore((s) => s.user?.currentCoins ?? 0);

  const [summary, setSummary] =
    useState<FocusActivityDeletionSummaryResponseDTO | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const activityId = activity?.id;

  useEffect(() => {
    if (!activityId) {
      setSummary(null);
      setIsLoadingSummary(false);
      return;
    }

    let cancelled = false;
    setSummary(null);
    setIsLoadingSummary(true);

    getFocusActivityDeletionSummary(activityId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setSummary(res.data);
        } else {
          setSummary({
            totalRecordsCount: 0,
            totalXpEarned: 0,
            totalCoinsEarned: 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummary({
            totalRecordsCount: 0,
            totalXpEarned: 0,
            totalCoinsEarned: 0,
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSummary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activityId]);

  if (!activity) return null;

  const totalXp = summary?.totalXpEarned ?? 0;
  const totalCoins = summary?.totalCoinsEarned ?? 0;
  const totalRecordsCount = summary?.totalRecordsCount ?? 0;

  const minXpForLevel = getCurrentLevel(userTotalXp).minXpRequired;
  const actualXpLoss = Math.min(
    totalXp,
    Math.max(0, userTotalXp - minXpForLevel),
  );
  const actualCoinsLoss = Math.min(totalCoins, Math.max(0, userCurrentCoins));

  const xpUnit = isGamified ? t("xpLabel") : t("xpProductivityLabel");
  const goldUnit = isGamified ? t("goldLabel") : t("goldProductivityLabel");

  return (
    <ConfirmationModal
      isOpen={Boolean(activity)}
      onClose={() => {
        if (!isDeleting) onClose();
      }}
      onConfirm={() => onConfirm(summary)}
      isLoading={isDeleting}
      title={t("title")}
      description={
        <div className="flex flex-col gap-3">
          <p>
            {t.rich("question", {
              name: activity.name,
              strong: (chunks) => (
                <strong className="text-neutral-100">{chunks}</strong>
              ),
            })}
          </p>

          {isLoadingSummary ? (
            <div className="flex items-center gap-2 rounded-xl border border-neutral-700/80 dark:border-primary/25 bg-surface/60 px-3 py-2.5 text-xs text-neutral-400">
              <Loader2 size={14} className="animate-spin shrink-0 text-gold" />
              <span>{t("summaryLoading")}</span>
            </div>
          ) : summary && totalRecordsCount > 0 ? (
            <div
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-3 text-xs transition-colors",
                deleteHistory
                  ? "border-rose-500/40 bg-rose-500/10 text-neutral-200"
                  : "border-neutral-700/80 dark:border-primary/25 bg-surface/60 text-neutral-300",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold flex items-center gap-1.5">
                  <Timer
                    size={13}
                    className={
                      deleteHistory
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-amber-800 dark:text-gold"
                    }
                  />
                  <span>
                    {deleteHistory
                      ? t("summaryRevertWarning")
                      : t("summaryPreserveNote")}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-surface dark:bg-black/25 border border-neutral-700/70 dark:border-white/10 font-medium text-neutral-200">
                  {t("summarySessions", { count: totalRecordsCount })}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md border font-bold",
                    deleteHistory
                      ? "bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300"
                      : "bg-primary/10 border-primary/25 text-primary dark:text-primary-light",
                  )}
                >
                  <Sparkles size={12} />
                  {deleteHistory ? `-${totalXp}` : `+${totalXp}`} {xpUnit}
                  {deleteHistory && actualXpLoss < totalXp
                    ? ` (-${actualXpLoss})`
                    : ""}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-md border font-bold",
                    deleteHistory
                      ? "bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300"
                      : "bg-amber-500/15 border-amber-500/35 text-amber-800 dark:text-gold",
                  )}
                >
                  <CoinIcon size={12} />
                  {deleteHistory ? "-" : "+"}
                  {formatCoins(totalCoins, { locale })} {goldUnit}
                  {deleteHistory && actualCoinsLoss < totalCoins
                    ? ` (-${formatCoins(actualCoinsLoss, { locale })})`
                    : ""}
                </span>
              </div>

              {deleteHistory && (
                <p className="text-[11px] leading-relaxed text-neutral-400 flex items-start gap-1.5 pt-0.5">
                  <ShieldCheck
                    size={13}
                    className="text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5"
                  />
                  <span>
                    {isGamified
                      ? t("nonNegativeFloorNote")
                      : t("nonNegativeFloorNoteProductivity")}
                  </span>
                </p>
              )}
            </div>
          ) : null}
        </div>
      }
      confirmText={t("confirm")}
      cancelText={t("cancel")}
      variant="danger"
      checkboxLabel={t("deleteHistoryLabel")}
      checkboxHint={
        isGamified ? t("deleteHistoryHint") : t("deleteHistoryHintProductivity")
      }
      checkboxChecked={deleteHistory}
      onCheckboxChange={onDeleteHistoryChange}
    />
  );
}
