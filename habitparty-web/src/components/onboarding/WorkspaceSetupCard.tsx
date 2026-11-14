import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { OnboardingStepHeader } from "@/components/onboarding/OnboardingStepHeader";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils";

interface WorkspaceSetupCardProps {
  workspaceName: string;
  onChangeName: (name: string) => void;
  chips: string[];
  onSelectChip: (chip: string) => void;
  disabled?: boolean;
}

export function WorkspaceSetupCard({
  workspaceName,
  onChangeName,
  chips,
  onSelectChip,
  disabled = false,
}: WorkspaceSetupCardProps) {
  const t = useTranslations("onboarding.workspaceSetup");

  return (
    <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-neutral-700 bg-card shadow-xs dark:border-primary/30 dark:bg-surface/50 dark:shadow-card-deep">
      <OnboardingStepHeader
        step={2}
        title={t("title")}
        rightSlot={
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-gold/15 border border-amber-500/35 dark:border-gold/40 text-amber-800 dark:text-gold text-label-m font-bold uppercase tracking-wider">
            {t("badge")}
          </span>
        }
      />

      <p className="text-tiny sm:text-xs text-neutral-300">
        {t("description")}
      </p>

      <div className="flex flex-col gap-2">
        <Input
          label={t("label")}
          id="workspaceName"
          value={workspaceName}
          maxLength={25}
          onChange={(e) => onChangeName(e.target.value.slice(0, 25))}
          placeholder={t("placeholder")}
          hint={t("hint")}
          required
          compact
          disabled={disabled}
        />

        {/* Sugestões Rápidas (Chips clicáveis) */}
        <div className="flex flex-col gap-1.5 mt-1">
          <span className="text-[11px] text-neutral-400 font-medium">
            {t("suggestionsLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const isChipActive = workspaceName === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onSelectChip(chip)}
                  disabled={disabled}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border",
                    isChipActive
                      ? "bg-amber-500/15 border-amber-500/50 text-amber-800 dark:bg-gold/20 dark:border-gold/60 dark:text-gold font-bold shadow-2xs dark:shadow-sm"
                      : "bg-surface hover:bg-surface-hover border-neutral-700 text-neutral-200 hover:text-neutral-50 dark:bg-primary-dark/20 dark:border-primary/30 dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-primary-dark/40",
                  )}
                >
                  {isChipActive && (
                    <Check size={11} className="inline mr-1 -mt-0.5" />
                  )}
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
