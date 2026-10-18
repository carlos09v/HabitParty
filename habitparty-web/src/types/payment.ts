export type PlanType = "MONTHLY" | "ANNUAL" | "FOUNDER_ANNUAL";
export type PaymentMethodType = "CREDIT_CARD" | "PIX";

export interface CheckoutRequestDTO {
  plan: PlanType;
  paymentMethod: PaymentMethodType;
}

export interface CheckoutResponseDTO {
  checkoutUrl: string;
}

export interface FoundersQuotaDTO {
  maxSlots: number;
  claimedSlots: number;
  remainingSlots: number;
  isAvailable: boolean;
}
