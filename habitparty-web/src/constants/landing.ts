import {
  CheckSquare,
  Flame,
  Gift,
  Languages,
  Layers,
  LineChart,
  type LucideIcon,
  MessageSquare,
  Palette,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Swords,
  Timer,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import { LANDING_ANCHORS } from "@/constants/landingAnchors";
import { APP_RELEASES, type AppReleaseLandingId } from "@/constants/releases";
import type {
  LandingFaqKey,
  LandingFeatureConfig,
  LandingHeroHighlightConfig,
  LandingNavLinkConfig,
  LandingPlanConfig,
  LandingProductivityStepConfig,
  LandingRoadmapConfig,
  LandingRoadmapStatus,
  LandingRoadmapStatusStyle,
} from "@/types/landing";

export { LANDING_ANCHORS };
export { SUPPORT_LINKS } from "@/constants/links";

/**
 * Ordem sincronizada com a sequência real das seções em `LandingPage`.
 */
export const LANDING_NAV_LINK_CONFIGS: readonly LandingNavLinkConfig[] = [
  { id: "gamification", href: `#${LANDING_ANCHORS.gamification}` },
  { id: "howItWorks", href: `#${LANDING_ANCHORS.howItWorks}` },
  { id: "features", href: `#${LANDING_ANCHORS.features}` },
  { id: "roadmap", href: `#${LANDING_ANCHORS.roadmap}` },
  { id: "pricing", href: `#${LANDING_ANCHORS.pricing}` },
  { id: "faq", href: `#${LANDING_ANCHORS.faq}` },
] as const;

export const LANDING_HERO_HIGHLIGHT_CONFIGS: readonly LandingHeroHighlightConfig[] =
  [
    {
      id: "levels",
      icon: Zap,
      colorClass: "text-gold-ink dark:text-gold",
    },
    {
      id: "streaks",
      icon: Flame,
      colorClass: "text-warning-400 dark:text-warning-500",
    },
    {
      id: "pomodoro",
      icon: Shield,
      colorClass: "text-info",
    },
    {
      id: "shop",
      icon: Trophy,
      colorClass: "text-magenta dark:text-fuchsia-300",
    },
  ] as const;

export const LANDING_PRODUCTIVITY_STEP_CONFIGS: readonly LandingProductivityStepConfig[] =
  [
    {
      id: "step1",
      number: "01",
      icon: CheckSquare,
      numberColor: "text-primary/25 dark:text-white/15",
      iconBoxClass:
        "bg-purple-500/10 border border-purple-500/25 dark:border-transparent dark:bg-gradient-to-br dark:from-primary dark:to-primary-light dark:p-0.5",
      iconColor: "text-primary dark:text-neutral-50",
      borderColor: "border-purple-500/25 dark:border-primary-light/30",
    },
    {
      id: "step2",
      number: "02",
      icon: Timer,
      numberColor: "text-sky-600/25 dark:text-white/15",
      iconBoxClass:
        "bg-sky-500/10 border border-sky-500/25 dark:border-transparent dark:bg-gradient-to-br dark:from-blue dark:to-info dark:p-0.5",
      iconColor: "text-info dark:text-neutral-50",
      borderColor: "border-sky-500/25 dark:border-info/30",
    },
    {
      id: "step3",
      number: "03",
      icon: Gift,
      numberColor: "text-amber-600/25 dark:text-white/15",
      iconBoxClass:
        "bg-amber-500/10 border border-amber-500/30 dark:border-transparent dark:bg-gradient-to-br dark:from-gold dark:via-warning-500 dark:to-gold dark:p-0.5",
      iconColor: "text-gold-ink dark:text-neutral-50",
      borderColor: "border-amber-500/35 dark:border-gold/40",
    },
  ] as const;

export const LANDING_FEATURE_CONFIGS: readonly LandingFeatureConfig[] = [
  {
    id: "experienceMode",
    icon: SlidersHorizontal,
    badgeColor: "bg-amber-500/12 text-gold-ink dark:bg-gold/12 dark:text-gold",
    iconBoxColor:
      "bg-amber-500/10 text-gold-ink border-amber-500/25 dark:bg-card dark:text-gold dark:border-white/10",
  },
  {
    id: "rewardShop",
    icon: ShoppingBag,
    badgeColor:
      "bg-primary/10 text-primary dark:bg-primary/25 dark:text-neutral-100",
    iconBoxColor:
      "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-card dark:text-primary-light dark:border-white/10",
  },
  {
    id: "hardcoreMode",
    icon: Flame,
    badgeColor:
      "bg-rose-500/10 text-rose-700 dark:bg-danger-500/15 dark:text-danger-300",
    iconBoxColor:
      "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-card dark:text-danger-400 dark:border-white/10",
  },
  {
    id: "workspaces",
    icon: Layers,
    badgeColor: "bg-info/12 text-info dark:bg-info/15 dark:text-info",
    iconBoxColor:
      "bg-sky-500/10 text-info border-sky-500/20 dark:bg-card dark:text-info dark:border-white/10",
  },
  {
    id: "analytics",
    icon: LineChart,
    badgeColor:
      "bg-magenta/10 text-magenta dark:text-fuchsia-300 dark:bg-magenta/15",
    iconBoxColor:
      "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 dark:bg-card dark:text-fuchsia-300 dark:border-white/10",
  },
  {
    id: "soundEffects",
    icon: Swords,
    badgeColor: "bg-amber-500/12 text-gold-ink dark:bg-gold/12 dark:text-gold",
    iconBoxColor:
      "bg-amber-500/10 text-gold-ink border-amber-500/25 dark:bg-card dark:text-gold dark:border-white/10",
  },
  {
    id: "partyGuild",
    icon: Users2,
    badgeColor:
      "bg-indigo-500/12 text-indigo-700 dark:bg-primary/25 dark:text-primary-light",
    iconBoxColor:
      "bg-indigo-500/10 text-indigo-700 border-indigo-500/20 dark:bg-card dark:text-primary-light dark:border-white/10",
  },
] as const;

export const ROADMAP_STATUS_STYLES: Record<
  LandingRoadmapStatus,
  LandingRoadmapStatusStyle
> = {
  completed: {
    statusBadgeColor: "bg-success-500/15 text-success-400",
    iconBoxColor: "bg-success-500/15 border-success-500/35 text-success-400",
    checkColor: "text-success-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
  },
  next: {
    statusBadgeColor:
      "bg-amber-500/12 text-gold-ink dark:bg-gold/15 dark:text-gold",
    iconBoxColor:
      "bg-amber-500/10 border-amber-500/25 text-gold-ink dark:bg-card dark:border-white/15 dark:text-gold",
    checkColor: "text-gold-ink dark:text-gold",
    accentColor: "from-gold to-warning-500",
  },
  planned: {
    statusBadgeColor: "bg-info/12 text-info dark:bg-info/15 dark:text-info",
    iconBoxColor:
      "bg-info/10 border-info/25 text-info dark:bg-card dark:border-white/15 dark:text-info",
    checkColor: "text-info",
    accentColor: "from-blue to-info",
  },
  epic: {
    statusBadgeColor:
      "bg-danger-500/12 text-danger-400 dark:bg-danger-500/15 dark:text-danger-300",
    iconBoxColor:
      "bg-danger-500/10 border-danger-500/25 text-danger-400 dark:bg-card dark:border-white/15 dark:text-danger-400",
    checkColor: "text-danger-400",
    accentColor: "from-danger-500 to-warning-500",
  },
};

const ROADMAP_ICONS_BY_RELEASE: Record<AppReleaseLandingId, LucideIcon> = {
  r11: Languages,
  r12: Trophy,
  r13: Timer,
  r14: Palette,
  r15: Users2,
  r16: MessageSquare,
  r20: Swords,
};

export const LANDING_ROADMAP_CONFIGS: readonly LandingRoadmapConfig[] =
  APP_RELEASES.map((release) => ({
    id: release.landingId,
    status: release.status,
    icon: ROADMAP_ICONS_BY_RELEASE[release.landingId],
    ...(release.hasLandingExtras ? { hasExtras: true } : {}),
  }));

export const LANDING_PLAN_CONFIGS: readonly LandingPlanConfig[] = [
  {
    id: "adventurer",
    badgeColor:
      "bg-surface border-neutral-700 dark:border-white/10 text-neutral-300",
    ctaLink: "/signUp",
  },
  {
    id: "founder",
    badgeColor:
      "bg-amber-500/15 border-amber-500/40 text-gold-ink dark:bg-gold/20 dark:border-gold/60 dark:text-gold",
    isFounder: true,
    hasOriginalPrice: true,
    ctaLink: "/signUp?plan=founder",
  },
  {
    id: "guardian",
    badgeColor:
      "bg-primary/15 dark:bg-primary/20 border-primary/30 dark:border-primary-light/40 text-primary dark:text-primary-light",
    ctaLink: "/signUp?plan=guardian",
  },
] as const;

export const LANDING_FAQ_KEYS: readonly LandingFaqKey[] = [
  "founderPromo",
  "experienceMode",
  "freeVsPremium",
  "honestyShop",
  "hardcoreMode",
  "partyGuild",
  "dataPreservation",
  "mobileApp",
] as const;
