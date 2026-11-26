import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ShowcaseContainer } from "@/components/showcase/ShowcaseContainer";
import { ShowcaseStatsGrid } from "@/components/showcase/ShowcaseStatsGrid";
import { RetryRefreshButton } from "@/components/ui/RetryRefreshButton";
import { ExperienceModeFallbackProvider } from "@/hooks/useExperienceMode";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import {
  getMyRetrospective,
  getMyShowcaseWithStatus,
} from "@/services/showcaseService";
import { getFriendsOverview } from "@/services/socialService";
import { getCurrentUser } from "@/services/userService";
import { resolveExperienceMode } from "@/utils/experienceMode";
import { resolveShowcaseTab } from "@/utils/showcaseUtils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("showcase.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type ProfileShowcasePageProps = {
  searchParams: Promise<{ tab?: string | string[] }>;
};

export default async function ProfileShowcasePage({
  searchParams,
}: ProfileShowcasePageProps) {
  const resolvedParams = await searchParams;
  const initialTab = resolveShowcaseTab(resolvedParams.tab);

  // Evita over-fetching pesado no carregamento inicial: Amigos e Retrospectiva só são
  // buscados em SSR quando o usuário abre diretamente abas que os consomem via URL.
  const [showcaseResult, friendsOverview, retrospective] = await Promise.all([
    getMyShowcaseWithStatus(),
    initialTab === "friends" || initialTab === "progression"
      ? getFriendsOverview()
      : Promise.resolve(null),
    initialTab === "retrospective"
      ? getMyRetrospective()
      : Promise.resolve(null),
  ]);

  if (showcaseResult.unauthorized) {
    redirect("/signIn");
  }

  const resolvedUser = showcaseResult.data?.user ?? (await getCurrentUser());
  if (!resolvedUser) {
    redirect("/signIn");
  }

  const resolvedMode = resolveExperienceMode(resolvedUser.experienceMode);

  if (showcaseResult.error || !showcaseResult.data) {
    const tError = await getTranslations("showcase.errorState");
    return (
      <ExperienceModeFallbackProvider mode={resolvedMode}>
        <PageWrapper>
          <div
            role="alert"
            className="flex flex-col items-center justify-center max-w-lg mx-auto my-12 rounded-2xl border border-red-500/35 bg-card dark:bg-surface/60 p-8 text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/35 flex items-center justify-center text-red-700 dark:text-red-400">
              <AlertTriangle size={26} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-neutral-100">
                {tError("title")}
              </h1>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {tError("description")}
              </p>
            </div>
            <RetryRefreshButton
              label={tError("retry")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-amber-300 shadow-glow-gold-xs transition-colors cursor-pointer disabled:opacity-60"
            />
          </div>
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    );
  }

  const resolvedShowcase = showcaseResult.data;

  return (
    <ScopedIntlProvider scope="showcase">
      <ExperienceModeFallbackProvider mode={resolvedMode}>
        <PageWrapper>
          <ShowcaseContainer
            initialShowcase={resolvedShowcase}
            initialFriendsOverview={friendsOverview}
            initialRetrospective={retrospective}
            initialTab={initialTab}
            statsSlot={<ShowcaseStatsGrid stats={resolvedShowcase.stats} />}
          />
        </PageWrapper>
      </ExperienceModeFallbackProvider>
    </ScopedIntlProvider>
  );
}
