import type { LucideIcon } from "lucide-react";

export interface LandingNavAnchor {
  label: string;
  href: string;
}

export interface LandingHeroHighlight {
  label: string;
  icon: LucideIcon;
  colorClass: string;
}

export interface LandingStepItem {
  number: string;
  icon: LucideIcon;
  title: string;
  tag: string;
  description: string;
  color: string;
  borderColor: string;
}

export interface LandingFeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

export interface LandingPlan {
  name: string;
  badge: string;
  badgeColor: string;
  price: string;
  originalPrice?: string;
  period: string;
  description: string;
  highlight: boolean;
  ctaText: string;
  ctaLink: string;
  features: string[];
  slotsLimitBadge?: string;
  isFounder?: boolean;
}

export interface LandingRoadmapItem {
  release: string;
  title: string;
  tagline: string;
  status: "in_progress" | "next" | "planned" | "epic";
  statusLabel: string;
  statusBadgeColor: string;
  icon: LucideIcon;
  accentColor: string;
  borderGlowColor: string;
  features: string[];
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}
