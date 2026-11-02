import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FocusContainer } from "@/components/focus/FocusContainer";
import { getFocusPageData } from "@/services/focusService";
import { getCompactMode } from "@/utils/cookies";

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
  const isCompact = await getCompactMode();
  const resolvedSearchParams = await searchParams;

  const { activities, backpackItems, initialRecords } =
    await getFocusPageData();

  return (
    <FocusContainer
      initialActivities={activities}
      initialBackpackItems={backpackItems}
      initialRecords={initialRecords}
      initialSelectedActivityId={resolvedSearchParams.activityId || null}
      initialCreateActivity={resolvedSearchParams.createActivity === "true"}
      isCompact={isCompact}
    />
  );
}
