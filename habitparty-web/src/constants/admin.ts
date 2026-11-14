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
export const PREMIUM_USER_EMAIL_MONTHLY_LIMIT = 100;

export const FREE_USER_MAX_ACTIVE_REMINDERS = 5;
export const PREMIUM_USER_MAX_ACTIVE_REMINDERS = 30;

export const ADMIN_DEFAULT_PAGE_SIZE = 15;

/** Abas de filtro da tabela de usuários */
export const ADMIN_USER_FILTER_TABS = [
  { id: "ALL" },
  { id: "VERIFIED" },
  { id: "UNVERIFIED" },
  { id: "FREE" },
  { id: "PREMIUM" },
  { id: "FOUNDER" },
  { id: "ADMIN" },
] as const;

export type AdminUserFilterId = (typeof ADMIN_USER_FILTER_TABS)[number]["id"];

export function resolveAdminUserFilter(raw?: string): AdminUserFilterId {
  if (!raw) return "ALL";
  const upper = raw.toUpperCase();
  const match = ADMIN_USER_FILTER_TABS.find((t) => t.id === upper);
  return match ? match.id : "ALL";
}

/** Itens de detalhamento de armazenamento mapeados para o design system do HabitParty */
export const ADMIN_STORAGE_BREAKDOWN_CONFIG = [
  {
    key: "tasks",
    icon: ListTodo,
    color: "text-info bg-info/10 border-info/30",
  },
  {
    key: "checklists",
    icon: CheckSquare,
    color:
      "text-emerald-700 dark:text-success-500 bg-success-500/10 border-success-500/30",
  },
  {
    key: "workspaces",
    icon: Layers,
    color:
      "text-primary dark:text-primary-light bg-primary/15 dark:bg-primary/20 border-primary/30",
  },
  {
    key: "history",
    icon: History,
    color: "text-amber-700 dark:text-gold bg-gold/10 border-gold/30",
  },
  {
    key: "inventory",
    icon: Backpack,
    color: "text-magenta bg-magenta/15 border-magenta/30",
  },
  {
    key: "focus",
    icon: Timer,
    color: "text-info bg-info/15 border-info/30",
  },
  {
    key: "userRow",
    icon: UserIcon,
    color:
      "text-neutral-300 bg-surface border-neutral-700 dark:border-white/10",
  },
] as const;
