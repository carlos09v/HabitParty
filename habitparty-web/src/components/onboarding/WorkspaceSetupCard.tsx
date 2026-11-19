"use client";

import { useTranslations } from "next-intl";
import { useId } from "react";
import { MAX_WORKSPACE_NAME_LENGTH } from "@/constants/onboarding";
import type { UsageMode } from "@/types/onboarding";
import { cn } from "@/utils";

interface WorkspaceSetupCardProps {
  workspaceName: string;
  onChangeName: (value: string) => void;
  onBlurName: () => void;
  usageMode: UsageMode;
  errorMessage?: string | null;
}

export function WorkspaceSetupCard({
  workspaceName,
  onChangeName,
  onBlurName,
  usageMode,
  errorMessage,
}: WorkspaceSetupCardProps) {
  const t = useTranslations("onboarding.workspaceSetup");
  const inputId = useId();
  const errorId = useId();
  const presets = t.raw(`presetsByMode.${usageMode}`) as string[];
  const hasError = Boolean(errorMessage);

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
                ? "text-amber-700 dark:text-gold font-semibold"
                : "text-neutral-400",
            )}
          >
            {t("charCounter", {
              current: workspaceName.length,
              max: MAX_WORKSPACE_NAME_LENGTH,
            })}
          </span>
        </div>
        <input
          id={inputId}
          type="text"
          value={workspaceName}
          onChange={(e) =>
            onChangeName(e.target.value.slice(0, MAX_WORKSPACE_NAME_LENGTH))
          }
          onBlur={onBlurName}
          maxLength={MAX_WORKSPACE_NAME_LENGTH}
          placeholder={t("inputPlaceholder")}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-surface dark:bg-surface/80 border text-body-s text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:ring-2",
            hasError
              ? "border-rose-500 focus:ring-rose-500/40"
              : "border-neutral-700 dark:border-primary/30 focus:border-gold focus:ring-gold/30",
          )}
        />
        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-rose-500 dark:text-rose-400 mt-0.5"
          >
            {errorMessage}
          </p>
        )}
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
                "px-3.5 py-2 min-h-[48px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold",
                isActive
                  ? "bg-amber-500/15 border-amber-500/70 text-amber-800 dark:bg-gold/15 dark:border-gold dark:text-gold"
                  : "bg-surface/80 border-neutral-700 text-neutral-200 hover:border-primary/50 hover:text-neutral-100 dark:border-primary/25",
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
