"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { resetPassword } from "@/actions/auth";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { validateAuthPassword } from "@/utils/validators";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showPasswordMismatch =
    confirmTouched && confirmPassword.length > 0 && !passwordsMatch;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validation = validateAuthPassword(password);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    if (!passwordsMatch) {
      toast.error(t("passwordsMismatchError"));
      return;
    }

    startTransition(async () => {
      const result = await resetPassword({ token, password });

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(t("successToast"));
        router.push("/signIn");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <Input
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          icon={<KeyRound size={18} aria-hidden="true" />}
          required
          disabled={isPending}
        />
        <PasswordStrengthIndicator password={password} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Input
          label={t("confirmPasswordLabel")}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setConfirmTouched(true);
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
