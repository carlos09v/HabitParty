import {
  Activity,
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
  Heart,
  Hourglass,
  Key,
  Laptop,
  Medal,
  Mountain,
  Palette,
  Pencil,
  Rocket,
  Shield,
  Skull,
  Sparkles,
  Star,
  Swords,
  Target,
  Timer,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import type { IconOption } from "@/types/ui";

export {
  FOCUS_ICON_KEYWORD_MAP,
  FOCUS_PREMIUM_ICON_IDS,
} from "./focusIconKeywords";

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
  { id: "heart", label: "Autocuidado", icon: Heart },
  { id: "activity", label: "Esporte", icon: Activity },
  { id: "coffee", label: "Pausa/Café", icon: Coffee },
  { id: "palette", label: "Design/Arte", icon: Palette },
  { id: "gamepad", label: "Jogos/Lazer", icon: Gamepad2 },
  { id: "sparkles", label: "Criatividade", icon: Sparkles },
  { id: "compass", label: "Planejamento", icon: Compass },
  { id: "timer", label: "Cronômetro", icon: Timer },

  // Ícones Exclusivos VIP Premium
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "star", label: "Estrela VIP", icon: Star, isPremium: true },
  { id: "flame", label: "Em Chamas", icon: Flame, isPremium: true },
  { id: "zap", label: "Hiperfoco", icon: Zap, isPremium: true },
  { id: "trophy", label: "Campeão", icon: Trophy, isPremium: true },
  { id: "medal", label: "Medalha de Honra", icon: Medal, isPremium: true },
  { id: "swords", label: "Batalha RPG", icon: Swords, isPremium: true },
  { id: "shield", label: "Impenetrável", icon: Shield, isPremium: true },
  { id: "wand", label: "Arcano", icon: Wand2, isPremium: true },
  { id: "gem", label: "Relíquia", icon: Gem, isPremium: true },
  { id: "rocket", label: "Sprint Épico", icon: Rocket, isPremium: true },
  {
    id: "mountain",
    label: "Alta Performance",
    icon: Mountain,
    isPremium: true,
  },
  { id: "hourglass", label: "Tempo Épico", icon: Hourglass, isPremium: true },
  { id: "skull", label: "Boss / Hardcore", icon: Skull, isPremium: true },
  { id: "key", label: "Chave Mestra", icon: Key, isPremium: true },
] as const;

/** Índice O(1) para resolução rápida de ícones de foco */
export const FOCUS_ICON_MAP = new Map(
  FOCUS_ICONS.map((item) => [item.id.toLowerCase(), item.icon]),
);

export function getFocusIcon(iconId?: string) {
  if (!iconId) return BookOpen;
  return FOCUS_ICON_MAP.get(iconId.trim().toLowerCase()) ?? BookOpen;
}
