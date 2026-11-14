"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteFocusActivity } from "@/actions/focusActions";
import type { ActivityPeriodOption } from "@/constants/dashboard";
import {
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_FOCUS_ACTIVITIES_PREMIUM,
} from "@/constants/focus";
import { useUserStore } from "@/store/userStore";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import { calculateActivityDurationMap } from "@/utils/focusMetrics";

export function useActivitiesWidget(
  activities: FocusActivity[],
  records: FocusRecord[],
) {
  const t = useTranslations("dashboard.sidebarRight.activitiesWidget");
  const [period, setPeriod] = useState<ActivityPeriodOption>("today");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const isPremium = useUserStore((s) => s.is_Premium);
  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const [activitiesList, setActivitiesList] =
    useState<FocusActivity[]>(activities);

  useEffect(() => {
    setActivitiesList(activities);
  }, [activities]);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    activity: FocusActivity | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    activity: null,
  });

  const [activityToEdit, setActivityToEdit] = useState<FocusActivity | null>(
    null,
  );
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] =
    useState<FocusActivity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const maxActivities = isPremium
    ? MAX_FOCUS_ACTIVITIES_PREMIUM
    : MAX_FOCUS_ACTIVITIES_FREE;
  const isLimitReached = activitiesList.length >= maxActivities;
  const activeActivities = activitiesList.slice(0, maxActivities);
  const blockedActivitiesCount = !isPremium
    ? Math.max(0, activitiesList.length - maxActivities)
    : 0;

  const activityTimeMap = useMemo(
    () =>
      calculateActivityDurationMap(
        records,
        period,
        undefined,
        new Date(),
        userTimeZone,
      ),
    [records, period, userTimeZone],
  );

  const handleOpenCreateModal = () => {
    setActivityToEdit(null);
    setIsActivityModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, act: FocusActivity) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      activity: act,
    });
  };

  const handleMenuButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    act: FocusActivity,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const isSameOpen =
      contextMenu.isOpen && contextMenu.activity?.id === act.id;
    if (isSameOpen) {
      setContextMenu((prev) => ({ ...prev, isOpen: false, activity: null }));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom + 4 },
      activity: act,
    });
  };

  const handleConfirmDelete = async () => {
    if (!activityToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteFocusActivity(activityToDelete.id, false);
      if (!res.success) {
        toast.error(res.error || t("deleteError"));
        return;
      }
      toast.success(t("deleteSuccess", { name: activityToDelete.name }));
      setActivitiesList((prev) =>
        prev.filter((a) => a.id !== activityToDelete.id),
      );
      setActivityToDelete(null);
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
    contextMenu,
    setContextMenu,
    activityToEdit,
    setActivityToEdit,
    isActivityModalOpen,
    setIsActivityModalOpen,
    activityToDelete,
    setActivityToDelete,
    isDeleting,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    handleOpenCreateModal,
    handleContextMenu,
    handleMenuButtonClick,
    handleConfirmDelete,
    handleActivitySaved,
  };
}
