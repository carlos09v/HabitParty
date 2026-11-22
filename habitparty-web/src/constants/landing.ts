import {
  CheckSquare,
  Flame,
  Gift,
  Languages,
  Layers,
  LineChart,
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
import type {
  LandingFaqKey,
  LandingFeatureConfig,
  LandingHeroHighlightConfig,
  LandingNavLinkConfig,
  LandingPlanConfig,
  LandingProductivityStepConfig,
  LandingRoadmapConfig,
} from "@/types/landing";

export { SUPPORT_LINKS } from "@/constants/links";

export const LANDING_ANCHORS = {
  howItWorks: "how-it-works",
  gamification: "demo",
  features: "features",
  roadmap: "roadmap",
  pricing: "pricing",
  faq: "faq",
} as const;

export const LANDING_NAV_LINK_CONFIGS: readonly LandingNavLinkConfig[] = [
  { id: "howItWorks", href: `#${LANDING_ANCHORS.howItWorks}` },
  { id: "gamification", href: `#${LANDING_ANCHORS.gamification}` },
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
      colorClass: "text-magenta dark:text-fuchsia-300",
    },
  ] as const;

export const LANDING_PRODUCTIVITY_STEP_CONFIGS: readonly LandingProductivityStepConfig[] =
  [
    {
      id: "step1",
      number: "01",
      icon: CheckSquare,
      color: "from-primary to-primary-light",
      numberColor: "text-primary/25 dark:text-white/12",
      iconBoxClass:
        "bg-purple-500/10 border border-purple-500/25 dark:border-transparent dark:bg-gradient-to-br dark:from-primary dark:to-primary-light dark:p-0.5",
      iconColor: "text-primary dark:text-neutral-50",
      borderColor: "border-purple-500/25 dark:border-primary-light/30",
    },
    {
      id: "step2",
      number: "02",
      icon: Timer,
      color: "from-blue to-info",
      numberColor: "text-sky-600/25 dark:text-white/12",
      iconBoxClass:
        "bg-sky-500/10 border border-sky-500/25 dark:border-transparent dark:bg-gradient-to-br dark:from-blue dark:to-info dark:p-0.5",
      iconColor: "text-sky-700 dark:text-neutral-50",
      borderColor: "border-sky-500/25 dark:border-info/30",
    },
    {
      id: "step3",
      number: "03",
      icon: Gift,
      color: "from-gold via-warning-500 to-gold",
      numberColor: "text-amber-600/25 dark:text-white/12",
      iconBoxClass:
        "bg-amber-500/10 border border-amber-500/30 dark:border-transparent dark:bg-gradient-to-br dark:from-gold dark:via-warning-500 dark:to-gold dark:p-0.5",
      iconColor: "text-amber-700 dark:text-neutral-50",
      borderColor: "border-amber-500/35 dark:border-gold/40",
    },
  ] as const;

export const LANDING_FEATURE_CONFIGS: readonly LandingFeatureConfig[] = [
  {
    id: "experienceMode",
    icon: SlidersHorizontal,
    badgeColor: "bg-amber-500/12 text-amber-800 dark:bg-gold/12 dark:text-gold",
    iconBoxColor:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-card dark:text-gold dark:border-white/10",
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
      "bg-rose-500/10 text-rose-700 dark:bg-danger-500/15 dark:text-danger-400",
    iconBoxColor:
      "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-card dark:text-danger-400 dark:border-white/10",
  },
  {
    id: "workspaces",
    icon: Layers,
    badgeColor: "bg-info/12 text-sky-700 dark:bg-info/15 dark:text-info",
    iconBoxColor:
      "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-card dark:text-info dark:border-white/10",
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
    badgeColor: "bg-amber-500/12 text-amber-800 dark:bg-gold/12 dark:text-gold",
    iconBoxColor:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-card dark:text-gold dark:border-white/10",
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

export const LANDING_ROADMAP_CONFIGS: readonly LandingRoadmapConfig[] = [
  {
    id: "r11",
    release: "Release 1.1",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    icon: Languages,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400",
    checkColor: "text-emerald-800 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "",
    hasExtras: true,
  },
  {
    id: "r12",
    release: "Release 1.2",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    icon: Trophy,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400",
    checkColor: "text-emerald-800 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "",
  },
  {
    id: "r13",
    release: "Release 1.3",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    icon: Timer,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400",
    checkColor: "text-emerald-800 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "",
    hasExtras: true,
  },
  {
    id: "r14",
    release: "Release 1.4",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
    icon: Palette,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400",
    checkColor: "text-emerald-800 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "",
    hasExtras: true,
  },
  {
    id: "r15",
    release: "Release 1.5",
    status: "next",
    statusBadgeColor:
      "bg-amber-500/12 text-amber-800 dark:bg-gold/15 dark:text-gold",
    icon: Users2,
    iconBoxColor:
      "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:bg-card dark:border-white/15 dark:text-gold",
    checkColor: "text-amber-800 dark:text-gold",
    accentColor: "from-gold to-warning-500",
    borderGlowColor: "",
  },
  {
    id: "r16",
    release: "Release 1.6",
    status: "planned",
    statusBadgeColor:
      "bg-sky-500/12 text-sky-700 dark:bg-info/15 dark:text-info",
    icon: MessageSquare,
    iconBoxColor:
      "bg-sky-500/10 border-sky-500/25 text-sky-700 dark:bg-card dark:border-white/15 dark:text-info",
    checkColor: "text-sky-700 dark:text-info",
    accentColor: "from-blue to-info",
    borderGlowColor: "",
  },
  {
    id: "r20",
    release: "Release 2.0+",
    status: "epic",
    statusBadgeColor:
      "bg-danger-500/12 text-danger-500 dark:bg-danger-500/15 dark:text-danger-400",
    icon: Swords,
    iconBoxColor:
      "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:bg-card dark:border-white/15 dark:text-danger-400",
    checkColor: "text-rose-700 dark:text-danger-400",
    accentColor: "from-danger-500 to-warning-500",
    borderGlowColor: "",
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
    badgeColor:
      "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:bg-gold/20 dark:border-gold/60 dark:text-gold",
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
