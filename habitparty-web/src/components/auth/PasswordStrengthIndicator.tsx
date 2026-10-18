"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export interface PasswordAnalysis {
  score: number; // 0 to 4
  label: "Muito Fraca" | "Fraca" | "Razoável" | "Boa" | "Forte";
  colorClass: string;
  barBgClass: string;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumberOrSpecial: boolean;
}

export function analyzePassword(password: string): PasswordAnalysis {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!password) {
    return {
      score: 0,
      label: "Muito Fraca",
      colorClass: "text-neutral-400",
      barBgClass: "bg-white/10",
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumberOrSpecial: false,
    };
  }

  let passedRules = 0;
  if (hasMinLength) passedRules++;
  if (hasUpperCase) passedRules++;
  if (hasLowerCase) passedRules++;
  if (hasNumberOrSpecial) passedRules++;

  // Bônus se tiver mais de 12 caracteres e atender a todas as regras
  const isExtraStrong = password.length >= 12 && passedRules === 4;

  let score = 1;
  let label: PasswordAnalysis["label"] = "Fraca";
  let colorClass = "text-danger-500";
  let barBgClass = "bg-danger-500";

  if (passedRules <= 1) {
    score = 1;
    label = "Fraca";
    colorClass = "text-danger-500";
    barBgClass = "bg-danger-500";
  } else if (passedRules === 2) {
    score = 2;
    label = "Razoável";
    colorClass = "text-warning-500";
    barBgClass = "bg-warning-500";
  } else if (passedRules === 3) {
    score = 3;
    label = "Boa";
    colorClass = "text-gold";
    barBgClass = "bg-gold";
  } else {
    score = 4;
    label = isExtraStrong ? "Forte" : "Forte";
    colorClass = "text-success-500";
    barBgClass = "bg-success-500";
  }

  return {
    score,
    label,
    colorClass,
    barBgClass,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumberOrSpecial,
  };
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => analyzePassword(password), [password]);

  if (!password) {
    return null;
  }

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
            Força da Senha:
          </span>
          <span
            className={cn("font-bold transition-colors", analysis.colorClass)}
          >
            {analysis.label}
          </span>
        </div>

        <div
          className="grid grid-cols-4 gap-1.5 w-full"
          role="progressbar"
          aria-valuenow={analysis.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Força da senha: ${analysis.label}`}
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
          Mínimo de 8 caracteres
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
          1 letra maiúscula
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
          1 letra minúscula
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
          1 número ou símbolo (@#$!%)
        </span>
      </div>
    </div>
  );
}
