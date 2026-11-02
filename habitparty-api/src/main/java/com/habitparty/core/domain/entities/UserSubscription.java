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
    this.userId = userId;
    this.isPremium = isPremium;
    this.isFounder = isFounder;
    this.stripeCustomerId = stripeCustomerId;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.subscriptionStatus = subscriptionStatus != null ? subscriptionStatus : SubscriptionStatus.FREE;
    this.subscriptionEndsAt = subscriptionEndsAt;
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
        LocalDateTime.now()
    );
  }

  public boolean isPremium() {
    if (this.subscriptionEndsAt != null) {
      return this.subscriptionEndsAt.isAfter(LocalDateTime.now());
    }
    if (this.subscriptionStatus == SubscriptionStatus.ACTIVE) {
      return true;
    }
    return this.isPremium && (this.subscriptionStatus == null || this.subscriptionStatus == SubscriptionStatus.FREE);
  }

  public boolean hasActiveRecurringSubscription() {
    return this.stripeSubscriptionId != null && !this.stripeSubscriptionId.isBlank()
        && this.subscriptionStatus == SubscriptionStatus.ACTIVE;
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
    if (customerId != null && !customerId.isBlank()) {
      this.stripeCustomerId = customerId;
    }
    this.stripeSubscriptionId = subscriptionId;
    this.subscriptionStatus = SubscriptionStatus.ACTIVE;
    if (endsAt != null) {
      if (this.subscriptionEndsAt != null && this.subscriptionEndsAt.isAfter(endsAt)) {
        // Mantém a data de expiração atual caso o usuário já possua período pago superior (ex: Pix anual vigente)
      } else {
        this.subscriptionEndsAt = endsAt;
      }
    }
    this.isPremium = true;
    this.updatedAt = LocalDateTime.now();
  }

  public void extendSubscriptionDays(int days) {
    if (days <= 0) {
      throw new DomainValidationException("O período a ser adicionado deve ser maior que zero.");
    }
    LocalDateTime baseDate = (this.subscriptionEndsAt != null && this.subscriptionEndsAt.isAfter(LocalDateTime.now()))
        ? this.subscriptionEndsAt
        : LocalDateTime.now();
    this.subscriptionEndsAt = baseDate.plusDays(days);
    this.subscriptionStatus = SubscriptionStatus.ACTIVE;
    this.isPremium = true;
    this.updatedAt = LocalDateTime.now();
  }

  public void cancelSubscription() {
    this.subscriptionStatus = SubscriptionStatus.CANCELED;
    if (this.subscriptionEndsAt == null || !this.subscriptionEndsAt.isAfter(LocalDateTime.now())) {
      this.isPremium = false;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void markPastDue() {
    this.subscriptionStatus = SubscriptionStatus.PAST_DUE;
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
    this.updatedAt = LocalDateTime.now();
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
