import {
  BookOpen,
  Clapperboard,
  Coffee,
  Gamepad2,
  Gift,
  type LucideIcon,
  Music,
  Package,
  Pizza,
  Sparkles,
  Ticket,
  Trophy,
  Zap,
} from "lucide-react";
import type { PackageLevel } from "@/types/reward";
import type { IconOption, SelectOption } from "@/types/ui";

export type RewardIconOption = IconOption;

export const REWARD_ICONS: readonly IconOption[] = [
  { id: "gamepad", label: "Jogos", icon: Gamepad2 },
  { id: "gift", label: "Mimo", icon: Gift },
  { id: "coffee", label: "Café", icon: Coffee },
  { id: "clapperboard", label: "Filmes", icon: Clapperboard },
  { id: "book", label: "Livro", icon: BookOpen },
  { id: "music", label: "Música", icon: Music },
  { id: "pizza", label: "Comida", icon: Pizza },
  { id: "sparkles", label: "Especial", icon: Sparkles },
  { id: "trophy", label: "Troféu", icon: Trophy },
  { id: "mystery_box", label: "Surpresa", icon: Package },
] as const;

export function getRewardIcon(
  iconId?: string | null,
  rewardType?: string | null,
): LucideIcon {
  if (iconId) {
    const normalized = iconId.trim().toLowerCase();
    if (normalized === "joystick") return Gamepad2;
    const found = REWARD_ICONS.find(
      (item) => item.id.toLowerCase() === normalized,
    );
    if (found) return found.icon;
  }
  if (rewardType === "MysteryBox" || rewardType === "MISTERY_BOX") {
    return Gift;
  }
  return Gamepad2;
}

export type { SelectOption };

export interface RewardTypeMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const REWARD_TYPE_META: Record<string, RewardTypeMeta> = {
  SingleUse: {
    label: "Uso Único",
    color: "text-purple-300 bg-purple-500/15 border-purple-500/25",
    icon: Zap,
  },
  TimeBased: {
    label: "Cupom",
    color: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
    icon: Ticket,
  },
  MysteryBox: {
    label: "Caixa Misteriosa",
    color: "text-amber-300 bg-amber-500/15 border-amber-500/25",
    icon: Sparkles,
  },
};

export const PACKAGE_LEVEL_COLOR: Partial<Record<string, string>> = {
  Nenhum: "text-neutral-400 bg-white/5 border-white/10",
  Básico: "text-success-500 bg-success-500/15 border-success-500/30",
  Premium: "text-info bg-info/15 border-info/30",
  Épico: "text-magenta bg-magenta/15 border-magenta/30",
  Lendário: "text-gold bg-gold/15 border-gold/30",
};

export const PACKAGE_LEVEL_GLOW: Partial<Record<string, string>> = {
  Básico: "border-success-500/30 group-hover:border-success-500/50",
  Premium: "border-info/30 group-hover:border-info/50",
  Épico: "border-magenta/30 group-hover:border-magenta/50",
  Lendário: "border-gold/40 group-hover:border-gold/70 shadow-glow-gold-xs",
};

export const PACKAGE_LEVEL_ICON_THEME: Partial<Record<string, string>> = {
  Básico:
    "bg-success-500/15 border-success-500/30 text-success-400 group-hover:border-success-500/50",
  Premium: "bg-info/15 border-info/30 text-info group-hover:border-info/50",
  Épico:
    "bg-magenta/15 border-magenta/30 text-magenta group-hover:border-magenta/50",
  Lendário:
    "bg-gold/15 border-gold/40 text-gold group-hover:border-gold/60 shadow-glow-gold-xs",
};

export const REWARD_TYPE_OPTIONS: SelectOption[] = [
  { label: "Todos os Tipos", value: "" },
  ...Object.entries(REWARD_TYPE_META).map(([value, { label }]) => ({
    label,
    value,
  })),
];

export const CATEGORY_LABELS: Partial<Record<string, string>> = {
  Nenhum: "Nenhum",
  Entretenimento: "Entretenimento",
  "Bem-estar": "Bem-estar",
  Compras: "Compras",
  Desenvolvimento: "Desenvolvimento",
  Sorte: "Sorte",
  Hobbies: "Hobbies",
};

export const REWARD_CATEGORY_OPTIONS: SelectOption[] = [
  { label: "Todas as Categorias", value: "" },
  ...Object.keys(CATEGORY_LABELS).map((cat) => ({
    label: cat,
    value: cat,
  })),
];

export const REWARD_TAG_OPTIONS: SelectOption[] = [
  { label: "Todas as Tags", value: "" },
  { label: "Tempo", value: "Tempo" },
  { label: "Digital", value: "Digital" },
  { label: "Físico", value: "Físico" },
];

export const REWARD_PACKAGE_OPTIONS: SelectOption[] = [
  { label: "Todos os Pacotes", value: "" },
  ...(Object.keys(PACKAGE_LEVEL_COLOR) as PackageLevel[]).map((level) => ({
    label: level,
    value: level,
  })),
];
