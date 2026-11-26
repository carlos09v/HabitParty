import { CheckSquare, Gift, History, Package, Timer } from "lucide-react";
import type { WelcomeCardConfig } from "@/types/settings";

export type { WelcomeCardConfig };

export const CONFIGURABLE_WELCOME_CARDS: readonly WelcomeCardConfig[] = [
  { key: "tasks", route: "/tasks", icon: CheckSquare },
  { key: "inventory", route: "/inventory", icon: Package },
  { key: "rewards", route: "/rewards", icon: Gift },
  { key: "focus", route: "/focus", icon: Timer },
  { key: "history", route: "/history", icon: History },
] as const;

export interface WelcomeCardDetail {
  imageSrc: string;
  normalWidth?: number;
  normalHeight?: number;
}

/**
 * Metadados visuais (ilustração e dimensões) dos WelcomeCards.
 * Todos os textos localizados residem em `messages/{locale}/common.json` (`ui.welcomeCard.cards.*`).
 */
export const WELCOME_CARD_DETAILS: Record<string, WelcomeCardDetail> = {
  inventory: {
    imageSrc: "/assets/undraw/inventory/undraw_camping_1hz9.svg",
    normalWidth: 162,
    normalHeight: 87,
  },
  rewards: {
    imageSrc: "/assets/undraw/reward/undraw_gift-card_sfy8 1.svg",
    normalWidth: 162,
    normalHeight: 87,
  },
  focus: {
    imageSrc: "/assets/undraw/transaction/undraw_time-change_lyxp 1.svg",
    normalWidth: 162,
    normalHeight: 87,
  },
  tasks: {
    imageSrc: "/assets/undraw/task/undraw_next-task_jtbr 1.svg",
    normalWidth: 136,
    normalHeight: 93,
  },
  history: {
    imageSrc: "/assets/undraw/reward/undraw_treasure_a4j2.svg",
    normalWidth: 162,
    normalHeight: 87,
  },
};
