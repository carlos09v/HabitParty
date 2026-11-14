import type { LucideIcon } from "lucide-react";
import { FOCUS_ICON_MAP } from "@/constants/focus";
import {
  DEFAULT_TRANSACTION_STYLE,
  NEGATIVE_TRANSACTION_TYPES,
  TRANSACTION_TYPE_CONFIG,
} from "@/constants/history";
import { PACKAGE_BADGE_COLORS, REWARD_ICONS } from "@/constants/reward";
import { COLUMN_ICONS } from "@/constants/routine";
import { DIFFICULTY_BORDER, TASK_DIFFICULTY_META } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type {
  HistoryPageSummary,
  TransactionDayGroup,
  TransactionHistoryResponseDTO,
  TransactionMetadata,
} from "@/types/history";
import type { DateFormat, TimeFormat } from "@/types/ui";
import {
  formatDateTime,
  formatShortDate,
  formatTimeDisplay,
  getCapitalizedWeekDays,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  parseServerDate,
} from "./date";

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

function formatTransactionTime(
  dateStr?: string | null,
  locale: AppLocale = "pt-BR",
  timeFormat?: TimeFormat,
  timeZone?: string | null,
): string {
  if (!dateStr) return "-";
  const d = parseServerDate(dateStr);
  if (!d) return formatDateTime(dateStr, { locale, timeFormat, timeZone });
  return formatTimeDisplay(d, { timeFormat, locale, timeZone });
}

const PACKAGE_BORDER_MAP: Record<string, string> = {
  BASIC: "border-l-emerald-500",
  PREMIUM: "border-l-sky-500",
  EPIC: "border-l-purple-500",
  LEGENDARY: "border-l-amber-500",
};

export interface TransactionMetadataLabels {
  defaultTransactionLabel: string;
  getTransactionTypeLabel: (resolvedType: string) => string;
  getDifficultyLabel: (difficulty: string) => string;
  getPackageLabel: (packageLevel: string) => string;
}

/**
 * Resolve e normaliza todos os metadados visuais e contextuais de uma transação
 * do histórico (tipo resolvido, rótulos traduzidos, ícone correto, fuso horário e classes Tailwind).
 */
export function resolveTransactionMetadata(
  transaction: TransactionHistoryResponseDTO,
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeFormat?: TimeFormat,
  timeZone?: string | null,
  labels?: TransactionMetadataLabels,
): TransactionMetadata {
  const isFocus = transaction.transactionType === "FOCUS_COMPLETED";
  const rawType = transaction.transactionType || "TASK_COMPLETED";
  const resolvedType =
    rawType === "TASK_COMPLETED" ? resolveLegacyTaskType(transaction) : rawType;

  const typeConfig =
    TRANSACTION_TYPE_CONFIG[resolvedType] || DEFAULT_TRANSACTION_STYLE;

  const normalizedDiff = transaction.difficulty?.trim().toUpperCase();
  const difficultyLabel = normalizedDiff
    ? labels
      ? labels.getDifficultyLabel(normalizedDiff)
      : normalizedDiff
    : null;

  const normalizedPkg = transaction.packageLevel?.trim().toUpperCase();
  const packageLabel = normalizedPkg
    ? labels
      ? labels.getPackageLabel(normalizedPkg)
      : normalizedPkg
    : null;

  // Penalidades/falhas sempre usam o vermelho do tipo, sem herdar a cor da dificuldade
  const borderClass = NEGATIVE_TRANSACTION_TYPES.has(resolvedType)
    ? typeConfig.borderClass
    : (normalizedDiff && DIFFICULTY_BORDER[normalizedDiff]) ||
      (normalizedPkg && PACKAGE_BORDER_MAP[normalizedPkg]) ||
      typeConfig.borderClass;

  const secondaryBadgeClass =
    (normalizedDiff && TASK_DIFFICULTY_META[normalizedDiff]?.badgeColor) ||
    (normalizedPkg && PACKAGE_BADGE_COLORS[normalizedPkg]) ||
    "bg-white/10 border-white/15 text-neutral-200";

  const label = labels
    ? labels.getTransactionTypeLabel(resolvedType) ||
      labels.defaultTransactionLabel
    : resolvedType;

  return {
    label,
    badgeClass: typeConfig.badgeClass,
    borderClass,
    secondaryBadgeClass,
    icon: resolveTransactionIcon(transaction, isFocus, typeConfig.icon),
    isFocus,
    resolvedType,
    difficultyLabel,
    packageLabel,
    formattedDate: formatDateTime(transaction.createdAt, {
      locale,
      dateFormat,
      timeFormat,
      timeZone,
    }),
    formattedTime: formatTransactionTime(
      transaction.createdAt,
      locale,
      timeFormat,
      timeZone,
    ),
  };
}

export interface TransactionDayLabels {
  unknownDate: string;
  today: string;
  yesterday: string;
}

/**
 * Formata um rótulo amigável para o divisor de data do extrato ("Hoje", "Ontem", "Ter, 12 Out" ou "12 Out 2025"),
 * respeitando o fuso horário do usuário.
 */
export function formatTransactionDayLabel(
  dateKey: string,
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeZone?: string | null,
  dayLabels?: TransactionDayLabels,
): string {
  const isEn = locale === "en";

  if (!dateKey || dateKey === "unknown") {
    return (
      dayLabels?.unknownDate ?? (isEn ? "Unknown date" : "Data desconhecida")
    );
  }

  const todayParts = getDatePartsInTimeZone(referenceDate, timeZone);
  const todayKey = getDateKeyInTimeZone(referenceDate, timeZone);
  if (dateKey === todayKey) {
    return dayLabels?.today ?? (isEn ? "Today" : "Hoje");
  }

  const yesterdayUtc = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day - 1),
  );
  const yesterdayKey = `${yesterdayUtc.getUTCFullYear()}-${String(yesterdayUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterdayUtc.getUTCDate()).padStart(2, "0")}`;
  if (dateKey === yesterdayKey) {
    return dayLabels?.yesterday ?? (isEn ? "Yesterday" : "Ontem");
  }

  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;

  const dateObj = new Date(y, m - 1, d);
  const weekDay = getCapitalizedWeekDays(locale)[dateObj.getDay()];
  const includeYear = y !== todayParts.year;
  const formattedDate = formatShortDate(dateKey, {
    includeYear,
    monthFormat: "short",
    locale,
    dateFormat,
  });

  if (includeYear) {
    return formattedDate;
  }
  return `${weekDay}, ${formattedDate}`;
}

/**
 * Agrupa uma lista de transações por dia no fuso horário do usuário preservando a ordem original.
 */
export function groupTransactionsByDay(
  transactions: TransactionHistoryResponseDTO[],
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeZone?: string | null,
  dayLabels?: TransactionDayLabels,
): TransactionDayGroup[] {
  const groups: TransactionDayGroup[] = [];
  const groupMap = new Map<string, TransactionDayGroup>();

  for (const tx of transactions) {
    const parsed = parseServerDate(tx.createdAt);
    const dateKey = parsed ? getDateKeyInTimeZone(parsed, timeZone) : "unknown";

    let group = groupMap.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        label: formatTransactionDayLabel(
          dateKey,
          referenceDate,
          locale,
          dateFormat,
          timeZone,
          dayLabels,
        ),
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
