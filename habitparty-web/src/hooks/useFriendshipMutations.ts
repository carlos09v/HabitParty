"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  blockUserAction,
  removeFriendshipAction,
  respondFriendRequestAction,
  sendFriendRequestAction,
} from "@/actions/socialActions";

interface UseFriendshipMutationsOptions {
  onMutated?: () => Promise<void> | void;
}

export function useFriendshipMutations(
  options: UseFriendshipMutationsOptions = {},
) {
  const tFriends = useTranslations("showcase.friends");
  const [pendingTargetIds, setPendingTargetIds] = useState<Set<string>>(
    () => new Set(),
  );
  const pendingRef = useRef<Set<string>>(new Set());

  const notifySidebarNotificationsChanged = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("habitparty:notifications-changed"));
    }
  };

  const runMutation = async (targetId: string, fn: () => Promise<void>) => {
    if (pendingRef.current.has(targetId)) return;
    pendingRef.current.add(targetId);
    setPendingTargetIds(new Set(pendingRef.current));
    try {
      await fn();
    } finally {
      pendingRef.current.delete(targetId);
      setPendingTargetIds(new Set(pendingRef.current));
    }
  };

  const isTargetPending = useCallback(
    (targetId?: string | null): boolean =>
      Boolean(targetId && pendingTargetIds.has(targetId)),
    [pendingTargetIds],
  );

  const sendFriendRequest = (
    payload: { username?: string; friendCode?: string },
    targetUsername: string,
    targetKey?: string,
  ) => {
    void runMutation(targetKey ?? targetUsername, async () => {
      const res = await sendFriendRequestAction(payload);
      if (!res.success) {
        toast.error(res.error || tFriends("sendRequestError"));
        return;
      }
      if (!res.data) {
        toast.error(tFriends("sendRequestError"));
        return;
      }
      toast.success(
        res.data.autoAccepted
          ? tFriends("autoAcceptedToast", { username: targetUsername })
          : tFriends("requestSentToast", { username: targetUsername }),
      );
      if (res.data.autoAccepted) {
        notifySidebarNotificationsChanged();
      }
      await options.onMutated?.();
    });
  };

  const respondFriendRequest = (friendshipId: string, accept: boolean) => {
    void runMutation(friendshipId, async () => {
      const res = await respondFriendRequestAction(friendshipId, accept);
      if (!res.success) {
        toast.error(res.error || tFriends("respondRequestError"));
        return;
      }
      toast.success(
        accept
          ? tFriends("acceptSuccessToast")
          : tFriends("declineSuccessToast"),
      );
      notifySidebarNotificationsChanged();
      await options.onMutated?.();
    });
  };

  const removeConnection = (friendshipId: string, wasBlocked = false) => {
    void runMutation(friendshipId, async () => {
      const res = await removeFriendshipAction(friendshipId);
      if (!res.success) {
        toast.error(res.error || tFriends("removeError"));
        return;
      }
      toast.success(
        wasBlocked ? tFriends("unblockedToast") : tFriends("removedToast"),
      );
      notifySidebarNotificationsChanged();
      await options.onMutated?.();
    });
  };

  const blockUser = (userId: string) => {
    void runMutation(userId, async () => {
      const res = await blockUserAction(userId);
      if (!res.success) {
        toast.error(res.error || tFriends("blockError"));
        return;
      }
      toast.success(tFriends("blockedToast"));
      notifySidebarNotificationsChanged();
      await options.onMutated?.();
    });
  };

  return {
    isMutating: pendingTargetIds.size > 0,
    pendingTargetIds,
    isTargetPending,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  };
}
