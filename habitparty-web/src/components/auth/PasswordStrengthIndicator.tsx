import { Check, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";
import { analyzePassword } from "@/utils/validators";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const t = useTranslations("auth.passwordStrength");
  const analysis = analyzePassword(password);

  if (!password) {
    return null;
  }

  const levelLabel = t(`levels.${analysis.levelKey}`);
  const requirements = [
    { key: "minLength" as const, met: analysis.hasMinLength },
    { key: "uppercase" as const, met: analysis.hasUpperCase },
    { key: "lowercase" as const, met: analysis.hasLowerCase },
    { key: "numberOrSpecial" as const, met: analysis.hasSpecialChar },
  ];

  return (
    <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-surface/60 border border-neutral-700 dark:bg-white/5 dark:border-white/10 text-xs">
      {/* Medidor Segmentado em 4 Barras */}
      <div className="flex flex-col gap-1.5">
        <div
          className="flex items-center justify-between text-[11px]"
          aria-live="polite"
        >
          <span className="text-neutral-300 font-medium flex items-center gap-1.5">
            <ShieldCheck
              size={14}
              className="text-neutral-400"
              aria-hidden="true"
            />
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
                  "h-1.5 rounded-full transition-colors duration-300",
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
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-neutral-700/80 dark:border-white/5">
        {requirements.map(({ key, met }) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              met ? "text-success-400 font-medium" : "text-neutral-400",
            )}
          >
            {met ? (
              <Check size={13} className="shrink-0" aria-hidden="true" />
            ) : (
              <X size={13} className="shrink-0" aria-hidden="true" />
            )}
            <span>{t(`requirements.${key}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
