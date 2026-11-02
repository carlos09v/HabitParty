import {
  Briefcase,
  Compass,
  GraduationCap,
  Sparkles,
  Swords,
  Target,
} from "lucide-react";
import type { ExperienceModeOption, ModeOption } from "@/types/onboarding";

export const EXPERIENCE_MODES: readonly ExperienceModeOption[] = [
  {
    id: "PRODUCTIVITY",
    icon: Target,
  },
  {
    id: "GAMIFIED",
    icon: Swords,
  },
] as const;

export const USAGE_MODES: readonly ModeOption[] = [
  {
    id: "personal",
    icon: Sparkles,
  },
  {
    id: "studies",
    icon: GraduationCap,
  },
  {
    id: "work",
    icon: Briefcase,
  },
  {
    id: "all",
    icon: Compass,
  },
] as const;
