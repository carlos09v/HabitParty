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
  MysteryBoxLootItem,
  MysteryBoxPreset,
  MysteryBoxTier,
  PackageLevel,
  PackageMessageKey,
  RewardCategory,
  RewardIconOption,
  RewardType,
  RewardTypeMessageKey,
  RewardTypeMeta,
  RouletteItem,
} from "@/types/reward";
import type { IconOption, SelectOption } from "@/types/ui";

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

export const MYSTERY_BOX_TIERS: readonly MysteryBoxTier[] = [
  {
    id: "Básico",
    backendPackageLevel: "BASIC",
    name: "Caixa Básica",
    recommendedPrice: 5,
    subtitle: "Pausas Diárias & Mimos Rápidos",
    concept:
      "Micro-recompensas para manter o ritmo sem culpa e sem desbalancear o saldo.",
    colorName: "Verde Esmeralda",
    icon: Package,
    badgeClass:
      "text-emerald-700 bg-emerald-500/15 border-emerald-500/35 dark:text-success-400 dark:bg-success-500/15 dark:border-success-500/30",
    borderClass: "border-success-500/30 hover:border-success-500/60",
    borderSelectedClass:
      "border-success-500 ring-2 ring-success-500/30 shadow-sm dark:ring-success-500/50 dark:shadow-[0_0_20px_rgba(0,201,80,0.3)]",
    bgClass: "bg-success-500/5 hover:bg-success-500/10",
    bgSelectedClass: "bg-success-500/15",
    textClass: "text-emerald-700 dark:text-success-400",
    glowClass: "shadow-[0_0_12px_rgba(0,201,80,0.2)]",
    ringClass: "ring-success-500",
    accentGlow: "rgba(0, 201, 80, 0.4)",
    slotMaxMinutes: [20, 35, 60],
    dropRates: [
      {
        percentage: 60,
        label: "Pausa Revigorante (10-15m)",
        description: "Café especial, snack favorito, 1 vídeo ou pausa curta.",
        badgeVariant: "emerald",
      },
      {
        percentage: 30,
        label: "Cupom de Lazer Médio (30m)",
        description: "Leitura de lazer, música relaxante ou podcast.",
        badgeVariant: "amber",
      },
      {
        percentage: 10,
        label: "Sessão Focada de Hobby (45m)",
        description: "45 minutos de lazer + 1 moeda de cashback bônus.",
        badgeVariant: "purple",
      },
    ],
  },
  {
    id: "Premium",
    backendPackageLevel: "PREMIUM",
    name: "Caixa Premium",
    recommendedPrice: 15,
    subtitle: "Entretenimento & Sessão de Jogos",
    concept:
      "Recompensa por um ou dois dias de metas cumpridas com excelência.",
    colorName: "Azul Ciano",
    icon: Gift,
    badgeClass:
      "text-sky-700 bg-sky-500/15 border-sky-500/35 dark:text-info dark:bg-info/15 dark:border-info/30",
    borderClass: "border-info/30 hover:border-info/60",
    borderSelectedClass:
      "border-info ring-2 ring-info/30 shadow-sm dark:ring-info/50 dark:shadow-[0_0_20px_rgba(0,194,255,0.3)]",
    bgClass: "bg-info/5 hover:bg-info/10",
    bgSelectedClass: "bg-info/15",
    textClass: "text-sky-700 dark:text-info",
    glowClass: "shadow-[0_0_12px_rgba(0,194,255,0.2)]",
    ringClass: "ring-info",
    accentGlow: "rgba(0, 194, 255, 0.4)",
    slotMaxMinutes: [60, 90, 120],
    dropRates: [
      {
        percentage: 50,
        label: "Lazer Padrão (45-60m)",
        description: "Sessão de videogame ou 1 episódio de série.",
        badgeVariant: "emerald",
      },
      {
        percentage: 35,
        label: "Vale-Lazer Estendido (75-90m)",
        description: "Tempo estendido ou lanche especial de comemoração.",
        badgeVariant: "amber",
      },
      {
        percentage: 15,
        label: "Noite Gamer / Cinema (120m)",
        description: "2 horas de entretenimento ininterrupto e sem culpa.",
        badgeVariant: "purple",
      },
    ],
  },
  {
    id: "Épico",
    backendPackageLevel: "EPIC",
    name: "Caixa Épica",
    recommendedPrice: 35,
    subtitle: "Grande Conquista da Semana",
    concept:
      "Recompensa substancial de final de semana para coroar dias consistentes.",
    colorName: "Magenta Radiante",
    icon: Sparkles,
    badgeClass:
      "text-magenta bg-magenta/10 border-magenta/30 dark:bg-magenta/15 dark:border-magenta/30",
    borderClass: "border-magenta/30 hover:border-magenta/60",
    borderSelectedClass:
      "border-magenta ring-2 ring-magenta/30 shadow-sm dark:ring-magenta/50 dark:shadow-[0_0_20px_rgba(237,43,229,0.35)]",
    bgClass: "bg-magenta/5 hover:bg-magenta/10",
    bgSelectedClass: "bg-magenta/15",
    textClass: "text-magenta",
    glowClass: "shadow-[0_0_15px_rgba(237,43,229,0.25)]",
    ringClass: "ring-magenta",
    accentGlow: "rgba(237, 43, 229, 0.45)",
    slotMaxMinutes: [120, 180, 240],
    dropRates: [
      {
        percentage: 50,
        label: "Bloco Estendido de Lazer (120m)",
        description: "2 horas de jogos favoritos, maratona ou passeio externo.",
        badgeVariant: "emerald",
      },
      {
        percentage: 35,
        label: "Noite Livre Completa (180m)",
        description: "3 horas livres ou livro/jogo na promoção da Steam.",
        badgeVariant: "amber",
      },
      {
        percentage: 15,
        label: "Tarde Inteira de Desconexão (240m)",
        description: "4 horas de descanso merecido e recarga total de ânimo.",
        badgeVariant: "purple",
      },
    ],
  },
  {
    id: "Lendário",
    backendPackageLevel: "LEGENDARY",
    name: "Caixa Lendária",
    recommendedPrice: 80,
    subtitle: "O Santo Graal da Produtividade",
    concept:
      "O ápice de semanas de disciplina e ofensivas intactas. Um marco memorável.",
    colorName: "Dourado Nobre",
    icon: Crown,
    badgeClass:
      "text-amber-700 bg-amber-500/15 border-amber-500/35 dark:text-gold dark:bg-gold/15 dark:border-gold/30",
    borderClass:
      "border-amber-500/40 hover:border-amber-500/75 dark:border-gold/40 dark:hover:border-gold/80",
    borderSelectedClass:
      "border-amber-500 ring-2 ring-amber-500/30 shadow-sm dark:border-gold dark:ring-gold/50 dark:shadow-glow-gold-md",
    bgClass:
      "bg-amber-500/5 hover:bg-amber-500/10 dark:bg-gold/5 dark:hover:bg-gold/10",
    bgSelectedClass: "bg-amber-500/15 dark:bg-gold/15",
    textClass: "text-amber-700 dark:text-gold",
    glowClass: "shadow-glow-gold-xs",
    ringClass: "ring-gold",
    accentGlow: "rgba(237, 229, 57, 0.5)",
    slotMaxMinutes: [240, 480, 480],
    dropRates: [
      {
        percentage: 60,
        label: "Day-Off Parcial de Elite (240m)",
        description: "4 horas dedicadas aos seus hobbies com dever cumprido.",
        badgeVariant: "emerald",
      },
      {
        percentage: 30,
        label: "Day-Off Integral (Dia Inteiro)",
        description: "Folga total de afazeres com proteção total de streak.",
        badgeVariant: "amber",
      },
      {
        percentage: 10,
        label: "Celebração Absoluta (Jackpot Supremo)",
        description:
          "Final de semana livre + autorização para grande mimo real.",
        badgeVariant: "gold",
      },
    ],
  },
] as const;

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
    label: "Épico (120m)",
    suggestedMinutes: 120,
    suggestedPrice: 28,
    dotColor: "bg-magenta",
    unselectedClass:
      "bg-magenta/10 border-magenta/30 text-magenta hover:bg-magenta/15 hover:border-magenta/50 dark:bg-magenta/5 dark:border-magenta/30 dark:hover:bg-magenta/10 dark:hover:border-magenta/60",
    selectedClass:
      "bg-magenta/15 border-magenta text-magenta ring-2 ring-magenta/20 dark:bg-magenta/20 dark:border-magenta dark:text-magenta dark:ring-magenta/40 dark:shadow-[0_0_12px_rgba(237,43,229,0.3)]",
  },
  {
    id: "Lendário",
    label: "Lendário (240m)",
    suggestedMinutes: 240,
    suggestedPrice: 50,
    dotColor: "bg-amber-500 dark:bg-gold",
    unselectedClass:
      "text-amber-700 border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/15 hover:border-amber-500/60 dark:bg-gold/5 dark:border-gold/30 dark:text-gold dark:hover:bg-gold/10 dark:hover:border-gold/60",
    selectedClass:
      "bg-amber-500/15 border-amber-600 text-amber-800 ring-2 ring-amber-500/20 dark:bg-gold/20 dark:border-gold dark:text-gold dark:ring-gold/40 dark:shadow-glow-gold-xs",
  },
] as const;

/**
 * Calcula o preço sugerido calibrado para um cupom de tempo (TimeBased)
 * com base na economia de tarefas e desconto progressivo por pacote.
 */
export function calculateSuggestedCouponPrice(minutes: number): number {
  const safeMin = Math.max(5, Math.round(minutes || 30));
  if (safeMin === 30) return 8;
  if (safeMin === 60) return 15;
  if (safeMin === 120) return 28;
  if (safeMin === 240) return 50;
  return Math.max(1, Math.round(safeMin * 0.25));
}

export const REWARD_SORT_OPTIONS: SelectOption[] = [
  { label: "Ordem Padrão", value: "" },
  { label: "Menor Preço", value: "price-asc" },
  { label: "Maior Preço", value: "price-desc" },
  { label: "Nome (A-Z)", value: "name" },
];

export const REWARD_ICON_KEYWORD_MAP: Record<string, string> = {
  jogar: "gamepad",
  jogo: "gamepad",
  jogos: "gamepad",
  game: "gamepad",
  games: "gamepad",
  videogame: "gamepad",
  play: "gamepad",
  ps5: "gamepad",
  playstation: "gamepad",
  xbox: "gamepad",
  nintendo: "gamepad",
  pc: "gamepad",
  gamer: "gamepad",
  partida: "gamepad",
  steam: "gamepad",
  filme: "clapperboard",
  filmes: "clapperboard",
  serie: "clapperboard",
  series: "clapperboard",
  netflix: "clapperboard",
  cinema: "clapperboard",
  pipoca: "clapperboard",
  anime: "clapperboard",
  youtube: "clapperboard",
  episodio: "clapperboard",
  assistir: "clapperboard",
  maratona: "clapperboard",
  cafe: "coffee",
  coffee: "coffee",
  cappuccino: "coffee",
  expresso: "coffee",
  cha: "coffee",
  starbucks: "coffee",
  pizza: "pizza",
  pizzas: "pizza",
  hamburguer: "pizza",
  burger: "pizza",
  lanche: "pizza",
  comida: "pizza",
  doce: "pizza",
  chocolate: "pizza",
  sorvete: "pizza",
  ifood: "pizza",
  comer: "pizza",
  livro: "book",
  livros: "book",
  ler: "book",
  leitura: "book",
  manga: "book",
  hq: "book",
  kindle: "book",
  estudo: "book",
  estudos: "book",
  musica: "music",
  musicas: "music",
  ouvir: "music",
  spotify: "music",
  album: "music",
  show: "music",
  podcast: "music",
  fone: "music",
  mimo: "gift",
  presente: "gift",
  roupa: "gift",
  trofeu: "trophy",
  premio: "trophy",
  conquista: "trophy",
  vitoria: "trophy",
  meta: "trophy",
  caixa: "mystery_box",
  surpresa: "mystery_box",
  misterio: "mystery_box",
  loot: "mystery_box",
  box: "mystery_box",
  sorte: "mystery_box",
  especial: "sparkles",
  vip: "sparkles",
  brilho: "sparkles",
  estrelas: "sparkles",
  relax: "sparkles",
  movie: "clapperboard",
  movies: "clapperboard",
  tvshow: "clapperboard",
  episode: "clapperboard",
  watch: "clapperboard",
  tea: "coffee",
  espresso: "coffee",
  snack: "pizza",
  food: "pizza",
  dinner: "pizza",
  lunch: "pizza",
  dessert: "pizza",
  sweet: "pizza",
  icecream: "pizza",
  restaurant: "pizza",
  eat: "pizza",
  book: "book",
  books: "book",
  read: "book",
  reading: "book",
  comic: "book",
  study: "book",
  music: "music",
  song: "music",
  listen: "music",
  concert: "music",
  headphones: "headphones",
  gift: "gift",
  treat: "gift",
  buy: "gift",
  clothes: "gift",
  trophy: "trophy",
  prize: "trophy",
  reward: "trophy",
  victory: "trophy",
  goal: "trophy",
  surprise: "mystery_box",
  mystery: "mystery_box",
  luck: "mystery_box",
  special: "sparkles",
  massage: "heart",
  beer: "beer",
  drink: "beer",
  drinks: "beer",
  party: "party",
  celebrate: "party",
  celebration: "party",
  travel: "plane",
  trip: "plane",
  vacation: "plane",
  flight: "plane",
  workout: "dumbbell",
  gym: "dumbbell",
  fitness: "dumbbell",
  treino: "dumbbell",
  ticket: "ticket",
  ingresso: "ticket",

  // Saúde, Autocuidado & Spa
  saude: "heart",
  health: "heart",
  autocuidado: "heart",
  selfcare: "heart",
  skincare: "heart",
  massagem: "heart",
  spa: "heart",
  terapia: "heart",
  bemestar: "heart",

  // Compras, TV & Restaurante
  shopping: "shopping",
  compras: "shopping",
  comprar: "shopping",
  loja: "shopping",
  tv: "tv",
  televisao: "tv",
  dorama: "tv",
  utensils: "utensils",
  jantar: "utensils",
  janta: "utensils",
  restaurante: "utensils",
  almoco: "utensils",
  gastronomia: "utensils",
  culinaria: "utensils",

  // Itens VIP & Especiais
  coroa: "crown",
  crown: "crown",
  realeza: "crown",
  estrela: "star",
  star: "star",
  joia: "gem",
  gema: "gem",
  gem: "gem",
  diamante: "gem",
  tesouro: "gem",
  espada: "swords",
  espadas: "swords",
  swords: "swords",
  varinha: "wand",
  wand: "wand",
  magia: "wand",
  medalha: "medal",
  medal: "medal",
  ouro: "medal",
  escudo: "shield",
  shield: "shield",
  chama: "flame",
  fogo: "flame",
  flame: "flame",
  raio: "zap",
  zap: "zap",
  recarga: "zap",
  chave: "key",
  key: "key",
  cofre: "key",
  caveira: "skull",
  skull: "skull",
};

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

export const ROULETTE_CARD_WIDTH = 132;
export const ROULETTE_CARD_GAP = 12;
export const ROULETTE_TOTAL_CARD_WIDTH =
  ROULETTE_CARD_WIDTH + ROULETTE_CARD_GAP;
export const ROULETTE_TRACK_LENGTH = 45;
export const ROULETTE_WINNING_INDEX = 32;

export const MYSTERY_BOX_ROULETTE_POOLS: Record<string, RouletteItem[]> = {
  Básico: [
    {
      id: "b1",
      name: "Pausa Revigorante",
      icon: "coffee",
      minutes: 15,
      badgeVariant: "emerald",
      badgeLabel: "60% Drop",
    },
    {
      id: "b2",
      name: "Cupom de Lazer Médio",
      icon: "music",
      minutes: 30,
      badgeVariant: "amber",
      badgeLabel: "30% Drop",
    },
    {
      id: "b3",
      name: "Sessão Focada de Hobby",
      icon: "book",
      minutes: 45,
      badgeVariant: "purple",
      badgeLabel: "10% Drop",
    },
  ],
  Premium: [
    {
      id: "p1",
      name: "Lazer Padrão",
      icon: "gamepad",
      minutes: 60,
      badgeVariant: "emerald",
      badgeLabel: "50% Drop",
    },
    {
      id: "p2",
      name: "Vale-Lazer Estendido",
      icon: "pizza",
      minutes: 90,
      badgeVariant: "amber",
      badgeLabel: "35% Drop",
    },
    {
      id: "p3",
      name: "Noite Gamer / Cinema",
      icon: "clapperboard",
      minutes: 120,
      badgeVariant: "purple",
      badgeLabel: "15% Drop",
    },
  ],
  Épico: [
    {
      id: "e1",
      name: "Bloco Estendido de Lazer",
      icon: "gamepad",
      minutes: 120,
      badgeVariant: "emerald",
      badgeLabel: "50% Drop",
    },
    {
      id: "e2",
      name: "Noite Livre Completa",
      icon: "ticket",
      minutes: 180,
      badgeVariant: "amber",
      badgeLabel: "35% Drop",
    },
    {
      id: "e3",
      name: "Tarde de Desconexão",
      icon: "trophy",
      minutes: 240,
      badgeVariant: "purple",
      badgeLabel: "15% Drop",
    },
  ],
  Lendário: [
    {
      id: "l1",
      name: "Day-Off Parcial de Elite",
      icon: "star",
      minutes: 240,
      badgeVariant: "emerald",
      badgeLabel: "60% Drop",
    },
    {
      id: "l2",
      name: "Day-Off Integral",
      icon: "crown",
      minutes: 480,
      badgeVariant: "amber",
      badgeLabel: "30% Drop",
    },
    {
      id: "l3",
      name: "Celebração Absoluta",
      icon: "gem",
      minutes: null,
      badgeVariant: "gold",
      badgeLabel: "10% Drop",
    },
  ],
};

export const DEFAULT_MYSTERY_BOX_LOOT: Record<
  "Básico" | "Premium" | "Épico" | "Lendário",
  readonly [MysteryBoxLootItem, MysteryBoxLootItem, MysteryBoxLootItem]
> = {
  Básico: [
    { name: "Pausa Revigorante", icon: "coffee", minutes: 15 },
    { name: "Cupom de Lazer Médio", icon: "music", minutes: 30 },
    { name: "Sessão Focada de Hobby", icon: "book", minutes: 45 },
  ],
  Premium: [
    { name: "Sessão de Videogame", icon: "gamepad", minutes: 60 },
    { name: "Vale-Lazer Estendido", icon: "pizza", minutes: 90 },
    { name: "Noite Gamer / Cinema", icon: "clapperboard", minutes: 120 },
  ],
  Épico: [
    { name: "Bloco Estendido de Lazer", icon: "gamepad", minutes: 120 },
    { name: "Noite Livre Completa", icon: "ticket", minutes: 180 },
    { name: "Tarde de Desconexão", icon: "trophy", minutes: 240 },
  ],
  Lendário: [
    { name: "Day-Off Parcial de Elite", icon: "star", minutes: 240 },
    { name: "Day-Off Integral", icon: "crown", minutes: 480 },
    { name: "Celebração Absoluta", icon: "gem", minutes: null },
  ],
};

export const MYSTERY_BOX_PRESETS: readonly MysteryBoxPreset[] = [
  {
    id: "gamer",
    icon: Gamepad2,
    tiers: {
      Básico: [
        { name: "Vídeo de Gameplay", icon: "tv", minutes: 15 },
        { name: "Partida Casual", icon: "gamepad", minutes: 30 },
        { name: "Sessão Ranqueada", icon: "trophy", minutes: 60 },
      ],
      Premium: [
        {
          name: "1 Episódio de Série / Anime",
          icon: "clapperboard",
          minutes: 50,
        },
        { name: "Jogatina com Amigos", icon: "gamepad", minutes: 90 },
        { name: "Maratona Gamer / Filme", icon: "tv", minutes: 120 },
      ],
      Épico: [
        { name: "Sessão Coop Estendida", icon: "gamepad", minutes: 120 },
        { name: "Maratona de Série", icon: "clapperboard", minutes: 180 },
        { name: "Noite Gamer Livre", icon: "trophy", minutes: 240 },
      ],
      Lendário: [
        { name: "Tarde Gamer Completa", icon: "gamepad", minutes: 240 },
        { name: "Day-Off de Lançamento", icon: "crown", minutes: 480 },
        { name: "Jogo Novo na Promoção", icon: "shopping_bag", minutes: null },
      ],
    },
  },
  {
    id: "relax",
    icon: Coffee,
    tiers: {
      Básico: [
        { name: "Café ou Chá Especial", icon: "coffee", minutes: null },
        { name: "Pausa Musical / Meditação", icon: "headphones", minutes: 25 },
        { name: "Cochilo Revigorante", icon: "heart", minutes: 45 },
      ],
      Premium: [
        { name: "Banho Relaxante & Skincare", icon: "sparkles", minutes: null },
        { name: "Caminhada ao Ar Livre", icon: "heart", minutes: 60 },
        { name: "Sessão de Filme no Sofá", icon: "tv", minutes: 120 },
      ],
      Épico: [
        { name: "Manhã ou Tarde Sem Pressa", icon: "coffee", minutes: 120 },
        { name: "Spa Day em Casa", icon: "sparkles", minutes: 180 },
        { name: "Desconexão Digital Total", icon: "heart", minutes: 240 },
      ],
      Lendário: [
        { name: "Meio Período Off", icon: "star", minutes: 240 },
        { name: "Day-Off de Descanso Total", icon: "crown", minutes: 480 },
        { name: "Massagem ou Passeio Especial", icon: "gem", minutes: null },
      ],
    },
  },
  {
    id: "gastronomy",
    icon: Pizza,
    tiers: {
      Básico: [
        { name: "Doce ou Chocolate Favorito", icon: "gift", minutes: null },
        { name: "Café Gelado / Capuccino", icon: "coffee", minutes: null },
        { name: "Lanche Especial da Tarde", icon: "pizza", minutes: 30 },
      ],
      Premium: [
        { name: "Açaí ou Sobremesa", icon: "sparkles", minutes: null },
        { name: "Pedir Delivery Favorito", icon: "pizza", minutes: null },
        { name: "Jantar + Filme Especial", icon: "utensils", minutes: 120 },
      ],
      Épico: [
        { name: "Noite da Pizza / Hambúrguer", icon: "pizza", minutes: null },
        { name: "Saída para Cafeteria / Bar", icon: "beer", minutes: 180 },
        { name: "Jantar Comemorativo", icon: "utensils", minutes: null },
      ],
      Lendário: [
        { name: "Brunch ou Almoço Especial", icon: "utensils", minutes: 180 },
        { name: "Restaurante dos Sonhos", icon: "crown", minutes: null },
        { name: "Experiência Gastronômica VIP", icon: "gem", minutes: null },
      ],
    },
  },
  {
    id: "hobbies",
    icon: BookOpen,
    tiers: {
      Básico: [
        { name: "Ouvir Álbum / Podcast", icon: "music", minutes: 20 },
        { name: "Capítulo de Livro / Mangá", icon: "book", minutes: 30 },
        { name: "Prática de Instrumento / Arte", icon: "wand", minutes: 60 },
      ],
      Premium: [
        { name: "Leitura Imersiva", icon: "book", minutes: 60 },
        { name: "Projeto Pessoal Criativo", icon: "wand", minutes: 90 },
        { name: "Sessão de Música / Pintura", icon: "music", minutes: 120 },
      ],
      Épico: [
        { name: "Imersão em Hobby Favorito", icon: "book", minutes: 120 },
        { name: "Tarde Criativa Livre", icon: "wand", minutes: 180 },
        {
          name: "Comprar Livro ou Material",
          icon: "shopping_bag",
          minutes: null,
        },
      ],
      Lendário: [
        { name: "Maratona de Hobby (4h)", icon: "star", minutes: 240 },
        { name: "Dia Inteiro para Projetos", icon: "crown", minutes: 480 },
        { name: "Item de Colecionador / Curso", icon: "gem", minutes: null },
      ],
    },
  },
] as const;
