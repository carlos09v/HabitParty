"use server";

import { cookies } from "next/headers";
import { type ActionState, getErrorMessage } from "@/actions/types";
import type { CheckoutRequestDTO, CheckoutResponseDTO } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Cria uma sessão no Stripe Checkout para assinatura ou pagamento Pix avulso.
 */
export async function createCheckoutSessionAction(
  payload: CheckoutRequestDTO,
): Promise<ActionState<CheckoutResponseDTO>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Você precisa estar conectado para realizar uma assinatura.",
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/v1/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      let errorMsg = "Falha ao iniciar o checkout. Tente novamente.";
      try {
        const errorData = await res.json();
        errorMsg = getErrorMessage(
          errorData.detail || errorData.message || errorData,
          errorMsg,
        );
      } catch {
        // Fallback para mensagem padrão
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    const data: CheckoutResponseDTO = await res.json();

    if (!data.checkoutUrl) {
      return {
        success: false,
        error: "URL de checkout inválida retornada pelo servidor.",
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
      error: "Erro de comunicação ao conectar com o serviço de pagamentos.",
    };
  }
}

/**
 * Cria uma sessão no Stripe Customer Portal para gerenciar assinatura, cartão e cancelamento.
 */
export async function createCustomerPortalSessionAction(): Promise<
  ActionState<{ portalUrl: string }>
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

    if (!token) {
      return {
        success: false,
        error:
          "Você precisa estar conectado para acessar o portal de assinaturas.",
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
      let errorMsg = "Falha ao abrir portal de pagamentos.";
      try {
        const errorData = await res.json();
        errorMsg = getErrorMessage(
          errorData.detail || errorData.message || errorData,
          errorMsg,
        );
      } catch {
        // Fallback
      }
      return {
        success: false,
        error: errorMsg,
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
      error: "Erro inesperado ao conectar ao portal de pagamentos.",
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
      cache: "no-store",
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
  isPaid: boolean;
  message: string;
  user?: import("@/api/schema").components["schemas"]["UserResponseDTO"];
}

/**
 * Confirma o status de uma sessão de checkout diretamente com o backend e ativa o plano.
 */
export async function confirmPaymentAction(
  sessionId: string,
): Promise<ActionState<PaymentConfirmResponse>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("habitparty_token")?.value;

    if (!token) {
      return {
        success: false,
        error: "Sessão não autenticada para confirmar pagamento.",
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
      return {
        success: false,
        error: "Não foi possível validar o pagamento com o servidor.",
      };
    }

    const data: PaymentConfirmResponse = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("[PaymentAction:ConfirmPayment]", err);
    return {
      success: false,
      error: "Erro de comunicação ao validar pagamento.",
    };
  }
}
