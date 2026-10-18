import {
  Backpack,
  CheckSquare,
  History,
  Layers,
  ListTodo,
  Timer,
  User as UserIcon,
} from "lucide-react";

/**
 * Limites justos de armazenamento em banco de dados por usuário.
 * No plano Railway (Postgres 1GB+), estes limites protegem o banco
 * de abusos e garantem que milhares de usuários possam usar o app tranquilamente.
 *
 * Média de uso por usuário ativo: ~50 KB a 200 KB em texto.
 */
export const FREE_USER_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB (~5.000 tarefas / afazeres)
export const PREMIUM_USER_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB (~50.000 tarefas / registros)

export const FREE_USER_EMAIL_MONTHLY_LIMIT = 20;
export const FREE_USER_MAX_ACTIVE_REMINDERS = 5;

/** Retorna a cota máxima em bytes de acordo com o plano do usuário */
export function getUserStorageLimitBytes(isPremium: boolean): number {
  return isPremium
    ? PREMIUM_USER_STORAGE_LIMIT_BYTES
    : FREE_USER_STORAGE_LIMIT_BYTES;
}

/** Retorna o limite formatado (ex: "5 MB" ou "50 MB") */
export function getUserStorageLimitFormatted(isPremium: boolean): string {
  return isPremium ? "50 MB" : "5 MB";
}

/** Calcula a porcentagem utilizada da cota (0% a 100%) */
export function calculateStoragePercentage(
  bytesUsed: number,
  isPremium: boolean,
): number {
  const limit = getUserStorageLimitBytes(isPremium);
  if (limit <= 0) return 0;
  const pct = (bytesUsed / limit) * 100;
  return Math.min(Math.round(pct * 10) / 10, 100);
}

/** Abas de filtro da tabela de usuários */
export const ADMIN_USER_FILTER_TABS = [
  { id: "ALL", label: "Todos os Usuários" },
  { id: "FREE", label: "Plano Gratuito" },
  { id: "PREMIUM", label: "Premium VIP" },
  { id: "FOUNDER", label: "Fundadores 👑" },
  { id: "ADMIN", label: "Administradores" },
] as const;

/** Itens de detalhamento de armazenamento mapeados para o design system do HabitParty */
export const ADMIN_STORAGE_BREAKDOWN_CONFIG = [
  {
    key: "tasks",
    label: "Afazeres e Tarefas",
    icon: ListTodo,
    color: "text-info bg-info/10 border-info/30",
  },
  {
    key: "checklists",
    label: "Itens de Checklist",
    icon: CheckSquare,
    color: "text-success-500 bg-success-500/10 border-success-500/30",
  },
  {
    key: "workspaces",
    label: "Ambientes & Quadros",
    icon: Layers,
    color: "text-primary-light bg-primary/20 border-primary/30",
  },
  {
    key: "history",
    label: "Histórico de Economia (XP & Ouro)",
    icon: History,
    color: "text-gold bg-gold/10 border-gold/30",
  },
  {
    key: "inventory",
    label: "Mochila & Inventário",
    icon: Backpack,
    color: "text-magenta bg-magenta/15 border-magenta/30",
  },
  {
    key: "focus",
    label: "Registros de Foco (Pomodoro)",
    icon: Timer,
    color: "text-info bg-info/15 border-info/30",
  },
  {
    key: "userRow",
    label: "Registro de Usuário & Perfil",
    icon: UserIcon,
    color: "text-neutral-300 bg-surface border-white/10",
  },
] as const;
