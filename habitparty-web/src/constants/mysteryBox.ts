import {
  BookOpen,
  Coffee,
  Crown,
  Gamepad2,
  Gift,
  Package,
  Pizza,
  Sparkles,
} from "lucide-react";
import type {
  MysteryBoxDropRate,
  MysteryBoxLootItem,
  MysteryBoxPreset,
  MysteryBoxTier,
  RouletteItem,
} from "@/types/reward";

export const MYSTERY_BADGE_VARIANT_CLASSES: Record<
  MysteryBoxDropRate["badgeVariant"],
  string
> = {
  emerald:
    "bg-emerald-500/15 text-emerald-700 border-emerald-500/35 dark:bg-success-500/20 dark:text-success-400 dark:border-success-500/30",
  amber:
    "bg-amber-500/15 text-amber-700 border-amber-500/35 dark:bg-warning-500/20 dark:text-warning-500 dark:border-warning-500/30",
  gold: "bg-amber-500/20 text-amber-800 border-amber-500/45 dark:bg-gold/20 dark:text-gold dark:border-gold/40",
  purple:
    "bg-purple-500/15 text-purple-700 border-purple-500/35 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
};

/**
 * Resolve as classes de badge (modo claro + escuro) para uma variante de raridade/chance da Caixa Misteriosa.
 */
export function getMysteryBadgeVariantClass(
  variant?: MysteryBoxDropRate["badgeVariant"],
): string {
  if (!variant) return MYSTERY_BADGE_VARIANT_CLASSES.purple;
  return (
    MYSTERY_BADGE_VARIANT_CLASSES[variant] ??
    MYSTERY_BADGE_VARIANT_CLASSES.purple
  );
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

export const ROULETTE_CARD_WIDTH = 132;
export const ROULETTE_CARD_GAP = 12;
export const ROULETTE_TOTAL_CARD_WIDTH =
  ROULETTE_CARD_WIDTH + ROULETTE_CARD_GAP;
export const ROULETTE_TRACK_LENGTH = 45;
export const ROULETTE_WINNING_INDEX = 32;

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
    { name: "Tarde de Desconexão", icon: "sparkles", minutes: 240 },
  ],
  Lendário: [
    { name: "Day-Off Parcial de Elite", icon: "party", minutes: 240 },
    { name: "Day-Off Integral", icon: "sparkles", minutes: 480 },
    { name: "Celebração Absoluta", icon: "gift", minutes: null },
  ],
};

/**
 * Pool padrão da roleta derivado diretamente de `DEFAULT_MYSTERY_BOX_LOOT` e `MYSTERY_BOX_TIERS`,
 * garantindo fonte única de verdade entre o editor de loot e a animação da roleta.
 */
export const MYSTERY_BOX_ROULETTE_POOLS: Record<string, RouletteItem[]> =
  Object.fromEntries(
    MYSTERY_BOX_TIERS.map((tier) => {
      const prefix = tier.backendPackageLevel[0].toLowerCase();
      const defaultLoot = DEFAULT_MYSTERY_BOX_LOOT[tier.id];
      const pool: RouletteItem[] = defaultLoot.map((loot, idx) => {
        const dropRate = tier.dropRates[idx] ?? tier.dropRates[0];
        return {
          id: `${prefix}${idx + 1}`,
          name: loot.name,
          icon: loot.icon || "gift",
          minutes: loot.minutes ?? null,
          badgeVariant: dropRate.badgeVariant,
          badgeLabel: `${dropRate.percentage}% Drop`,
        };
      });
      return [tier.id, pool];
    }),
  );

export const MYSTERY_BOX_PRESETS: readonly MysteryBoxPreset[] = [
  {
    id: "gamer",
    icon: Gamepad2,
    tiers: {
      Básico: [
        { name: "Vídeo de Gameplay", icon: "tv", minutes: 15 },
        { name: "Partida Casual", icon: "gamepad", minutes: 30 },
        { name: "Sessão Ranqueada", icon: "sparkles", minutes: 60 },
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
        { name: "Noite Gamer Livre", icon: "party", minutes: 240 },
      ],
      Lendário: [
        { name: "Tarde Gamer Completa", icon: "gamepad", minutes: 240 },
        { name: "Day-Off de Lançamento", icon: "sparkles", minutes: 480 },
        { name: "Jogo Novo na Promoção", icon: "shopping", minutes: null },
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
        { name: "Cochilo Revigorante", icon: "sparkles", minutes: 45 },
      ],
      Premium: [
        { name: "Banho Relaxante & Skincare", icon: "sparkles", minutes: null },
        { name: "Caminhada ao Ar Livre", icon: "headphones", minutes: 60 },
        { name: "Sessão de Filme no Sofá", icon: "tv", minutes: 120 },
      ],
      Épico: [
        { name: "Manhã ou Tarde Sem Pressa", icon: "coffee", minutes: 120 },
        { name: "Spa Day em Casa", icon: "sparkles", minutes: 180 },
        { name: "Desconexão Digital Total", icon: "book", minutes: 240 },
      ],
      Lendário: [
        { name: "Meio Período Off", icon: "party", minutes: 240 },
        { name: "Day-Off de Descanso Total", icon: "sparkles", minutes: 480 },
        { name: "Massagem ou Passeio Especial", icon: "gift", minutes: null },
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
        { name: "Restaurante dos Sonhos", icon: "sparkles", minutes: null },
        { name: "Experiência Gastronômica VIP", icon: "gift", minutes: null },
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
        {
          name: "Prática de Instrumento / Arte",
          icon: "sparkles",
          minutes: 60,
        },
      ],
      Premium: [
        { name: "Leitura Imersiva", icon: "book", minutes: 60 },
        { name: "Projeto Pessoal Criativo", icon: "sparkles", minutes: 90 },
        { name: "Sessão de Música / Pintura", icon: "music", minutes: 120 },
      ],
      Épico: [
        { name: "Imersão em Hobby Favorito", icon: "book", minutes: 120 },
        { name: "Tarde Criativa Livre", icon: "sparkles", minutes: 180 },
        {
          name: "Comprar Livro ou Material",
          icon: "shopping",
          minutes: null,
        },
      ],
      Lendário: [
        { name: "Maratona de Hobby (4h)", icon: "book", minutes: 240 },
        { name: "Dia Inteiro para Projetos", icon: "sparkles", minutes: 480 },
        { name: "Item de Colecionador / Curso", icon: "gift", minutes: null },
      ],
    },
  },
] as const;
