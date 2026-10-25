import { Coins, History, type LucideIcon, Sparkles } from "lucide-react";
import { FOCUS_ICON_MAP } from "@/constants/focus";
import {
  DEFAULT_TRANSACTION_STYLE,
  DIFFICULTY_LABELS,
  PACKAGE_LABELS,
  TRANSACTION_TYPE_CONFIG,
} from "@/constants/history";
import { REWARD_ICONS } from "@/constants/reward";
import { COLUMN_ICONS } from "@/constants/routine";
import type {
  HistoryPageSummary,
  TransactionDayGroup,
  TransactionHistoryResponseDTO,
  TransactionMetadata,
} from "@/types/history";
import type { WelcomeCardStat } from "@/types/ui";
import {
  CAPITALIZED_WEEK_DAYS_BR,
  formatDateTime,
  parseServerDate,
  SHORT_MONTHS_BR,
} from "./date";
import { formatCoins } from "./economy";
import { toLocalDateKey } from "./focusMetrics";

/** Índices de ícones construídos uma única vez (evita `.find` por linha/render). */
const toIconMap = (items: readonly { id: string; icon: LucideIcon }[]) =>
  new Map(items.map((item) => [item.id.toLowerCase(), item.icon]));

const REWARD_ICON_MAP = toIconMap(REWARD_ICONS);
const COLUMN_ICON_MAP = toIconMap(COLUMN_ICONS);

/**
 * Fallback para transações legadas salvas genericamente como TASK_COMPLETED:
 * tenta inferir o tipo real (hábito/diária) a partir das tags.
 */
function resolveLegacyTaskType(
  transaction: TransactionHistoryResponseDTO,
): string {
  const lowerTags = (transaction.tags ?? []).map((t) => t.toLowerCase());
  if (lowerTags.some((t) => t.includes("habit") || t.includes("hábito"))) {
    return "HABIT_COMPLETED";
  }
  if (
    lowerTags.some(
      (t) =>
        t.includes("daily") || t.includes("diária") || t.includes("diaria"),
    )
  ) {
    return "DAILY_COMPLETED";
  }
  return "TASK_COMPLETED";
}

function resolveTransactionIcon(
  transaction: TransactionHistoryResponseDTO,
  isFocus: boolean,
  fallback: LucideIcon,
): LucideIcon {
  const iconId = transaction.icon?.trim().toLowerCase();
  if (!iconId) return fallback;

  if (isFocus) {
    return FOCUS_ICON_MAP.get(iconId) ?? fallback;
  }
  return REWARD_ICON_MAP.get(iconId) ?? COLUMN_ICON_MAP.get(iconId) ?? fallback;
}

function formatTransactionTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  const d = parseServerDate(dateStr);
  if (!d) return formatDateTime(dateStr);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Resolve e normaliza todos os metadados visuais e contextuais de uma transação
 * do histórico (tipo resolvido, rótulos, ícone correto e classes Tailwind).
 */
export function resolveTransactionMetadata(
  transaction: TransactionHistoryResponseDTO,
): TransactionMetadata {
  const isFocus = transaction.transactionType === "FOCUS_COMPLETED";
  const rawType = transaction.transactionType || "TASK_COMPLETED";
  const resolvedType =
    rawType === "TASK_COMPLETED" ? resolveLegacyTaskType(transaction) : rawType;

  const typeConfig =
    TRANSACTION_TYPE_CONFIG[resolvedType] || DEFAULT_TRANSACTION_STYLE;

  const difficultyLabel = transaction.difficulty
    ? DIFFICULTY_LABELS[transaction.difficulty] || transaction.difficulty
    : null;

  const packageLabel =
    transaction.packageLevel && transaction.packageLevel !== "NONE"
      ? PACKAGE_LABELS[transaction.packageLevel] || transaction.packageLevel
      : null;

  return {
    label: typeConfig.label,
    badgeClass: typeConfig.badgeClass,
    borderClass: typeConfig.borderClass,
    icon: resolveTransactionIcon(transaction, isFocus, typeConfig.icon),
    isFocus,
    resolvedType,
    difficultyLabel,
    packageLabel,
    formattedDate: formatDateTime(transaction.createdAt),
    formattedTime: formatTransactionTime(transaction.createdAt),
  };
}

/**
 * Formata um rótulo amigável para o divisor de data do extrato ("Hoje", "Ontem", "Ter, 12 Out" ou "12 Out 2025").
 */
export function formatTransactionDayLabel(
  dateKey: string,
  referenceDate: Date = new Date(),
): string {
  if (!dateKey || dateKey === "unknown") return "Data desconhecida";

  const todayKey = toLocalDateKey(referenceDate);
  if (dateKey === todayKey) return "Hoje";

  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);
  if (dateKey === yesterdayKey) return "Ontem";

  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;

  const dateObj = new Date(y, m - 1, d);
  const weekDay = CAPITALIZED_WEEK_DAYS_BR[dateObj.getDay()];
  const monthName = SHORT_MONTHS_BR[dateObj.getMonth()];
  const dayStr = String(d).padStart(2, "0");

  if (y !== referenceDate.getFullYear()) {
    return `${dayStr} ${monthName} ${y}`;
  }
  return `${weekDay}, ${dayStr} ${monthName}`;
}

/**
 * Agrupa uma lista de transações por dia no fuso horário local preservando a ordem original.
 */
export function groupTransactionsByDay(
  transactions: TransactionHistoryResponseDTO[],
  referenceDate: Date = new Date(),
): TransactionDayGroup[] {
  const groups: TransactionDayGroup[] = [];
  const groupMap = new Map<string, TransactionDayGroup>();

  for (const tx of transactions) {
    const parsed = parseServerDate(tx.createdAt);
    const dateKey = parsed ? toLocalDateKey(parsed) : "unknown";

    let group = groupMap.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        label: formatTransactionDayLabel(dateKey, referenceDate),
        items: [],
      };
      groupMap.set(dateKey, group);
      groups.push(group);
    }
    group.items.push(tx);
  }

  return groups;
}

/**
 * Calcula os totais numéricos puros da página de transações (executável no Server Component).
 */
export function summarizeHistoryPage(
  transactions: TransactionHistoryResponseDTO[],
  totalElements?: number,
): HistoryPageSummary {
  let goldEarned = 0;
  let goldSpent = 0;
  let xpEarned = 0;

  for (const tx of transactions) {
    const gold = tx.goldAmount ?? 0;
    if (gold > 0) goldEarned += gold;
    else if (gold < 0) goldSpent += Math.abs(gold);

    const xp = tx.xpAmount ?? 0;
    if (xp > 0) xpEarned += xp;
  }

  return {
    goldEarned,
    goldSpent,
    xpEarned,
    totalCount: totalElements ?? transactions.length,
  };
}

/**
 * Estatísticas do WelcomeCard do Extrato.
 * Moedas e XP refletem apenas as transações da página visível; o total de
 * registros reflete todos os resultados dos filtros atuais.
 */
export function calculateHistoryWelcomeStats(
  input: TransactionHistoryResponseDTO[] | HistoryPageSummary,
  totalElements?: number,
): WelcomeCardStat[] {
  const summary = Array.isArray(input)
    ? summarizeHistoryPage(input, totalElements)
    : input;

  return [
    {
      label: "Moedas nesta página",
      value: `+${formatCoins(summary.goldEarned)} (pág.)`,
      icon: Coins,
      variant: "gold",
      hint:
        summary.goldSpent > 0
          ? `−${formatCoins(summary.goldSpent)} gastas nesta página`
          : "ganhas nos registros visíveis",
    },
    {
      label: "XP nesta página",
      value: `+${summary.xpEarned} XP (pág.)`,
      icon: Sparkles,
      variant: "info",
      hint: "ganho nos registros visíveis",
    },
    {
      label: "Registros",
      value: `${summary.totalCount} no total`,
      icon: History,
      variant: "default",
      hint: "com os filtros atuais",
    },
  ];
}
