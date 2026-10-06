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
