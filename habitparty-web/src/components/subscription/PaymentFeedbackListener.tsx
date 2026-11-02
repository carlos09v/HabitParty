"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { confirmPaymentAction } from "@/actions/paymentActions";
import { useUserStore } from "@/store/userStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";

export function PaymentFeedbackListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("paymentFeedback");
  const setUser = useUserStore((s) => s.setUser);
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const sessionId = searchParams.get("session_id");

    if (!payment) return;

    const cleanupUrl = () => {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("payment");
      newParams.delete("session_id");
      const newUrl = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    };

    if (payment === "success") {
      if (sessionId && !isVerifyingRef.current) {
        isVerifyingRef.current = true;

        const verifyWithRetry = async (retriesLeft: number) => {
          try {
            const res = await confirmPaymentAction(sessionId);

            // Somente celebra se o gateway confirmou E o usuário de fato tornou-se Premium!
            if (res.success && res.data.isPaid && res.data.user?.isPremium) {
              toast.dismiss("payment-checking");
              setUser(res.data.user);
              triggerCelebrationConfetti();
              toast.success(t("successToast"), { duration: 6000 });
              router.refresh();
              cleanupUrl();
              return;
            }

            // Se ainda não compensou (comum no Pix nos primeiros segundos):
            if (retriesLeft > 0) {
              toast.loading(t("waitingCompensationToast"), {
                id: "payment-checking",
              });
              setTimeout(() => {
                verifyWithRetry(retriesLeft - 1);
              }, 2500);
            } else {
              toast.dismiss("payment-checking");
              toast.info(t("processingPixToast"), { duration: 6000 });
              router.refresh();
              cleanupUrl();
            }
          } catch {
            toast.dismiss("payment-checking");
            cleanupUrl();
          }
        };

        verifyWithRetry(3);
      } else if (!sessionId) {
        router.refresh();
        cleanupUrl();
      }
    } else if (payment === "cancel") {
      toast.info(t("cancelledToast"), { duration: 4000 });
      cleanupUrl();
    }
  }, [searchParams, router, pathname, setUser, t]);

  return null;
}
