import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.resetPassword.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const [resolvedParams, t] = await Promise.all([
    searchParams,
    getTranslations("auth.resetPassword"),
  ]);
  const token = resolvedParams?.token;

  if (!token) {
    return (
      <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-neutral-50">{t("title")}</h1>
        </header>

        <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-danger-500/20 border border-danger-500/50 flex items-center justify-center text-danger-400">
            <AlertTriangle size={24} aria-hidden="true" />
          </div>

          <h2 className="text-lg font-bold text-neutral-50">
            {t("invalidLinkTitle")}
          </h2>

          <p className="text-sm text-neutral-300 leading-relaxed max-w-sm">
            {t("invalidLinkDesc")}
          </p>
        </div>

        <Link
          href="/forgot-password"
          className="w-full py-3.5 px-4 rounded-lg text-base font-bold transition-all text-center flex items-center justify-center bg-primary hover:bg-primary-dark text-white border border-primary-dark/30 shadow-sm active:scale-[0.99] dark:bg-neutral-900/60 dark:hover:bg-neutral-900/80 dark:border-2 dark:border-gold/50 dark:hover:border-gold dark:hover:shadow-glow-gold-md dark:text-neutral-50"
        >
          {t("requestNewLink")}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">{t("title")}</h1>
        <p className="text-base text-neutral-300">{t("subtitle")}</p>
      </header>

      <ResetPasswordForm token={token} />
    </main>
  );
}
