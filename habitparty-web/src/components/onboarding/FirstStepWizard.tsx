"use client";

import { ArrowLeft, ArrowRight, Check, Rocket, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { completeFirstStepOnboardingAction } from "@/actions/ui";
import {
  DEFAULT_STARTER_PACK_SELECTIONS,
  MAX_PRIMARY_GOALS,
  MAX_WORKSPACE_NAME_LENGTH,
  resolveInitialDailyFocusGoal,
  resolveInitialDisciplineStyle,
  resolveInitialMainObstacle,
  resolveInitialPeakPeriod,
  resolveInitialPrimaryGoals,
  resolveInitialUsageMode,
} from "@/constants/onboarding";
import { useThemeMode } from "@/hooks/useThemeMode";
import {
  useSoundPreferences,
  useSoundPreferencesStore,
} from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DailyFocusGoalMinutes,
  DisciplineStyle,
  MainObstacle,
  PeakPeriod,
  PrimaryGoal,
  StarterPackSelections,
  UsageMode,
} from "@/types/onboarding";
import type { ExperienceMode, ThemeId } from "@/types/ui";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";
import { ExperienceModeSelector } from "./ExperienceModeSelector";
import { OnboardingStepHeader } from "./OnboardingStepHeader";
import { ProfileContextStep } from "./ProfileContextStep";
import { RhythmAndThemeStep } from "./RhythmAndThemeStep";
import { StarterPackCard } from "./StarterPackCard";
import { UsageModeSelector } from "./UsageModeSelector";
import { WorkspaceSetupCard } from "./WorkspaceSetupCard";

type WizardStep = 1 | 2 | 3;
const WIZARD_STEPS: readonly WizardStep[] = [1, 2, 3] as const;

interface FirstStepWizardProps {
  initialUser?: UserResponseDTO | null;
}

export function FirstStepWizard({ initialUser = null }: FirstStepWizardProps) {
  const router = useRouter();
  const t = useTranslations("onboarding.wizard");
  const tUsage = useTranslations("onboarding.usageModes");

  // Estado elevado entre as 3 etapas para nunca perder escolhas em Back/Next
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [usageMode, setUsageMode] = useState<UsageMode>(() =>
    resolveInitialUsageMode(initialUser?.usageMode),
  );
  const [primaryGoals, setPrimaryGoals] = useState<PrimaryGoal[]>(() =>
    resolveInitialPrimaryGoals(initialUser?.primaryGoals),
  );
  const [mainObstacle, setMainObstacle] = useState<MainObstacle>(() =>
    resolveInitialMainObstacle(initialUser?.mainObstacle),
  );
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>(() =>
    initialUser?.experienceMode === "GAMIFIED" ? "GAMIFIED" : "PRODUCTIVITY",
  );
  const [dailyFocusGoalMinutes, setDailyFocusGoalMinutes] =
    useState<DailyFocusGoalMinutes>(() =>
      resolveInitialDailyFocusGoal(initialUser?.dailyFocusGoalMinutes),
    );
  const [peakPeriod, setPeakPeriod] = useState<PeakPeriod>(() =>
    resolveInitialPeakPeriod(initialUser?.peakPeriod),
  );
  const [disciplineStyle, setDisciplineStyle] = useState<DisciplineStyle>(() =>
    resolveInitialDisciplineStyle(initialUser?.disciplineStyle),
  );

  const { theme: activeTheme, setTheme } = useThemeMode();
  const {
    uiSoundsEnabled,
    toggleUiSounds,
    setTimerSoundType,
    mounted: soundsMounted,
  } = useSoundPreferences();

  // `null` enquanto o usuário não editou manualmente o nome, permitindo
  // reagir tanto à troca de `usageMode` quanto à troca de idioma (PT <-> EN).
  const [customWorkspaceName, setCustomWorkspaceName] = useState<string | null>(
    null,
  );
  const workspaceName =
    customWorkspaceName ?? tUsage(`options.${usageMode}.defaultWorkspace`);

  const [startBlank, setStartBlank] = useState(false);
  const [starterPack, setStarterPack] = useState<StarterPackSelections>(
    DEFAULT_STARTER_PACK_SELECTIONS,
  );

  // Validação após interação (validate-input-after-interaction)
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [workspaceTouched, setWorkspaceTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (currentStep === 3) {
      router.prefetch("/dashboard");
    }
  }, [currentStep, router]);

  const transitionToStep = (nextStep: WizardStep) => {
    setCurrentStep(nextStep);
    requestAnimationFrame(() => {
      stepHeadingRef.current?.focus();
    });
  };

  const handleToggleGoal = (goal: PrimaryGoal) => {
    setPrimaryGoals((prev) => {
      if (prev.includes(goal)) {
        return prev.filter((item) => item !== goal);
      }
      if (prev.length >= MAX_PRIMARY_GOALS) {
        return [...prev.slice(1), goal];
      }
      return [...prev, goal];
    });
  };

  const handleExperienceModeSelect = (nextMode: ExperienceMode) => {
    setExperienceMode(nextMode);
    const currentTimerSound =
      useSoundPreferencesStore.getState().timerSoundType;
    if (nextMode === "PRODUCTIVITY" && currentTimerSound === "arcade") {
      setTimerSoundType("zen");
    } else if (nextMode === "GAMIFIED" && currentTimerSound === "zen") {
      setTimerSoundType("arcade");
    }
  };

  const handleToggleUiSounds = () => {
    const willEnable = !useSoundPreferencesStore.getState().uiSoundsEnabled;
    toggleUiSounds();
    if (willEnable) {
      soundEffects.playHabitSound();
    }
  };

  const handleThemeSelect = (themeId: ThemeId) => {
    setTheme(themeId);
  };

  const handleWorkspaceNameChange = (value: string) => {
    setCustomWorkspaceName(value.slice(0, MAX_WORKSPACE_NAME_LENGTH));
  };

  const handleToggleStarterItem = (key: keyof StarterPackSelections) => {
    setStarterPack((prev) => {
      const nextValue = !prev[key];
      // Tarefas iniciais dependem das colunas do Starter Pack
      if (key === "createColumns" && !nextValue) {
        return { ...prev, createColumns: false, createTasks: false };
      }
      if (key === "createTasks" && nextValue && !prev.createColumns) {
        return { ...prev, createColumns: true, createTasks: true };
      }
      return {
        ...prev,
        [key]: nextValue,
      };
    });
  };

  const goalsError =
    step1Submitted && primaryGoals.length === 0
      ? t("validation.selectAtLeastOneGoal")
      : null;

  const trimmedWorkspaceName = workspaceName.trim();
  const workspaceError =
    (workspaceTouched || submitAttempted) && trimmedWorkspaceName.length === 0
      ? t("validation.workspaceRequired")
      : null;

  const goToStep = (nextStep: WizardStep) => {
    if (nextStep > 1 && primaryGoals.length === 0) {
      setStep1Submitted(true);
      transitionToStep(1);
      return;
    }
    transitionToStep(nextStep);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (primaryGoals.length === 0) {
        setStep1Submitted(true);
        return;
      }
      transitionToStep(2);
      return;
    }
    if (currentStep === 2) {
      transitionToStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) transitionToStep(1);
    if (currentStep === 3) transitionToStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || currentStep !== 3) return;

    setSubmitAttempted(true);
    if (trimmedWorkspaceName.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const clientTimeZone =
        typeof Intl !== "undefined"
          ? Intl.DateTimeFormat().resolvedOptions().timeZone
          : undefined;
      const latestTheme = (useUIStore.getState().theme ||
        activeTheme) as ThemeId;

      const result = await completeFirstStepOnboardingAction({
        workspaceName: trimmedWorkspaceName,
        usageMode,
        experienceMode,
        theme: latestTheme,
        primaryGoals,
        mainObstacle,
        dailyFocusGoalMinutes,
        peakPeriod,
        disciplineStyle,
        startBlank,
        starterPack,
        clientTimeZone,
      });

      if (!result?.success || !result.data?.id) {
        toast.error((!result?.success && result?.error) || t("errorToast"));
        setIsSubmitting(false);
        return;
      }

      const createdWorkspace = result.data;

      useUIStore.setState({
        experienceMode,
      });

      const userStore = useUserStore.getState();
      if (userStore.user) {
        userStore.updateUserPartial({
          experienceMode,
          theme: latestTheme,
          usageMode,
          primaryGoals,
          mainObstacle,
          dailyFocusGoalMinutes,
          peakPeriod,
          disciplineStyle,
        });
      }

      useWorkspaceStore.setState((state) => ({
        workspaces: state.workspaces.some((w) => w.id === createdWorkspace.id)
          ? state.workspaces
          : [...state.workspaces, createdWorkspace],
        activeWorkspaceId: createdWorkspace.id ?? null,
      }));

      toast.success(
        t("successToast", {
          name: createdWorkspace.name || trimmedWorkspaceName,
        }),
      );
      if (result.starterPackPartialWarning) {
        toast.warning(t("partialWarningToast"));
      }
      router.replace("/dashboard");
    } catch {
      toast.error(t("errorToast"));
      setIsSubmitting(false);
    }
  };

  const isGamified = experienceMode === "GAMIFIED";

  return (
    <section className="w-full max-w-5xl mx-auto flex flex-col gap-5 py-2 sm:py-4">
      {/* Cabeçalho introdutório + Progresso acessível */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/30 text-amber-800 dark:bg-gold/15 dark:border-gold/35 dark:text-gold text-xs font-bold">
            <Sparkles size={13} aria-hidden="true" />
            {t("badge")}
          </span>
          <span className="text-xs font-semibold text-neutral-300 tabular-nums">
            {t("stepCounter", { current: currentStep, total: 3 })}
          </span>
        </div>

        <h1 className="text-title-m sm:text-title-l font-bold text-neutral-100 leading-tight">
          {t("title")}
        </h1>
        <p className="text-body-s text-neutral-300 max-w-2xl">
          {t("subtitle")}
        </p>

        {/* Indicador acessível de progresso (nav + aria-current="step") */}
        <nav aria-label={t("stepsNavLabel")} className="mt-1">
          <ol className="grid grid-cols-3 gap-2 sm:gap-3">
            {WIZARD_STEPS.map((stepNum) => {
              const isActive = currentStep === stepNum;
              const isCompleted = stepNum < currentStep;
              const canJump = stepNum <= currentStep;

              return (
                <li key={stepNum}>
                  <button
                    type="button"
                    disabled={!canJump}
                    onClick={() => canJump && goToStep(stepNum)}
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "w-full min-h-[48px] px-3 py-2 rounded-xl border flex items-center gap-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold",
                      isActive
                        ? "bg-primary/15 border-amber-500/80 dark:bg-primary/25 dark:border-gold text-neutral-100 shadow-xs"
                        : isCompleted
                          ? "bg-emerald-500/10 border-emerald-500/40 text-neutral-100 cursor-pointer hover:bg-emerald-500/15"
                          : "bg-card/50 border-neutral-700/60 text-neutral-400 cursor-not-allowed opacity-75",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0",
                        isActive
                          ? "bg-amber-500 text-slate-950 dark:bg-gold dark:text-slate-950"
                          : isCompleted
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-surface text-neutral-400 border border-neutral-700",
                      )}
                    >
                      {isCompleted ? <Check size={13} /> : stepNum}
                    </span>
                    <span className="text-xs font-bold truncate">
                      {t(`steps.${stepNum}.shortLabel`)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Formulário ativo apenas com a etapa corrente no DOM (fora da ordem de Tab se inativo) */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="rounded-2xl p-4 sm:p-6 flex flex-col gap-5 bg-card/90 dark:bg-surface/65 border border-neutral-700/80 dark:border-primary/25 shadow-lg">
          {currentStep === 1 && (
            <div className="flex flex-col gap-5">
              <OnboardingStepHeader
                step={1}
                title={t("steps.1.heading")}
                headingRef={stepHeadingRef}
              />
              <UsageModeSelector
                selectedMode={usageMode}
                onSelect={setUsageMode}
              />
              <ProfileContextStep
                primaryGoals={primaryGoals}
                onToggleGoal={handleToggleGoal}
                mainObstacle={mainObstacle}
                onSelectObstacle={setMainObstacle}
                goalsError={goalsError}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              <OnboardingStepHeader
                step={2}
                title={t("steps.2.heading")}
                headingRef={stepHeadingRef}
              />
              <ExperienceModeSelector
                selectedMode={experienceMode}
                onSelect={handleExperienceModeSelect}
              />
              <RhythmAndThemeStep
                experienceMode={experienceMode}
                dailyFocusGoalMinutes={dailyFocusGoalMinutes}
                onSelectFocusGoal={setDailyFocusGoalMinutes}
                peakPeriod={peakPeriod}
                onSelectPeakPeriod={setPeakPeriod}
                disciplineStyle={disciplineStyle}
                onSelectDiscipline={setDisciplineStyle}
                selectedTheme={activeTheme as ThemeId}
                onSelectTheme={handleThemeSelect}
                uiSoundsEnabled={soundsMounted ? uiSoundsEnabled : true}
                onToggleUiSounds={handleToggleUiSounds}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              <OnboardingStepHeader
                step={3}
                title={t("steps.3.heading")}
                headingRef={stepHeadingRef}
              />
              <WorkspaceSetupCard
                workspaceName={workspaceName}
                onChangeName={handleWorkspaceNameChange}
                onBlurName={() => setWorkspaceTouched(true)}
                usageMode={usageMode}
                errorMessage={workspaceError}
              />
              <StarterPackCard
                usageMode={usageMode}
                primaryGoals={primaryGoals}
                mainObstacle={mainObstacle}
                experienceMode={experienceMode}
                dailyFocusGoalMinutes={dailyFocusGoalMinutes}
                peakPeriod={peakPeriod}
                disciplineStyle={disciplineStyle}
                startBlank={startBlank}
                onChangeStartBlank={setStartBlank}
                selections={starterPack}
                onToggleSelection={handleToggleStarterItem}
              />
            </div>
          )}

          {/* Barra de ações Back / Next / Submit com alvo mínimo 48px */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-neutral-700/70 dark:border-primary/20">
            <p className="text-xs text-neutral-300 order-2 sm:order-1">
              {t("footerNote")}
            </p>

            <div className="flex items-center justify-end gap-2.5 order-1 sm:order-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl border border-neutral-700 dark:border-primary/30 bg-surface text-xs font-bold text-neutral-200 hover:text-neutral-100 hover:border-primary/60 transition-colors cursor-pointer disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  <span>{t("actions.back")}</span>
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-gold hover:bg-gold-hover text-on-gold text-sm font-bold shadow-glow-gold-sm transition-[background-color,transform] active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span>{t("actions.next")}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl bg-gold hover:bg-gold-hover text-on-gold text-sm font-bold shadow-glow-gold-sm transition-[background-color,transform,opacity] active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Rocket size={16} aria-hidden="true" />
                  <span>
                    {isSubmitting
                      ? t("actions.submitting")
                      : isGamified
                        ? t("actions.submitGamified")
                        : t("actions.submitProductivity")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
