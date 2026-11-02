import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/components/auth/SignUpForm";

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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Cabeçalho do Formulário */}
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">{t("title")}</h1>
        <p className="text-base text-neutral-300">{t("subtitle")}</p>
      </header>

      {/* Formulário Modularizado */}
      <SignUpForm />

      {/* Link de redirecionamento */}
      <footer className="text-center text-sm text-neutral-300">
        {t("hasAccount")}{" "}
        <Link
          href="/signIn"
          className="text-gold font-bold hover:underline transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded px-1"
        >
          {t("signInLink")}
        </Link>
      </footer>
    </div>
  );
}
