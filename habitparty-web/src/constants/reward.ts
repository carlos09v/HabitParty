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
  Trophy,
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

export const REWARD_TYPE_META: Record<
  string,
  { label: string; color: string }
> = {
  SingleUse: {
    label: "Uso Único",
    color: "text-neutral-200 bg-white/10 border-white/20",
  },
  TimeBased: {
    label: "Cupom",
    color: "text-success-500 bg-success-500/15 border-success-500/30",
  },
  MysteryBox: {
    label: "Caixa Misteriosa",
    color: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  },
};

export const PACKAGE_LEVEL_COLOR: Partial<Record<string, string>> = {
  Nenhum: "text-neutral-400 bg-white/5 border-white/10",
  Básico: "text-success-500 bg-success-500/15 border-success-500/30",
  Premium: "text-info bg-info/15 border-info/30",
  Épico: "text-magenta bg-magenta/15 border-magenta/30",
  Lendário: "text-gold bg-gold/15 border-gold/30",
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
