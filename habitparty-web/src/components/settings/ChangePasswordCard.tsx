"use client";

import { Check, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { updateUserPasswordAction } from "@/actions/userActions";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { GoogleLogoIcon } from "@/components/ui/GoogleLogoIcon";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import type { ProfileCardBaseProps } from "@/types/settings";
import { cn } from "@/utils";
import { analyzePassword } from "@/utils/validators";

export function ChangePasswordCard({ isCompact }: ProfileCardBaseProps) {
  const t = useTranslations("settings.changePassword");
  const user = useUserStore((s) => s.user);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isPending, startTransition] = useTransition();
  const [isSendingReset, startResetTransition] = useTransition();
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const isSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;

  const analysis = analyzePassword(newPassword);
  const isPasswordValid =
    analysis.hasMinLength &&
    analysis.hasUpperCase &&
    analysis.hasLowerCase &&
    analysis.hasNumberOrSpecial;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isPasswordValid && passwordsMatch;

  const isEmailUnverified = user?.emailVerified === false;

  const canSubmit =
    !isEmailUnverified &&
    currentPassword.length > 0 &&
    isFormValid &&
    !isSameAsCurrent;

  const handleSendPasswordSetupEmail = () => {
    if (!user?.email) {
      toast.error(t("userEmailNotFound"));
      return;
    }

    startResetTransition(async () => {
      const res = await requestPasswordReset(user.email || "");
      if (res.success) {
        setResetEmailSent(true);
        toast.success(t("setupLinkSent", { email: user?.email ?? "" }));
      } else {
        toast.error(res.error || t("setupLinkError"));
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error(t("currentPasswordRequired"));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t("newPasswordDifferent"));
      return;
    }

    if (!isPasswordValid) {
      toast.error(t("requirementsNotMet"));
      return;
    }

    if (!passwordsMatch) {
      toast.error(t("passwordsDoNotMatch"));
      return;
    }

    startTransition(async () => {
      const res = await updateUserPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        toast.success(t("successToast"));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || t("changePasswordError"));
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {isEmailUnverified && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 dark:bg-gold/10 border border-amber-500/35 dark:border-gold/30 text-xs sm:text-body-s text-neutral-200 leading-relaxed">
          <strong className="text-amber-700 dark:text-gold font-bold">
            {t("unverifiedEmailWarning")}
          </strong>{" "}
          {t("unverifiedEmailDesc", { email: user?.email ?? "" })}
        </div>
      )}

      {/* Aviso informativo para contas criadas/vinculadas via Google */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl bg-surface/60 border border-neutral-700 dark:border-primary/25">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 border border-neutral-700 dark:border-white/15 shadow-2xs dark:shadow-none flex items-center justify-center shrink-0 mt-0.5">
            <GoogleLogoIcon />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs sm:text-body-s font-bold text-neutral-100">
              {t("googleNoticeTitleFull")}
            </span>
            <p className="text-tiny sm:text-xs text-neutral-300 leading-relaxed">
              {t("googleNoticeDescFull")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendPasswordSetupEmail}
          disabled={isSendingReset || resetEmailSent || !user?.email}
          className={cn(
            "shrink-0 rounded-xl border font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
            resetEmailSent
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default"
              : "border-gold/45 bg-gold/10 text-amber-700 dark:text-gold hover:bg-gold hover:text-on-gold dark:hover:text-neutral-950",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isCompact ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs",
          )}
        >
          {resetEmailSent ? (
            <>
              <Check size={14} />
              <span>{t("linkSent")}</span>
            </>
          ) : (
            <>
              <Mail size={14} />
              <span>
                {isSendingReset ? t("sendingEmail") : t("receiveLink")}
              </span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 max-w-xl">
          <Input
            id="currentPassword"
            type="password"
            label={t("currentPasswordLabel")}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("currentPasswordPlaceholder")}
            compact={isCompact}
            icon={<Lock size={18} />}
            required
          />

          <Input
            id="newPassword"
            type="password"
            label={t("newPasswordLabel")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("newPasswordPlaceholder")}
            compact={isCompact}
            icon={<Lock size={18} />}
            error={isSameAsCurrent ? t("samePasswordError") : undefined}
            required
          />

          <PasswordStrengthIndicator password={newPassword} />

          <Input
            id="confirmPassword"
            type="password"
            label={t("confirmPasswordLabel")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            compact={isCompact}
            icon={<Lock size={18} />}
            error={
              confirmPassword.length > 0 && !passwordsMatch
                ? t("passwordsDoNotMatch")
                : undefined
            }
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
          <button
            type="submit"
            disabled={isPending || !canSubmit}
            className={cn(
              "rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs dark:shadow-md",
              "bg-gold text-on-gold hover:bg-gold-hover active:bg-gold-pressed",
              "disabled:bg-neutral-700 disabled:text-neutral-400 disabled:border disabled:border-neutral-600 disabled:shadow-none disabled:opacity-100 dark:disabled:bg-gold dark:disabled:text-on-gold dark:disabled:border-transparent dark:disabled:opacity-40 disabled:cursor-not-allowed",
              isCompact ? "px-4 py-2 text-xs" : "px-6 py-2.5 text-sm",
            )}
          >
            {isPending ? t("submittingBtn") : t("submitBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}
