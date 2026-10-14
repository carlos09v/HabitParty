import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-headline-g",
        "text-headline-g-regular",
        "text-headline-m",
        "text-headline-m-regular",
        "text-headline-s",
        "text-headline-s-regular",
        "text-subtitle-g",
        "text-subtitle-g-regular",
        "text-subtitle-m",
        "text-subtitle-m-regular",
        "text-subtitle-s",
        "text-body-m",
        "text-body-s",
        "text-label-g",
        "text-label-m",
        "text-label-s",
        "text-tiny",
      ],
      "text-color": [
        "text-primary",
        "text-primary-dark",
        "text-primary-light",
        "text-surface",
        "text-card",
        "text-gold",
        "text-magenta",
      ],
      "bg-color": [
        "bg-primary",
        "bg-primary-dark",
        "bg-primary-light",
        "bg-surface",
        "bg-surface-hover",
        "bg-card",
        "bg-card-hover",
        "bg-gold",
        "bg-magenta",
      ],
    },
  },
});

/**
 * Combina classes condicionais (clsx) e resolve conflitos de especificidade do Tailwind (tailwind-merge).
 */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
