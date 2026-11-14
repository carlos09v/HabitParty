"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { regenerateFriendCodeAction } from "@/actions/socialActions";
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
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRegenerating, startRegenerateTransition] = useTransition();
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        globalThis.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopyCode = async () => {
    if (!friendCode) return;
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopiedCode(true);
      toast.success(messages.copied);
      if (copyTimerRef.current) {
        globalThis.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = globalThis.setTimeout(
        () => setCopiedCode(false),
        2000,
      );
    } catch {
      toast.error(messages.copyError);
    }
  };

  const handleRegenerateCode = () => {
    startRegenerateTransition(async () => {
      const res = await regenerateFriendCodeAction();
      if (!res.success || !res.user) {
        toast.error(res.error || messages.regenerateError);
        return;
      }
      updateUserPartial(res.user);
      if (res.user.friendCode) {
        onRegenerated?.(res.user.friendCode);
      }
      toast.success(messages.regenerated);
    });
  };

  return {
    copiedCode,
    isRegenerating,
    handleCopyCode,
    handleRegenerateCode,
  };
}
