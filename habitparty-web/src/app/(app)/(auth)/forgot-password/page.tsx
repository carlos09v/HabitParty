import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgotPassword.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");

  return (
    <AuthPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("rememberPassword")}
      footerLinkText={t("signIn")}
      footerLinkHref="/signIn"
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
