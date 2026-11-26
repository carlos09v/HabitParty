"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { AuthFormAlert } from "@/components/auth/AuthFormAlert";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  type AuthUrlErrorCode,
  resolveSafeReturnTo,
} from "@/utils/authRedirect";
import { validateEmail } from "@/utils/validators";

interface SignInFormProps {
  initialErrorCode?: AuthUrlErrorCode;
  returnTo?: string;
}

export function SignInForm({
  initialErrorCode,
  returnTo,
}: SignInFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.signIn");
  const tOAuth = useTranslations("auth.oauth");
  const tValidation = useTranslations("auth.validation");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const lastHandledErrorCodeRef = useRef<AuthUrlErrorCode | undefined>(
    initialErrorCode,
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState<string | null>(() =>
    initialErrorCode ? t(`urlErrors.${initialErrorCode}`) : null,
  );

  // Limpa o parâmetro ?error= da URL após capturar a mensagem inicial
  useEffect(() => {
    if (!initialErrorCode) return;
    if (lastHandledErrorCodeRef.current !== initialErrorCode) {
      lastHandledErrorCodeRef.current = initialErrorCode;
      setFormError(t(`urlErrors.${initialErrorCode}`));
    }
    const safeReturnTo = returnTo ? resolveSafeReturnTo(returnTo, "") : "";
    const nextUrl = safeReturnTo
      ? `/signIn?returnTo=${encodeURIComponent(safeReturnTo)}`
      : "/signIn";
    router.replace(nextUrl, { scroll: false });
  }, [initialErrorCode, returnTo, router, t]);

  const emailValidation = validateEmail(email);
  const emailError =
    touched.email && !emailValidation.isValid && emailValidation.errorKey
      ? tValidation(emailValidation.errorKey)
      : undefined;

  const passwordError =
    touched.password && !password ? tValidation("passwordRequired") : undefined;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);

    const currentEmailValidation = validateEmail(email);
    if (!currentEmailValidation.isValid) {
      emailRef.current?.focus();
      return;
    }

    if (!password) {
      passwordRef.current?.focus();
      return;
    }

    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("password", password);

    startTransition(async () => {
      try {
        const result = await signIn(formData);

        if (!result.success) {
          setFormError(result.error);
          toast.error(result.error);
          return;
        }

        toast.success(t("successToast"));
        const target = result.data.isNewUser
          ? "/firstStep"
          : resolveSafeReturnTo(returnTo);
        router.push(target);
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

      <Input
        ref={emailRef}
        label={t("emailLabel")}
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (formError) setFormError(null);
        }}
        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        error={emailError}
        placeholder={t("emailPlaceholder")}
        required
        disabled={isPending}
      />

      <div className="flex flex-col gap-2">
        <Input
          ref={passwordRef}
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          enterKeyHint="done"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (formError) setFormError(null);
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
          error={passwordError}
          placeholder={t("passwordPlaceholder")}
          required
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="inline-flex items-center py-1.5 sm:py-0.5 -my-1 sm:my-0 text-xs text-neutral-400 hover:text-primary dark:hover:text-gold transition-colors outline-none focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:rounded px-1"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <SubmitButton isPending={isPending} loadingText={t("submitting")}>
          {t("submit")}
        </SubmitButton>

        <AuthDivider label={tOAuth("divider")} />

        <GoogleSignInButton disabled={isPending} returnTo={returnTo} />
      </div>
    </form>
  );
}
