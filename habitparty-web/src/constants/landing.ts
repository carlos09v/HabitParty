import {
  Award,
  CheckSquare,
  Flame,
  Gift,
  Languages,
  Layers,
  LineChart,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Swords,
  Timer,
  Trophy,
  Users2,
  Zap,
} from "lucide-react";
import type {
  LandingFaqKey,
  LandingFeatureConfig,
  LandingHeroHighlightConfig,
  LandingNavLinkConfig,
  LandingPlanConfig,
  LandingProductivityStepConfig,
  LandingRoadmapConfig,
} from "@/types/landing";

export const SUPPORT_LINKS = {
  githubRepo: "https://github.com/carlos09v/HabitParty",
  githubIssues: "https://github.com/carlos09v/HabitParty/issues",
  contactEmail: "contact@habitparty.app",
  contactMailto: "mailto:contact@habitparty.app",
} as const;

export const LANDING_NAV_LINK_CONFIGS: readonly LandingNavLinkConfig[] = [
  { id: "howItWorks", href: "#como-funciona" },
  { id: "gamification", href: "#gamificacao" },
  { id: "features", href: "#recursos" },
  { id: "roadmap", href: "#roadmap" },
  { id: "pricing", href: "#planos" },
  { id: "faq", href: "#faq" },
] as const;

export const LANDING_HERO_HIGHLIGHT_CONFIGS: readonly LandingHeroHighlightConfig[] =
  [
    {
      id: "levels",
      icon: Zap,
      colorClass: "text-gold",
    },
    {
      id: "streaks",
      icon: Flame,
      colorClass: "text-warning-500",
    },
    {
      id: "pomodoro",
      icon: Shield,
      colorClass: "text-info",
    },
    {
      id: "shop",
      icon: Trophy,
      colorClass: "text-magenta",
    },
  ] as const;

export const LANDING_PRODUCTIVITY_STEP_CONFIGS: readonly LandingProductivityStepConfig[] =
  [
    {
      id: "step1",
      number: "01",
      icon: CheckSquare,
      color: "from-primary to-primary-light",
      borderColor: "border-primary-light/30",
    },
    {
      id: "step2",
      number: "02",
      icon: Timer,
      color: "from-blue to-info",
      borderColor: "border-info/30",
    },
    {
      id: "step3",
      number: "03",
      icon: Gift,
      color: "from-gold via-warning-500 to-gold",
      borderColor: "border-gold/40",
    },
  ] as const;

export const LANDING_FEATURE_CONFIGS: readonly LandingFeatureConfig[] = [
  {
    id: "experienceMode",
    icon: SlidersHorizontal,
    badgeColor: "bg-gold/15 text-gold border-gold/30",
  },
  {
    id: "rewardShop",
    icon: ShoppingBag,
    badgeColor:
      "bg-primary-light/15 text-primary-light border-primary-light/30",
  },
  {
    id: "hardcoreMode",
    icon: Flame,
    badgeColor: "bg-danger-500/15 text-danger-500 border-danger-500/30",
  },
  {
    id: "workspaces",
    icon: Layers,
    badgeColor: "bg-info/15 text-info border-info/30",
  },
  {
    id: "analytics",
    icon: LineChart,
    badgeColor: "bg-magenta/15 text-magenta border-magenta/30",
  },
  {
    id: "soundEffects",
    icon: Swords,
    badgeColor: "bg-gold/15 text-gold border-gold/30",
  },
] as const;

export const LANDING_ROADMAP_CONFIGS: readonly LandingRoadmapConfig[] = [
  {
    id: "r11",
    release: "Release 1.1",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Languages,
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "hover:border-emerald-500/50",
    hasExtras: true,
  },
  {
    id: "r12",
    release: "Release 1.2",
    status: "next",
    statusBadgeColor: "bg-gold/15 text-gold border-gold/30",
    icon: Trophy,
    accentColor: "from-gold to-warning-500",
    borderGlowColor: "hover:border-gold/40",
  },
  {
    id: "r13",
    release: "Release 1.3",
    status: "planned",
    statusBadgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    icon: Award,
    accentColor: "from-purple-500 to-indigo-500",
    borderGlowColor: "hover:border-purple-500/40",
  },
  {
    id: "r14",
    release: "Release 1.4",
    status: "planned",
    statusBadgeColor: "bg-magenta/15 text-magenta border-magenta/30",
    icon: Users2,
    accentColor: "from-magenta to-primary-light",
    borderGlowColor: "hover:border-magenta/40",
  },
  {
    id: "r20",
    release: "Release 2.0+",
    status: "epic",
    statusBadgeColor: "bg-danger-500/15 text-danger-500 border-danger-500/30",
    icon: Swords,
    accentColor: "from-danger-500 to-warning-500",
    borderGlowColor: "hover:border-danger-500/40",
  },
] as const;

export const LANDING_PLAN_CONFIGS: readonly LandingPlanConfig[] = [
  {
    id: "adventurer",
    badgeColor:
      "bg-surface border-neutral-700 dark:border-white/10 text-neutral-300",
    highlight: false,
    ctaLink: "/signUp",
  },
  {
    id: "founder",
    badgeColor: "bg-gold/20 border-gold/60 text-gold",
    highlight: true,
    isFounder: true,
    hasOriginalPrice: true,
    ctaLink: "/signUp",
  },
  {
    id: "guardian",
    badgeColor:
      "bg-primary/15 dark:bg-primary/20 border-primary/30 dark:border-primary-light/40 text-primary dark:text-primary-light",
    highlight: false,
    ctaLink: "/signUp",
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
