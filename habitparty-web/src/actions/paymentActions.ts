"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invalidateShowcaseDomainTags } from "@/actions/cacheInvalidation";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken, serverApi } from "@/api/server";
import { getFoundersQuota } from "@/services/paymentService";
import type {
  CheckoutRequestDTO,
  CheckoutResponseDTO,
  FoundersQuotaDTO,
} from "@/types/payment";

/**
 * Cria uma sessão no Stripe Checkout para assinatura ou pagamento Pix avulso.
 */
export async function createCheckoutSessionAction(
  payload: CheckoutRequestDTO,
): Promise<ActionState<CheckoutResponseDTO>> {
  const [t, token] = await Promise.all([
    getTranslations("settings.paymentActions"),
    getServerAuthToken(),
  ]);

  try {
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const { data, error } = await serverApi.POST("/api/v1/payments/checkout", {
      body: payload,
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("checkoutError")),
      };
    }

    if (!data.checkoutUrl) {
      return {
        success: false,
        error: t("invalidCheckoutUrl"),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("[PaymentAction:CreateCheckout]", err);
    return {
      success: false,
      error: t("networkError"),
    };
  }
}

/**
 * Cria uma sessão no Stripe Customer Portal para gerenciar assinatura, cartão e cancelamento.
 */
export async function createCustomerPortalSessionAction(): Promise<
  ActionState<{ portalUrl: string }>
> {
  const [t, token] = await Promise.all([
    getTranslations("settings.paymentActions"),
    getServerAuthToken(),
  ]);

  try {
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const { data, error } = await serverApi.POST("/api/v1/payments/portal", {
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("portalError")),
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("[PaymentAction:CreateCustomerPortal]", err);
    return {
      success: false,
      error: t("networkError"),
    };
  }
}

/**
 * Consulta a disponibilidade e contagem de vagas do plano Membro Fundador (para Client Components).
 */
export async function getFoundersQuotaAction(): Promise<
  ActionState<FoundersQuotaDTO>
> {
  const data = await getFoundersQuota();
  return {
    success: true,
    data,
  };
}

export interface PaymentConfirmResponse {
  isPaid?: boolean;
  message: string;
  user?: import("@/api/schema").components["schemas"]["UserResponseDTO"];
}

/**
 * Confirma o status de uma sessão de checkout diretamente com o backend e ativa o plano.
 */
export async function confirmPaymentAction(
  sessionId: string,
): Promise<ActionState<PaymentConfirmResponse>> {
  const [t, token] = await Promise.all([
    getTranslations("settings.paymentActions"),
    getServerAuthToken(),
  ]);

  try {
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const { data, error } = await serverApi.POST("/api/v1/payments/confirm", {
      body: { sessionId },
      cache: "no-store",
    });

    if (error || !data) {
      return {
        success: false,
        error: getErrorMessage(error, t("checkoutError")),
      };
    }

    if (data.isPaid) {
      updateTag("user");
      invalidateShowcaseDomainTags(false);
      updateTag("admin-overview");
      updateTag("admin-users");
      updateTag("founders-quota");
    }
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("[PaymentAction:ConfirmPayment]", err);
    return {
      success: false,
      error: t("networkError"),
    };
  }
}
