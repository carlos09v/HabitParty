"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createCustomerPortalSessionAction } from "@/actions/paymentActions";

interface UseCustomerPortalMessages {
  redirecting: string;
  error: string;
  missingUrl?: string;
  unexpectedError?: string;
}

/**
 * Encapsula a abertura do Portal de Assinaturas do Stripe com feedback de toast e estado pendente.
 */
export function useCustomerPortal(messages: UseCustomerPortalMessages) {
  const [isPendingPortal, startTransition] = useTransition();

  const openCustomerPortal = () => {
    startTransition(async () => {
      try {
        const res = await createCustomerPortalSessionAction();
        if (res.success) {
          if (res.data?.portalUrl) {
            toast.success(messages.redirecting);
            window.location.href = res.data.portalUrl;
          } else {
            toast.error(messages.missingUrl ?? messages.error);
          }
        } else {
          toast.error(res.error || messages.error);
        }
      } catch (err) {
        console.error(err);
        toast.error(messages.unexpectedError ?? messages.error);
      }
    });
  };

  return {
    isPendingPortal,
    openCustomerPortal,
  };
}
