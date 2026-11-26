import { useTranslations } from "next-intl";
import { type RefObject, useId } from "react";
import { Input } from "@/components/ui/Input";
import { MAX_WORKSPACE_NAME_LENGTH } from "@/constants/onboarding";
import type { UsageMode } from "@/types/onboarding";
import { cn } from "@/utils";
import {
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_CHIP_SELECTED,
  ONBOARDING_FOCUS_RING,
} from "./onboardingStyles";

interface WorkspaceSetupCardProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  workspaceName: string;
  onChangeName: (value: string) => void;
  onBlurName: () => void;
  usageMode: UsageMode;
  errorMessage?: string | null;
}

export function WorkspaceSetupCard({
  inputRef,
  workspaceName,
  onChangeName,
  onBlurName,
  usageMode,
  errorMessage,
}: WorkspaceSetupCardProps) {
  const t = useTranslations("onboarding.workspaceSetup");
  const inputId = useId();
  const presets = t.raw(`presetsByMode.${usageMode}`) as string[];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-700/80 dark:border-primary/25 bg-card/80 dark:bg-surface/45 p-4">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={inputId}
            className="text-body-s font-bold text-neutral-100"
          >
            {t("fieldLabel")}
          </label>
          <span
            className={cn(
              "text-tiny tabular-nums transition-colors",
              workspaceName.length >= MAX_WORKSPACE_NAME_LENGTH
                ? "text-gold-ink dark:text-gold font-semibold"
                : "text-neutral-400",
            )}
          >
            {t("charCounter", {
              current: workspaceName.length,
              max: MAX_WORKSPACE_NAME_LENGTH,
            })}
          </span>
        </div>

        <Input
          ref={inputRef}
          id={inputId}
          type="text"
          value={workspaceName}
          onChange={(e) =>
            onChangeName(e.target.value.slice(0, MAX_WORKSPACE_NAME_LENGTH))
          }
          onBlur={onBlurName}
          maxLength={MAX_WORKSPACE_NAME_LENGTH}
          placeholder={t("inputPlaceholder")}
          enterKeyHint="done"
          error={errorMessage ?? undefined}
          className="min-h-[48px] rounded-xl text-body-s"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-300">
          {t("quickPresetsLabel")}
        </span>
        {presets.map((preset) => {
          const isActive =
            workspaceName.trim().toLowerCase() === preset.toLowerCase();
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChangeName(preset)}
              aria-pressed={isActive}
              className={cn(
                "px-3.5 py-2 min-h-[48px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer",
                ONBOARDING_FOCUS_RING,
                isActive ? ONBOARDING_CHIP_SELECTED : ONBOARDING_CHIP_IDLE,
              )}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
}
