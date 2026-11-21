import type { components } from "@/api/schema";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type { AppLocale } from "@/types/ui";
import { parseServerDate } from "./date";

type User = components["schemas"]["UserResponseDTO"];

export type ExpirationWarningLevel = "none" | "info" | "warning" | "danger";

export interface SubscriptionExpirationInfo {
  isPremium: boolean;
  hasEndsAt: boolean;
  endsAt: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean; // <= 7 dias
  isUrgent: boolean; // <= 3 dias
  isLastDay: boolean; // <= 1 dia
  hasExpired: boolean;
  hasActiveRecurringSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  status: "FREE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  formattedRemaining: string;
  warningLevel: ExpirationWarningLevel;
}

/**
 * Analisa as informações de assinatura e expiração do usuário.
 * Retorna flags de alerta para uso na Sidebar e em modais de renovação.
 */
export function getSubscriptionExpirationInfo(
  user?: Partial<User> | null,
  locale: AppLocale = "pt-BR",
): SubscriptionExpirationInfo {
  const t = getUtilityTranslator(locale, "subscription");
  const isPremium = Boolean(user?.isPremium);
  const status =
    (user?.subscriptionStatus as
      | "FREE"
      | "ACTIVE"
      | "PAST_DUE"
      | "CANCELED"
      | undefined) ?? "FREE";
  const hasActiveRecurring = Boolean(user?.hasActiveRecurringSubscription);
  const cancelAtPeriodEnd = Boolean(user?.cancelAtPeriodEnd);

  if (!user?.subscriptionEndsAt) {
    return {
      isPremium,
      hasEndsAt: false,
      endsAt: null,
      daysRemaining: Number.POSITIVE_INFINITY,
      hoursRemaining: Number.POSITIVE_INFINITY,
      isExpiringSoon: false,
      isUrgent: false,
      isLastDay: false,
      hasExpired: false,
      hasActiveRecurringSubscription: hasActiveRecurring,
      cancelAtPeriodEnd,
      status,
      formattedRemaining: "",
      warningLevel: "none",
    };
  }

  const endsAt =
    parseServerDate(user.subscriptionEndsAt) ??
    new Date(user.subscriptionEndsAt);
  const now = new Date();
  const diffMs = endsAt.getTime() - now.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const hasExpired = diffMs <= 0;

  // Se tem assinatura recorrente ativa e não está cancelada, não deve alarmar como expiração fatal,
  // mas informa a data de renovação. Se for Pix ou cancelada (inclusive cancelamento agendado no Portal), é expiração real.
  const isCanceledOrPix =
    !hasActiveRecurring || status === "CANCELED" || cancelAtPeriodEnd;

  let formattedRemaining = "";
  let warningLevel: ExpirationWarningLevel = "none";

  if (hasExpired) {
    formattedRemaining = t("expired");
    warningLevel = "danger";
  } else if (daysRemaining <= 1) {
    formattedRemaining =
      totalHours <= 1
        ? t("expiresLessThan1h")
        : t("expiresInHours", { hours: totalHours });
    warningLevel = "danger";
  } else if (daysRemaining <= 3) {
    formattedRemaining = t("daysLeft", { days: daysRemaining });
    warningLevel = "warning";
  } else if (daysRemaining <= 7) {
    formattedRemaining = t("daysLeft", { days: daysRemaining });
    warningLevel = "info";
  } else {
    formattedRemaining = t("daysRemaining", { days: daysRemaining });
    warningLevel = "none";
  }

  // Alerta apenas quando faltam 7 dias ou menos para Pix ou assinatura cancelada
  const isExpiringSoon =
    isPremium && isCanceledOrPix && daysRemaining <= 7 && !hasExpired;
  const isUrgent =
    isPremium && isCanceledOrPix && daysRemaining <= 3 && !hasExpired;
  const isLastDay =
    isPremium && isCanceledOrPix && daysRemaining <= 1 && !hasExpired;

  return {
    isPremium,
    hasEndsAt: true,
    endsAt,
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining: Math.max(0, totalHours),
    isExpiringSoon,
    isUrgent,
    isLastDay,
    hasExpired,
    hasActiveRecurringSubscription: hasActiveRecurring,
    cancelAtPeriodEnd,
    status,
    formattedRemaining,
    warningLevel,
  };
}
