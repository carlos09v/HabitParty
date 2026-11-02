package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.SubscriptionStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserSubscriptionJpaEntity {

  @Id
  @Column(name = "user_id")
  private UUID userId;

  @OneToOne(fetch = FetchType.LAZY)
  @MapsId
  @JoinColumn(name = "user_id")
  private UserJpaEntity user;

  @Column(name = "is_premium", nullable = false)
  private boolean isPremium = false;

  @Column(name = "is_founder", nullable = false, columnDefinition = "boolean default false")
  private boolean isFounder = false;

  @Column(name = "stripe_customer_id", unique = true)
  private String stripeCustomerId;

  @Column(name = "stripe_subscription_id")
  private String stripeSubscriptionId;

  @Enumerated(EnumType.STRING)
  @Column(name = "subscription_status", nullable = false, length = 50)
  private SubscriptionStatus subscriptionStatus = SubscriptionStatus.FREE;

  @Column(name = "subscription_ends_at")
  private LocalDateTime subscriptionEndsAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt = LocalDateTime.now();
}
