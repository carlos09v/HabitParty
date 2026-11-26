import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FocusContainer } from "@/components/focus/FocusContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import {
  getFocusCriticalPageData,
  getFocusInitialHistoryBundle,
} from "@/services/focusService";
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
    itemId?: string;
    createActivity?: string;
    linkActivity?: string;
    from?: string;
  }>;
};

/**
 * Página Principal do Modo Foco (Server Component)
 * Carrega dados críticos (atividades, mochila e tarefas) imediatamente e faz streaming
 * via `<Suspense>` do resumo agregado (`GET /focus-records/summary`) + 1ª página leve de registros.
 */
export default async function FocusPage({ searchParams }: PageProps) {
  const [resolvedSearchParams, criticalData, user] = await Promise.all([
    searchParams,
    getFocusCriticalPageData(),
    getCurrentUser(),
  ]);

  const initialActivityId = resolvedSearchParams.activityId || null;
  const userTimeZone = user?.timezone ?? null;

  // Não aguarda o histórico/resumo antes de entregar o HTML inicial do Palco de Foco
  const historyBundlePromise = getFocusInitialHistoryBundle(
    criticalData.activities,
    criticalData.allInventoryItems,
    {
      initialActivityId,
      timeZone: userTimeZone,
    },
  );

  return (
    <ScopedIntlProvider scope="focus">
      <FocusContainer
        initialActivities={criticalData.activities}
        initialBackpackItems={criticalData.backpackItems}
        initialAllInventoryItems={criticalData.allInventoryItems}
        historyBundlePromise={historyBundlePromise}
        initialFocusableTasks={criticalData.focusableTasks}
        initialSelectedActivityId={initialActivityId}
        initialSelectedItemId={resolvedSearchParams.itemId || null}
        initialCreateActivity={resolvedSearchParams.createActivity === "true"}
        initialLinkActivity={resolvedSearchParams.linkActivity === "true"}
        initialFromSource={resolvedSearchParams.from || null}
        initialDailyFocusGoalMinutes={user?.dailyFocusGoalMinutes ?? null}
        initialTimeZone={userTimeZone}
        initialIsPremium={Boolean(user?.isPremium)}
        initialExperienceMode={user?.experienceMode ?? "PRODUCTIVITY"}
      />
    </ScopedIntlProvider>
  );
}
