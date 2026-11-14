"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
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
  const [isMutating, startMutateTransition] = useTransition();

  const sendFriendRequest = (
    payload: { username?: string; friendCode?: string },
    targetUsername: string,
  ) => {
    startMutateTransition(async () => {
      const res = await sendFriendRequestAction(payload);
      if (!res.success || !res.data) {
        toast.error(res.error || tFriends("sendRequestError"));
        return;
      }
      toast.success(
        res.data.autoAccepted
          ? tFriends("autoAcceptedToast", { username: targetUsername })
          : tFriends("requestSentToast", { username: targetUsername }),
      );
      await options.onMutated?.();
    });
  };

  const respondFriendRequest = (friendshipId: string, accept: boolean) => {
    startMutateTransition(async () => {
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
      await options.onMutated?.();
    });
  };

  const removeConnection = (friendshipId: string, wasBlocked = false) => {
    startMutateTransition(async () => {
      const res = await removeFriendshipAction(friendshipId);
      if (!res.success) {
        toast.error(res.error || tFriends("removeError"));
        return;
      }
      toast.success(
        wasBlocked ? tFriends("unblockedToast") : tFriends("removedToast"),
      );
      await options.onMutated?.();
    });
  };

  const blockUser = (userId: string) => {
    startMutateTransition(async () => {
      const res = await blockUserAction(userId);
      if (!res.success) {
        toast.error(res.error || tFriends("blockError"));
        return;
      }
      toast.success(tFriends("blockedToast"));
      await options.onMutated?.();
    });
  };

  return {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  };
}
