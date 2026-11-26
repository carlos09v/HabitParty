import { toast } from "sonner";
import { deleteFocusRecord } from "@/actions/focusActions";
import { useUserStore } from "@/store/userStore";
import type { FocusRecord } from "@/types/focus";
import { getTodayDateString } from "@/utils/date";
import { toLocalDateKey } from "@/utils/focusMetrics";
import { getBrowserDocumentLocale } from "@/utils/focusTimerBrowser";
import { deductUserPenalty } from "@/utils/gamification";

/**
 * Helper compartilhado para exclusão de registro de foco com estorno otimista,
 * ajuste de minutos focados hoje, feedback visual e tratamento seguro de exceções.
 * Retorna `true` somente quando a exclusão é confirmada pelo backend.
 */
export async function executeDeleteFocusRecord(
  recordId: string,
  messages?: {
    success?: string;
    error?: string;
  },
  onSuccess?: () => void,
  deleteHistory = false,
  deletedRecord?: Partial<
    Pick<
      FocusRecord,
      | "inventoryItemId"
      | "xpEarned"
      | "coinsEarned"
      | "endTime"
      | "durationMinutes"
    >
  >,
): Promise<boolean> {
  const isEn = getBrowserDocumentLocale() === "en";
  const fallbackError =
    messages?.error ||
    (isEn
      ? "Error deleting focus record."
      : "Erro ao excluir registro de foco.");

  try {
    const res = await deleteFocusRecord(recordId, deleteHistory);
    if (!res.success) {
      toast.error(res.error || fallbackError);
      return false;
    }

    if (deletedRecord && !deletedRecord.inventoryItemId) {
      if (
        (deletedRecord.xpEarned ?? 0) > 0 ||
        (deletedRecord.coinsEarned ?? 0) > 0
      ) {
        deductUserPenalty(
          deletedRecord.xpEarned ?? 0,
          deletedRecord.coinsEarned ?? 0,
        );
      }

      if (deletedRecord.endTime && (deletedRecord.durationMinutes ?? 0) > 0) {
        const userTimeZone = useUserStore.getState().user?.timezone;
        const todayIso = getTodayDateString(new Date(), userTimeZone);
        if (toLocalDateKey(deletedRecord.endTime, userTimeZone) === todayIso) {
          useUserStore
            .getState()
            .adjustFocusMinutesToday(
              -(deletedRecord.durationMinutes ?? 0),
              todayIso,
            );
        }
      }
    }

    toast.success(
      messages?.success ??
        (isEn
          ? "Focus record removed successfully!"
          : "Registro de foco removido com sucesso!"),
    );
    onSuccess?.();
    return true;
  } catch {
    toast.error(fallbackError);
    return false;
  }
}
