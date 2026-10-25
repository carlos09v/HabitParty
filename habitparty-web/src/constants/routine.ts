import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BookOpen,
  Briefcase,
  CheckSquare,
  Coffee,
  Crown,
  Dumbbell,
  Flame,
  Gem,
  type LucideIcon,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Swords,
  Target,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";

import type { BoardAlignment, ColumnWidthPreset } from "@/types/task-ui";
import type { IconOption } from "@/types/ui";

/** Máximo de colunas exibidas simultaneamente no quadro. */
export const MAX_VISIBLE_COLUMNS = 4;

/** Máximo de colunas (listas) permitidas no plano Premium. */
export const MAX_COLUMNS_PREMIUM = 6;

export type ColumnIconOption = IconOption;

/** Classes de largura das colunas do quadro Kanban por preset. */
export const COLUMN_WIDTH_CLASSES: Readonly<Record<ColumnWidthPreset, string>> =
  {
    compact: "w-[250px] min-w-[240px] max-w-[270px]",
    normal: "w-[300px] min-w-[270px] max-w-[320px]",
    wide: "w-[420px] min-w-[380px] max-w-[460px]",
  };

/** Opções de alinhamento horizontal do quadro Kanban. */
export const ALIGNMENT_OPTIONS: ReadonlyArray<{
  id: BoardAlignment;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "left", label: "Alinhar à esquerda", icon: AlignLeft },
  { id: "center", label: "Centralizar quadro", icon: AlignCenter },
  { id: "right", label: "Alinhar à direita", icon: AlignRight },
] as const;

/** Ícones pré-configurados para seleção de listas/colunas. */
export const COLUMN_ICONS: readonly IconOption[] = [
  // Ícones Gratuitos Base
  { id: "sun", label: "Manhã", icon: Sun },
  { id: "moon", label: "Noite", icon: Moon },
  { id: "flame", label: "Foco", icon: Flame },
  { id: "target", label: "Metas", icon: Target },
  { id: "dumbbell", label: "Treino", icon: Dumbbell },
  { id: "book", label: "Estudos", icon: BookOpen },
  { id: "briefcase", label: "Trabalho", icon: Briefcase },
  { id: "sparkles", label: "Hábitos", icon: Sparkles },
  { id: "coffee", label: "Pausa", icon: Coffee },
  { id: "check", label: "Geral", icon: CheckSquare },

  // Ícones Exclusivos VIP Premium
  { id: "crown", label: "Realeza VIP", icon: Crown, isPremium: true },
  { id: "swords", label: "Quests VIP", icon: Swords, isPremium: true },
  { id: "trophy", label: "Metas VIP", icon: Trophy, isPremium: true },
  { id: "shield", label: "Defesa", icon: Shield, isPremium: true },
  { id: "wand", label: "Projetos", icon: Wand2, isPremium: true },
  { id: "zap", label: "Sprint", icon: Zap, isPremium: true },
  { id: "gem", label: "Tesouros", icon: Gem, isPremium: true },
] as const;

/** Retorna o ícone Lucide correspondente ao ID da coluna, com fallback para Sun. */
export function getColumnIcon(iconId?: string | null): LucideIcon {
  if (iconId) {
    const normalized = iconId.trim().toLowerCase();
    const found = COLUMN_ICONS.find(
      (item) => item.id.toLowerCase() === normalized,
    );
    if (found) return found.icon;
  }
  return Sun;
}

export { TASK_TYPE_FILTER_OPTIONS } from "@/constants/task";

/** Opções de filtro por Status no quadro Kanban. */
export const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendentes" },
  { id: "completed", label: "Concluídas" },
] as const;

/** Mapeamento de palavras-chave para sugestão automática de ícone de coluna. */
export const COLUMN_ICON_KEYWORD_MAP: Readonly<Record<string, string>> = {
  manha: "sun",
  matutina: "sun",
  dia: "sun",
  acordar: "sun",
  noite: "moon",
  noturna: "moon",
  dormir: "moon",
  sono: "moon",
  foco: "flame",
  urgente: "flame",
  prioridade: "flame",
  meta: "target",
  metas: "target",
  objetivo: "target",
  alvo: "target",
  treino: "dumbbell",
  academia: "dumbbell",
  exercicio: "dumbbell",
  fitness: "dumbbell",
  saude: "dumbbell",
  esporte: "dumbbell",
  estudo: "book",
  estudos: "book",
  livro: "book",
  leitura: "book",
  faculdade: "book",
  curso: "book",
  trabalho: "briefcase",
  work: "briefcase",
  projeto: "briefcase",
  tarefa: "check",
  geral: "check",
  todo: "check",
  afazeres: "check",
  habito: "sparkles",
  habitos: "sparkles",
  rotina: "sparkles",
  pausa: "coffee",
  cafe: "coffee",
  descanso: "coffee",
  intervalo: "coffee",
};

/** Sugere automaticamente o ícone com base nas palavras do nome da coluna. */
export function inferColumnIcon(name: string): string | null {
  if (!name.trim()) return null;
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, iconId] of Object.entries(COLUMN_ICON_KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      return iconId;
    }
  }
  return null;
}

/**
 * Resolve de forma determinística quais IDs de colunas devem estar visíveis no Kanban,
 * aplicando o limite do plano (gratuito vs premium) e garantindo que `targetColumnId`
 * (se fornecido e válido) esteja incluído na seleção.
 */
export function resolveVisibleColumnIds(
  allColumnIds: string[],
  savedIds: string[] | undefined | null,
  maxAllowed: number,
  targetColumnId?: string,
): string[] {
  const validSet = new Set(allColumnIds);
  const validSaved = Array.isArray(savedIds)
    ? savedIds.filter((id) => validSet.has(id))
    : [];

  let result =
    validSaved.length > 0
      ? validSaved.slice(0, maxAllowed)
      : allColumnIds.slice(0, maxAllowed);

  if (targetColumnId && validSet.has(targetColumnId)) {
    if (!result.includes(targetColumnId)) {
      result =
        result.length < maxAllowed
          ? [...result, targetColumnId]
          : [...result.slice(0, maxAllowed - 1), targetColumnId];
    }
  }

  return result;
}
