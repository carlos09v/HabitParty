import { cacheLife, cacheTag } from "next/cache";
import { publicServerApi } from "@/api/server";
import type { FoundersQuotaDTO } from "@/types/payment";

const DEFAULT_FOUNDERS_QUOTA: FoundersQuotaDTO = {
  maxSlots: 30,
  claimedSlots: 0,
  remainingSlots: 30,
  isAvailable: true,
};

/**
 * Consulta a disponibilidade e contagem de vagas do plano Membro Fundador.
 * Cacheada no servidor com tag `founders-quota` (invalidada automaticamente após confirmação de pagamento).
 */
export async function getFoundersQuota(): Promise<FoundersQuotaDTO> {
  "use cache";
  cacheLife("hours");
  cacheTag("founders-quota");

  try {
    const { data, error } = await publicServerApi.GET(
      "/api/v1/payments/founders-quota",
    );
    if (error || !data) {
      return DEFAULT_FOUNDERS_QUOTA;
    }
    return data;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      err.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("[PaymentService:getFoundersQuota]", err);
    return DEFAULT_FOUNDERS_QUOTA;
  }
}
