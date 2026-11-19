import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FirstStepWizard } from "@/components/onboarding/FirstStepWizard";
import { getCurrentUser } from "@/services/userService";
import { getWorkspaces } from "@/services/workspaceService";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FirstStepPage() {
  const [workspaces, user, headerStore] = await Promise.all([
    getWorkspaces(),
    getCurrentUser(),
    headers(),
  ]);

  // Evita reexecução acidental via URL/Histórico após o usuário já possuir workspaces,
  // mantendo o fluxo de retorno da Server Action intacto durante a conclusão do wizard.
  if (!headerStore.has("next-action") && workspaces.length > 0) {
    redirect("/dashboard");
  }

  return <FirstStepWizard initialUser={user} />;
}
