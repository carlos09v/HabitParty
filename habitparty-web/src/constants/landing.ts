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
      numberColor:
        "text-primary/25 dark:text-white/10 group-hover:text-primary/45 dark:group-hover:text-white/20",
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
      numberColor:
        "text-sky-600/25 dark:text-white/10 group-hover:text-sky-600/45 dark:group-hover:text-white/20",
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
      numberColor:
        "text-amber-600/25 dark:text-white/10 group-hover:text-amber-600/45 dark:group-hover:text-white/20",
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
    badgeColor:
      "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30",
    iconBoxColor:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-card dark:text-gold dark:border-white/10",
  },
  {
    id: "rewardShop",
    icon: ShoppingBag,
    badgeColor:
      "bg-primary/10 text-primary border-primary/25 dark:bg-primary-light/15 dark:text-primary-light dark:border-primary-light/30",
    iconBoxColor:
      "bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-card dark:text-primary-light dark:border-white/10",
  },
  {
    id: "hardcoreMode",
    icon: Flame,
    badgeColor:
      "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:bg-danger-500/15 dark:text-danger-500 dark:border-danger-500/30",
    iconBoxColor:
      "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-card dark:text-danger-500 dark:border-white/10",
  },
  {
    id: "workspaces",
    icon: Layers,
    badgeColor:
      "bg-info/10 text-info border-info/25 dark:bg-info/15 dark:border-info/30",
    iconBoxColor:
      "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-card dark:text-info dark:border-white/10",
  },
  {
    id: "analytics",
    icon: LineChart,
    badgeColor:
      "bg-magenta/10 text-magenta border-magenta/25 dark:bg-magenta/15 dark:border-magenta/30",
    iconBoxColor:
      "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/20 dark:bg-card dark:text-magenta dark:border-white/10",
  },
  {
    id: "soundEffects",
    icon: Swords,
    badgeColor:
      "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30",
    iconBoxColor:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-card dark:text-gold dark:border-white/10",
  },
] as const;

export const LANDING_ROADMAP_CONFIGS: readonly LandingRoadmapConfig[] = [
  {
    id: "r11",
    release: "Release 1.1",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    icon: Languages,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    checkColor: "text-emerald-600 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "hover:border-emerald-500/50",
    hasExtras: true,
  },
  {
    id: "r12",
    release: "Release 1.2",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    icon: Trophy,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    checkColor: "text-emerald-600 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "hover:border-emerald-500/50",
  },
  {
    id: "r13",
    release: "Release 1.3",
    status: "completed",
    statusBadgeColor:
      "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
    icon: Timer,
    iconBoxColor:
      "bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:border-emerald-500/40 dark:text-emerald-400 dark:shadow-[0_0_15px_rgba(16,185,129,0.15)]",
    checkColor: "text-emerald-600 dark:text-emerald-400",
    accentColor: "from-emerald-400 via-teal-400 to-emerald-500",
    borderGlowColor: "hover:border-emerald-500/50",
    hasExtras: true,
  },
  {
    id: "r14",
    release: "Release 1.4",
    status: "next",
    statusBadgeColor:
      "bg-amber-500/15 text-amber-800 border-amber-500/30 dark:bg-gold/15 dark:text-gold dark:border-gold/30",
    icon: Palette,
    iconBoxColor:
      "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:bg-card dark:border-white/15 dark:text-gold",
    checkColor: "text-amber-600 dark:text-gold",
    accentColor: "from-gold to-warning-500",
    borderGlowColor: "hover:border-gold/40",
  },
  {
    id: "r15",
    release: "Release 1.5",
    status: "planned",
    statusBadgeColor:
      "bg-purple-500/10 text-purple-700 border-purple-500/25 dark:bg-primary/15 dark:text-primary-light dark:border-primary-light/30",
    icon: Users2,
    iconBoxColor:
      "bg-purple-500/10 border-purple-500/25 text-purple-700 dark:bg-card dark:border-white/15 dark:text-primary-light",
    checkColor: "text-purple-600 dark:text-primary-light",
    accentColor: "from-primary to-primary-light",
    borderGlowColor: "hover:border-primary/40",
  },
  {
    id: "r16",
    release: "Release 1.6",
    status: "planned",
    statusBadgeColor:
      "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:bg-info/15 dark:text-info dark:border-info/30",
    icon: MessageSquare,
    iconBoxColor:
      "bg-sky-500/10 border-sky-500/25 text-sky-700 dark:bg-card dark:border-white/15 dark:text-info",
    checkColor: "text-sky-600 dark:text-info",
    accentColor: "from-blue to-info",
    borderGlowColor: "hover:border-info/40",
  },
  {
    id: "r20",
    release: "Release 2.0+",
    status: "epic",
    statusBadgeColor:
      "bg-danger-500/10 text-danger-400 border-danger-500/25 dark:bg-danger-500/15 dark:text-danger-500 dark:border-danger-500/30",
    icon: Swords,
    iconBoxColor:
      "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:bg-card dark:border-white/15 dark:text-danger-500",
    checkColor: "text-rose-600 dark:text-danger-500",
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
