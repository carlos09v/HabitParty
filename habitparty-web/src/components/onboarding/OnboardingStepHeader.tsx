import type { ReactNode } from "react";

interface OnboardingStepHeaderProps {
  step: number;
  title: string;
  rightSlot?: ReactNode;
}

export function OnboardingStepHeader({
  step,
  title,
  rightSlot,
}: OnboardingStepHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h2 className="text-body-s font-bold text-neutral-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:bg-gold/20 dark:text-gold text-tiny font-bold">
          {step}
        </span>
        {title}
      </h2>
      {rightSlot}
    </div>
  );
}
