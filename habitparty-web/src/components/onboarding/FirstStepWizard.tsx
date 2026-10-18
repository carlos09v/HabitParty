"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setFirstStepPreferencesAction } from "@/actions/ui";
import { createWorkspaceAction } from "@/actions/workspaceActions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { USAGE_MODES } from "@/constants/onboarding";
import { useThemeMode } from "@/hooks/useThemeMode";
import type { ModeOption, UsageMode } from "@/types/onboarding";
import { AppearanceSelector } from "./AppearanceSelector";
import { UsageModeSelector } from "./UsageModeSelector";
import { WorkspaceSetupCard } from "./WorkspaceSetupCard";

export function FirstStepWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme, isDark } = useThemeMode();

  // 1. Estado do Modo de Uso
  const [selectedMode, setSelectedMode] = useState<UsageMode>("personal");

  // 2. Estado do Workspace Inicial
  const currentModeConfig =
    USAGE_MODES.find((m) => m.id === selectedMode) || USAGE_MODES[0];
  const [workspaceName, setWorkspaceName] = useState(
    currentModeConfig.defaultWorkspace,
  );
  const [hasManuallyEditedName, setHasManuallyEditedName] = useState(false);

  const handleSelectMode = (mode: ModeOption) => {
    setSelectedMode(mode.id);
    if (!hasManuallyEditedName) {
      setWorkspaceName(mode.defaultWorkspace);
    }
  };

  const handleSelectChip = (chip: string) => {
    setWorkspaceName(chip);
    setHasManuallyEditedName(true);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = workspaceName.trim();
    if (!trimmedName) {
      toast.error("Por favor, digite um nome para o seu primeiro ambiente.");
      return;
    }

    if (trimmedName.length > 12) {
      toast.error("O nome do ambiente deve ter até 12 caracteres.");
      return;
    }

    startTransition(async () => {
      // 1. Criar o Workspace inicial no Backend
      const result = await createWorkspaceAction({
        name: trimmedName,
      });

      if (!result.success) {
        toast.error(
          result.error ||
            "Não foi possível criar o ambiente. Tente novamente em instantes.",
        );
        return;
      }

      if (!result.data?.id) {
        toast.error("O ambiente foi criado sem um identificador válido.");
        return;
      }

      // 2. Salvar preferências de modo de uso e workspace ativa nos cookies do servidor
      await setFirstStepPreferencesAction(selectedMode, result.data.id);

      toast.success(
        `Ambiente "${result.data.name}" criado com sucesso! Bem-vindo(a) ao HabitParty!`,
      );
      router.push("/dashboard");
    });
  };

  return (
    <form
      onSubmit={handleFinish}
      className="w-full flex-1 flex flex-col justify-center animate-in fade-in duration-300 py-2"
    >
      <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 lg:gap-10 py-1">
        {/* ==================================================== */}
        {/* LADO ESQUERDO: Objetivo Principal & Modo de Uso       */}
        {/* ==================================================== */}
        <section className="w-full lg:w-1/2 flex flex-col gap-4">
          <header className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] lg:text-[11px] font-bold uppercase tracking-wider">
              <Star size={12} className="fill-gold" />
              Personalização
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-50 tracking-tight">
              Personalize sua Experiência
            </h1>
            <p className="text-xs sm:text-body-s text-neutral-300 max-w-lg leading-relaxed">
              Vamos calibrar sua jornada no HabitParty. Escolha seu objetivo
              principal para prepararmos seu primeiro espaço.
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
              setWorkspaceName(name);
              setHasManuallyEditedName(true);
            }}
            chips={currentModeConfig.chips}
            onSelectChip={handleSelectChip}
            disabled={isPending}
          />

          <AppearanceSelector
            theme={theme}
            onSetTheme={setTheme}
            isDark={isDark}
          />

          <div className="flex flex-col gap-2 pt-1">
            <SubmitButton
              isPending={isPending}
              disabled={!workspaceName.trim()}
              loadingText="Preparando seu ambiente e dashboard..."
            >
              Criar Ambiente e Começar Minha Jornada
            </SubmitButton>
            <p className="text-center text-[11px] text-neutral-400">
              Você será direcionado diretamente ao painel principal ao concluir.
            </p>
          </div>
        </section>
      </div>
    </form>
  );
}
