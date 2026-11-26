"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteFocusActivity } from "@/actions/focusActions";
import {
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_FOCUS_ACTIVITIES_PREMIUM,
} from "@/constants/focusRules";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import {
  type QuickFocusTargetAdapter,
  useQuickFocusTarget,
} from "@/hooks/useQuickFocusTask";
import { useDashboardFilterStore } from "@/store/dashboardFilterStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { DashboardFocusRecordSummary } from "@/types/dashboard";
import type {
  FocusActivity,
  FocusActivityDeletionSummaryResponseDTO,
} from "@/types/focus";
import { calculateActivityDurationMap } from "@/utils/focusMetrics";
import { deductUserPenalty } from "@/utils/gamification";

const ACTIVITY_FOCUS_ADAPTER: QuickFocusTargetAdapter<FocusActivity> = {
  isSameTarget: (store, activity) =>
    store.target?.type === "activity" && store.target.id === activity.id,
  startTarget: (store, activity) => store.startFocusActivity(activity),
  transferTarget: (store, activity) => store.transferTarget(activity),
};

export function useActivitiesWidget(
  activities: FocusActivity[],
  records: DashboardFocusRecordSummary[],
  initialIsPremium = false,
  initialTimeZone?: string | null,
) {
  const t = useTranslations("dashboard.sidebarRight.activitiesWidget");
  const period = useDashboardFilterStore((s) => s.activityPeriod);
  const setPeriod = useDashboardFilterStore((s) => s.setActivityPeriod);
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);
  const hasStoreUser = useUserStore((s) => Boolean(s.user));
  const storeIsPremium = useUserStore((s) => s.is_Premium);
  const storeTimeZone = useUserStore((s) => s.user?.timezone);
  const isPremium = hasStoreUser ? storeIsPremium : initialIsPremium;
  const userTimeZone = storeTimeZone ?? initialTimeZone;
  const todayIso = useMidnightRollover(userTimeZone);

  const [activitiesList, setActivitiesList] =
    useState<FocusActivity[]>(activities);

  useEffect(() => {
    setActivitiesList(activities);
  }, [activities]);

  const {
    contextMenu: rawContextMenu,
    openContextMenu: handleContextMenu,
    toggleFromButton,
    closeContextMenu,
  } = useContextMenu<FocusActivity>();

  const [activityToEdit, setActivityToEdit] = useState<FocusActivity | null>(
    null,
  );
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] =
    useState<FocusActivity | null>(null);
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Play/Pause com proteção para sessão de foco já em andamento
  const {
    pendingTarget: pendingFocusActivity,
    currentFocusTarget,
    clearPendingTarget: clearPendingFocusActivity,
    handleStartTarget: handleStartActivityFocus,
    handleTransferTarget: handleTransferToPendingActivity,
    handleSaveAndStartTarget: handleSaveAndStartPendingActivity,
    handleDiscardAndStartTarget: handleDiscardAndStartPendingActivity,
  } = useQuickFocusTarget(ACTIVITY_FOCUS_ADAPTER);

  const openDeleteActivityModal = (activity: FocusActivity | null) => {
    setDeleteHistory(false);
    setActivityToDelete(activity);
  };

  const maxActivities = isPremium
    ? MAX_FOCUS_ACTIVITIES_PREMIUM
    : MAX_FOCUS_ACTIVITIES_FREE;
  const isLimitReached = activitiesList.length >= maxActivities;
  const activeActivities = activitiesList.slice(0, maxActivities);
  const blockedActivitiesCount = !isPremium
    ? Math.max(0, activitiesList.length - maxActivities)
    : 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: recalcula janela "Hoje" ao virar a meia-noite
  const activityTimeMap = useMemo(
    () =>
      calculateActivityDurationMap(
        records,
        period,
        undefined,
        new Date(),
        userTimeZone,
      ),
    [records, period, userTimeZone, todayIso],
  );

  const totalPeriodMinutes = useMemo(() => {
    let total = 0;
    for (const act of activeActivities) {
      total += activityTimeMap[act.id] || 0;
    }
    return total;
  }, [activeActivities, activityTimeMap]);

  const handleOpenCreateModal = () => {
    setActivityToEdit(null);
    setIsActivityModalOpen(true);
  };

  const handleMenuButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, act: FocusActivity) => {
      toggleFromButton(e, act, (current, next) => current?.id === next.id);
    },
    [toggleFromButton],
  );

  const handleConfirmDelete = async (
    summary?: FocusActivityDeletionSummaryResponseDTO | null,
  ) => {
    if (!activityToDelete) return;
    const targetActivity = activityToDelete;
    const shouldDeleteHistory = deleteHistory;
    setIsDeleting(true);
    try {
      const res = await deleteFocusActivity(
        targetActivity.id,
        shouldDeleteHistory,
      );
      if (!res.success) {
        toast.error(res.error || t("deleteError"));
        return;
      }
      if (
        shouldDeleteHistory &&
        summary &&
        (summary.totalXpEarned > 0 || summary.totalCoinsEarned > 0)
      ) {
        deductUserPenalty(summary.totalXpEarned, summary.totalCoinsEarned);
      }
      const timerStore = useFocusTimerStore.getState();
      if (timerStore.target?.id === targetActivity.id) {
        timerStore.resetTarget();
      }
      toast.success(t("deleteSuccess", { name: targetActivity.name }));
      setActivitiesList((prev) =>
        prev.filter((a) => a.id !== targetActivity.id),
      );
      setActivityToDelete(null);
      setDeleteHistory(false);
    } catch {
      toast.error(t("deleteUnexpectedError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivitySaved = (
    savedActivity?: FocusActivity,
    isEditing?: boolean,
  ) => {
    if (savedActivity) {
      if (isEditing) {
        setActivitiesList((prev) =>
          prev.map((a) => (a.id === savedActivity.id ? savedActivity : a)),
        );
      } else {
        setActivitiesList((prev) => [...prev, savedActivity]);
      }
    }
    setIsActivityModalOpen(false);
    setActivityToEdit(null);
  };

  return {
    period,
    setPeriod,
    isPremium,
    maxActivities,
    isLimitReached,
    activeActivities,
    blockedActivitiesCount,
    activityTimeMap,
    totalPeriodMinutes,
    contextMenu: {
      isOpen: rawContextMenu.isOpen,
      position: rawContextMenu.position,
      activity: rawContextMenu.data,
    },
    closeContextMenu,
    activityToEdit,
    setActivityToEdit,
    isActivityModalOpen,
    setIsActivityModalOpen,
    activityToDelete,
    setActivityToDelete: openDeleteActivityModal,
    deleteHistory,
    setDeleteHistory,
    isDeleting,
    openUpgradeModal,
    handleOpenCreateModal,
    handleContextMenu,
    handleMenuButtonClick,
    handleConfirmDelete,
    handleActivitySaved,
    pendingFocusActivity,
    currentFocusTarget,
    clearPendingFocusActivity,
    handleStartActivityFocus,
    handleTransferToPendingActivity,
    handleSaveAndStartPendingActivity,
    handleDiscardAndStartPendingActivity,
  };
}
