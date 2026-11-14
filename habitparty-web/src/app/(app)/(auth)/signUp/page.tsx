import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signUp.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function SignUpPage() {
  const t = await getTranslations("auth.signUp");

  return (
    <AuthPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("hasAccount")}
      footerLinkText={t("signInLink")}
      footerLinkHref="/signIn"
    >
      <SignUpForm />
    </AuthPageShell>
  );
}
