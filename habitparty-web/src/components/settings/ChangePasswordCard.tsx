"use client";

import { Check, Lock, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/auth";
import { updateUserPasswordAction } from "@/actions/userActions";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useRegisterSettingsDirty } from "@/components/settings/SettingsDirtyContext";
import { SettingsSaveButton } from "@/components/settings/SettingsSaveButton";
import { GoogleLogoIcon } from "@/components/ui/GoogleLogoIcon";
import { Input } from "@/components/ui/Input";
import { useResolvedUser } from "@/hooks/useResolvedUser";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils/cn";
import { analyzePassword } from "@/utils/validators";

const RESEND_COOLDOWN_SECONDS = 60;

interface ChangePasswordCardProps {
  initialUser?: UserResponseDTO | null;
}

export function ChangePasswordCard({
  initialUser = null,
}: ChangePasswordCardProps = {}) {
  const t = useTranslations("settings.changePassword");
  const user = useResolvedUser(initialUser);
  const hasPassword = user?.hasPassword !== false;
  const formRef = useRef<HTMLFormElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isSendingReset, startResetTransition] = useTransition();
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const isCooldownActive = cooldownSeconds > 0;

  useRegisterSettingsDirty(
    "change-password",
    Boolean(currentPassword || newPassword || confirmPassword),
  );

  // Intervalo único enquanto o cooldown está ativo (evita recriar setInterval 60x por envio)
  useEffect(() => {
    if (!isCooldownActive) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCooldownActive]);

  const isSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword === newPassword;

  const analysis = analyzePassword(newPassword);
  const isPasswordValid =
    analysis.hasMinLength &&
    analysis.hasUpperCase &&
    analysis.hasLowerCase &&
    analysis.hasSpecialChar;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  const isEmailUnverified = user?.emailVerified === false;

  const showCurrentMissingError = hasAttemptedSubmit && !currentPassword;
  const showSamePasswordError =
    (newPasswordTouched || hasAttemptedSubmit) && isSameAsCurrent;
  const showWeakPasswordError =
    hasAttemptedSubmit && !isSameAsCurrent && !isPasswordValid;
  const showConfirmMismatchError =
    (confirmTouched || hasAttemptedSubmit) &&
    (confirmPassword.length > 0 || hasAttemptedSubmit) &&
    !passwordsMatch;

  const focusField = (fieldId: string) => {
    formRef.current?.querySelector<HTMLInputElement>(`#${fieldId}`)?.focus();
  };

  const handleSendPasswordSetupEmail = () => {
    if (isSendingReset || isCooldownActive) return;
    if (!user?.email) {
      toast.error(t("userEmailNotFound"));
      return;
    }

    startResetTransition(async () => {
      const res = await requestPasswordReset(user.email || "");
      if (res.success) {
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        toast.success(t("setupLinkSent", { email: user?.email ?? "" }));
      } else {
        toast.error(res.error || t("setupLinkError"));
      }
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isPending || isEmailUnverified) return;
    setHasAttemptedSubmit(true);

    if (!currentPassword) {
      toast.error(t("currentPasswordRequired"));
      focusField("currentPassword");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t("newPasswordDifferent"));
      focusField("newPassword");
      return;
    }

    if (!isPasswordValid) {
      toast.error(t("requirementsNotMet"));
      focusField("newPassword");
      return;
    }

    if (!passwordsMatch) {
      toast.error(t("passwordsDoNotMatch"));
      focusField("confirmPassword");
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
        setNewPasswordTouched(false);
        setConfirmTouched(false);
        setHasAttemptedSubmit(false);
      } else {
        toast.error(res.error || t("changePasswordError"));
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {isEmailUnverified && (
        <aside className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 dark:bg-gold/10 border border-amber-500/35 dark:border-gold/30 text-xs sm:text-body-s text-neutral-200 leading-relaxed">
          <strong className="text-amber-700 dark:text-gold font-bold">
            {t("unverifiedEmailWarning")}
          </strong>{" "}
          {t("unverifiedEmailDesc", { email: user?.email ?? "" })}
        </aside>
      )}

      {/* Fluxo contextualizado: contas OAuth sem senha manual recebem destaque para definição da 1ª senha */}
      <div
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl border",
          !hasPassword
            ? "bg-amber-500/[0.08] dark:bg-gold/10 border-amber-500/40 dark:border-gold/35"
            : "bg-surface/60 border-neutral-700 dark:border-primary/25",
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-card dark:bg-white/10 border border-neutral-700 dark:border-white/15 shadow-2xs dark:shadow-none flex items-center justify-center shrink-0 mt-0.5">
            {!hasPassword ? (
              <GoogleLogoIcon />
            ) : (
              <Mail
                size={16}
                className="text-amber-700 dark:text-gold"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs sm:text-body-s font-bold text-neutral-100">
              {hasPassword ? t("forgotNoticeTitle") : t("oauthSetupTitle")}
            </span>
            <p className="text-tiny sm:text-xs text-neutral-300 leading-relaxed">
              {hasPassword
                ? t("forgotNoticeDesc")
                : t("oauthSetupDesc", { email: user?.email ?? "" })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSendPasswordSetupEmail}
          disabled={isSendingReset || isCooldownActive || !user?.email}
          className={cn(
            "w-full sm:w-auto justify-center shrink-0 rounded-xl border font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
            isCooldownActive
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default"
              : !hasPassword
                ? "border-gold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs"
                : "border-gold/45 bg-gold/10 text-amber-700 dark:text-gold hover:bg-gold hover:text-on-gold dark:hover:text-neutral-950",
            "disabled:opacity-55 disabled:cursor-not-allowed px-3.5 py-2 text-xs tabular-nums",
          )}
        >
          {isCooldownActive ? (
            <>
              <Check size={14} aria-hidden="true" />
              <span>{t("resendCooldown", { seconds: cooldownSeconds })}</span>
            </>
          ) : (
            <>
              <Mail size={14} aria-hidden="true" />
              <span>
                {isSendingReset
                  ? t("sendingEmail")
                  : hasPassword
                    ? t("receiveLink")
                    : t("definePasswordBtn")}
              </span>
            </>
          )}
        </button>
      </div>

      {hasPassword && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-4 max-w-xl">
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              label={t("currentPasswordLabel")}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("currentPasswordPlaceholder")}
              icon={<Lock size={18} aria-hidden="true" />}
              error={
                showCurrentMissingError
                  ? t("currentPasswordRequired")
                  : undefined
              }
              required
            />

            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              label={t("newPasswordLabel")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={() => setNewPasswordTouched(true)}
              placeholder={t("newPasswordPlaceholder")}
              icon={<Lock size={18} aria-hidden="true" />}
              error={
                showSamePasswordError
                  ? t("samePasswordError")
                  : showWeakPasswordError
                    ? t("requirementsNotMet")
                    : undefined
              }
              required
            />

            <PasswordStrengthIndicator password={newPassword} />

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              label={t("confirmPasswordLabel")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setConfirmTouched(true)}
              placeholder={t("confirmPasswordPlaceholder")}
              icon={<Lock size={18} aria-hidden="true" />}
              error={
                showConfirmMismatchError ? t("passwordsDoNotMatch") : undefined
              }
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
            <SettingsSaveButton
              type="submit"
              isPending={isPending}
              disabled={isEmailUnverified}
              showSaveIcon={false}
              label={t("submitBtn")}
              savingLabel={t("submittingBtn")}
            />
          </div>
        </form>
      )}
    </div>
  );
}
