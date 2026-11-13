import type { LucideIcon } from "lucide-react";

export type LandingNavLinkKey =
  | "howItWorks"
  | "gamification"
  | "features"
  | "roadmap"
  | "pricing"
  | "faq";

export interface LandingNavLinkConfig {
  id: LandingNavLinkKey;
  href: string;
}

export type LandingHeroHighlightKey =
  | "levels"
  | "streaks"
  | "pomodoro"
  | "shop";

export interface LandingHeroHighlightConfig {
  id: LandingHeroHighlightKey;
  icon: LucideIcon;
  colorClass: string;
}

export type LandingProductivityStepKey = "step1" | "step2" | "step3";

export interface LandingProductivityStepConfig {
  id: LandingProductivityStepKey;
  number: string;
  icon: LucideIcon;
  color: string;
  numberColor: string;
  iconBoxClass: string;
  iconColor: string;
  borderColor: string;
}

export type LandingFeatureKey =
  | "experienceMode"
  | "rewardShop"
  | "partyGuild"
  | "hardcoreMode"
  | "workspaces"
  | "analytics"
  | "soundEffects";

export interface LandingFeatureConfig {
  id: LandingFeatureKey;
  icon: LucideIcon;
  badgeColor: string;
  iconBoxColor: string;
}

export type LandingRoadmapKey =
  | "r11"
  | "r12"
  | "r13"
  | "r14"
  | "r15"
  | "r16"
  | "r20";

export interface LandingRoadmapConfig {
  id: LandingRoadmapKey;
  release: string;
  status: "completed" | "in_progress" | "next" | "planned" | "epic";
  statusBadgeColor: string;
  icon: LucideIcon;
  iconBoxColor: string;
  checkColor: string;
  accentColor: string;
  borderGlowColor: string;
  hasExtras?: boolean;
}

export type LandingPlanKey = "adventurer" | "founder" | "guardian";

export interface LandingPlanConfig {
  id: LandingPlanKey;
  badgeColor: string;
  highlight: boolean;
  isFounder?: boolean;
  hasOriginalPrice?: boolean;
  ctaLink: string;
}

export type LandingFaqKey =
  | "founderPromo"
  | "freeVsPremium"
  | "honestyShop"
  | "hardcoreMode"
  | "partyGuild"
  | "dataPreservation"
  | "experienceMode"
  | "mobileApp";
