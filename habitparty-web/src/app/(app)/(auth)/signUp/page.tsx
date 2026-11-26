import { Crown, Sparkles } from "lucide-react";
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

interface SignUpPageProps {
  searchParams?: Promise<{ plan?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [resolvedParams, t] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({} as { plan?: string }),
    getTranslations("auth.signUp"),
  ]);

  const selectedPlan =
    resolvedParams.plan === "founder" || resolvedParams.plan === "guardian"
      ? resolvedParams.plan
      : undefined;

  return (
    <AuthPageShell
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("hasAccount")}
      footerLinkText={t("signInLink")}
      footerLinkHref="/signIn"
    >
      {selectedPlan && (
        <div
          className={
            selectedPlan === "founder"
              ? "flex items-start gap-2.5 rounded-xl border border-amber-500/35 dark:border-gold/40 bg-amber-500/10 dark:bg-gold/10 px-3.5 py-2.5 text-xs text-neutral-100"
              : "flex items-start gap-2.5 rounded-xl border border-primary/35 dark:border-primary-light/40 bg-primary/10 dark:bg-primary/15 px-3.5 py-2.5 text-xs text-neutral-100"
          }
        >
          {selectedPlan === "founder" ? (
            <Crown
              className="w-4 h-4 text-gold-ink dark:text-gold shrink-0 mt-0.5"
              aria-hidden="true"
            />
          ) : (
            <Sparkles
              className="w-4 h-4 text-primary dark:text-primary-light shrink-0 mt-0.5"
              aria-hidden="true"
            />
          )}
          <span className="leading-snug font-medium">
            {t(`planBanner.${selectedPlan}`)}
          </span>
        </div>
      )}
      <SignUpForm />
    </AuthPageShell>
  );
}
