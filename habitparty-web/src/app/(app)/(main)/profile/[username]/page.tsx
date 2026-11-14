import { ArrowLeft, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { PublicShowcaseView } from "@/components/showcase/PublicShowcaseView";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import {
  getPublicUserRetrospective,
  getPublicUserShowcase,
} from "@/services/showcaseService";
import { getCurrentUser } from "@/services/userService";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const [{ username }, t] = await Promise.all([
    params,
    getTranslations("showcase.metadata"),
  ]);
  const cleanHandle = decodeURIComponent(username);
  return {
    title: `@${cleanHandle} | HabitParty`,
    description: t("description"),
  };
}

async function PublicProfileContent({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);

  const [currentUser, publicShowcase, publicRetrospective, t] =
    await Promise.all([
      getCurrentUser(),
      getPublicUserShowcase(decodedUsername),
      getPublicUserRetrospective(decodedUsername),
      getTranslations("showcase.publicProfile"),
    ]);

  if (!currentUser) {
    redirect("/signIn");
  }

  const isGamified = currentUser.experienceMode !== "PRODUCTIVITY";

  if (!publicShowcase) {
    return (
      <div className="flex flex-col items-center justify-center max-w-lg mx-auto my-12 rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/55 p-8 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface border border-neutral-700 flex items-center justify-center text-neutral-400">
          <UserX size={28} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-neutral-100">
            {t("notFoundTitle")}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">{t("notFoundDesc")}</p>
        </div>
        <Link
          href="/profile?tab=friends"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 transition-colors"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>{t("backToFriends")}</span>
        </Link>
      </div>
    );
  }

  return (
    <PublicShowcaseView
      data={publicShowcase}
      retrospective={publicRetrospective}
      statsSlot={
        publicShowcase.canViewStats && publicShowcase.stats ? (
          <ShowcaseStatsGrid
            stats={publicShowcase.stats}
            isGamified={isGamified}
          />
        ) : undefined
      }
    />
  );
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  return (
    <Suspense fallback={<RouteLoading route="showcase" />}>
      <ScopedIntlProvider scope="showcase">
        <PageWrapper>
          <PublicProfileContent params={params} />
        </PageWrapper>
      </ScopedIntlProvider>
    </Suspense>
  );
}
