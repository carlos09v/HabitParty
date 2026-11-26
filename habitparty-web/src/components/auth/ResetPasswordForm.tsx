"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { resetPassword } from "@/actions/auth";
import { AuthFormAlert } from "@/components/auth/AuthFormAlert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PASSWORD_MAX_LENGTH, validateAuthPassword } from "@/utils/validators";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const passwordValidation = validateAuthPassword(password);
  const passwordError =
    passwordTouched && !passwordValidation.isValid
      ? passwordValidation.errorKey
        ? tValidation(passwordValidation.errorKey, {
            max: PASSWORD_MAX_LENGTH,
          })
        : passwordValidation.error
      : undefined;

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch = confirmTouched && !passwordsMatch;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordTouched(true);
    setConfirmTouched(true);
    setFormError(null);

    const validation = validateAuthPassword(password);
    if (!validation.isValid) {
      passwordRef.current?.focus();
      return;
    }

    if (!passwordsMatch) {
      confirmRef.current?.focus();
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetPassword({ token, password });

        if (!result.success) {
          setFormError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success(t("successToast"));
        router.push("/signIn");
      } catch {
        const fallbackError = t("connectionError");
        setFormError(fallbackError);
        toast.error(fallbackError);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 w-full"
    >
      <AuthFormAlert message={formError} />

      <div className="flex flex-col gap-2">
        <Input
          ref={passwordRef}
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          enterKeyHint="next"
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (formError) setFormError(null);
          }}
          onBlur={() => setPasswordTouched(true)}
          error={passwordError}
          placeholder={t("passwordPlaceholder")}
          icon={<KeyRound size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          ref={confirmRef}
          label={t("confirmPasswordLabel")}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          enterKeyHint="done"
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmTouched(true);
            if (formError) setFormError(null);
          }}
          onBlur={() => setConfirmTouched(true)}
          placeholder={t("confirmPlaceholder")}
          icon={<KeyRound size={18} aria-hidden="true" />}
          error={showPasswordMismatch ? t("passwordsMismatchError") : undefined}
          required
          disabled={isPending}
        />
      </div>

      <SubmitButton
        isPending={isPending}
        loadingText={t("submitting")}
        className="mt-2"
      >
        {t("submit")}
      </SubmitButton>
    </form>
  );
}
