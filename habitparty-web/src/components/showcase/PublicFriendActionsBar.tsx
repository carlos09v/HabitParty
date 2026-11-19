"use client";

import { useRouter } from "next/navigation";
import { PublicFriendActionButtons } from "@/components/showcase/PublicFriendActionButtons";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { PublicUserShowcaseData } from "@/types/social";

interface PublicFriendActionsBarProps {
  data: PublicUserShowcaseData;
}

export function PublicFriendActionsBar({ data }: PublicFriendActionsBarProps) {
  const router = useRouter();
  const {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  } = useFriendshipMutations({ onMutated: () => router.refresh() });

  return (
    <PublicFriendActionButtons
      data={data}
      isMutating={isMutating}
      onSendRequest={() =>
        sendFriendRequest({ username: data.user.username }, data.user.username)
      }
      onRespondRequest={(accept) => {
        if (data.friendshipId) {
          respondFriendRequest(data.friendshipId, accept);
        }
      }}
      onRemoveConnection={(wasBlocked = false) => {
        if (data.friendshipId) {
          removeConnection(data.friendshipId, wasBlocked);
        }
      }}
      onBlockUser={() => blockUser(data.user.id)}
    />
  );
}
