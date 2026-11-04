"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { type ActionState, getErrorMessage } from "@/actions/types";
import { getServerAuthToken } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import type { CheckoutRequestDTO, CheckoutResponseDTO } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Cria uma sessão no Stripe Checkout para assinatura ou pagamento Pix avulso.
 */
export async function createCheckoutSessionAction(
  payload: CheckoutRequestDTO,
): Promise<ActionState<CheckoutResponseDTO>> {
  const [t, token, locale] = await Promise.all([
    getTranslations("settings.paymentActions"),
    getServerAuthToken(),
    getRequestLocale(),
  ]);

  try {
    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Accept-Language": locale,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(errorData, t("checkoutError")),
      };
    }

    const data: CheckoutResponseDTO = await res.json();

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
  const t = await getTranslations("settings.paymentActions");

  try {
    const token = await getServerAuthToken();

    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/payments/portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(errorData, t("portalError")),
      };
    }

    const data: { portalUrl: string } = await res.json();
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
 * Consulta a disponibilidade e contagem de vagas do plano Membro Fundador.
 */
export async function getFoundersQuotaAction(): Promise<
  ActionState<import("@/types/payment").FoundersQuotaDTO>
> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/payments/founders-quota`, {
      method: "GET",
      next: { tags: ["founders-quota"] },
    });

    if (!res.ok) {
      return {
        success: true,
        data: {
          maxSlots: 30,
          claimedSlots: 0,
          remainingSlots: 30,
          isAvailable: true,
        },
      };
    }

    const data: import("@/types/payment").FoundersQuotaDTO = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      err.digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("[PaymentAction:GetFoundersQuota]", err);
    return {
      success: true,
      data: {
        maxSlots: 30,
        claimedSlots: 0,
        remainingSlots: 30,
        isAvailable: true,
      },
    };
  }
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
  const t = await getTranslations("settings.paymentActions");

  try {
    const token = await getServerAuthToken();

    if (!token) {
      return {
        success: false,
        error: t("unauthorized"),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/payments/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return {
        success: false,
        error: getErrorMessage(errorData, t("checkoutError")),
      };
    }

    const data: PaymentConfirmResponse = await res.json();
    if (data.isPaid) {
      updateTag("user");
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
