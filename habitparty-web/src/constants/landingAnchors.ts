/**
 * Âncoras de navegação interna da Landing Page.
 * Mantidas em módulo puro (sem imports de ícones) para que Client Components
 * como `LandingInteractiveDemo` não puxem ícones server-only de `constants/landing.ts`.
 */
export const LANDING_ANCHORS = {
  gamification: "demo",
  howItWorks: "how-it-works",
  features: "features",
  roadmap: "roadmap",
  pricing: "pricing",
  faq: "faq",
} as const;
