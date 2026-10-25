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
  type LucideIcon,
  Medal,
  Music,
  Package,
  PartyPopper,
  Pizza,
  Plane,
  Shield,
  ShoppingBag,
  Smile,
  Sparkles,
  Star,
  Swords,
  Ticket,
  Timer,
  Trophy,
  Tv,
  UtensilsCrossed,
  Wand2,
  Zap,
} from "lucide-react";
import type {
  PackageLevel,
  RewardCategory,
  RewardType,
  RouletteItem,
} from "@/types/reward";
import type { IconOption, SelectOption } from "@/types/ui";

export type RewardIconOption = IconOption;

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
  { id: "trophy", label: "Conquista", icon: Trophy },
  { id: "mystery_box", label: "Surpresa", icon: Package },

  // Ícones Exclusivos VIP Premium
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "gem", label: "Joia Rara", icon: Gem, isPremium: true },
  { id: "swords", label: "Loot Épico", icon: Swords, isPremium: true },
  { id: "wand", label: "Artefato", icon: Wand2, isPremium: true },
  { id: "medal", label: "Medalha Ouro", icon: Medal, isPremium: true },
  { id: "shield", label: "Item Mítico", icon: Shield, isPremium: true },
  { id: "flame", label: "Chama Dourada", icon: Flame, isPremium: true },
  { id: "zap", label: "Super Recarga", icon: Zap, isPremium: true },
  { id: "heart", label: "Autocuidado VIP", icon: Heart, isPremium: true },
] as const;

export function getRewardIcon(
  iconId?: string | null,
  rewardType?: string | null,
): LucideIcon {
  if (iconId) {
    const normalized = iconId.trim().toLowerCase();
    if (normalized === "joystick") return Gamepad2;
    if (normalized === "book_open") return BookOpen;
    if (normalized === "smile") return Smile;
    if (normalized === "timer") return Timer;
    if (normalized === "star") return Star;
    if (normalized === "mystery_box" || normalized === "package")
      return Package;
    const found = REWARD_ICONS.find(
      (item) => item.id.toLowerCase() === normalized,
    );
    if (found) return found.icon;
  }
  if (rewardType === "MysteryBox" || rewardType === "MISTERY_BOX") {
    return Package;
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

export interface MysteryBoxDropRate {
  percentage: number;
  label: string;
  description: string;
  badgeVariant: "emerald" | "amber" | "purple" | "gold";
}

export interface MysteryBoxTier {
  id: "Básico" | "Premium" | "Épico" | "Lendário";
  backendPackageLevel: "BASIC" | "PREMIUM" | "EPIC" | "LEGENDARY";
  name: string;
  recommendedPrice: number;
  subtitle: string;
  concept: string;
  colorName: string;
  icon: LucideIcon;
  badgeClass: string;
  borderClass: string;
  borderSelectedClass: string;
  bgClass: string;
  bgSelectedClass: string;
  textClass: string;
  glowClass: string;
  ringClass: string;
  accentGlow: string;
  dropRates: MysteryBoxDropRate[];
}

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
    badgeClass: "text-success-400 bg-success-500/15 border-success-500/30",
    borderClass: "border-success-500/30 hover:border-success-500/60",
    borderSelectedClass:
      "border-success-500 ring-2 ring-success-500/50 shadow-[0_0_20px_rgba(0,201,80,0.3)]",
    bgClass: "bg-success-500/5 hover:bg-success-500/10",
    bgSelectedClass: "bg-success-500/15",
    textClass: "text-success-400",
    glowClass: "shadow-[0_0_12px_rgba(0,201,80,0.2)]",
    ringClass: "ring-success-500",
    accentGlow: "rgba(0, 201, 80, 0.4)",
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
    badgeClass: "text-info bg-info/15 border-info/30",
    borderClass: "border-info/30 hover:border-info/60",
    borderSelectedClass:
      "border-info ring-2 ring-info/50 shadow-[0_0_20px_rgba(0,194,255,0.3)]",
    bgClass: "bg-info/5 hover:bg-info/10",
    bgSelectedClass: "bg-info/15",
    textClass: "text-info",
    glowClass: "shadow-[0_0_12px_rgba(0,194,255,0.2)]",
    ringClass: "ring-info",
    accentGlow: "rgba(0, 194, 255, 0.4)",
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
    badgeClass: "text-magenta bg-magenta/15 border-magenta/30",
    borderClass: "border-magenta/30 hover:border-magenta/60",
    borderSelectedClass:
      "border-magenta ring-2 ring-magenta/50 shadow-[0_0_20px_rgba(237,43,229,0.35)]",
    bgClass: "bg-magenta/5 hover:bg-magenta/10",
    bgSelectedClass: "bg-magenta/15",
    textClass: "text-magenta",
    glowClass: "shadow-[0_0_15px_rgba(237,43,229,0.25)]",
    ringClass: "ring-magenta",
    accentGlow: "rgba(237, 43, 229, 0.45)",
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
    badgeClass: "text-gold bg-gold/15 border-gold/30",
    borderClass: "border-gold/40 hover:border-gold/80",
    borderSelectedClass: "border-gold ring-2 ring-gold/50 shadow-glow-gold-md",
    bgClass: "bg-gold/5 hover:bg-gold/10",
    bgSelectedClass: "bg-gold/15",
    textClass: "text-gold",
    glowClass: "shadow-glow-gold-xs",
    ringClass: "ring-gold",
    accentGlow: "rgba(237, 229, 57, 0.5)",
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

export interface CouponPackageOption {
  id: PackageLevel;
  label: string;
  suggestedMinutes?: number;
  dotColor?: string;
  unselectedClass: string;
  selectedClass: string;
}

export const COUPON_PACKAGE_OPTIONS: readonly CouponPackageOption[] = [
  {
    id: "Nenhum",
    label: "Nenhum",
    unselectedClass:
      "bg-white/5 border-white/10 text-neutral-400 hover:text-neutral-200 hover:bg-white/10 hover:border-white/20",
    selectedClass:
      "bg-white/15 border-white/40 text-neutral-100 ring-2 ring-white/20 shadow-xs",
  },
  {
    id: "Básico",
    label: "Básico (30m)",
    suggestedMinutes: 30,
    dotColor: "bg-success-500",
    unselectedClass:
      "bg-success-500/5 border-success-500/30 text-success-400 hover:bg-success-500/10 hover:border-success-500/60",
    selectedClass:
      "bg-success-500/20 border-success-500 text-success-300 ring-2 ring-success-500/40 shadow-[0_0_10px_rgba(0,201,80,0.25)]",
  },
  {
    id: "Premium",
    label: "Premium (60m)",
    suggestedMinutes: 60,
    dotColor: "bg-info",
    unselectedClass:
      "bg-info/5 border-info/30 text-info hover:bg-info/10 hover:border-info/60",
    selectedClass:
      "bg-info/20 border-info text-info ring-2 ring-info/40 shadow-[0_0_10px_rgba(0,194,255,0.25)]",
  },
  {
    id: "Épico",
    label: "Épico (120m)",
    suggestedMinutes: 120,
    dotColor: "bg-magenta",
    unselectedClass:
      "bg-magenta/5 border-magenta/30 text-magenta hover:bg-magenta/10 hover:border-magenta/60",
    selectedClass:
      "bg-magenta/20 border-magenta text-magenta ring-2 ring-magenta/40 shadow-[0_0_12px_rgba(237,43,229,0.3)]",
  },
  {
    id: "Lendário",
    label: "Lendário (240m)",
    suggestedMinutes: 240,
    dotColor: "bg-gold",
    unselectedClass:
      "bg-gold/5 border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/60",
    selectedClass:
      "bg-gold/20 border-gold text-gold ring-2 ring-gold/40 shadow-glow-gold-xs",
  },
] as const;

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
  jantar: "pizza",
  almoco: "pizza",
  doce: "pizza",
  chocolate: "pizza",
  sorvete: "pizza",
  ifood: "pizza",
  restaurante: "pizza",
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
  compra: "gift",
  compras: "gift",
  comprar: "gift",
  roupa: "gift",
  shopping: "gift",
  shopper: "gift",
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
  massagem: "sparkles",
  spa: "sparkles",
};

export function suggestRewardIconFromTitle(title: string): string | null {
  if (!title.trim()) return null;
  const normalized = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, iconId] of Object.entries(REWARD_ICON_KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      return iconId;
    }
  }
  return null;
}

export function isMysteryBoxReward(
  type?: string | null,
  iconName?: string | null,
): boolean {
  return (
    iconName === "mystery_box" ||
    type === "MysteryBox" ||
    type === "MISTERY_BOX"
  );
}

export function getMysteryBoxTier(
  packageLevel?: string | null,
): MysteryBoxTier {
  if (!packageLevel) return MYSTERY_BOX_TIERS[0];
  return (
    MYSTERY_BOX_TIERS.find(
      (t) =>
        t.id === packageLevel ||
        t.backendPackageLevel === packageLevel ||
        t.id.toLowerCase() === packageLevel.toLowerCase() ||
        t.backendPackageLevel === packageLevel.toUpperCase(),
    ) || MYSTERY_BOX_TIERS[0]
  );
}

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
