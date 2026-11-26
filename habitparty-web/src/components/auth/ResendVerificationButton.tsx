"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { resendVerificationEmailAction } from "@/actions/auth";
import { cn } from "@/utils";

const RESEND_COOLDOWN_SECONDS = 60;

interface ResendVerificationButtonProps {
  email?: string;
}

export function ResendVerificationButton({
  email,
}: ResendVerificationButtonProps) {
  const t = useTranslations("emailVerificationBanner");
  const [isPending, startTransition] = useTransition();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const isCoolingDown = cooldownSeconds > 0;

  const handleResend = () => {
    startTransition(async () => {
      try {
        const res = await resendVerificationEmailAction();
        if (res.success) {
          setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
          toast.success(
            t("resendSuccessToast", {
              target: email || t("resendDefaultTarget"),
            }),
          );
        } else {
          toast.error(res.error || t("resendErrorToast"));
        }
      } catch {
        toast.error(t("resendErrorToast"));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isPending || isCoolingDown}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isCoolingDown
          ? "border-success-500/40 bg-success-500/15 text-success-400 cursor-default"
          : "border-gold/40 bg-gold text-on-gold hover:bg-gold-hover",
        "disabled:opacity-70 disabled:cursor-not-allowed",
      )}
    >
      {isCoolingDown ? (
        <>
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>{t("resendCooldown", { seconds: cooldownSeconds })}</span>
        </>
      ) : (
        <>
          <RefreshCw
            size={13}
            aria-hidden="true"
            className={cn(isPending && "animate-spin")}
          />
          <span>{isPending ? t("sending") : t("resendButton")}</span>
        </>
      )}
    </button>
  );
}
