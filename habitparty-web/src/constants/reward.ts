import {
  Beer,
  BookOpen,
  Clapperboard,
  Coffee,
  Crown,
  Dumbbell,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Headphones,
  Heart,
  Key,
  Medal,
  Music,
  Package,
  PartyPopper,
  Pizza,
  Plane,
  Shield,
  ShoppingBag,
  Skull,
  Sparkles,
  Star,
  Swords,
  Ticket,
  Trophy,
  Tv,
  UtensilsCrossed,
  Wand2,
  Zap,
} from "lucide-react";
import type {
  CategoryMessageKey,
  CouponPackageOption,
  MysteryBoxDropRate,
  MysteryBoxTier,
  PackageLevel,
  PackageMessageKey,
  RewardCategory,
  RewardIconOption,
  RewardType,
  RewardTypeMessageKey,
  RewardTypeMeta,
  SingleUseTierOption,
} from "@/types/reward";
import type { IconOption, SelectOption } from "@/types/ui";

export {
  DEFAULT_MYSTERY_BOX_LOOT,
  getMysteryBadgeVariantClass,
  MYSTERY_BADGE_VARIANT_CLASSES,
  MYSTERY_BOX_PRESETS,
  MYSTERY_BOX_ROULETTE_POOLS,
  MYSTERY_BOX_TIERS,
  ROULETTE_CARD_GAP,
  ROULETTE_CARD_WIDTH,
  ROULETTE_TOTAL_CARD_WIDTH,
  ROULETTE_TRACK_LENGTH,
  ROULETTE_WINNING_INDEX,
} from "@/constants/mysteryBox";
export { REWARD_ICON_KEYWORD_MAP } from "@/constants/rewardIconKeywords";
export { calculateSuggestedCouponPrice } from "@/utils/rewardEconomy";

/** Limite máximo de caracteres da descrição de uma recompensa. */
export const REWARD_DESCRIPTION_MAX_LENGTH = 120;

export type {
  CategoryMessageKey,
  CouponPackageOption,
  MysteryBoxDropRate,
  MysteryBoxTier,
  PackageMessageKey,
  RewardIconOption,
  RewardTypeMessageKey,
  RewardTypeMeta,
  SelectOption,
};

export const REWARD_ICONS: readonly IconOption[] = [
  // Ícones Gratuitos Base
  { id: "gamepad", label: "Jogos", icon: Gamepad2 },
  { id: "gift", label: "Mimo", icon: Gift },
  { id: "coffee", label: "Café", icon: Coffee },
  { id: "clapperboard", label: "Cinema/Série", icon: Clapperboard },
  { id: "book", label: "Livro/HQ", icon: BookOpen },
  { id: "music", label: "Música", icon: Music },
  { id: "pizza", label: "Lanche", icon: Pizza },
  { id: "ticket", label: "Ingresso", icon: Ticket },
  { id: "shopping", label: "Compras", icon: ShoppingBag },
  { id: "tv", label: "TV/Anime", icon: Tv },
  { id: "headphones", label: "Podcast", icon: Headphones },
  { id: "party", label: "Comemoração", icon: PartyPopper },
  { id: "beer", label: "Happy Hour", icon: Beer },
  { id: "utensils", label: "Jantar", icon: UtensilsCrossed },
  { id: "plane", label: "Viagem/Lazer", icon: Plane },
  { id: "dumbbell", label: "Fitness", icon: Dumbbell },
  { id: "sparkles", label: "Especial", icon: Sparkles },
  { id: "mystery_box", label: "Surpresa", icon: Package },

  // Ícones Exclusivos VIP Premium
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "star", label: "Estrela VIP", icon: Star, isPremium: true },
  { id: "trophy", label: "Conquista VIP", icon: Trophy, isPremium: true },
  { id: "gem", label: "Joia Rara", icon: Gem, isPremium: true },
  { id: "swords", label: "Loot Épico", icon: Swords, isPremium: true },
  { id: "wand", label: "Artefato", icon: Wand2, isPremium: true },
  { id: "medal", label: "Medalha Ouro", icon: Medal, isPremium: true },
  { id: "shield", label: "Item Mítico", icon: Shield, isPremium: true },
  { id: "flame", label: "Chama Dourada", icon: Flame, isPremium: true },
  { id: "zap", label: "Super Recarga", icon: Zap, isPremium: true },
  { id: "heart", label: "Autocuidado VIP", icon: Heart, isPremium: true },
  { id: "key", label: "Chave Mestra", icon: Key, isPremium: true },
  { id: "skull", label: "Relíquia Sombria", icon: Skull, isPremium: true },
] as const;

/** Índice O(1) para resolução rápida de ícones de recompensa */
export const REWARD_ICON_MAP = new Map(
  REWARD_ICONS.map((item) => [item.id.toLowerCase(), item.icon]),
);

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
  NONE: "text-neutral-400 bg-white/5 border-white/10",
  Básico:
    "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-success-500 dark:bg-success-500/15 dark:border-success-500/30",
  BASIC:
    "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-success-500 dark:bg-success-500/15 dark:border-success-500/30",
  Premium:
    "text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-info dark:bg-info/15 dark:border-info/30",
  PREMIUM:
    "text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-info dark:bg-info/15 dark:border-info/30",
  Épico:
    "text-magenta bg-magenta/10 border-magenta/25 dark:bg-magenta/15 dark:border-magenta/30",
  EPIC: "text-magenta bg-magenta/10 border-magenta/25 dark:bg-magenta/15 dark:border-magenta/30",
  Lendário:
    "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-gold dark:bg-gold/15 dark:border-gold/30",
  LEGENDARY:
    "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-gold dark:bg-gold/15 dark:border-gold/30",
};

export const PACKAGE_BADGE_COLORS = PACKAGE_LEVEL_COLOR;

export const PACKAGE_LEVEL_GLOW: Partial<Record<string, string>> = {
  Básico:
    "border-neutral-700 group-hover:border-emerald-500/45 dark:border-success-500/30 dark:group-hover:border-success-500/50",
  BASIC:
    "border-neutral-700 group-hover:border-emerald-500/45 dark:border-success-500/30 dark:group-hover:border-success-500/50",
  Premium:
    "border-neutral-700 group-hover:border-sky-500/45 dark:border-info/30 dark:group-hover:border-info/50",
  PREMIUM:
    "border-neutral-700 group-hover:border-sky-500/45 dark:border-info/30 dark:group-hover:border-info/50",
  Épico:
    "border-neutral-700 group-hover:border-magenta/45 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  EPIC: "border-neutral-700 group-hover:border-magenta/45 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  Lendário:
    "border-neutral-700 group-hover:border-amber-500/55 dark:border-gold/40 dark:group-hover:border-gold/70 dark:shadow-glow-gold-xs",
  LEGENDARY:
    "border-neutral-700 group-hover:border-amber-500/55 dark:border-gold/40 dark:group-hover:border-gold/70 dark:shadow-glow-gold-xs",
};

export const PACKAGE_LEVEL_ICON_THEME: Partial<Record<string, string>> = {
  Básico:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-success-500/15 dark:border-success-500/30 dark:text-success-400 dark:group-hover:border-success-500/50",
  BASIC:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-success-500/15 dark:border-success-500/30 dark:text-success-400 dark:group-hover:border-success-500/50",
  Premium:
    "bg-sky-500/10 text-sky-700 border-sky-500/20 group-hover:border-sky-500/40 dark:bg-info/15 dark:border-info/30 dark:text-info dark:group-hover:border-info/50",
  PREMIUM:
    "bg-sky-500/10 text-sky-700 border-sky-500/20 group-hover:border-sky-500/40 dark:bg-info/15 dark:border-info/30 dark:text-info dark:group-hover:border-info/50",
  Épico:
    "bg-magenta/10 text-magenta border-magenta/20 group-hover:border-magenta/40 dark:bg-magenta/15 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  EPIC: "bg-magenta/10 text-magenta border-magenta/20 group-hover:border-magenta/40 dark:bg-magenta/15 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  Lendário:
    "bg-amber-500/10 text-amber-700 border-amber-500/25 group-hover:border-amber-500/50 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:group-hover:border-gold/60 dark:shadow-glow-gold-xs",
  LEGENDARY:
    "bg-amber-500/10 text-amber-700 border-amber-500/25 group-hover:border-amber-500/50 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:group-hover:border-gold/60 dark:shadow-glow-gold-xs",
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

export const COUPON_PACKAGE_OPTIONS: readonly CouponPackageOption[] = [
  {
    id: "Nenhum",
    label: "Nenhum",
    unselectedClass:
      "bg-surface/70 border-neutral-600 text-neutral-300 hover:text-neutral-100 hover:bg-surface hover:border-neutral-500 dark:bg-white/5 dark:border-white/10 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 dark:hover:border-white/20",
    selectedClass:
      "bg-neutral-700/60 border-neutral-500 text-neutral-50 ring-2 ring-neutral-500/20 shadow-2xs dark:bg-white/15 dark:border-white/40 dark:text-neutral-100 dark:ring-white/20",
  },
  {
    id: "Básico",
    label: "Básico (30m)",
    suggestedMinutes: 30,
    suggestedPrice: 8,
    dotColor: "bg-emerald-500 dark:bg-success-500",
    unselectedClass:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/15 hover:border-emerald-500/50 dark:bg-success-500/5 dark:border-success-500/30 dark:text-success-400 dark:hover:bg-success-500/10 dark:hover:border-success-500/60",
    selectedClass:
      "bg-emerald-500/15 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-success-500/20 dark:border-success-500 dark:text-success-300 dark:ring-success-500/40 dark:shadow-[0_0_10px_rgba(0,201,80,0.25)]",
  },
  {
    id: "Premium",
    label: "Premium (60m)",
    suggestedMinutes: 60,
    suggestedPrice: 15,
    dotColor: "bg-sky-500 dark:bg-info",
    unselectedClass:
      "bg-sky-500/10 border-sky-500/30 text-sky-700 hover:bg-sky-500/15 hover:border-sky-500/50 dark:bg-info/5 dark:border-info/30 dark:text-info dark:hover:bg-info/10 dark:hover:border-info/60",
    selectedClass:
      "bg-sky-500/15 border-sky-600 text-sky-800 ring-2 ring-sky-500/20 dark:bg-info/20 dark:border-info dark:text-info dark:ring-info/40 dark:shadow-[0_0_10px_rgba(0,194,255,0.25)]",
  },
  {
    id: "Épico",
    label: "Épico (180m)",
    suggestedMinutes: 180,
    suggestedPrice: 40,
    dotColor: "bg-magenta",
    unselectedClass:
      "bg-magenta/10 border-magenta/30 text-magenta hover:bg-magenta/15 hover:border-magenta/50 dark:bg-magenta/5 dark:border-magenta/30 dark:hover:bg-magenta/10 dark:hover:border-magenta/60",
    selectedClass:
      "bg-magenta/15 border-magenta text-magenta ring-2 ring-magenta/20 dark:bg-magenta/20 dark:border-magenta dark:text-magenta dark:ring-magenta/40 dark:shadow-[0_0_12px_rgba(237,43,229,0.3)]",
  },
  {
    id: "Lendário",
    label: "Lendário (480m)",
    suggestedMinutes: 480,
    suggestedPrice: 95,
    dotColor: "bg-amber-500 dark:bg-gold",
    unselectedClass:
      "text-amber-700 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-500/60 dark:bg-gold/5 dark:border-gold/30 dark:text-gold dark:hover:bg-gold/10 dark:hover:border-gold/60",
    selectedClass:
      "bg-amber-500/15 border-amber-600 text-amber-800 ring-2 ring-amber-500/20 dark:bg-gold/20 dark:border-gold dark:text-gold dark:ring-gold/40 dark:shadow-glow-gold-xs",
  },
] as const;

/**
 * Presets exponenciais de horizonte temporal para recompensas de Uso Único (SingleUse):
 * 8 (Mimo Rápido) -> 16 (Diária) -> 60 (Semanal) -> 180 (Marco Épico).
 */
export const SINGLE_USE_TIER_OPTIONS: readonly SingleUseTierOption[] = [
  {
    id: "BASIC",
    suggestedPrice: 8,
    dotColor: "bg-emerald-500 dark:bg-success-500",
    unselectedClass:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/15 hover:border-emerald-500/50 dark:bg-success-500/5 dark:border-success-500/30 dark:text-success-400 dark:hover:bg-success-500/10 dark:hover:border-success-500/60",
    selectedClass:
      "bg-emerald-500/15 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-success-500/20 dark:border-success-500 dark:text-success-300 dark:ring-success-500/40 dark:shadow-[0_0_10px_rgba(0,201,80,0.25)]",
  },
  {
    id: "PREMIUM",
    suggestedPrice: 16,
    dotColor: "bg-sky-500 dark:bg-info",
    unselectedClass:
      "bg-sky-500/10 border-sky-500/30 text-sky-700 hover:bg-sky-500/15 hover:border-sky-500/50 dark:bg-info/5 dark:border-info/30 dark:text-info dark:hover:bg-info/10 dark:hover:border-info/60",
    selectedClass:
      "bg-sky-500/15 border-sky-600 text-sky-800 ring-2 ring-sky-500/20 dark:bg-info/20 dark:border-info dark:text-info dark:ring-info/40 dark:shadow-[0_0_10px_rgba(0,194,255,0.25)]",
  },
  {
    id: "EPIC",
    suggestedPrice: 60,
    dotColor: "bg-magenta",
    unselectedClass:
      "bg-magenta/10 border-magenta/30 text-magenta hover:bg-magenta/15 hover:border-magenta/50 dark:bg-magenta/5 dark:border-magenta/30 dark:hover:bg-magenta/10 dark:hover:border-magenta/60",
    selectedClass:
      "bg-magenta/15 border-magenta text-magenta ring-2 ring-magenta/20 dark:bg-magenta/20 dark:border-magenta dark:text-magenta dark:ring-magenta/40 dark:shadow-[0_0_12px_rgba(237,43,229,0.3)]",
  },
  {
    id: "LEGENDARY",
    suggestedPrice: 180,
    dotColor: "bg-amber-500 dark:bg-gold",
    unselectedClass:
      "text-amber-700 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-500/60 dark:bg-gold/5 dark:border-gold/30 dark:text-gold dark:hover:bg-gold/10 dark:hover:border-gold/60",
    selectedClass:
      "bg-amber-500/15 border-amber-600 text-amber-800 ring-2 ring-amber-500/20 dark:bg-gold/20 dark:border-gold dark:text-gold dark:ring-gold/40 dark:shadow-glow-gold-xs",
  },
] as const;

export const REWARD_SORT_OPTIONS: SelectOption[] = [
  { label: "Ordem Padrão", value: "" },
  { label: "Menor Preço", value: "price-asc" },
  { label: "Maior Preço", value: "price-desc" },
  { label: "Nome (A-Z)", value: "name" },
];

export const REWARD_PACKAGE_FILTER_LEVELS: readonly PackageLevel[] = [
  "Nenhum",
  "Básico",
  "Premium",
  "Épico",
  "Lendário",
] as const;

export const REWARD_PACKAGE_OPTIONS: SelectOption[] = [
  { label: "Todos os Pacotes", value: "" },
  ...REWARD_PACKAGE_FILTER_LEVELS.map((level) => ({
    label: level,
    value: level,
  })),
];

export const REWARD_FORM_CATEGORY_OPTIONS: SelectOption[] = (
  Object.keys(CATEGORY_LABELS) as RewardCategory[]
).map((cat) => ({
  value: cat,
  label: cat,
}));

export const REWARD_FORM_TYPE_KEYS = Object.keys(
  REWARD_TYPE_META,
) as RewardType[];
