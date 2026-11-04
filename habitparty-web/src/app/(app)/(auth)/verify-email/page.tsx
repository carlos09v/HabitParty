import { CheckCircle2, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  redirectAfterEmailVerificationAction,
  verifyEmailAction,
} from "@/actions/auth";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verifyEmail.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const [resolvedParams, t] = await Promise.all([
    searchParams,
    getTranslations("auth.verifyEmail"),
  ]);
  const token = resolvedParams.token;
  const cleanToken = token?.trim();

  if (!cleanToken) {
    return (
      <main className="flex flex-col items-center text-center gap-6 w-full animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-danger-500/15 border border-danger-500/35 flex items-center justify-center text-danger-400">
          <ShieldAlert size={28} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-neutral-50">
            {t("errorTitle")}
          </h1>
          <p className="text-sm text-neutral-300">{t("invalidTokenDesc")}</p>
        </div>
        <Link
          href="/dashboard"
          className="w-full py-3 px-6 rounded-xl bg-gold text-neutral-950 font-bold hover:bg-gold-hover transition-colors text-center"
        >
          {t("backToHabitParty")}
        </Link>
      </main>
    );
  }

  const verificationResult = await verifyEmailAction(cleanToken, {
    skipCacheUpdate: true,
  });

  if (!verificationResult.success) {
    return (
      <main className="flex flex-col items-center text-center gap-6 w-full animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-2xl bg-danger-500/15 border border-danger-500/35 flex items-center justify-center text-danger-400">
          <ShieldAlert size={28} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-neutral-50">
            {t("errorTitle")}
          </h1>
          <p className="text-sm text-neutral-300">
            {verificationResult.error || t("fallbackError")}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="w-full py-3 px-6 rounded-xl bg-gold text-neutral-950 font-bold hover:bg-gold-hover transition-colors text-center"
        >
          {t("backToHabitParty")}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center text-center gap-6 w-full animate-in fade-in duration-300">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400">
        <CheckCircle2 size={28} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-50">
          {t("successTitle")}
        </h1>
        <p className="text-sm text-neutral-300">{t("successDesc")}</p>
      </div>
      <form action={redirectAfterEmailVerificationAction} className="w-full">
        <button
          type="submit"
          className="w-full py-3 px-6 rounded-xl bg-gold text-neutral-950 font-bold hover:bg-gold-hover transition-colors text-center cursor-pointer"
        >
          {t("continueToApp")}
        </button>
      </form>
    </main>
  );
}
