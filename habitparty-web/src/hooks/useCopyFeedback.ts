"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface CopyFeedbackMessages {
  success?: string;
  error?: string;
}

/**
 * Hook compartilhado para copiar texto para a área de transferência com estado visual
 * temporário (`copied`) e limpeza automática do timer no unmount.
 */
export function useCopyFeedback(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      globalThis.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setCopied(false);
  }, [clearTimer]);

  const copy = useCallback(
    async (
      value: string | null | undefined,
      messages?: CopyFeedbackMessages,
    ): Promise<boolean> => {
      if (!value) return false;
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (messages?.success) {
          toast.success(messages.success);
        }
        clearTimer();
        timerRef.current = globalThis.setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, timeoutMs);
        return true;
      } catch {
        if (messages?.error) {
          toast.error(messages.error);
        }
        return false;
      }
    },
    [clearTimer, timeoutMs],
  );

  return { copied, copy, reset };
}
