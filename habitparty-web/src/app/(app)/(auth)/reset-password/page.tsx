import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
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
      <AuthPageShell title={t("title")}>
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
          className="w-full py-3.5 px-4 rounded-lg text-base font-bold transition-colors text-center flex items-center justify-center bg-primary hover:bg-primary-dark text-white border border-primary-dark/30 shadow-sm active:scale-[0.99] dark:bg-primary dark:hover:bg-primary-light dark:border dark:border-primary-light/40 dark:hover:border-gold/60 dark:shadow-[0_0_20px_rgba(124,58,237,0.35)] dark:text-white"
        >
          {t("requestNewLink")}
        </Link>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell title={t("title")} subtitle={t("subtitle")}>
      <ResetPasswordForm token={token} />
    </AuthPageShell>
  );
}
