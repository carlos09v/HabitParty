import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signIn.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface SignInPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [resolvedParams, t] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({} as { error?: string }),
    getTranslations("auth.signIn"),
  ]);
  const error = resolvedParams.error;

  return (
    <AuthPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("noAccount")}
      footerLinkText={t("createAccount")}
      footerLinkHref="/signUp"
    >
      <SignInForm initialError={error} />
    </AuthPageShell>
  );
}
