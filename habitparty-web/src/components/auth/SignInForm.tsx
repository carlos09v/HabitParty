"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { signIn } from "@/actions/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";

interface SignInFormProps {
  initialError?: string;
}

export function SignInForm({ initialError }: SignInFormProps = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("auth.signIn");

  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
  }, [initialError]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);

      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(t("successToast"));
        router.push("/dashboard");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <Input
        label={t("emailLabel")}
        id="email"
        name="email"
        type="email"
        placeholder={t("emailPlaceholder")}
        required
        disabled={isPending}
      />

      <div className="flex flex-col gap-2">
        <Input
          label={t("passwordLabel")}
          id="password"
          name="password"
          type="password"
          placeholder={t("passwordPlaceholder")}
          required
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-xs text-neutral-400 hover:text-gold transition-colors outline-none focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:rounded px-1"
          >
            {t("forgotPassword")}
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <SubmitButton isPending={isPending} loadingText={t("submitting")}>
          {t("submit")}
        </SubmitButton>

        <GoogleSignInButton disabled={isPending} />
      </div>
    </form>
  );
}
