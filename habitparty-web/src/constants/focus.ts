import {
  BookOpen,
  Brain,
  Code2,
  Coffee,
  Compass,
  Crown,
  Dumbbell,
  Flame,
  Gamepad2,
  Gem,
  GraduationCap,
  Headphones,
  Laptop,
  Palette,
  Pencil,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import type { IconOption } from "@/types/ui";

/** Limite de atividades permitidas no plano Gratuito */
export const MAX_FOCUS_ACTIVITIES_FREE = 4;

/** Limite de atividades permitidas no plano Premium */
export const MAX_FOCUS_ACTIVITIES_PREMIUM = 6;

/** Duração padrão de um ciclo de Pomodoro em minutos */
export const DEFAULT_POMO_MINUTES = 35;

/** Duração padrão do intervalo curto em minutos */
export const DEFAULT_SHORT_BREAK_MINUTES = 5;

/** Duração padrão do intervalo longo em minutos */
export const DEFAULT_LONG_BREAK_MINUTES = 15;

/** Presets rápidos de duração para sessões de Pomodoro (em minutos) */
export const FOCUS_POMO_PRESETS = [15, 25, 35, 45, 50] as const;

/** Presets de duração para inserção manual de foco (em minutos) */
export const FOCUS_MANUAL_PRESETS = [15, 25, 35, 45, 60] as const;

/** Regras de cálculo e tetos de bonificação de foco */
export const FOCUS_REWARD_RULES = {
  MIN_QUALIFYING_MINUTES: 10,
  MAX_EFFECTIVE_MINUTES: 90,
  ANTI_EXPLOIT_THRESHOLD_MINUTES: 15,
  STANDARD_POMO_MIN_MINUTES: 25,
  STANDARD_POMO_MAX_MINUTES: 40,
  STANDARD_COINS_PER_CYCLE: 0.25,
  SHORT_POMO_COINS_PER_CYCLE: 0.1,
  DEEP_WORK_COINS_PER_CYCLE: 0.5,
  STANDARD_XP_PER_CYCLE: 8,
  SHORT_POMO_XP_PER_CYCLE: 4,
  DEEP_WORK_XP_PER_CYCLE: 15,
  UNCOMPLETED_POMO_XP_PER_30_MIN: 6,
  UNCOMPLETED_POMO_COINS_PER_30_MIN: 0.15,
  STOPWATCH_XP_PER_30_MIN: 7,
  STOPWATCH_COINS_PER_30_MIN: 0.2,
  DAILY_SOFT_CAP_MINUTES: 240,
  DAILY_HARD_CAP_MINUTES: 360,
} as const;

/** Opções de ícones temáticos para atividades de foco */
export const FOCUS_ICONS: readonly IconOption[] = [
  // Ícones Gratuitos Base
  { id: "book", label: "Estudos", icon: BookOpen },
  { id: "code", label: "Dev/Código", icon: Code2 },
  { id: "brain", label: "Foco Puro", icon: Brain },
  { id: "graduation", label: "Acadêmico", icon: GraduationCap },
  { id: "pencil", label: "Escrita", icon: Pencil },
  { id: "laptop", label: "Trabalho", icon: Laptop },
  { id: "target", label: "Meta", icon: Target },
  { id: "headphones", label: "Música/Podcast", icon: Headphones },
  { id: "dumbbell", label: "Treino", icon: Dumbbell },
  { id: "coffee", label: "Pausa/Café", icon: Coffee },
  { id: "palette", label: "Design/Arte", icon: Palette },
  { id: "gamepad", label: "Jogos/Lazer", icon: Gamepad2 },
  { id: "rocket", label: "Produtividade", icon: Rocket },
  { id: "sparkles", label: "Criatividade", icon: Sparkles },
  { id: "compass", label: "Planejamento", icon: Compass },
  { id: "timer", label: "Cronômetro", icon: Timer },

  // Ícones Exclusivos VIP Premium
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "swords", label: "Batalha RPG", icon: Swords, isPremium: true },
  { id: "trophy", label: "Campeão", icon: Trophy, isPremium: true },
  { id: "zap", label: "Hiperfoco", icon: Zap, isPremium: true },
  { id: "shield", label: "Impenetrável", icon: Shield, isPremium: true },
  { id: "flame", label: "Em Chamas", icon: Flame, isPremium: true },
  { id: "gem", label: "Relíquia", icon: Gem, isPremium: true },
  { id: "wand", label: "Arcano", icon: Wand2, isPremium: true },
] as const;

/** Índice O(1) para resolução rápida de ícones de foco */
export const FOCUS_ICON_MAP = new Map(
  FOCUS_ICONS.map((item) => [item.id.toLowerCase(), item.icon]),
);

export function getFocusIcon(iconId?: string) {
  if (!iconId) return BookOpen;
  return FOCUS_ICON_MAP.get(iconId.trim().toLowerCase()) ?? BookOpen;
}

export const FOCUS_ICON_KEYWORD_MAP: Record<string, string> = {
  codigo: "code",
  code: "code",
  dev: "code",
  programar: "code",
  programacao: "code",
  software: "code",
  bug: "code",
  ts: "code",
  js: "code",
  java: "code",
  estudo: "book",
  estudos: "book",
  livro: "book",
  leitura: "book",
  ler: "book",
  faculdade: "graduation",
  aula: "graduation",
  curso: "graduation",
  academico: "graduation",
  pos: "graduation",
  trabalho: "laptop",
  work: "laptop",
  job: "laptop",
  laptop: "laptop",
  computador: "laptop",
  reuniao: "laptop",
  treino: "dumbbell",
  academia: "dumbbell",
  exercicio: "dumbbell",
  alongamento: "dumbbell",
  foco: "brain",
  cerebro: "brain",
  deep: "brain",
  mental: "brain",
  escrever: "pencil",
  escrita: "pencil",
  texto: "pencil",
  redacao: "pencil",
  artigo: "pencil",
  musica: "headphones",
  podcast: "headphones",
  ouvir: "headphones",
  audio: "headphones",
  design: "palette",
  arte: "palette",
  desenho: "palette",
  ui: "palette",
  figma: "palette",
  jogar: "gamepad",
  jogo: "gamepad",
  game: "gamepad",
  lazer: "gamepad",
  pausa: "coffee",
  cafe: "coffee",
  descanso: "coffee",
  meta: "target",
  alvo: "target",
  objetivo: "target",
  foguete: "rocket",
  produtividade: "rocket",
  lancamento: "rocket",
  planejamento: "compass",
  cronometro: "timer",
  tempo: "timer",
  criatividade: "sparkles",
};
