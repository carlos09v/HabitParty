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
import type { IconOption } from "@/types/ui";

export {
  DEFAULT_MYSTERY_BOX_LOOT,
  getMysteryBadgeTextClass,
  getMysteryBadgeVariantClass,
  MYSTERY_BADGE_TEXT_CLASSES,
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

/** Limite máximo de caracteres da descrição de uma recompensa (sincronizado com o backend). */
export const REWARD_DESCRIPTION_MAX_LENGTH = 140;

/** Limites de cards de recompensa na vitrine por plano e teto de pacotes por card agrupado (sincronizado com o backend). */
export const FREE_MAX_REWARD_CARDS = 12;
export const PREMIUM_MAX_REWARD_CARDS = 50;
export const MAX_REWARD_PACKAGES_PER_CARD = 4;

export type {
  CategoryMessageKey,
  CouponPackageOption,
  MysteryBoxDropRate,
  MysteryBoxTier,
  PackageMessageKey,
  RewardIconOption,
  RewardTypeMessageKey,
  RewardTypeMeta,
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
    color:
      "text-purple-700 dark:text-purple-300 bg-purple-500/12 dark:bg-purple-500/15 border-purple-500/30 dark:border-purple-500/25",
    icon: Zap,
  },
  TimeBased: {
    color:
      "text-emerald-700 dark:text-emerald-300 bg-emerald-500/12 dark:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/25",
    icon: Ticket,
  },
  MysteryBox: {
    color:
      "text-amber-700 dark:text-amber-300 bg-amber-500/12 dark:bg-amber-500/15 border-amber-500/30 dark:border-amber-500/25",
    icon: Sparkles,
  },
};

export const PACKAGE_LEVEL_COLOR: Record<PackageMessageKey, string> = {
  NONE: "text-neutral-400 bg-white/5 border-white/10",
  BASIC:
    "text-emerald-700 bg-emerald-500/10 border-emerald-500/25 dark:text-success-500 dark:bg-success-500/15 dark:border-success-500/30",
  PREMIUM:
    "text-sky-700 bg-sky-500/10 border-sky-500/25 dark:text-info dark:bg-info/15 dark:border-info/30",
  EPIC: "text-magenta dark:text-fuchsia-300 bg-magenta/10 border-magenta/25 dark:bg-magenta/15 dark:border-magenta/30",
  LEGENDARY:
    "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-gold dark:bg-gold/15 dark:border-gold/30",
};

export const PACKAGE_LEVEL_GLOW: Partial<Record<PackageMessageKey, string>> = {
  BASIC:
    "border-neutral-700 group-hover:border-emerald-500/45 dark:border-success-500/30 dark:group-hover:border-success-500/50",
  PREMIUM:
    "border-neutral-700 group-hover:border-sky-500/45 dark:border-info/30 dark:group-hover:border-info/50",
  EPIC: "border-neutral-700 group-hover:border-magenta/45 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  LEGENDARY:
    "border-neutral-700 group-hover:border-amber-500/55 dark:border-gold/40 dark:group-hover:border-gold/70 dark:shadow-glow-gold-xs",
};

export const PACKAGE_LEVEL_ICON_THEME: Partial<
  Record<PackageMessageKey, string>
> = {
  BASIC:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 group-hover:border-emerald-500/40 dark:bg-success-500/15 dark:border-success-500/30 dark:text-success-400 dark:group-hover:border-success-500/50",
  PREMIUM:
    "bg-sky-500/10 text-sky-700 border-sky-500/20 group-hover:border-sky-500/40 dark:bg-info/15 dark:border-info/30 dark:text-info dark:group-hover:border-info/50",
  EPIC: "bg-magenta/10 text-magenta dark:text-fuchsia-300 border-magenta/20 group-hover:border-magenta/40 dark:bg-magenta/15 dark:border-magenta/30 dark:group-hover:border-magenta/50",
  LEGENDARY:
    "bg-amber-500/10 text-amber-700 border-amber-500/25 group-hover:border-amber-500/50 dark:bg-gold/15 dark:border-gold/40 dark:text-gold dark:group-hover:border-gold/60 dark:shadow-glow-gold-xs",
};

export const TIER_CHIP_STYLES: Record<
  PackageMessageKey,
  {
    dotColor?: string;
    unselectedClass: string;
    selectedClass: string;
  }
> = {
  NONE: {
    unselectedClass:
      "bg-surface/70 border-neutral-600 text-neutral-300 hover:text-neutral-100 hover:bg-surface hover:border-neutral-500 dark:bg-white/5 dark:border-white/10 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-white/10 dark:hover:border-white/20",
    selectedClass:
      "bg-neutral-700/60 border-neutral-500 text-neutral-50 ring-2 ring-neutral-500/20 shadow-2xs dark:bg-white/15 dark:border-white/40 dark:text-neutral-100 dark:ring-white/20",
  },
  BASIC: {
    dotColor: "bg-emerald-500 dark:bg-success-500",
    unselectedClass:
      "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/15 hover:border-emerald-500/50 dark:bg-success-500/5 dark:border-success-500/30 dark:text-success-400 dark:hover:bg-success-500/10 dark:hover:border-success-500/60",
    selectedClass:
      "bg-emerald-500/15 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-success-500/20 dark:border-success-500 dark:text-success-300 dark:ring-success-500/40 dark:shadow-[0_0_10px_rgba(0,201,80,0.25)]",
  },
  PREMIUM: {
    dotColor: "bg-sky-500 dark:bg-info",
    unselectedClass:
      "bg-sky-500/10 border-sky-500/30 text-sky-700 hover:bg-sky-500/15 hover:border-sky-500/50 dark:bg-info/5 dark:border-info/30 dark:text-info dark:hover:bg-info/10 dark:hover:border-info/60",
    selectedClass:
      "bg-sky-500/15 border-sky-600 text-sky-800 ring-2 ring-sky-500/20 dark:bg-info/20 dark:border-info dark:text-info dark:ring-info/40 dark:shadow-[0_0_10px_rgba(0,194,255,0.25)]",
  },
  EPIC: {
    dotColor: "bg-magenta",
    unselectedClass:
      "bg-magenta/10 border-magenta/30 text-magenta dark:text-fuchsia-300 hover:bg-magenta/15 hover:border-magenta/50 dark:bg-magenta/5 dark:border-magenta/30 dark:hover:bg-magenta/10 dark:hover:border-magenta/60",
    selectedClass:
      "bg-magenta/15 border-magenta text-magenta ring-2 ring-magenta/20 dark:bg-magenta/20 dark:border-magenta dark:text-fuchsia-300 dark:ring-magenta/40 dark:shadow-[0_0_12px_rgba(237,43,229,0.3)]",
  },
  LEGENDARY: {
    dotColor: "bg-amber-500 dark:bg-gold",
    unselectedClass:
      "text-amber-700 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-500/60 dark:bg-gold/5 dark:border-gold/30 dark:text-gold dark:hover:bg-gold/10 dark:hover:border-gold/60",
    selectedClass:
      "bg-amber-500/15 border-amber-600 text-amber-800 ring-2 ring-amber-500/20 dark:bg-gold/20 dark:border-gold dark:text-gold dark:ring-gold/40 dark:shadow-glow-gold-xs",
  },
};

export const REWARD_TYPE_FILTER_VALUES = [
  "",
  "SingleUse",
  "TimeBased",
  "MysteryBox",
] as const;

export const REWARD_CATEGORY_VALUES: readonly RewardCategory[] = [
  "Nenhum",
  "Entretenimento",
  "Bem-estar",
  "Compras",
  "Desenvolvimento",
  "Sorte",
  "Hobbies",
  "Dívida",
] as const;

export const REWARD_CATEGORY_FILTER_VALUES: readonly (RewardCategory | "")[] = [
  "",
  ...REWARD_CATEGORY_VALUES,
] as const;

export const COUPON_PACKAGE_OPTIONS: readonly CouponPackageOption[] = [
  {
    id: "Nenhum",
    label: "Nenhum",
    ...TIER_CHIP_STYLES.NONE,
  },
  {
    id: "Básico",
    label: "Básico (30m)",
    suggestedMinutes: 30,
    suggestedPrice: 8,
    ...TIER_CHIP_STYLES.BASIC,
  },
  {
    id: "Premium",
    label: "Premium (60m)",
    suggestedMinutes: 60,
    suggestedPrice: 15,
    ...TIER_CHIP_STYLES.PREMIUM,
  },
  {
    id: "Épico",
    label: "Épico (180m)",
    suggestedMinutes: 180,
    suggestedPrice: 40,
    ...TIER_CHIP_STYLES.EPIC,
  },
  {
    id: "Lendário",
    label: "Lendário (480m)",
    suggestedMinutes: 480,
    suggestedPrice: 95,
    ...TIER_CHIP_STYLES.LEGENDARY,
  },
] as const;

export interface DebtUnitPricePreset {
  id: "15m" | "30m" | "45m" | "60m";
  minutes: number;
  price: number;
}

/**
 * Tabela linear de atalhos rápidos de preço para criação/edição de Dívidas
 * (taxa base: 8 moedas / 30 min = 0.2667/min).
 * Dívidas são descartáveis e quitadas pelo valor unitário direto ao clicar em "Pagar Dívida".
 */
export const DEBT_UNIT_PRICE_PRESETS: readonly DebtUnitPricePreset[] = [
  { id: "15m", minutes: 15, price: 4 },
  { id: "30m", minutes: 30, price: 8 },
  { id: "45m", minutes: 45, price: 12 },
  { id: "60m", minutes: 60, price: 16 },
] as const;

export const DEBT_DEFAULT_UNIT_PRICE = 8;
export const MAX_ACTIVE_DEBT_CARDS = 15;

export const SINGLE_USE_NONE_OPTION = {
  id: "NONE" as const,
  packageLevel: "Nenhum" as const,
  ...TIER_CHIP_STYLES.NONE,
};

/** Preços sugeridos calibrados para níveis de Uso Único (4 -> 15 -> 50 -> 150). */
export const SINGLE_USE_TIER_SUGGESTED_PRICES: Partial<
  Record<PackageMessageKey, number>
> = {
  BASIC: 4,
  PREMIUM: 15,
  EPIC: 50,
  LEGENDARY: 150,
};

/**
 * Presets calibrados de esforço para recompensas de Uso Único (SingleUse):
 * 4 (Básico/Mimo) -> 15 (Premium/Diário) -> 50 (Épico/Semanal) -> 150 (Lendário/Marco).
 */
export const SINGLE_USE_TIER_OPTIONS: readonly SingleUseTierOption[] = [
  {
    id: "BASIC",
    packageLevel: "Básico",
    suggestedPrice: SINGLE_USE_TIER_SUGGESTED_PRICES.BASIC ?? 4,
    dotColor: TIER_CHIP_STYLES.BASIC.dotColor as string,
    unselectedClass: TIER_CHIP_STYLES.BASIC.unselectedClass,
    selectedClass: TIER_CHIP_STYLES.BASIC.selectedClass,
  },
  {
    id: "PREMIUM",
    packageLevel: "Premium",
    suggestedPrice: SINGLE_USE_TIER_SUGGESTED_PRICES.PREMIUM ?? 15,
    dotColor: TIER_CHIP_STYLES.PREMIUM.dotColor as string,
    unselectedClass: TIER_CHIP_STYLES.PREMIUM.unselectedClass,
    selectedClass: TIER_CHIP_STYLES.PREMIUM.selectedClass,
  },
  {
    id: "EPIC",
    packageLevel: "Épico",
    suggestedPrice: SINGLE_USE_TIER_SUGGESTED_PRICES.EPIC ?? 50,
    dotColor: TIER_CHIP_STYLES.EPIC.dotColor as string,
    unselectedClass: TIER_CHIP_STYLES.EPIC.unselectedClass,
    selectedClass: TIER_CHIP_STYLES.EPIC.selectedClass,
  },
  {
    id: "LEGENDARY",
    packageLevel: "Lendário",
    suggestedPrice: SINGLE_USE_TIER_SUGGESTED_PRICES.LEGENDARY ?? 150,
    dotColor: TIER_CHIP_STYLES.LEGENDARY.dotColor as string,
    unselectedClass: TIER_CHIP_STYLES.LEGENDARY.unselectedClass,
    selectedClass: TIER_CHIP_STYLES.LEGENDARY.selectedClass,
  },
] as const;

export const REWARD_SORT_VALUES = [
  "",
  "price-asc",
  "price-desc",
  "name",
] as const;

export const REWARD_PACKAGE_FILTER_LEVELS: readonly PackageLevel[] = [
  "Nenhum",
  "Básico",
  "Premium",
  "Épico",
  "Lendário",
] as const;

export const REWARD_PACKAGE_FILTER_VALUES: readonly (PackageLevel | "")[] = [
  "",
  ...REWARD_PACKAGE_FILTER_LEVELS,
] as const;

export const REWARD_FORM_CATEGORY_VALUES: readonly RewardCategory[] =
  REWARD_CATEGORY_VALUES.filter((cat) => cat !== "Dívida");

export const REWARD_FORM_TYPE_KEYS = Object.keys(
  REWARD_TYPE_META,
) as RewardType[];
