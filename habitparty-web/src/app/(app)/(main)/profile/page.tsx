import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ShowcaseContainer } from "@/components/showcase/ShowcaseContainer";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getMyShowcase } from "@/services/showcaseService";
import { getCurrentUser } from "@/services/userService";
import { createEmptyShowcaseData } from "@/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("showcase.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ProfileShowcasePage() {
  const showcaseData = await getMyShowcase();

  const resolvedUser = showcaseData?.user ?? (await getCurrentUser());
  if (!resolvedUser) {
    redirect("/signIn");
  }

  const resolvedShowcase =
    showcaseData || createEmptyShowcaseData(resolvedUser);
  const isGamified = resolvedUser.experienceMode !== "PRODUCTIVITY";

  return (
    <ScopedIntlProvider scope="showcase">
      <PageWrapper>
        <ShowcaseContainer
          initialShowcase={resolvedShowcase}
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
