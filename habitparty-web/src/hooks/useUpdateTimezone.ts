"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateUserProfileAction } from "@/actions/userActions";
import { useUserStore } from "@/store/userStore";
import { setClientTimeZoneCookie } from "@/utils/date";

interface UseUpdateTimezoneOptions {
  formatSuccessMessage: (timezone: string) => string;
  errorMessage: string;
  onSuccess?: (timezone: string) => void;
}

/**
 * Centraliza o fluxo de atualização do fuso horário (Action + Store + Cookie SSR + Toast + Router Refresh),
 * eliminando duplicação entre TimezoneSettings e TimezoneMismatchBanner.
 */
export function useUpdateTimezone({
  formatSuccessMessage,
  errorMessage,
  onSuccess,
}: UseUpdateTimezoneOptions) {
  const router = useRouter();
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const [isPending, startTransition] = useTransition();

  const updateTimezone = (targetTimezone: string) => {
    startTransition(async () => {
      const result = await updateUserProfileAction({
        timezone: targetTimezone,
      });
      if (result.success) {
        const nextTz = result.data?.timezone || targetTimezone;
        updateUserPartial({
          timezone: nextTz,
          timezoneUpdatedAt:
            result.data?.timezoneUpdatedAt ?? new Date().toISOString(),
        });
        setClientTimeZoneCookie(nextTz);
        toast.success(formatSuccessMessage(nextTz));
        onSuccess?.(nextTz);
        router.refresh();
      } else {
        toast.error(result.error || errorMessage);
      }
    });
  };

  return {
    isPending,
    updateTimezone,
  };
}
