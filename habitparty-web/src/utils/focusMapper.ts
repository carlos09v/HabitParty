import type {
  FocusActivity,
  FocusActivityResponseDTO,
  FocusRecord,
  FocusRecordResponseDTO,
} from "@/types/focus";
import { toLocalISOString } from "./date";

/**
 * Converte o DTO retornado do backend na entidade FocusActivity utilizada pela UI.
 */
export function mapFocusActivityDtoToActivity(
  dto: FocusActivityResponseDTO,
): FocusActivity {
  return {
    id: dto.id || "",
    name: dto.name || "Atividade",
    icon: dto.icon || "book",
    orderIndex: dto.orderIndex ?? 0,
    recordType: dto.recordType || "POMO",
    targetTimeMinutes: dto.targetTimeMinutes || 35,
    createdAt: dto.createdAt,
  };
}

/**
 * Mapeia uma lista de DTOs de atividades de foco.
 */
export function mapFocusActivities(
  dtos?: FocusActivityResponseDTO[] | null,
): FocusActivity[] {
  if (!dtos) return [];
  return dtos.map(mapFocusActivityDtoToActivity);
}

/**
 * Converte o DTO de registro de foco retornado do backend na entidade FocusRecord utilizada pela UI.
 */
export function mapFocusRecordDtoToRecord(
  dto: FocusRecordResponseDTO,
  activity?: FocusActivity,
): FocusRecord {
  return {
    id: dto.id || crypto.randomUUID(),
    userId: dto.userId,
    focusActivityId: dto.focusActivityId,
    activityName: activity?.name,
    activityIcon: activity?.icon,
    inventoryItemId: dto.inventoryItemId,
    notes: dto.notes,
    startTime: dto.startTime || toLocalISOString(),
    endTime: dto.endTime || toLocalISOString(),
    recordType: dto.recordType || "POMO",
    completedPomos: dto.completedPomos,
    durationMinutes: dto.durationMinutes || 0,
    xpEarned: dto.inventoryItemId ? 0 : (dto.xpEarned ?? 0),
    coinsEarned: dto.inventoryItemId ? 0 : Number(dto.coinsEarned ?? 0),
  };
}

/**
 * Mapeia uma lista de registros associando os metadados da atividade correspondente.
 */
export function mapFocusRecords(
  dtos: FocusRecordResponseDTO[] | undefined | null,
  activities: FocusActivity[] = [],
): FocusRecord[] {
  if (!dtos || dtos.length === 0) return [];
  const activityMap = new Map(activities.map((act) => [act.id, act]));

  return dtos.map((dto) => {
    const matchedActivity = dto.focusActivityId
      ? activityMap.get(dto.focusActivityId)
      : undefined;
    return mapFocusRecordDtoToRecord(dto, matchedActivity);
  });
}
