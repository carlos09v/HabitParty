import { Check, Loader2, Pencil, Target, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

const DAILY_GOAL_QUICK_PRESETS = [30, 60, 90, 120, 180] as const;
const MIN_DAILY_GOAL_MINUTES = 15;
const MAX_DAILY_GOAL_MINUTES = 720;

interface FocusDailyGoalEditorProps {
  todayMinutesForGoal: number;
  dailyFocusGoalMinutes?: number | null;
  isFilteredByActivity?: boolean;
}

/**
 * Editor inline e barra de progresso da meta diária global de foco.
 * Garante alvos ≥ 28px/36px, Enter seguro para IME, `try/catch` no save e restauração de foco.
 */
export function FocusDailyGoalEditor({
  todayMinutesForGoal,
  dailyFocusGoalMinutes,
  isFilteredByActivity = false,
}: FocusDailyGoalEditorProps) {
  const t = useTranslations("focus.metrics");
  const hasHydratedUser = useUserStore((s) => s.user !== null);
  const storeDailyGoalMinutes = useUserStore(
    (s) => s.user?.dailyFocusGoalMinutes,
  );
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("60");
  const [isSavingGoal, startSavingGoal] = useTransition();
  const goalInputRef = useRef<HTMLInputElement>(null);
  const editTriggerRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (isEditingGoal) {
      goalInputRef.current?.focus();
    } else if (shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      editTriggerRef.current?.focus();
    }
  }, [isEditingGoal]);

  const resolvedDailyGoalMinutes = hasHydratedUser
    ? (storeDailyGoalMinutes ?? null)
    : (dailyFocusGoalMinutes ?? null);
  const hasDailyGoal =
    typeof resolvedDailyGoalMinutes === "number" &&
    resolvedDailyGoalMinutes > 0;
  const dailyGoalPercent = hasDailyGoal
    ? Math.min(
        100,
        Math.round((todayMinutesForGoal / resolvedDailyGoalMinutes) * 100),
      )
    : 0;
  const isDailyGoalReached =
    hasDailyGoal && todayMinutesForGoal >= resolvedDailyGoalMinutes;

  const openGoalEditor = () => {
    setGoalDraft(String(resolvedDailyGoalMinutes || 60));
    setIsEditingGoal(true);
  };

  const closeGoalEditor = (restoreFocus: boolean) => {
    shouldRestoreFocusRef.current = restoreFocus;
    setIsEditingGoal(false);
  };

  const handleSaveDailyGoal = () => {
    const parsed = Number.parseInt(goalDraft, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(
      MAX_DAILY_GOAL_MINUTES,
      Math.max(MIN_DAILY_GOAL_MINUTES, parsed),
    );
    startSavingGoal(async () => {
      try {
        const res = await updateUserProfileAction({
          dailyFocusGoalMinutes: clamped,
        });
        if (res.success) {
          useUserStore
            .getState()
            .updateUserPartial({ dailyFocusGoalMinutes: clamped });
          toast.success(
            t("dailyGoalSavedToast", { goal: formatFocusMinutes(clamped) }),
          );
          closeGoalEditor(true);
        } else {
          toast.error(res.error || t("dailyGoalSaveError"));
        }
      } catch {
        toast.error(t("dailyGoalSaveError"));
      }
    });
  };

  return (
    <div className="pt-2 border-t border-neutral-700/60 dark:border-white/10 flex flex-col gap-1.5">
      {isEditingGoal ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-gold">
              <Target size={11} aria-hidden="true" />
              {t("dailyGoalEditLabel")}
            </span>
            <div className="flex items-center gap-1">
              <input
                ref={goalInputRef}
                type="number"
                min={MIN_DAILY_GOAL_MINUTES}
                max={MAX_DAILY_GOAL_MINUTES}
                step={15}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (e.nativeEvent.isComposing || e.keyCode === 229) {
                      return;
                    }
                    handleSaveDailyGoal();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    closeGoalEditor(true);
                  }
                }}
                disabled={isSavingGoal}
                aria-label={t("dailyGoalInputAria")}
                className="w-14 min-h-7 px-1.5 py-0.5 rounded-md border border-gold/60 bg-surface text-xs font-bold text-neutral-100 text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[11px] text-neutral-400">m</span>
              <button
                type="button"
                disabled={isSavingGoal}
                onClick={handleSaveDailyGoal}
                aria-label={t("dailyGoalSaveAria")}
                className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-md bg-gold text-on-gold hover:bg-gold-hover disabled:opacity-50 flex items-center justify-center cursor-pointer transition-colors"
              >
                {isSavingGoal ? (
                  <Loader2
                    size={12}
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : (
                  <Check size={12} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                disabled={isSavingGoal}
                onClick={() => closeGoalEditor(true)}
                aria-label={t("dailyGoalCancelAria")}
                className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {DAILY_GOAL_QUICK_PRESETS.map((mins) => (
              <button
                key={mins}
                type="button"
                disabled={isSavingGoal}
                onClick={() => setGoalDraft(String(mins))}
                className={cn(
                  "min-h-6 pointer-coarse:min-h-8 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer",
                  goalDraft === String(mins)
                    ? "border-gold bg-gold/20 text-amber-800 dark:text-gold"
                    : "border-neutral-700 bg-surface/60 text-neutral-400 hover:text-neutral-100",
                )}
              >
                {formatFocusMinutes(mins)}
              </button>
            ))}
          </div>
        </div>
      ) : hasDailyGoal && resolvedDailyGoalMinutes ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold leading-none",
                  isDailyGoalReached
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-gold",
                )}
              >
                <Target size={11} className="shrink-0" aria-hidden="true" />
                <span>
                  {isDailyGoalReached
                    ? t("dailyGoalReachedLabel")
                    : t("dailyGoalLabel")}
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
              <button
                ref={editTriggerRef}
                type="button"
                onClick={openGoalEditor}
                aria-label={t("dailyGoalEditButtonAria")}
                title={t("dailyGoalEditButtonAria")}
                className="min-w-6 min-h-6 pointer-coarse:min-w-9 pointer-coarse:min-h-9 rounded flex items-center justify-center text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-amber-500/10 dark:hover:bg-gold/10 transition-colors cursor-pointer shrink-0"
              >
                <Pencil size={11} aria-hidden="true" />
              </button>
            </div>
            <span className="text-[11px] font-semibold text-neutral-300 tabular-nums shrink-0">
              {`${formatFocusMinutes(todayMinutesForGoal)} / ${formatFocusMinutes(resolvedDailyGoalMinutes)} (${dailyGoalPercent}%)`}
            </span>
          </div>
          <ProgressBar
            percent={dailyGoalPercent}
            className="h-1.5 bg-neutral-800/80 dark:bg-white/10"
            fillClassName={cn(
              "transition-transform duration-300",
              isDailyGoalReached ? "bg-emerald-500" : "bg-gold",
            )}
            ariaValueNow={todayMinutesForGoal}
            ariaValueMin={0}
            ariaValueMax={resolvedDailyGoalMinutes}
            ariaLabel={t("dailyGoalProgressAria", {
              percent: dailyGoalPercent,
            })}
          />
        </>
      ) : (
        <button
          ref={editTriggerRef}
          type="button"
          onClick={openGoalEditor}
          className="flex items-center justify-between gap-2 min-h-7 text-xs font-semibold text-neutral-400 hover:text-amber-700 dark:hover:text-gold transition-colors cursor-pointer group"
        >
          <span className="inline-flex items-center gap-1.5">
            <Target
              size={12}
              aria-hidden="true"
              className="text-amber-700 dark:text-gold"
            />
            <span>{t("dailyGoalSetCta")}</span>
          </span>
          <Pencil
            size={11}
            aria-hidden="true"
            className="opacity-70 group-hover:opacity-100"
          />
        </button>
      )}
    </div>
  );
}
