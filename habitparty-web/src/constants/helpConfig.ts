import type { HelpCategory, HelpProductivityStep } from "@/types/help";

/**
 * Metadados leves compartilhados entre Server e Client Components da Central de Ajuda (`/help`).
 * Mantidos isolados de `constants/help.ts` para evitar o envio das ~2.100 linhas de FAQs e
 * tabelas bilíngues ao bundle JavaScript do cliente.
 */
export const HELP_PRODUCTIVITY_STEPS: readonly HelpProductivityStep[] = [
  {
    step: 1,
    badgeClassName:
      "bg-primary/15 dark:bg-primary/20 border-primary/30 dark:border-primary/40 text-primary dark:text-primary-light",
  },
  {
    step: 2,
    badgeClassName:
      "bg-amber-500/15 dark:bg-gold/20 border-amber-500/35 dark:border-gold/40 text-gold-ink dark:text-gold",
  },
  {
    step: 3,
    badgeClassName:
      "bg-magenta/15 dark:bg-magenta/20 border-magenta/35 dark:border-magenta/40 text-magenta dark:text-fuchsia-300",
  },
  {
    step: 4,
    badgeClassName:
      "bg-success-500/15 dark:bg-success-500/20 border-success-500/35 dark:border-success-500/40 text-success-400",
  },
] as const;

export const HELP_CATEGORY_IDS: readonly HelpCategory[] = [
  "ALL",
  "OVERVIEW",
  "TASKS",
  "ECONOMY",
  "REWARDS",
  "INVENTORY",
  "FOCUS",
  "LEVELS",
] as const;
