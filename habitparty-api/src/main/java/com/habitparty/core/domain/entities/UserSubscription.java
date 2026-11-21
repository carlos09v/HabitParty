package com.habitparty.core.domain.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.exceptions.DomainValidationException;

public class UserSubscription {
  private UUID userId;
  private boolean isPremium;
  private boolean isFounder;
  private String stripeCustomerId;
  private String stripeSubscriptionId;
  private SubscriptionStatus subscriptionStatus;
  private LocalDateTime subscriptionEndsAt;
  private LocalDateTime prepaidEndsAt;
  private boolean cancelAtPeriodEnd;
  private LocalDateTime updatedAt;

  public UserSubscription(
      UUID userId,
      boolean isPremium,
      boolean isFounder,
      String stripeCustomerId,
      String stripeSubscriptionId,
      SubscriptionStatus subscriptionStatus,
      LocalDateTime subscriptionEndsAt,
      LocalDateTime updatedAt) {
    this(
        userId,
        isPremium,
        isFounder,
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus,
        subscriptionEndsAt,
        null,
        false,
        updatedAt);
  }

  public UserSubscription(
      UUID userId,
      boolean isPremium,
      boolean isFounder,
      String stripeCustomerId,
      String stripeSubscriptionId,
      SubscriptionStatus subscriptionStatus,
      LocalDateTime subscriptionEndsAt,
      LocalDateTime prepaidEndsAt,
      boolean cancelAtPeriodEnd,
      LocalDateTime updatedAt) {
    this.userId = userId;
    this.isPremium = isPremium;
    this.isFounder = isFounder;
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.subscriptionStatus = subscriptionStatus != null ? subscriptionStatus : SubscriptionStatus.FREE;
    this.subscriptionEndsAt = subscriptionEndsAt;
    this.prepaidEndsAt = prepaidEndsAt;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
  }

  public static UserSubscription createInitial(UUID userId) {
    return new UserSubscription(
        userId,
        false,
        false,
        null,
        null,
        SubscriptionStatus.FREE,
        null,
        null,
        false,
        LocalDateTime.now()
    );
  }

  public boolean hasActivePrepaidBalance(LocalDateTime now) {
    return this.prepaidEndsAt != null && this.prepaidEndsAt.isAfter(now);
  }

  public boolean isPremium() {
    LocalDateTime now = LocalDateTime.now();
    if (hasActivePrepaidBalance(now)) {
      return true;
    }
    if (this.subscriptionStatus == SubscriptionStatus.PAST_DUE) {
      return false;
    }
    if (this.subscriptionEndsAt != null) {
      return this.subscriptionEndsAt.isAfter(now);
    }
    if (this.subscriptionStatus == SubscriptionStatus.ACTIVE) {
      return true;
    }
    return this.isPremium && (this.subscriptionStatus == null || this.subscriptionStatus == SubscriptionStatus.FREE);
  }

  public SubscriptionStatus getEffectiveSubscriptionStatus() {
    if (this.subscriptionStatus == SubscriptionStatus.ACTIVE
        && this.subscriptionEndsAt != null
        && !this.subscriptionEndsAt.isAfter(LocalDateTime.now())
        && !hasActivePrepaidBalance(LocalDateTime.now())) {
      return SubscriptionStatus.FREE;
    }
    return this.subscriptionStatus;
  }

  public boolean hasActiveRecurringSubscription() {
    if (this.stripeSubscriptionId == null || this.stripeSubscriptionId.isBlank()) {
      return false;
    }
    if (this.subscriptionStatus != SubscriptionStatus.ACTIVE || this.cancelAtPeriodEnd) {
      return false;
    }
    return this.subscriptionEndsAt == null || this.subscriptionEndsAt.isAfter(LocalDateTime.now());
  }

  public void upgradeToPremium() {
    this.isPremium = true;
    if (this.subscriptionStatus == null || this.subscriptionStatus == SubscriptionStatus.FREE) {
      this.subscriptionStatus = SubscriptionStatus.ACTIVE;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void grantFounderStatus() {
    this.isFounder = true;
    this.updatedAt = LocalDateTime.now();
  }

  public void activateSubscription(String customerId, String subscriptionId, LocalDateTime endsAt) {
    syncActiveSubscription(customerId, subscriptionId, endsAt, false);
  }

  /**
   * Atualiza os dados de uma assinatura Stripe ativa/trialing preservando eventual saldo pré-pago
   * de Pix superior e propagando o flag {@code cancelAtPeriodEnd} vindo do Portal.
   */
  public void syncActiveSubscription(
      String customerId,
      String subscriptionId,
      LocalDateTime endsAt,
      boolean cancelAtPeriodEnd) {
    if (customerId != null && !customerId.isBlank()) {
      this.stripeCustomerId = customerId;
    }
    if (subscriptionId != null && !subscriptionId.isBlank()) {
      this.stripeSubscriptionId = subscriptionId;
    }
    this.subscriptionStatus = SubscriptionStatus.ACTIVE;
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;

    LocalDateTime now = LocalDateTime.now();
    if (this.prepaidEndsAt != null && !this.prepaidEndsAt.isAfter(now)) {
      this.prepaidEndsAt = null;
    }

    if (endsAt != null) {
      if (this.prepaidEndsAt != null && this.prepaidEndsAt.isAfter(endsAt)) {
        this.subscriptionEndsAt = this.prepaidEndsAt;
      } else {
        this.subscriptionEndsAt = endsAt;
      }
    }
    this.isPremium = true;
    this.updatedAt = now;
  }

  public void extendSubscriptionDays(int days) {
    if (days <= 0) {
      throw new DomainValidationException("O período a ser adicionado deve ser maior que zero.");
    }
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime baseDate = now;
    if (this.subscriptionEndsAt != null && this.subscriptionEndsAt.isAfter(baseDate)) {
      baseDate = this.subscriptionEndsAt;
    }
    if (this.prepaidEndsAt != null && this.prepaidEndsAt.isAfter(baseDate)) {
      baseDate = this.prepaidEndsAt;
    }
    LocalDateTime newEndsAt = baseDate.plusDays(days);
    this.subscriptionEndsAt = newEndsAt;
    this.prepaidEndsAt = newEndsAt;
    this.subscriptionStatus = SubscriptionStatus.ACTIVE;
    if (!hasActiveRecurringSubscription()) {
      this.cancelAtPeriodEnd = false;
    }
    this.isPremium = true;
    this.updatedAt = now;
  }

  public void cancelSubscription() {
    LocalDateTime now = LocalDateTime.now();
    this.subscriptionStatus = SubscriptionStatus.CANCELED;
    this.cancelAtPeriodEnd = false;
    if (hasActivePrepaidBalance(now)) {
      this.subscriptionEndsAt = this.prepaidEndsAt;
      this.isPremium = true;
    } else if (this.subscriptionEndsAt == null || !this.subscriptionEndsAt.isAfter(now)) {
      this.isPremium = false;
    }
    this.updatedAt = now;
  }

  /**
   * Revoga imediatamente o acesso Premium quando a cobrança recorrente falha ({@code past_due} ou {@code unpaid}),
   * preservando apenas saldo pré-pago de Pix ainda vigente.
   */
  public void revokeOnPaymentFailure(SubscriptionStatus targetStatus) {
    LocalDateTime now = LocalDateTime.now();
    this.subscriptionStatus = targetStatus != null ? targetStatus : SubscriptionStatus.PAST_DUE;
    this.cancelAtPeriodEnd = false;
    if (this.subscriptionStatus == SubscriptionStatus.CANCELED) {
      this.stripeSubscriptionId = null;
    }
    if (hasActivePrepaidBalance(now)) {
      this.subscriptionEndsAt = this.prepaidEndsAt;
      this.isPremium = true;
    } else {
      this.prepaidEndsAt = null;
      this.isPremium = false;
      if (this.subscriptionEndsAt != null && this.subscriptionEndsAt.isAfter(now)) {
        this.subscriptionEndsAt = now;
      }
    }
    this.updatedAt = now;
  }

  public void markPastDue() {
    revokeOnPaymentFailure(SubscriptionStatus.PAST_DUE);
  }

  public LocalDateTime getPrepaidEndsAt() {
    return prepaidEndsAt;
  }

  public void setPrepaidEndsAt(LocalDateTime prepaidEndsAt) {
    this.prepaidEndsAt = prepaidEndsAt;
    this.updatedAt = LocalDateTime.now();
  }

  public boolean isCancelAtPeriodEnd() {
    return cancelAtPeriodEnd;
  }

  public void setCancelAtPeriodEnd(boolean cancelAtPeriodEnd) {
    this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    this.updatedAt = LocalDateTime.now();
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public boolean getRawIsPremium() {
    return isPremium;
  }

  public void setPremium(boolean isPremium) {
    this.isPremium = isPremium;
    this.updatedAt = LocalDateTime.now();
  }

  public boolean isFounder() {
    return isFounder;
  }

  public void setFounder(boolean isFounder) {
    this.isFounder = isFounder;
    this.updatedAt = LocalDateTime.now();
  }

  public String getStripeCustomerId() {
    return stripeCustomerId;
  }

  public void setStripeCustomerId(String stripeCustomerId) {
    this.stripeCustomerId = stripeCustomerId;
    this.updatedAt = LocalDateTime.now();
  }

  public String getStripeSubscriptionId() {
    return stripeSubscriptionId;
  }

  public void setStripeSubscriptionId(String stripeSubscriptionId) {
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.updatedAt = LocalDateTime.now();
  }

  public SubscriptionStatus getSubscriptionStatus() {
    return subscriptionStatus;
  }

  public void setSubscriptionStatus(SubscriptionStatus subscriptionStatus) {
    this.subscriptionStatus = subscriptionStatus;
    this.updatedAt = LocalDateTime.now();
  }

  public LocalDateTime getSubscriptionEndsAt() {
    return subscriptionEndsAt;
  }

  public void setSubscriptionEndsAt(LocalDateTime subscriptionEndsAt) {
    this.subscriptionEndsAt = subscriptionEndsAt;
    if (this.prepaidEndsAt != null
        && (subscriptionEndsAt == null || subscriptionEndsAt.isBefore(this.prepaidEndsAt))) {
      this.prepaidEndsAt = subscriptionEndsAt;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
