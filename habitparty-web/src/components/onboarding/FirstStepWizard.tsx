"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { completeFirstStepOnboardingAction } from "@/actions/ui";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { ModeOption, UsageMode } from "@/types/onboarding";
import type { ExperienceMode } from "@/types/ui";
import { ExperienceModeSelector } from "./ExperienceModeSelector";
import { UsageModeSelector } from "./UsageModeSelector";
import { WorkspaceSetupCard } from "./WorkspaceSetupCard";

export function FirstStepWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("onboarding.wizard");
  const tUsage = useTranslations("onboarding.usageModes");

  // 1. Estado do Modo de Uso
  const [selectedMode, setSelectedMode] = useState<UsageMode>("personal");

  // 2. Estado do Estilo de Experiência (Gamificado vs Produtividade) + Calibragem
  const [experienceMode, setExperienceModeState] =
    useState<ExperienceMode>("PRODUCTIVITY");
  const uiSoundsEnabled = useSoundPreferencesStore((s) => s.uiSoundsEnabled);
  const setUiSoundsEnabled = useSoundPreferencesStore(
    (s) => s.setUiSoundsEnabled,
  );
  const setTimerSoundType = useSoundPreferencesStore(
    (s) => s.setTimerSoundType,
  );

  const handleSelectExperienceMode = (mode: ExperienceMode) => {
    setExperienceModeState(mode);
    if (mode === "PRODUCTIVITY") {
      setTimerSoundType("zen");
    } else {
      setUiSoundsEnabled(true);
    }
  };

  // 3. Estado do Workspace Inicial (reativo ao modo e ao idioma enquanto não editado manualmente)
  const defaultWorkspaceName = tUsage(`modes.${selectedMode}.defaultWorkspace`);
  const currentChips =
    (tUsage.raw(`modes.${selectedMode}.chips`) as string[]) || [];
  const [customWorkspaceName, setCustomWorkspaceName] = useState<string | null>(
    null,
  );
  const workspaceName = customWorkspaceName ?? defaultWorkspaceName;

  const handleSelectMode = (mode: ModeOption) => {
    setSelectedMode(mode.id);
  };

  const handleSelectChip = (chip: string) => {
    setCustomWorkspaceName(chip);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      toast.error(t("validation.nameRequired"));
      return;
    }

    if (trimmedName.length > 25) {
      toast.error(t("validation.nameMaxLength"));
      return;
    }

    startTransition(async () => {
      const result = await completeFirstStepOnboardingAction({
        workspaceName: trimmedName,
        usageMode: selectedMode,
        experienceMode,
      });

      if (!result.success) {
        toast.error(result.error || t("validation.createFailed"));
        return;
      }

      if (!result.data?.id) {
        toast.error(t("validation.invalidId"));
        return;
      }

      useUIStore.setState({
        experienceMode,
      });
      useUserStore.getState().updateUserPartial({ experienceMode });

      toast.success(
        t("successToast", { name: result.data.name || trimmedName }),
      );
      router.push("/dashboard");
    });
  };

  return (
    <form
      onSubmit={handleFinish}
      className="w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300 py-2"
    >
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start justify-between gap-6 lg:gap-10 py-1">
        {/* ==================================================== */}
        {/* LADO ESQUERDO: Objetivo Principal & Modo de Uso       */}
        {/* ==================================================== */}
        <section className="w-full lg:w-1/2 flex flex-col gap-4">
          <header className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-gold/10 border border-amber-500/35 dark:border-gold/30 text-amber-700 dark:text-gold text-[10px] lg:text-[11px] font-bold uppercase tracking-wider">
              <Star
                size={12}
                className="text-amber-600 fill-amber-500 dark:text-gold dark:fill-gold"
              />
              {t("badge")}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-50 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs sm:text-body-s text-neutral-300 max-w-lg leading-relaxed">
              {t("subtitle")}
            </p>
          </header>

          <UsageModeSelector
            selectedMode={selectedMode}
            onSelectMode={handleSelectMode}
            disabled={isPending}
          />
        </section>

        {/* ==================================================== */}
        {/* LADO DIREITO: Primeiro Workspace + Tema + Botão      */}
        {/* ==================================================== */}
        <section className="w-full lg:w-1/2 flex flex-col gap-3.5">
          <WorkspaceSetupCard
            workspaceName={workspaceName}
            onChangeName={(name) => {
              setCustomWorkspaceName(name);
            }}
            chips={currentChips}
            onSelectChip={handleSelectChip}
            disabled={isPending}
          />

          <ExperienceModeSelector
            experienceMode={experienceMode}
            onSelectExperienceMode={handleSelectExperienceMode}
            uiSoundsEnabled={uiSoundsEnabled}
            onToggleSounds={setUiSoundsEnabled}
            disabled={isPending}
          />

          <div className="flex flex-col gap-2 pt-1">
            <SubmitButton
              isPending={isPending}
              disabled={!workspaceName.trim()}
              loadingText={t("submitting")}
            >
              {t("submit")}
            </SubmitButton>
            <p className="text-center text-[11px] text-neutral-400">
              {t("redirectHint")}
            </p>
          </div>
        </section>
      </div>
    </form>
  );
}
