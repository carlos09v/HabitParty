import type { LucideIcon } from "lucide-react";

export interface ActivityItem {
  id: string;
  title: string;
  timeSpent: string;
  icon: LucideIcon;
  href: string;
}

export interface EconomyWidgetProps {
  balance?: number;
}

export interface PartyMember {
  id: string;
  name: string;
  level: number;
  role: string;
  status: "online" | "idle" | "offline";
}

export interface DayItem {
  shortName: string;
  dayNumber: number;
  hasActivity?: boolean;
}
