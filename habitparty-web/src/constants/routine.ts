import {
  BookOpen,
  Briefcase,
  CheckSquare,
  Coffee,
  Dumbbell,
  Flame,
  type LucideIcon,
  Moon,
  Sparkles,
  Sun,
  Target,
} from "lucide-react";

import type { IconOption } from "@/types/ui";

/** Máximo de colunas exibidas simultaneamente no quadro. */
export const MAX_VISIBLE_COLUMNS = 4;

/** Máximo de colunas (listas) permitidas no plano Premium. */
export const MAX_COLUMNS_PREMIUM = 6;

export type ColumnIconOption = IconOption;

/** Ícones pré-configurados para seleção de listas/colunas. */
export const COLUMN_ICONS: readonly IconOption[] = [
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

/** Opções de filtro por Tipo de Tarefa no quadro Kanban. */
export const TASK_TYPE_FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "HABIT", label: "Hábitos" },
  { id: "DAILY", label: "Diárias" },
  { id: "TODO", label: "Afazeres" },
] as const;

/** Opções de filtro por Status no quadro Kanban. */
export const STATUS_FILTER_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendentes" },
  { id: "completed", label: "Concluídas" },
] as const;
