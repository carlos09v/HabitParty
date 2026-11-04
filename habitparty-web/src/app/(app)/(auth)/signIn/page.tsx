import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">{t("title")}</h1>
        <p className="text-base text-neutral-300">{t("subtitle")}</p>
      </header>

      <SignInForm initialError={error} />

      <footer className="text-center text-sm text-neutral-300">
        {t("noAccount")}{" "}
        <Link
          href="/signUp"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
        >
          {t("createAccount")}
        </Link>
      </footer>
    </div>
  );
}
