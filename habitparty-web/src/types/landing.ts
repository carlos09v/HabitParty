import type { LucideIcon } from "lucide-react";

export type LandingNavLinkKey =
  | "gamification"
  | "howItWorks"
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

export type LandingRoadmapStatus = "completed" | "next" | "planned" | "epic";

export interface LandingRoadmapStatusStyle {
  statusBadgeColor: string;
  iconBoxColor: string;
  checkColor: string;
  accentColor: string;
}

export interface LandingRoadmapConfig {
  id: LandingRoadmapKey;
  status: LandingRoadmapStatus;
  icon: LucideIcon;
  hasExtras?: boolean;
}

export type LandingPlanKey = "adventurer" | "founder" | "guardian";

export interface LandingPlanConfig {
  id: LandingPlanKey;
  badgeColor: string;
  isFounder?: boolean;
  hasOriginalPrice?: boolean;
  ctaLink: string;
}

export type LandingFaqKey =
  | "founderPromo"
  | "experienceMode"
  | "freeVsPremium"
  | "honestyShop"
  | "hardcoreMode"
  | "partyGuild"
  | "dataPreservation"
  | "mobileApp";
