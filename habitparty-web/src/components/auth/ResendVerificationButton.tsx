"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resendVerificationEmailAction } from "@/actions/auth";
import { cn } from "@/utils";

interface ResendVerificationButtonProps {
  email?: string;
}

export function ResendVerificationButton({
  email,
}: ResendVerificationButtonProps) {
  const t = useTranslations("emailVerificationBanner");
  const [isPending, startTransition] = useTransition();
  const [resentSuccess, setResentSuccess] = useState(false);

  const handleResend = () => {
    startTransition(async () => {
      const res = await resendVerificationEmailAction();
      if (res.success) {
        setResentSuccess(true);
        toast.success(
          t("resendSuccessToast", {
            target: email || t("resendDefaultTarget"),
          }),
        );
      } else {
        toast.error(res.error || t("resendErrorToast"));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={isPending || resentSuccess}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
        resentSuccess
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 cursor-default"
          : "border-gold/40 bg-gold text-neutral-950 hover:bg-gold-hover",
        "disabled:opacity-60 disabled:cursor-not-allowed",
      )}
    >
      {resentSuccess ? (
        <>
          <CheckCircle2 size={13} />
          <span>{t("resent")}</span>
        </>
      ) : (
        <>
          <RefreshCw size={13} className={cn(isPending && "animate-spin")} />
          <span>{isPending ? t("sending") : t("resendButton")}</span>
        </>
      )}
    </button>
  );
}
