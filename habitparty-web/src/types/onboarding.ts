import type { LucideIcon } from "lucide-react";

export type UsageMode = "personal" | "studies" | "work" | "all";

export interface ModeOption {
  id: UsageMode;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultWorkspace: string;
  chips: string[];
}
