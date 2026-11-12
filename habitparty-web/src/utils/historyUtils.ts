import { Coins, History, type LucideIcon, Sparkles } from "lucide-react";
import { FOCUS_ICON_MAP } from "@/constants/focus";
import {
  DEFAULT_TRANSACTION_STYLE,
  getDifficultyLabel,
  getPackageLabel,
  getTransactionTypeLabel,
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
import type { DateFormat, TimeFormat, WelcomeCardStat } from "@/types/ui";
import {
  formatDateTime,
  formatShortDate,
  formatTimeDisplay,
  getCapitalizedWeekDays,
  parseServerDate,
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

function formatTransactionTime(
  dateStr?: string | null,
  locale: AppLocale = "pt-BR",
  timeFormat?: TimeFormat,
): string {
  if (!dateStr) return "-";
  const d = parseServerDate(dateStr);
  if (!d) return formatDateTime(dateStr, { locale, timeFormat });
  return formatTimeDisplay(d, { timeFormat, locale });
}

const PACKAGE_BORDER_MAP: Record<string, string> = {
  BASIC: "border-l-emerald-500",
  PREMIUM: "border-l-sky-500",
  EPIC: "border-l-purple-500",
  LEGENDARY: "border-l-amber-500",
};

/**
 * Resolve e normaliza todos os metadados visuais e contextuais de uma transação
 * do histórico (tipo resolvido, rótulos, ícone correto e classes Tailwind).
 */
export function resolveTransactionMetadata(
  transaction: TransactionHistoryResponseDTO,
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeFormat?: TimeFormat,
): TransactionMetadata {
  const isFocus = transaction.transactionType === "FOCUS_COMPLETED";
  const rawType = transaction.transactionType || "TASK_COMPLETED";
  const resolvedType =
    rawType === "TASK_COMPLETED" ? resolveLegacyTaskType(transaction) : rawType;

  const typeConfig =
    TRANSACTION_TYPE_CONFIG[resolvedType] || DEFAULT_TRANSACTION_STYLE;

  const normalizedDiff = transaction.difficulty?.trim().toUpperCase();
  const difficultyLabel = normalizedDiff
    ? getDifficultyLabel(normalizedDiff, locale)
    : null;

  const normalizedPkg = transaction.packageLevel?.trim().toUpperCase();
  // Pacote "NONE" também é exibido ("Comum") para que Loja/Mochila sempre tenham detalhes na coluna
  const packageLabel = normalizedPkg
    ? getPackageLabel(normalizedPkg, locale)
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

  return {
    label: getTransactionTypeLabel(resolvedType, locale),
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
    }),
    formattedTime: formatTransactionTime(
      transaction.createdAt,
      locale,
      timeFormat,
    ),
  };
}

/**
 * Formata um rótulo amigável para o divisor de data do extrato ("Hoje", "Ontem", "Ter, 12 Out" ou "12 Out 2025").
 */
export function formatTransactionDayLabel(
  dateKey: string,
  referenceDateOrLocale: Date | AppLocale = new Date(),
  localeArg: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
): string {
  const referenceDate =
    typeof referenceDateOrLocale === "string"
      ? new Date()
      : referenceDateOrLocale;
  const locale =
    typeof referenceDateOrLocale === "string"
      ? referenceDateOrLocale
      : localeArg;
  const isEn = locale === "en";

  if (!dateKey || dateKey === "unknown") {
    return isEn ? "Unknown date" : "Data desconhecida";
  }

  const todayKey = toLocalDateKey(referenceDate);
  if (dateKey === todayKey) return isEn ? "Today" : "Hoje";

  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);
  if (dateKey === yesterdayKey) return isEn ? "Yesterday" : "Ontem";

  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;

  const dateObj = new Date(y, m - 1, d);
  const weekDay = getCapitalizedWeekDays(locale)[dateObj.getDay()];
  const includeYear = y !== referenceDate.getFullYear();
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
 * Agrupa uma lista de transações por dia no fuso horário local preservando a ordem original.
 */
export function groupTransactionsByDay(
  transactions: TransactionHistoryResponseDTO[],
  referenceDateOrLocale: Date | AppLocale = new Date(),
  localeArg: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
): TransactionDayGroup[] {
  const referenceDate =
    typeof referenceDateOrLocale === "string"
      ? new Date()
      : referenceDateOrLocale;
  const locale =
    typeof referenceDateOrLocale === "string"
      ? referenceDateOrLocale
      : localeArg;

  const groups: TransactionDayGroup[] = [];
  const groupMap = new Map<string, TransactionDayGroup>();

  for (const tx of transactions) {
    const parsed = parseServerDate(tx.createdAt);
    const dateKey = parsed ? toLocalDateKey(parsed) : "unknown";

    let group = groupMap.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        label: formatTransactionDayLabel(
          dateKey,
          referenceDate,
          locale,
          dateFormat,
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

/**
 * Estatísticas do WelcomeCard do Extrato.
 * Moedas e XP refletem apenas as transações da página visível; o total de
 * registros reflete todos os resultados dos filtros atuais.
 */
export function calculateHistoryWelcomeStats(
  input: TransactionHistoryResponseDTO[] | HistoryPageSummary,
  totalElementsOrLocale?: number | AppLocale,
  localeArg: AppLocale = "pt-BR",
  isGamified = true,
): WelcomeCardStat[] {
  const totalElements =
    typeof totalElementsOrLocale === "number"
      ? totalElementsOrLocale
      : undefined;
  const locale =
    typeof totalElementsOrLocale === "string"
      ? totalElementsOrLocale
      : localeArg;
  const isEn = locale === "en";

  const summary = Array.isArray(input)
    ? summarizeHistoryPage(input, totalElements)
    : input;

  const currencyLabel = isGamified
    ? isEn
      ? "Coins"
      : "Moedas"
    : isEn
      ? "Credits"
      : "Créditos";
  const currencyLower = isGamified
    ? isEn
      ? "coins"
      : "moedas"
    : isEn
      ? "credits"
      : "créditos";

  return [
    {
      label: isEn ? `${currencyLabel} on Page` : `${currencyLabel} na Página`,
      value: `+${formatCoins(summary.goldEarned, { locale })} ${currencyLabel}`,
      icon: Coins,
      variant: "gold",
      hint:
        summary.goldSpent > 0
          ? isEn
            ? `−${formatCoins(summary.goldSpent, { locale })} ${currencyLower} spent on this page`
            : `−${formatCoins(summary.goldSpent, { locale })} ${currencyLower} ${isGamified ? "gastas" : "usados"} nesta página`
          : isEn
            ? "earned in visible records"
            : isGamified
              ? "ganhas nos registros visíveis"
              : "acumulados nos registros visíveis",
    },
    {
      label: isGamified
        ? isEn
          ? "XP on Page"
          : "XP na Página"
        : isEn
          ? "Points on Page"
          : "Pontos na Página",
      value: `+${summary.xpEarned} ${isGamified ? "XP" : "pts"}`,
      icon: Sparkles,
      variant: "info",
      hint: isGamified
        ? isEn
          ? "experience in visible records"
          : "experiência nos registros visíveis"
        : isEn
          ? "points in visible records"
          : "pontos nos registros visíveis",
    },
    {
      label: isEn ? "Total Records" : "Total de Registros",
      value: `${summary.totalCount} ${summary.totalCount === 1 ? (isEn ? "transaction" : "transação") : isEn ? "transactions" : "transações"}`,
      icon: History,
      variant: "primary",
      hint: isEn ? "with current filters" : "com os filtros atuais",
    },
  ];
}
