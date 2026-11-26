import type { ReactNode, RefObject } from "react";
import { ONBOARDING_FOCUS_RING } from "./onboardingStyles";

interface OnboardingStepHeaderProps {
  step: number;
  title: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  rightSlot?: ReactNode;
}

export function OnboardingStepHeader({
  step,
  title,
  headingRef,
  rightSlot,
}: OnboardingStepHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className={`text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2.5 rounded-lg px-0.5 ${ONBOARDING_FOCUS_RING}`}
      >
        <span
          aria-hidden="true"
          className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-gold-ink dark:bg-gold/20 dark:text-gold text-xs font-bold shrink-0"
        >
          {step}
        </span>
        <span>{title}</span>
      </h2>
      {rightSlot}
    </div>
  );
}
