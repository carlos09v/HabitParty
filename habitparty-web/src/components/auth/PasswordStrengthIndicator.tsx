"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/utils";
import {
  analyzePassword,
  type PasswordAnalysis,
  type PasswordStrengthKey,
} from "@/utils/validators";

export { analyzePassword, type PasswordAnalysis, type PasswordStrengthKey };

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const t = useTranslations("auth.passwordStrength");
  const analysis = useMemo(() => analyzePassword(password), [password]);

  if (!password) {
    return null;
  }

  const levelLabel = t(`levels.${analysis.levelKey}`);

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface/50 border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-xs transition-all">
      {/* Medidor Segmentado em 4 Barras */}
      <div className="flex flex-col gap-1.5">
        <div
          className="flex items-center justify-between text-[11px]"
          aria-live="polite"
        >
          <span className="text-neutral-300 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-neutral-400" />
            {t("title")}
          </span>
          <span
            className={cn("font-bold transition-colors", analysis.colorClass)}
          >
            {levelLabel}
          </span>
        </div>

        <div
          className="grid grid-cols-4 gap-1.5 w-full"
          role="progressbar"
          aria-valuenow={analysis.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={t("ariaLabel", { level: levelLabel })}
        >
          {[1, 2, 3, 4].map((step) => {
            const isFilled = analysis.score >= step;
            return (
              <div
                key={step}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isFilled
                    ? analysis.barBgClass
                    : "bg-neutral-700 dark:bg-white/10",
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Checklist de Requisitos Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-neutral-700/80 dark:border-white/5">
        <span
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            analysis.hasMinLength
              ? "text-success-500 font-medium"
              : "text-neutral-400",
          )}
        >
          {analysis.hasMinLength ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          {t("requirements.minLength")}
        </span>

        <span
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            analysis.hasUpperCase
              ? "text-success-500 font-medium"
              : "text-neutral-400",
          )}
        >
          {analysis.hasUpperCase ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          {t("requirements.uppercase")}
        </span>

        <span
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            analysis.hasLowerCase
              ? "text-success-500 font-medium"
              : "text-neutral-400",
          )}
        >
          {analysis.hasLowerCase ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          {t("requirements.lowercase")}
        </span>

        <span
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            analysis.hasNumberOrSpecial
              ? "text-success-500 font-medium"
              : "text-neutral-400",
          )}
        >
          {analysis.hasNumberOrSpecial ? (
            <Check size={13} className="shrink-0" />
          ) : (
            <X size={13} className="shrink-0" />
          )}
          {t("requirements.numberOrSpecial")}
        </span>
      </div>
    </div>
  );
}
