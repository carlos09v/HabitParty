import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { FocusContainer } from "@/components/focus/FocusContainer";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getFocusPageData } from "@/services/focusService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("focus.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

type PageProps = {
  searchParams: Promise<{ activityId?: string; createActivity?: string }>;
};

/**
 * Página Principal do Modo Foco (Server Component)
 * Carrega atividades cadastradas, itens da mochila em foco e histórico inicial de sessões.
 */
export default async function FocusPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const { activities, backpackItems, initialRecords, focusableTasks } =
    await getFocusPageData();

  return (
    <ScopedIntlProvider scope="focus">
      <Suspense fallback={null}>
        <FocusContainer
          initialActivities={activities}
          initialBackpackItems={backpackItems}
          initialRecords={initialRecords}
          initialFocusableTasks={focusableTasks}
          initialSelectedActivityId={resolvedSearchParams.activityId || null}
          initialCreateActivity={resolvedSearchParams.createActivity === "true"}
        />
      </Suspense>
    </ScopedIntlProvider>
  );
}
