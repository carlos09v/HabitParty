import { DEFAULT_POMO_MINUTES } from "@/constants/focusRules";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type {
  FocusActivity,
  FocusActivityResponseDTO,
  FocusRecord,
  FocusRecordResponseDTO,
  FocusSummaryData,
  FocusSummaryResponseDTO,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { toLocalISOString } from "./date";

/**
 * Converte o DTO retornado do backend na entidade FocusActivity utilizada pela UI.
 */
export function mapFocusActivityDtoToActivity(
  dto: FocusActivityResponseDTO,
  locale: AppLocale = "pt-BR",
): FocusActivity {
  const t = getUtilityTranslator(locale, "focus");
  const recordType = dto.recordType || "POMO";
  return {
    id: dto.id || "",
    name: dto.name || t("defaultActivityName"),
    icon: dto.icon || "book",
    orderIndex: dto.orderIndex ?? 0,
    recordType,
    targetTimeMinutes:
      recordType === "STOPWATCH"
        ? (dto.targetTimeMinutes ?? undefined)
        : dto.targetTimeMinutes || DEFAULT_POMO_MINUTES,
    createdAt: dto.createdAt,
  };
}

/**
 * Mapeia uma lista de DTOs de atividades de foco.
 */
export function mapFocusActivities(
  dtos?: FocusActivityResponseDTO[] | null,
  locale: AppLocale = "pt-BR",
): FocusActivity[] {
  if (!dtos) return [];
  return dtos.map((dto) => mapFocusActivityDtoToActivity(dto, locale));
}

/**
 * Converte o DTO de registro de foco retornado do backend na entidade FocusRecord utilizada pela UI.
 */
export function mapFocusRecordDtoToRecord(
  dto: FocusRecordResponseDTO,
  activity?: FocusActivity,
  timeZone?: string | null,
  inventoryItem?: InventoryItemResponseDTO,
  fallbackIndex = 0,
): FocusRecord {
  const fallbackTimestamp = toLocalISOString(new Date(), timeZone);
  const startTime = dto.startTime || fallbackTimestamp;
  const endTime = dto.endTime || fallbackTimestamp;
  const deterministicFallbackId = `focus-rec-${dto.focusActivityId ?? dto.inventoryItemId ?? dto.taskId ?? "free"}-${startTime}-${endTime}-${fallbackIndex}`;

  return {
    id: dto.id || deterministicFallbackId,
    userId: dto.userId,
    focusActivityId: dto.focusActivityId,
    activityName: activity?.name,
    activityIcon: activity?.icon,
    inventoryItemId: dto.inventoryItemId,
    itemName: inventoryItem?.rewardName,
    itemIcon: inventoryItem?.rewardIcon,
    taskId: dto.taskId,
    taskNameSnapshot: dto.taskNameSnapshot,
    notes: dto.notes,
    startTime,
    endTime,
    recordType: dto.recordType || "POMO",
    completedPomos: dto.completedPomos,
    pomoTargetMinutes: dto.pomoTargetMinutes,
    durationMinutes: dto.durationMinutes || 0,
    xpEarned: dto.inventoryItemId ? 0 : (dto.xpEarned ?? 0),
    coinsEarned: dto.inventoryItemId ? 0 : Number(dto.coinsEarned ?? 0),
  };
}

/**
 * Mapeia uma lista de registros associando os metadados da atividade ou cupom da mochila correspondente.
 */
export function mapFocusRecords(
  dtos: FocusRecordResponseDTO[] | undefined | null,
  activities: FocusActivity[] = [],
  timeZone?: string | null,
  inventoryItems: InventoryItemResponseDTO[] = [],
): FocusRecord[] {
  if (!dtos || dtos.length === 0) return [];
  const activityMap = new Map(activities.map((act) => [act.id, act]));
  const inventoryMap = new Map(
    inventoryItems
      .filter(
        (
          item,
        ): item is InventoryItemResponseDTO & { inventoryItemId: string } =>
          Boolean(item.inventoryItemId),
      )
      .map((item) => [item.inventoryItemId, item]),
  );

  return dtos.map((dto, index) => {
    const matchedActivity = dto.focusActivityId
      ? activityMap.get(dto.focusActivityId)
      : undefined;
    const matchedItem = dto.inventoryItemId
      ? inventoryMap.get(dto.inventoryItemId)
      : undefined;
    return mapFocusRecordDtoToRecord(
      dto,
      matchedActivity,
      timeZone,
      matchedItem,
      index,
    );
  });
}

export interface FocusRecordsPageResult {
  records: FocusRecordResponseDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

/**
 * Normaliza os metadados de paginação Spring Data para registros de foco.
 */
export function normalizeFocusRecordsPage(
  data:
    | {
        content?: FocusRecordResponseDTO[];
        totalElements?: number;
        totalPages?: number;
        number?: number;
        last?: boolean;
      }
    | undefined
    | null,
  fallbackPage = 0,
): FocusRecordsPageResult {
  const records = data?.content || [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? records.length;
  const currentPage = data?.number !== undefined ? data.number : fallbackPage;
  const hasMore =
    data?.last !== undefined ? !data.last : currentPage + 1 < totalPages;

  return {
    records,
    totalElements,
    totalPages,
    currentPage,
    hasMore,
  };
}

/**
 * Normaliza o DTO do resumo agregado de foco retornado por `GET /focus-records/summary`.
 */
export function normalizeFocusSummary(
  dto: FocusSummaryResponseDTO | undefined | null,
): FocusSummaryData | null {
  if (!dto) return null;
  const toInt = (val: unknown) =>
    typeof val === "number" && Number.isFinite(val)
      ? Math.max(0, Math.round(val))
      : 0;
  const toCoins = (val: unknown) => {
    const num = typeof val === "string" ? Number(val) : Number(val ?? 0);
    return Number.isFinite(num) ? Math.round(Math.max(0, num) * 100) / 100 : 0;
  };

  return {
    todayRecordsCount: toInt(dto.todayRecordsCount),
    totalRecordsCount: toInt(dto.totalRecordsCount),
    activeStreakDays: toInt(dto.activeStreakDays),
    totalActiveDays: toInt(dto.totalActiveDays),
    todayXp: toInt(dto.todayXp),
    totalXp: toInt(dto.totalXp),
    todayGold: toCoins(dto.todayGold),
    totalGold: toCoins(dto.totalGold),
    todayFocusMinutes: toInt(dto.todayFocusMinutes),
    totalFocusMinutes: toInt(dto.totalFocusMinutes),
    todayPomosCount: toInt(dto.todayPomosCount),
    totalPomosCount: toInt(dto.totalPomosCount),
    todayAverageMinutes: toInt(dto.todayAverageMinutes),
    totalAverageMinutes: toInt(dto.totalAverageMinutes),
    globalTodayProductiveMinutes: toInt(dto.globalTodayProductiveMinutes),
    globalTodayRewardableMinutes: toInt(dto.globalTodayRewardableMinutes),
    todayDurationByActivityId: dto.todayDurationByActivityId
      ? { ...dto.todayDurationByActivityId }
      : {},
    dailyMinutes: dto.dailyMinutes ? { ...dto.dailyMinutes } : {},
  };
}
