"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PublicFriendActionButtons } from "@/components/showcase/PublicFriendActionButtons";
import { useConfirmationDialog } from "@/hooks/useConfirmationDialog";
import { useFriendshipMutations } from "@/hooks/useFriendshipMutations";
import type { PublicUserShowcaseData } from "@/types/social";

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then(
      (mod) => mod.ConfirmationModal,
    ),
  { ssr: false },
);

interface PublicFriendActionsBarProps {
  data: PublicUserShowcaseData;
}

export function PublicFriendActionsBar({ data }: PublicFriendActionsBarProps) {
  const router = useRouter();
  const t = useTranslations("showcase.friends");
  const confirmDialog = useConfirmationDialog<"remove" | "block">();
  const {
    isMutating,
    sendFriendRequest,
    respondFriendRequest,
    removeConnection,
    blockUser,
  } = useFriendshipMutations({ onMutated: () => router.refresh() });

  const displayName = data.user.fullName || data.user.username;

  const handleConfirm = () => {
    confirmDialog.confirm((action) => {
      if (action === "remove" && data.friendshipId) {
        removeConnection(data.friendshipId, false);
      } else if (action === "block") {
        blockUser(data.user.id);
      }
    });
  };

  return (
    <>
      <PublicFriendActionButtons
        data={data}
        isMutating={isMutating}
        onSendRequest={() =>
          sendFriendRequest(
            { username: data.user.username },
            data.user.username,
            data.user.id,
          )
        }
        onRespondRequest={(accept) => {
          if (data.friendshipId) {
            respondFriendRequest(data.friendshipId, accept);
          }
        }}
        onRemoveConnection={(wasBlocked = false) => {
          if (!data.friendshipId) return;
          if (!wasBlocked && data.relationshipStatus === "FRIENDS") {
            confirmDialog.request("remove");
          } else {
            removeConnection(data.friendshipId, wasBlocked);
          }
        }}
        onBlockUser={() => confirmDialog.request("block")}
      />

      {confirmDialog.pending && (
        <ConfirmationModal
          isOpen
          onClose={confirmDialog.close}
          onConfirm={handleConfirm}
          variant="danger"
          title={
            confirmDialog.pending === "block"
              ? t("confirmBlockTitle", { username: data.user.username })
              : t("confirmRemoveTitle", { name: displayName })
          }
          description={
            confirmDialog.pending === "block"
              ? t("confirmBlockDesc", { username: data.user.username })
              : t("confirmRemoveDesc", { username: data.user.username })
          }
          confirmText={
            confirmDialog.pending === "block"
              ? t("blockBtn")
              : t("removeFriendBtn")
          }
          cancelText={t("confirmCancelBtn")}
        />
      )}
    </>
  );
}
