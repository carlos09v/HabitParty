import type { LucideIcon } from "lucide-react";
import { FOCUS_ICON_MAP } from "@/constants/focusIcons";
import {
  DEFAULT_HISTORY_PAGE_SIZE,
  DEFAULT_TRANSACTION_STYLE,
  DIRECTION_OPTIONS,
  HISTORY_PAGE_SIZE_OPTIONS,
  HISTORY_TABS,
  NEGATIVE_TRANSACTION_TYPES,
  PERIOD_OPTIONS,
  SORT_OPTIONS,
  TRANSACTION_TYPE_CONFIG,
} from "@/constants/history";
import { PACKAGE_LEVEL_COLOR } from "@/constants/reward";
import { COLUMN_ICON_MAP } from "@/constants/routine";
import { DIFFICULTY_BORDER, TASK_DIFFICULTY_META } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type {
  HistoryDirectionFilter,
  HistoryPageSummary,
  HistoryPeriodFilter,
  HistorySortOption,
  HistoryTabId,
  TransactionDayGroup,
  TransactionHistoryResponseDTO,
  TransactionHistorySummaryDTO,
  TransactionMetadata,
} from "@/types/history";
import type { DateFormat, TimeFormat } from "@/types/ui";
import { findRewardIcon, toPackageMessageKey } from "@/utils/rewardMapper";
import {
  formatDateTime,
  formatShortDate,
  formatTimeDisplay,
  getCapitalizedWeekDays,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  parseServerDate,
} from "./date";

const VALID_TABS = new Set<string>(HISTORY_TABS.map((t) => t.id));
const VALID_PERIODS = new Set<string>(PERIOD_OPTIONS.map((p) => p.value));
const VALID_DIRECTIONS = new Set<string>(DIRECTION_OPTIONS.map((d) => d.value));
const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((s) => s.value));
const VALID_PAGE_SIZES = new Set<number>(HISTORY_PAGE_SIZE_OPTIONS);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_HISTORY_PAGE = 100_000;

type RawParamValue = string | string[] | undefined;

function firstParam(value: RawParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return typeof value === "string" ? value : undefined;
}

function parseValidIsoDate(raw?: string): string {
  const trimmed = raw?.trim() ?? "";
  if (!ISO_DATE_RE.test(trimmed)) return "";
  const [y, m, d] = trimmed.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return "";
  }
  return trimmed;
}

export interface NormalizedHistoryQuery {
  tab: HistoryTabId;
  period: HistoryPeriodFilter;
  from: string;
  to: string;
  search: string;
  direction: HistoryDirectionFilter;
  sort: HistorySortOption;
  page: number;
  size: number;
}

export interface RawHistorySearchParams {
  tab?: RawParamValue;
  period?: RawParamValue;
  from?: RawParamValue;
  to?: RawParamValue;
  search?: RawParamValue;
  direction?: RawParamValue;
  sort?: RawParamValue;
  page?: RawParamValue;
  size?: RawParamValue;
}

export function normalizeHistoryQuery(
  raw: RawHistorySearchParams,
): NormalizedHistoryQuery {
  const upperTab = firstParam(raw.tab)?.trim().toUpperCase() ?? "ALL";
  const tab: HistoryTabId = VALID_TABS.has(upperTab)
    ? (upperTab as HistoryTabId)
    : "ALL";

  let from = parseValidIsoDate(firstParam(raw.from));
  let to = parseValidIsoDate(firstParam(raw.to));
  if (from && to && from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  const upperPeriod = firstParam(raw.period)?.trim().toUpperCase() ?? "ALL";
  let period: HistoryPeriodFilter = VALID_PERIODS.has(upperPeriod)
    ? (upperPeriod as HistoryPeriodFilter)
    : "ALL";
  if ((from || to) && period !== "CUSTOM") {
    period = "CUSTOM";
  }

  const upperDirection =
    firstParam(raw.direction)?.trim().toUpperCase() ?? "ALL";
  const direction: HistoryDirectionFilter = VALID_DIRECTIONS.has(upperDirection)
    ? (upperDirection as HistoryDirectionFilter)
    : "ALL";

  const upperSort = firstParam(raw.sort)?.trim().toUpperCase() ?? "NEWEST";
  const sort: HistorySortOption = VALID_SORTS.has(upperSort)
    ? (upperSort as HistorySortOption)
    : "NEWEST";

  const rawPage = firstParam(raw.page);
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const page =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, MAX_HISTORY_PAGE)
      : 1;

  const rawSize = firstParam(raw.size);
  const parsedSize = rawSize
    ? Number.parseInt(rawSize, 10)
    : DEFAULT_HISTORY_PAGE_SIZE;
  const size = VALID_PAGE_SIZES.has(parsedSize)
    ? parsedSize
    : DEFAULT_HISTORY_PAGE_SIZE;

  const search = firstParam(raw.search)?.trim() ?? "";

  return {
    tab,
    period,
    from: period === "CUSTOM" ? from : "",
    to: period === "CUSTOM" ? to : "",
    search,
    direction,
    sort,
    page,
    size,
  };
}

export function isChronologicalHistorySort(sort?: HistorySortOption): boolean {
  return !sort || sort === "NEWEST" || sort === "OLDEST";
}

/**
 * Indica se há filtros restritivos ativos (exclui apenas `sort`, que não filtra registros).
 */
export function hasActiveHistoryFilters(
  query: Pick<
    NormalizedHistoryQuery,
    "tab" | "period" | "from" | "to" | "search" | "direction"
  >,
): boolean {
  return (
    query.tab !== "ALL" ||
    (query.period !== "ALL" &&
      (query.period !== "CUSTOM" || Boolean(query.from || query.to))) ||
    Boolean(query.from) ||
    Boolean(query.to) ||
    Boolean(query.search.trim()) ||
    query.direction !== "ALL"
  );
}

/**
 * Conta quantos filtros avançados (além da aba, busca e período simples) estão ativos.
 */
export function countActiveAdvancedFilters(
  query: Pick<NormalizedHistoryQuery, "direction" | "sort" | "period" | "size">,
): number {
  return (
    (query.direction !== "ALL" ? 1 : 0) +
    (query.sort !== "NEWEST" ? 1 : 0) +
    (query.period === "CUSTOM" ? 1 : 0) +
    (query.size !== DEFAULT_HISTORY_PAGE_SIZE ? 1 : 0)
  );
}

export interface SerializeHistorySearchParamsOptions {
  /** Omitir `period=CUSTOM` e paginação, emitindo apenas os filtros aceitos pelo backend. */
  forBackend?: boolean;
  /** Incluir `size` e `page` para URLs de navegação da UI. */
  includePagination?: boolean;
}

/**
 * Serializa parâmetros de consulta do extrato em `URLSearchParams` (fonte única para UI, RSC e export CSV).
 */
export function serializeHistorySearchParams(
  query: Partial<NormalizedHistoryQuery>,
  options: SerializeHistorySearchParamsOptions = {},
): URLSearchParams {
  const { forBackend = false, includePagination = false } = options;
  const params = new URLSearchParams();

  if (query.tab && query.tab !== "ALL") {
    params.set("tab", query.tab);
  }
  if (
    query.period &&
    query.period !== "ALL" &&
    (!forBackend || query.period !== "CUSTOM")
  ) {
    params.set("period", query.period);
  }
  if (query.period === "CUSTOM" || (forBackend && !query.period)) {
    const trimmedFrom = query.from?.trim();
    const trimmedTo = query.to?.trim();
    if (trimmedFrom) params.set("from", trimmedFrom);
    if (trimmedTo) params.set("to", trimmedTo);
  }
  const trimmedSearch = query.search?.trim();
  if (trimmedSearch) {
    params.set("search", trimmedSearch);
  }
  if (query.direction && query.direction !== "ALL") {
    params.set("direction", query.direction);
  }
  if (query.sort && query.sort !== "NEWEST") {
    params.set("sort", query.sort);
  }
  if (includePagination) {
    if (query.size && query.size !== DEFAULT_HISTORY_PAGE_SIZE) {
      params.set("size", String(query.size));
    }
    if (query.page && query.page > 1) {
      params.set("page", String(query.page));
    }
  }

  return params;
}

/**
 * Constrói os parâmetros de filtro normalizados aceitos pelo backend (`/transactions` e `/transactions/export`).
 */
export function buildHistoryBackendParams(
  query: Partial<NormalizedHistoryQuery>,
): URLSearchParams {
  return serializeHistorySearchParams(query, { forBackend: true });
}

export function buildHistoryHref(
  pathname: string,
  query: Partial<NormalizedHistoryQuery>,
): string {
  const qs = serializeHistorySearchParams(query, {
    includePagination: true,
  }).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

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
  return findRewardIcon(iconId) ?? COLUMN_ICON_MAP.get(iconId) ?? fallback;
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
  BASIC: "border-l-success-500",
  PREMIUM: "border-l-info",
  EPIC: "border-l-magenta",
  LEGENDARY: "border-l-gold",
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

  const rawPkg = transaction.packageLevel?.trim().toUpperCase();
  const normalizedPkg =
    resolvedType === "DEBT_PAID" && (!rawPkg || rawPkg === "NONE")
      ? undefined
      : rawPkg;
  const packageLabel = normalizedPkg
    ? labels
      ? labels.getPackageLabel(normalizedPkg)
      : normalizedPkg
    : null;

  const borderClass =
    NEGATIVE_TRANSACTION_TYPES.has(resolvedType) || resolvedType === "DEBT_PAID"
      ? typeConfig.borderClass
      : (normalizedDiff && DIFFICULTY_BORDER[normalizedDiff]) ||
        (normalizedPkg && PACKAGE_BORDER_MAP[normalizedPkg]) ||
        typeConfig.borderClass;

  const secondaryBadgeClass =
    (normalizedDiff && TASK_DIFFICULTY_META[normalizedDiff]?.badgeColor) ||
    (normalizedPkg &&
      PACKAGE_LEVEL_COLOR[toPackageMessageKey(normalizedPkg)]) ||
    "bg-surface dark:bg-white/10 border-neutral-600/40 dark:border-white/15 text-neutral-700 dark:text-neutral-200";

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

interface ReferenceDayContext {
  todayYear: number;
  todayKey: string;
  yesterdayKey: string;
  weekDays: readonly string[];
}

function buildReferenceDayContext(
  referenceDate: Date,
  locale: AppLocale,
  timeZone?: string | null,
): ReferenceDayContext {
  const todayParts = getDatePartsInTimeZone(referenceDate, timeZone);
  const todayKey = `${todayParts.year}-${String(todayParts.month).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;
  const yesterdayUtc = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day - 1),
  );
  const yesterdayKey = `${yesterdayUtc.getUTCFullYear()}-${String(yesterdayUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(yesterdayUtc.getUTCDate()).padStart(2, "0")}`;
  return {
    todayYear: todayParts.year,
    todayKey,
    yesterdayKey,
    weekDays: getCapitalizedWeekDays(locale),
  };
}

function formatTransactionDayLabelWithContext(
  dateKey: string,
  ctx: ReferenceDayContext,
  locale: AppLocale,
  dateFormat?: DateFormat,
  dayLabels?: TransactionDayLabels,
): string {
  if (!dateKey || dateKey === "unknown") {
    return (
      dayLabels?.unknownDate ??
      getUtilityTranslator(locale, "history")("unknownDate")
    );
  }

  if (dateKey === ctx.todayKey) {
    return dayLabels?.today ?? getUtilityTranslator(locale, "history")("today");
  }

  if (dateKey === ctx.yesterdayKey) {
    return (
      dayLabels?.yesterday ??
      getUtilityTranslator(locale, "history")("yesterday")
    );
  }

  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;

  const utcDayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const weekDay = ctx.weekDays[utcDayOfWeek];
  const includeYear = y !== ctx.todayYear;
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
 * Formata um rótulo amigável para o divisor de data do extrato ("Hoje", "Ontem", "Ter, 12 Out" ou "12 Out 2025"),
 * respeitando o fuso horário do usuário e usando Date.UTC para evitar deslocamentos de fuso/DST no servidor.
 */
export function formatTransactionDayLabel(
  dateKey: string,
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  dateFormat?: DateFormat,
  timeZone?: string | null,
  dayLabels?: TransactionDayLabels,
): string {
  const ctx = buildReferenceDayContext(referenceDate, locale, timeZone);
  return formatTransactionDayLabelWithContext(
    dateKey,
    ctx,
    locale,
    dateFormat,
    dayLabels,
  );
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
  const refCtx = buildReferenceDayContext(referenceDate, locale, timeZone);

  for (const tx of transactions) {
    const parsed = parseServerDate(tx.createdAt);
    const dateKey = parsed ? getDateKeyInTimeZone(parsed, timeZone) : "unknown";

    let group = groupMap.get(dateKey);
    if (!group) {
      group = {
        dateKey,
        label: formatTransactionDayLabelWithContext(
          dateKey,
          refCtx,
          locale,
          dateFormat,
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
 * Constrói o resumo agregado do período filtrado (priorizando os totais reais do servidor
 * sobre o fallback calculado pela página atual).
 */
export function summarizeHistoryPage(
  transactions: TransactionHistoryResponseDTO[],
  totalElements?: number,
  serverSummary?: TransactionHistorySummaryDTO | null,
): HistoryPageSummary {
  if (serverSummary) {
    return {
      goldEarned: serverSummary.goldEarned ?? 0,
      goldSpent: serverSummary.goldSpent ?? 0,
      xpEarned: serverSummary.xpEarned ?? 0,
      xpLost: serverSummary.xpLost ?? 0,
      totalCount:
        serverSummary.totalCount ?? totalElements ?? transactions.length,
    };
  }

  let goldEarned = 0;
  let goldSpent = 0;
  let xpEarned = 0;
  let xpLost = 0;

  for (const tx of transactions) {
    const gold = tx.goldAmount ?? 0;
    if (gold > 0) goldEarned += gold;
    else if (gold < 0) goldSpent += Math.abs(gold);

    const xp = tx.xpAmount ?? 0;
    if (xp > 0) xpEarned += xp;
    else if (xp < 0) xpLost += Math.abs(xp);
  }

  return {
    goldEarned,
    goldSpent,
    xpEarned,
    xpLost,
    totalCount: totalElements ?? transactions.length,
  };
}
