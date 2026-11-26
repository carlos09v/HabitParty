"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { regenerateFriendCodeAction } from "@/actions/socialActions";
import { useCopyFeedback } from "@/hooks/useCopyFeedback";
import { useUserStore } from "@/store/userStore";

interface FriendCodeMessages {
  copied: string;
  copyError: string;
  regenerated: string;
  regenerateError: string;
}

interface UseFriendCodeActionsOptions {
  friendCode: string;
  messages: FriendCodeMessages;
  onRegenerated?: (nextCode: string) => void;
}

export function useFriendCodeActions({
  friendCode,
  messages,
  onRegenerated,
}: UseFriendCodeActionsOptions) {
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const { copied: copiedCode, copy } = useCopyFeedback();
  const [isRegenerating, startRegenerateTransition] = useTransition();

  const handleCopyCode = () => {
    void copy(friendCode, {
      success: messages.copied,
      error: messages.copyError,
    });
  };

  const handleRegenerateCode = (onSettled?: () => void) => {
    if (isRegenerating) return;
    startRegenerateTransition(async () => {
      try {
        const res = await regenerateFriendCodeAction();
        if (!res.success) {
          toast.error(res.error || messages.regenerateError);
          return;
        }
        updateUserPartial(res.data);
        if (res.data.friendCode) {
          onRegenerated?.(res.data.friendCode);
        }
        toast.success(messages.regenerated);
      } finally {
        onSettled?.();
      }
    });
  };

  return {
    copiedCode,
    isRegenerating,
    handleCopyCode,
    handleRegenerateCode,
  };
}
