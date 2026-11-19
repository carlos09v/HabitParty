import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FocusContainer } from "@/components/focus/FocusContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getFocusPageData } from "@/services/focusService";
import { getCurrentUser } from "@/services/userService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("focus.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  searchParams: Promise<{
    activityId?: string;
    createActivity?: string;
    linkActivity?: string;
    from?: string;
  }>;
};

/**
 * Página Principal do Modo Foco (Server Component)
 * Carrega atividades cadastradas, itens da mochila em foco e histórico inicial de sessões.
 */
export default async function FocusPage({ searchParams }: PageProps) {
  const [resolvedSearchParams, focusPageData, user] = await Promise.all([
    searchParams,
    getFocusPageData(),
    getCurrentUser(),
  ]);

  const {
    activities,
    backpackItems,
    initialRecords,
    totalRecordsCount,
    hasMoreRecords,
    initialLoadedRecordsPage,
    focusableTasks,
  } = focusPageData;

  return (
    <ScopedIntlProvider scope="focus">
      <FocusContainer
        initialActivities={activities}
        initialBackpackItems={backpackItems}
        initialRecords={initialRecords}
        initialTotalRecordsCount={totalRecordsCount}
        initialHasMoreRecords={hasMoreRecords}
        initialLoadedRecordsPage={initialLoadedRecordsPage}
        initialFocusableTasks={focusableTasks}
        initialSelectedActivityId={resolvedSearchParams.activityId || null}
        initialCreateActivity={resolvedSearchParams.createActivity === "true"}
        initialLinkActivity={resolvedSearchParams.linkActivity === "true"}
        initialFromSource={resolvedSearchParams.from || null}
        initialDailyFocusGoalMinutes={user?.dailyFocusGoalMinutes ?? null}
      />
    </ScopedIntlProvider>
  );
}
