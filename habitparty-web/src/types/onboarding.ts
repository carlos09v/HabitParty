import type { LucideIcon } from "lucide-react";
import type { ExperienceMode } from "./ui";

export type UsageMode = "personal" | "studies" | "work" | "all";

export interface ModeOption {
  id: UsageMode;
  icon: LucideIcon;
}

export interface ExperienceModeOption {
  id: ExperienceMode;
  icon: LucideIcon;
}
