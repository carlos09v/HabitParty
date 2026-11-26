/**
 * Estilos compartilhados entre os componentes de onboarding (`/firstStep`).
 *
 * Usa exclusivamente tokens semânticos calibrados para WCAG 2.2 AA (>= 4.5:1)
 * nos 4 temas disponíveis no onboarding:
 * `dark`, `light`, `dark-knight` e `solar-parchment`.
 */
export const ONBOARDING_FOCUS_RING =
  "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

export const ONBOARDING_CARD_SELECTED =
  "bg-primary/12 border-amber-500/80 dark:bg-primary/25 dark:border-gold shadow-xs dark:shadow-glow-gold-xs";

export const ONBOARDING_CARD_IDLE =
  "bg-card/85 border-neutral-700/80 hover:border-primary/50 hover:bg-surface/70 dark:bg-surface/55 dark:border-primary/25 dark:hover:border-primary/50";

/**
 * Estado visual desabilitado ou suavizado sem `opacity-*` no texto para
 * preservar contraste >= 4.5:1 em todos os temas.
 */
export const ONBOARDING_CARD_DISABLED =
  "bg-surface/45 border-neutral-700/60 dark:bg-surface/35 dark:border-primary/20";

export const ONBOARDING_CARD_MUTED = `${ONBOARDING_CARD_DISABLED} hover:border-primary/45 hover:bg-surface/75 dark:hover:border-primary/45`;

export const ONBOARDING_CHIP_SELECTED =
  "bg-amber-500/15 border-amber-500/80 text-gold-ink dark:bg-gold/15 dark:border-gold dark:text-gold";

export const ONBOARDING_CHIP_IDLE =
  "bg-card/80 border-neutral-700/80 text-neutral-200 hover:border-primary/50 hover:bg-surface/70 dark:bg-surface/55 dark:border-primary/25 dark:hover:border-primary/50";
