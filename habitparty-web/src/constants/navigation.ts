import {
  Backpack,
  Gift,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListTodo,
  type LucideIcon,
  Settings,
  Timer,
} from "lucide-react";
import type { NavItem, NavSection } from "@/types/navigation";
import type { AppLocale } from "@/types/ui";

export type { NavItem, NavSection };

export type NavLabelKey =
  | "dashboard"
  | "tasks"
  | "focus"
  | "rewards"
  | "inventory"
  | "history"
  | "settings"
  | "help";

export type NavSectionTitleKey = "activitySection" | "rewardSection";

export interface NavSectionConfig {
  titleKey?: NavSectionTitleKey;
  items: readonly {
    labelKey: NavLabelKey;
    href: string;
    icon: LucideIcon;
  }[];
}

export const NAV_SECTION_CONFIGS: readonly NavSectionConfig[] = [
  {
    items: [
      { labelKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "activitySection",
    items: [
      { labelKey: "tasks", href: "/tasks", icon: ListTodo },
      { labelKey: "focus", href: "/focus", icon: Timer },
    ],
  },
  {
    titleKey: "rewardSection",
    items: [
      { labelKey: "rewards", href: "/rewards", icon: Gift },
      { labelKey: "inventory", href: "/inventory", icon: Backpack },
    ],
  },
] as const;

export const NAV_FOOTER_CONFIGS: readonly {
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
}[] = [
  { labelKey: "history", href: "/history", icon: History },
  { labelKey: "settings", href: "/settings", icon: Settings },
  { labelKey: "help", href: "/help", icon: LifeBuoy },
] as const;

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Painel", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Atividade",
    items: [
      { label: "Tarefas", href: "/tasks", icon: ListTodo },
      { label: "Foco", href: "/focus", icon: Timer },
    ],
  },
  {
    title: "Recompensa",
    items: [
      { label: "Recompensas", href: "/rewards", icon: Gift },
      { label: "Mochila", href: "/inventory", icon: Backpack },
    ],
  },
];

export const NAV_SECTIONS_EN: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Activity",
    items: [
      { label: "Tasks", href: "/tasks", icon: ListTodo },
      { label: "Focus", href: "/focus", icon: Timer },
    ],
  },
  {
    title: "Reward",
    items: [
      { label: "Rewards", href: "/rewards", icon: Gift },
      { label: "Backpack", href: "/inventory", icon: Backpack },
    ],
  },
];

export const NAV_FOOTER: NavItem[] = [
  { label: "Histórico", href: "/history", icon: History },
  { label: "Configurações", href: "/settings", icon: Settings },
  { label: "Ajuda", href: "/help", icon: LifeBuoy },
];

export const NAV_FOOTER_EN: NavItem[] = [
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: LifeBuoy },
];

export function getNavSections(locale: AppLocale): NavSection[] {
  return locale === "en" ? NAV_SECTIONS_EN : NAV_SECTIONS;
}

export function getNavFooter(locale: AppLocale): NavItem[] {
  return locale === "en" ? NAV_FOOTER_EN : NAV_FOOTER;
}
