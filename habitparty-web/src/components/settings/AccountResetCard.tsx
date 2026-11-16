"use client";

import { Eraser, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetUserAccountAction } from "@/actions/userActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useAvatarFrameStore } from "@/store/avatarFrameStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { ProfileCardBaseProps } from "@/types/settings";
import type { AccountResetScope } from "@/types/user";
import { cn } from "@/utils";

const STREAK_TRACKER_STORAGE_PREFIX = "habitparty_streak_tracker_";

export function AccountResetCard({ isCompact }: ProfileCardBaseProps) {
  const t = useTranslations("settings.accountReset");
  const router = useRouter();
  const [pendingScope, setPendingScope] = useState<AccountResetScope | null>(
    null,
  );
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirmReset = () => {
    if (!pendingScope) return;
    const scope = pendingScope;
    const shouldDeleteHistory = scope === "COMPLETE" ? true : deleteHistory;

    startTransition(async () => {
      const res = await resetUserAccountAction(scope, shouldDeleteHistory);
      if (!res.success) {
        toast.error(res.error || t("errorToast"));
        return;
      }
      if (!res.data) {
        toast.error(t("errorToast"));
        return;
      }

      const resetUser = res.data;
      const userStore = useUserStore.getState();
      userStore.setUser(resetUser);
      userStore.setLastStreakSecuredDate(null);
      userStore.resetAchievementSession();
      userStore.triggerAchievementCheck();

      try {
        if (resetUser.id) {
          localStorage.removeItem(
            `${STREAK_TRACKER_STORAGE_PREFIX}${resetUser.id}`,
          );
        }
      } catch {
        // Ignora ambientes sem acesso ao localStorage
      }

      if (scope === "COMPLETE") {
        useWorkspaceStore.setState({
          workspaces: [],
          activeWorkspaceId: null,
        });
        useFocusTimerStore.getState().resetTarget();
        useAvatarFrameStore.getState().setFrameId("none");
      }

      toast.success(
        scope === "COMPLETE"
          ? t("completeSuccessToast")
          : t("metricsSuccessToast"),
      );
      setPendingScope(null);
      setDeleteHistory(false);
      router.refresh();
    });
  };

  const isCompleteScope = pendingScope === "COMPLETE";

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Opção 1: Reset de Métricas e Gamificação */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.04] dark:border-amber-500/25 dark:bg-amber-950/15",
            isCompact ? "p-3.5" : "p-4",
          )}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-body font-bold text-neutral-50">
                {t("metricsTitle")}
              </h4>
              <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {t("metricsBadge")}
              </span>
            </div>
            <p className="text-body-s text-neutral-300 leading-relaxed">
              {t("metricsDesc")}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setDeleteHistory(false);
              setPendingScope("METRICS");
            }}
            className={cn(
              "w-full sm:w-auto justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-700 hover:bg-amber-600 hover:text-white dark:border-amber-500/45 dark:bg-amber-500/15 dark:text-amber-300 transition-colors font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shrink-0 flex items-center gap-2 shadow-xs",
              isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
            )}
          >
            <RotateCcw size={16} />
            {t("metricsButton")}
          </button>
        </div>

        {/* Opção 2: Reset Completo sem excluir a conta */}
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/25 bg-red-500/[0.04] dark:border-red-500/30 dark:bg-red-950/15",
            isCompact ? "p-3.5" : "p-4",
          )}
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-body font-bold text-neutral-50">
                {t("completeTitle")}
              </h4>
              <span className="inline-flex items-center rounded-md border border-red-500/30 bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">
                {t("completeBadge")}
              </span>
            </div>
            <p className="text-body-s text-neutral-300 leading-relaxed">
              {t("completeDesc")}
            </p>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setPendingScope("COMPLETE")}
            className={cn(
              "w-full sm:w-auto justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white dark:border-red-500/50 dark:bg-red-600/20 dark:text-red-300 transition-colors font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shrink-0 flex items-center gap-2 shadow-xs",
              isCompact ? "px-3.5 py-2 text-xs" : "px-4 py-2.5 text-sm",
            )}
          >
            <Eraser size={16} />
            {t("completeButton")}
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={pendingScope !== null}
        onClose={() => {
          if (!isPending) {
            setPendingScope(null);
            setDeleteHistory(false);
          }
        }}
        onConfirm={handleConfirmReset}
        title={
          isCompleteScope ? t("completeModalTitle") : t("metricsModalTitle")
        }
        description={
          isCompleteScope ? t("completeModalDesc") : t("metricsModalDesc")
        }
        confirmText={
          isCompleteScope ? t("completeModalConfirm") : t("metricsModalConfirm")
        }
        cancelText={t("modalCancel")}
        variant={isCompleteScope ? "danger" : "warning"}
        isLoading={isPending}
        checkboxLabel={isCompleteScope ? undefined : t("deleteHistoryLabel")}
        checkboxHint={isCompleteScope ? undefined : t("deleteHistoryHint")}
        checkboxChecked={isCompleteScope ? undefined : deleteHistory}
        onCheckboxChange={isCompleteScope ? undefined : setDeleteHistory}
      />
    </>
  );
}
