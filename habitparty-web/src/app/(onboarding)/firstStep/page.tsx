import type { Metadata } from "next";
import { FirstStepWizard } from "@/components/onboarding/FirstStepWizard";

export const metadata: Metadata = {
  title: "Configuração Inicial — HabitParty",
  description:
    "Personalize seu modo de uso, crie seu primeiro ambiente e defina a aparência inicial.",
};

export default function FirstStepPage() {
  return <FirstStepWizard />;
}
