import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FirstStepWizard } from "@/components/onboarding/FirstStepWizard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function FirstStepPage() {
  return <FirstStepWizard />;
}
