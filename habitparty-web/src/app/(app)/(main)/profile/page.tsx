import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ShowcaseContainer } from "@/components/showcase/ShowcaseContainer";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getMyRetrospective, getMyShowcase } from "@/services/showcaseService";
import { getFriendsOverview } from "@/services/socialService";
import { getCurrentUser } from "@/services/userService";
import { createEmptyShowcaseData, resolveShowcaseTab } from "@/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("showcase.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type ProfileShowcasePageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProfileShowcasePage({
  searchParams,
}: ProfileShowcasePageProps) {
  const [resolvedParams, showcaseData, friendsOverview, retrospective] =
    await Promise.all([
      searchParams,
      getMyShowcase(),
      getFriendsOverview(),
      getMyRetrospective(),
    ]);

  const resolvedUser = showcaseData?.user ?? (await getCurrentUser());
  if (!resolvedUser) {
    redirect("/signIn");
  }

  const resolvedShowcase =
    showcaseData || createEmptyShowcaseData(resolvedUser);
  const isGamified = resolvedUser.experienceMode !== "PRODUCTIVITY";
  const initialTab = resolveShowcaseTab(resolvedParams.tab);

  return (
    <ScopedIntlProvider scope="showcase">
      <PageWrapper>
        <ShowcaseContainer
          initialShowcase={resolvedShowcase}
          initialFriendsOverview={friendsOverview}
          initialRetrospective={retrospective}
          initialTab={initialTab}
          statsSlot={
            <ShowcaseStatsGrid
              stats={resolvedShowcase.stats}
              isGamified={isGamified}
            />
          }
        />
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
